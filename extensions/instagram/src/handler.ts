// HTTP handler for Instagram webhook verification (GET) and message events (POST).

import type { IncomingMessage, ServerResponse } from "node:http";
import { classifyMessage } from "./classifier.js";
import { sendInstagramReply } from "./instagram-api.js";
import {
  findByBarrioOnly,
  findByCityOnly,
  getAllForCity,
  getBarrioCities,
  getOnlineStoreUrl,
  groupByBarrio,
  hasDistinctBarrios,
} from "./puntos-de-venta.js";
import { RESPONSES } from "./responses.js";
import { getSession, setSession, incrementConfusion, resetConfusion } from "./session-store.js";
import { sendTelegramNotification } from "./telegram.js";

// ---------------------------------------------------------------------------
// Test Mode Filter
// ---------------------------------------------------------------------------
function isTestModeEnabled(): boolean {
  const raw = process.env["INSTAGRAM_TEST_MODE"];
  if (!raw) return true;
  return raw.trim().toLowerCase() !== "false" && raw.trim() !== "0";
}

function isAllowedInTestMode(senderId: string, text: string): boolean {
  if (!isTestModeEnabled()) return true;
  const authorizedSenderId = process.env["INSTAGRAM_TEST_SENDER_ID"]?.trim();
  if (authorizedSenderId && senderId === authorizedSenderId) return true;
  if (text.includes("ACTIVAR_TEST")) return true;
  return false;
}

type MessagingEvent = {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text?: string };
};

type InstagramWebhookPayload = {
  object: string;
  entry: Array<{ id: string; time: number; messaging: MessagingEvent[] }>;
};

async function readBody(req: IncomingMessage, maxBytes = 512 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBytes) { reject(new Error("Payload too large")); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function extractField(text: string, fieldName: string): string | undefined {
  const regex = new RegExp(
    `${fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[:\\-\\s]+([^\\n•\\-,]+)`,
    "i",
  );
  const match = text.match(regex);
  return match?.[1]?.trim() || undefined;
}

function extractPhone(text: string): string | undefined {
  const match = text.match(/(?:tel[eé]fono|tel|cel|celular|whatsapp|wp|wsp)?[:\s]*(\+?[\d\s\-()]{7,})/i);
  return match?.[1]?.trim() || undefined;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const PURCHASE_KEYWORDS = [
  "donde comprar", "dónde comprar", "donde conseguir", "dónde conseguir",
  "donde lo consigo", "donde encuentro", "dónde encuentro",
  "punto de venta", "puntos de venta", "donde venden", "dónde venden",
];

function askingWhereToBuy(text: string): boolean {
  const q = normalize(text);
  return PURCHASE_KEYWORDS.some((kw) => q.includes(normalize(kw)));
}

const PRICE_KEYWORDS = [
  "precio", "precios", "cuánto cuesta", "cuanto cuesta", "cuánto sale", "cuanto sale",
  "cuánto vale", "cuanto vale", "cuánto están", "cuanto estan", "qué precio",
  "que precio", "tienen precio", "precio tiene", "cuánto cobran", "cuanto cobran",
  "precio de", "valor de", "cuánto es", "cuanto es",
];

function askingAboutPrice(text: string): boolean {
  const q = normalize(text);
  return PRICE_KEYWORDS.some((kw) => q.includes(normalize(kw)));
}

// ---------------------------------------------------------------------------
// Consumer location flow helpers
// ---------------------------------------------------------------------------
async function sendStoresByBarrio(senderId: string, locationName: string, stores: ReturnType<typeof findByBarrioOnly>): Promise<void> {
  resetConfusion(senderId);
  await sendInstagramReply({
    recipientId: senderId,
    text: RESPONSES.consumer.storeFound(locationName, stores),
  });
}

async function triggerConfusionIfNeeded(senderId: string): Promise<boolean> {
  const count = incrementConfusion(senderId);
  if (count >= 2) {
    setSession(senderId, { segment: "confusion", step: "asking" });
    await sendInstagramReply({ recipientId: senderId, text: RESPONSES.confusion.escapeValve() });
    return true;
  }
  return false;
}

async function sendAllForCity(senderId: string, cityName: string): Promise<void> {
  const all = getAllForCity(cityName);
  if (all.length === 0) {
    const triggered = await triggerConfusionIfNeeded(senderId);
    if (!triggered) {
      const tiendaOnline = getOnlineStoreUrl();
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.noStore(tiendaOnline) });
    }
    return;
  }
  if (hasDistinctBarrios(all)) {
    const groups = groupByBarrio(all);
    await sendInstagramReply({
      recipientId: senderId,
      text: RESPONSES.consumer.storeFoundGrouped(cityName, groups),
    });
  } else {
    await sendInstagramReply({
      recipientId: senderId,
      text: RESPONSES.consumer.storeFound(cityName, all),
    });
  }
}

