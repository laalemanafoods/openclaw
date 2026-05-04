// HTTP handler for Instagram webhook verification (GET) and message events (POST).

import type { IncomingMessage, ServerResponse } from "node:http";
import { classifyMessage } from "./classifier.js";
import { sendInstagramReply } from "./instagram-api.js";
import { findStoresByLocation, getOnlineStoreUrl } from "./puntos-de-venta.js";
import { RESPONSES } from "./responses.js";
import { getSession, setSession } from "./session-store.js";
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
      if (total > maxBytes) {
        reject(new Error("Payload too large"));
        return;
      }
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

async function handleMessage(senderId: string, text: string): Promise<void> {
  const session = getSession(senderId);

  // B2B data collection response
  if (session.segment === "b2b" && session.step === "collecting") {
    const negocio =
      extractField(text, "negocio") ??
      extractField(text, "local") ??
      extractField(text, "empresa") ??
      `Negocio ${senderId.slice(-6)}`;
    const ciudad =
      extractField(text, "ciudad") ??
      extractField(text, "ubicación") ??
      extractField(text, "ubicacion") ??
      extractField(text, "barrio") ??
      "no informada";
    const whatsapp =
      extractField(text, "whatsapp") ??
      extractField(text, "wp") ??
      extractField(text, "wsp") ??
      extractPhone(text) ??
      "no informado";

    setSession(senderId, { segment: "b2b", step: "done" });

    const extraInfo = `Negocio: ${negocio} | Ciudad: ${ciudad} | WhatsApp: ${whatsapp}`;

    await Promise.all([
      sendInstagramReply({ recipientId: senderId, text: RESPONSES.b2b.confirmation(negocio) }),
      sendTelegramNotification({ clientName: negocio, segment: "b2b", senderId, extraInfo }),
    ]);
    return;
  }

  // Consumer city lookup response
  if (session.segment === "consumer" && "step" in session && session.step === "asking_city") {
    setSession(senderId, { segment: "consumer" });
    const stores = findStoresByLocation(text);
    if (stores.length > 0) {
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.storeFound(stores) });
    } else {
      const tiendaOnline = getOnlineStoreUrl();
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.noStore(tiendaOnline) });
    }
    return;
  }

  const segment = classifyMessage(text);

  switch (segment) {
    case "consumer": {
      setSession(senderId, { segment: "consumer", step: "asking_city" });
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.askCity() });
      break;
    }
    case "b2b": {
      setSession(senderId, { segment: "b2b", step: "collecting" });
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.b2b.askForData() });
      break;
    }
    case "queja": {
      setSession(senderId, { segment: "queja" });
      await Promise.all([
        sendInstagramReply({ recipientId: senderId, text: RESPONSES.queja.initial() }),
        sendTelegramNotification({
          clientName: `Usuario IG ${senderId.slice(-6)}`,
          segment: "queja",
          senderId,
          extraInfo: text.slice(0, 300),
        }),
      ]);
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

  if (payload.object !== "instagram") {
    return;
  }

  for (const entry of payload.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const text = event.message?.text;
      if (!senderId || !text) continue;

      if (!isAllowedInTestMode(senderId, text)) {
        console.info(`[instagram] Mensaje de ${senderId} ignorado (filtro test mode)`);
        continue;
      }

      await handleMessage(senderId, text).catch((err) => {
        console.error(`[instagram] Error procesando mensaje de ${senderId}:`, err);
      });
    }
  }
}

export function createInstagramWebhookHandler(): (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<boolean> {
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
