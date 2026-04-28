// HTTP handler for Instagram webhook verification (GET) and message events (POST).

import type { IncomingMessage, ServerResponse } from "node:http";
import { classifyMessage } from "./classifier.js";
import { sendInstagramReply } from "./instagram-api.js";
import { RESPONSES } from "./responses.js";
import { getSession, setSession } from "./session-store.js";
import { sendTelegramNotification } from "./telegram.js";

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
  // Matches "Nombre: Juan" or "Nombre - Juan" patterns, case-insensitive.
  const regex = new RegExp(
    `${fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[:\\-\\s]+([^\\n•\\-,]+)`,
    "i",
  );
  const match = text.match(regex);
  return match?.[1]?.trim() || undefined;
}

function extractPhone(text: string): string | undefined {
  const match = text.match(/(?:tel[eé]fono|tel|cel|celular)?[:\s]*(\+?[\d\s\-()]{7,})/i);
  return match?.[1]?.trim() || undefined;
}

async function handleMessage(senderId: string, text: string): Promise<void> {
  const session = getSession(senderId);

  // If there's an active B2B data-collection session, treat this message as the data submission.
  if (session.segment === "b2b" && session.step === "collecting") {
    const nombre =
      extractField(text, "nombre") ??
      extractField(text, "name") ??
      `Cliente ${senderId.slice(-6)}`;
    const telefono =
      extractField(text, "teléfono") ??
      extractField(text, "telefono") ??
      extractField(text, "tel") ??
      extractPhone(text) ??
      "no informado";
    const negocio =
      extractField(text, "negocio") ??
      extractField(text, "local") ??
      extractField(text, "empresa") ??
      "su negocio";
    const ubicacion =
      extractField(text, "ubicación") ??
      extractField(text, "ubicacion") ??
      extractField(text, "ciudad") ??
      extractField(text, "barrio") ??
      "no informada";

    setSession(senderId, { segment: "b2b", step: "done" });

    const extraInfo = `Negocio: ${negocio} | Tel: ${telefono} | Ubicación: ${ubicacion}`;

    await Promise.all([
      sendInstagramReply({ recipientId: senderId, text: RESPONSES.b2b.sendPrices(nombre, negocio) }),
      sendTelegramNotification({ clientName: nombre, segment: "b2b", senderId, extraInfo }),
    ]);
    return;
  }

  const segment = classifyMessage(text);

  switch (segment) {
    case "consumer": {
      setSession(senderId, { segment: "consumer" });
      await sendInstagramReply({ recipientId: senderId, text: RESPONSES.consumer.info() });
      break;
    }
    case "b2b": {
      setSession(senderId, { segment: "b2b", step: "collecting", data: {} });
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

    // Instagram webhook verification: GET with hub.challenge
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

    // Instagram events: POST with messaging payload
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

      // Always respond 200 first; Meta retries if we take too long.
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("EVENT_RECEIVED");

      // Process async so the 200 is delivered immediately.
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