// ---------------------------------------------------------------------------
// Main message handler
// ---------------------------------------------------------------------------
async function handleMessage(senderId: string, text: string): Promise<void> {
  // Human-like typing delay (3–7 s)
  await new Promise<void>((resolve) => setTimeout(resolve, 3000 + Math.floor(Math.random() * 4000)));

  const session = getSession(senderId);

  // Price policy: intercept price questions for consumer/unknown sessions
  if (
    (session.segment === "unknown" || session.segment === "consumer") &&
    askingAboutPrice(text)
  ) {
    await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.pricePolicy() });
    return;
  }

  // B2B data collection
  if (session.segment === "b2b" && session.step === "collecting") {
    const negocio = extractField(text, "negocio") ?? extractField(text, "local") ?? extractField(text, "empresa") ?? `Negocio ${senderId.slice(-6)}`;
    const ciudad = extractField(text, "ciudad") ?? extractField(text, "ubicación") ?? extractField(text, "ubicacion") ?? extractField(text, "barrio") ?? "no informada";
    const whatsapp = extractField(text, "whatsapp") ?? extractField(text, "wp") ?? extractField(text, "wsp") ?? extractPhone(text) ?? "no informado";

    setSession(senderId, { segment: "b2b", step: "done" });
    await Promise.all([
      sendInstagramReply({ recipientId: senderId, text: RESPONSES.b2b.confirmation(negocio) }),
      sendTelegramNotification({ segment: "b2b", negocio, ciudad, whatsapp, senderId }),
    ]);
    return;
  }

  // Evento data collection
  if (session.segment === "evento" && session.step === "collecting") {
    const nombre = extractField(text, "nombre") ?? `Cliente IG ${senderId.slice(-6)}`;
    const whatsapp = extractField(text, "whatsapp") ?? extractField(text, "wp") ?? extractField(text, "wsp") ?? extractPhone(text) ?? "no informado";
    const localidad = extractField(text, "localidad") ?? extractField(text, "ciudad") ?? extractField(text, "ubicación") ?? extractField(text, "ubicacion") ?? "no informada";
    const cantidad = extractField(text, "cantidad") ?? extractField(text, "kg") ?? extractField(text, "kilo") ?? "no informada";

    setSession(senderId, { segment: "evento", step: "done" });
    await Promise.all([
      sendInstagramReply({ recipientId: senderId, text: RESPONSES.evento.confirmation(nombre) }),
      sendTelegramNotification({ segment: "evento", nombre, localidad, cantidad, whatsapp, senderId }),
    ]);
    return;
  }

  // Queja data collection
  if (session.segment === "queja" && session.step === "collecting") {
    const nombre = extractField(text, "nombre") ?? `Usuario IG ${senderId.slice(-6)}`;
    const whatsapp = extractField(text, "whatsapp") ?? extractField(text, "wp") ?? extractField(text, "wsp") ?? extractPhone(text) ?? "no informado";
    const descripcion = text.slice(0, 300);

    setSession(senderId, { segment: "queja", step: "done" });
    await Promise.all([
      sendInstagramReply({ recipientId: senderId, text: RESPONSES.queja.confirmation(nombre) }),
      sendTelegramNotification({ segment: "queja", nombre, whatsapp, descripcion, senderId }),
    ]);
    return;
  }

  // Confusion: waiting for yes/no on escape valve
  if (session.segment === "confusion" && session.step === "asking") {
    const q = normalize(text);
    const yes = ["si", "sí", "dale", "claro", "ok", "bueno", "porfa", "quiero", "genial"].some((w) => q.includes(w));
    const no = ["no", "gracias no", "no gracias", "dejá", "deja"].some((w) => q === w || q.startsWith(w + " "));
    if (no) {
      setSession(senderId, { segment: "unknown" });
      resetConfusion(senderId);
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.confusion.decline() });
    } else if (yes || (!no)) {
      setSession(senderId, { segment: "confusion", step: "collecting" });
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.confusion.askForData() });
    }
    return;
  }

  // Confusion: collecting lead data
  if (session.segment === "confusion" && session.step === "collecting") {
    const nombre = extractField(text, "nombre") ?? `Usuario IG ${senderId.slice(-6)}`;
    const whatsapp = extractField(text, "whatsapp") ?? extractField(text, "wp") ?? extractField(text, "wsp") ?? extractPhone(text) ?? "no informado";
    const consulta = text.slice(0, 300);

    setSession(senderId, { segment: "confusion", step: "done" });
    resetConfusion(senderId);
    await Promise.all([
      sendInstagramReply({ recipientId: senderId, text: RESPONSES.confusion.confirmation() }),
      sendTelegramNotification({ segment: "confusion", nombre, whatsapp, consulta, senderId }),
    ]);
    return;
  }

  // Consumer: disambiguating barrio city (e.g. "Centro de BA o Córdoba?")
  if (session.segment === "consumer" && "step" in session && session.step === "asking_city_for_barrio") {
    const savedBarrio = session.barrio;
    const byCity = findByCityOnly(text);
    setSession(senderId, { segment: "consumer" });
    if (byCity.length > 0) {
      const cityName = byCity[0]!.ciudad;
      const filtered = findByBarrioOnly(savedBarrio, cityName);
      if (filtered.length > 0) {
        await sendStoresByBarrio(senderId, savedBarrio, filtered);
      } else {
        await sendAllForCity(senderId, cityName);
      }
    } else {
      // Can't determine city — show all matches for that barrio
      const all = findByBarrioOnly(savedBarrio);
      await sendStoresByBarrio(senderId, savedBarrio, all);
    }
    return;
  }

  // Consumer: waiting for barrio refinement after showing big city — filter by saved city
  if (session.segment === "consumer" && "step" in session && session.step === "asking_barrio") {
    const savedCity = session.city;
    const byBarrio = findByBarrioOnly(text, savedCity);
    if (byBarrio.length > 0) {
      setSession(senderId, { segment: "consumer" });
      const barrio = byBarrio[0]?.barrio ?? text;
      await sendStoresByBarrio(senderId, barrio, byBarrio);
    } else {
      // User didn't specify barrio or repeated the city → show all grouped
      setSession(senderId, { segment: "consumer" });
      await sendAllForCity(senderId, savedCity);
    }
    return;
  }

  // Consumer: waiting for city/barrio (initial ask)
  if (session.segment === "consumer" && "step" in session && session.step === "asking_city") {
    const byBarrio = findByBarrioOnly(text);
    if (byBarrio.length > 0) {
      const cities = getBarrioCities(text);
      if (cities.length > 1) {
        const barrioName = byBarrio[0]?.barrio ?? text;
        setSession(senderId, { segment: "consumer", step: "asking_city_for_barrio", barrio: barrioName });
        await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.askCityForBarrio(barrioName, cities) });
        return;
      }
      setSession(senderId, { segment: "consumer" });
      const barrio = byBarrio[0]?.barrio ?? text;
      await sendStoresByBarrio(senderId, barrio, byBarrio);
      return;
    }

    setSession(senderId, { segment: "consumer" });

    const byCity = findByCityOnly(text);
    if (byCity.length > 0) {
      const cityName = byCity[0]!.ciudad;
      if (hasDistinctBarrios(byCity)) {
        setSession(senderId, { segment: "consumer", step: "asking_barrio", city: cityName });
        await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.askBarrio(cityName) });
      } else {
        await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.storeFound(cityName, byCity) });
      }
      return;
    }

    const triggered = await triggerConfusionIfNeeded(senderId);
    if (!triggered) {
      const tiendaOnline = getOnlineStoreUrl();
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.noStore(tiendaOnline) });
    }
    return;
  }

  // New message — classify fresh
  const segment = classifyMessage(text);

  switch (segment) {
    case "consumer": {
      // Check if barrio is in the message
      const byBarrio = findByBarrioOnly(text);
      if (byBarrio.length > 0) {
        const cities = getBarrioCities(text);
        if (cities.length > 1) {
          // Ambiguous barrio — ask which city
          const barrioName = byBarrio[0]?.barrio ?? text;
          setSession(senderId, { segment: "consumer", step: "asking_city_for_barrio", barrio: barrioName });
          await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.askCityForBarrio(barrioName, cities) });
          break;
        }
        setSession(senderId, { segment: "consumer" });
        const barrio = byBarrio[0]?.barrio ?? text;
        await sendStoresByBarrio(senderId, barrio, byBarrio);
        break;
      }
      // Check if city is in the message
      const byCity = findByCityOnly(text);
      if (byCity.length > 0) {
        const cityName = byCity[0]!.ciudad;
        if (hasDistinctBarrios(byCity)) {
          setSession(senderId, { segment: "consumer", step: "asking_barrio", city: cityName });
          await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.askBarrio(cityName) });
        } else {
          setSession(senderId, { segment: "consumer" });
          await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.storeFound(cityName, byCity) });
        }
        break;
      }
      // No location in message — ask for it
      if (askingWhereToBuy(text)) {
        setSession(senderId, { segment: "consumer", step: "asking_city" });
        await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.askCityDirect() });
      } else {
        setSession(senderId, { segment: "consumer", step: "asking_city" });
        await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.askCity() });
      }
      break;
    }
    case "b2b": {
      setSession(senderId, { segment: "b2b", step: "collecting" });
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.b2b.askForData() });
      break;
    }
    case "evento": {
      setSession(senderId, { segment: "evento", step: "collecting" });
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.evento.askForData() });
      break;
    }
    case "queja": {
      setSession(senderId, { segment: "queja", step: "collecting" });
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.queja.askForData() });
      break;
    }
    case "vendedor": {
      setSession(senderId, { segment: "vendedor" });
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.vendedor.redirect() });
      break;
    }
  }
}

async function processWebhookPayload(rawBody: string): Promise<void> {
  let payload: InstagramWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as InstagramWebhookPayload;
  } catch {
    console.warn("[instagram] Payload no es JSON válido");
    return;
  }
  if (payload.object !== "instagram") return;

  for (const entry of payload.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const text = event.message?.text;
      if (!senderId || !text) continue;
      const isModoStaff = /^modo staff\s*/i.test(text.trimStart());
      const processedText = isModoStaff ? text.trimStart().replace(/^modo staff\s*/i, "").trim() || text : text;
      if (!isModoStaff && !isAllowedInTestMode(senderId, processedText)) {
        console.info(`[instagram] Mensaje de ${senderId} ignorado (filtro test mode)`);
        continue;
      }
      await handleMessage(senderId, processedText).catch((err) => {
        console.error(`[instagram] Error procesando mensaje de ${senderId}:`, err);
      });
    }
  }
}

export function createInstagramWebhookHandler(): (req: IncomingMessage, res: ServerResponse) => Promise<boolean> {
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      const verifyToken = process.env["INSTAGRAM_VERIFY_TOKEN"];
      if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end(challenge);
      } else {
        res.statusCode = 403;
        res.end("Forbidden");
      }
      return true;
    }

    if (req.method === "POST") {
      let rawBody = "";
      try {
        rawBody = await readBody(req);
      } catch (err) {
        console.error("[instagram] Error leyendo body del webhook:", err);
        res.statusCode = 200;
        res.end("EVENT_RECEIVED");
        return true;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("EVENT_RECEIVED");
      processWebhookPayload(rawBody).catch((err) => {
        console.error("[instagram] Error procesando payload:", err);
      });
      return true;
    }

    res.statusCode = 405;
    res.end("Method Not Allowed");
    return true;
  };
}
