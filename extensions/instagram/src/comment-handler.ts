// Handles public Instagram comment events and invites users to DM.
// Never resolves full queries in comments — only redirects to private conversation.

import { sendCommentReply } from "./instagram-api.js";

const repliedComments = new Set<string>();

const COMMENT_B2C_KEYWORDS = [
  "donde comprar", "dónde comprar", "donde conseguir", "dónde conseguir",
  "donde lo consigo", "donde encuentro", "dónde encuentro",
  "punto de venta", "puntos de venta", "donde venden", "dónde venden",
  "hacen envios", "hacen envíos", "envio", "envíos", "mandan a",
  "despachan", "llegan a", "tienen en",
];

const COMMENT_B2B_KEYWORDS = [
  "reventa", "revendedor", "revendedora", "mayorista", "por mayor",
  "distribucion", "distribución", "distribuir", "ser distribuidor",
  "trabajar con", "vender sus productos", "vender los productos",
  "para mi negocio", "precio mayorista", "lista de precios",
  "me interesa distribuir", "interesa vender",
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

type CommentIntent = "b2c" | "b2b" | "ignore";

function classifyComment(text: string): CommentIntent {
  const q = normalize(text);
  if (COMMENT_B2B_KEYWORDS.some((kw) => q.includes(normalize(kw)))) return "b2b";
  if (COMMENT_B2C_KEYWORDS.some((kw) => q.includes(normalize(kw)))) return "b2c";
  return "ignore";
}

function pick(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)]!;
}

function replyTextB2C(): string {
  return pick([
    "¡Hola! 🙌 Escribinos por DM y te ayudamos a encontrar el punto de venta más cercano.",
    "¡Gracias por escribirnos! 😊 Mandanos un DM y te pasamos toda la info.",
    "¡Hola! 🌭 Escribinos por privado y te ayudamos con muchísimo gusto.",
  ]);
}

function replyTextB2B(): string {
  return pick([
    "¡Qué bueno que te interese trabajar con nosotros! 🙌 Escribinos por DM y seguimos por ahí.",
    "¡Gracias por tu interés! 😊 Mandanos un mensaje privado y el equipo comercial te responde.",
    "¡Nos encanta leer eso! 🌭 Escribinos por privado y te contamos más.",
  ]);
}

export type CommentChangeValue = {
  id: string;
  text?: string;
  from?: { id: string; username?: string };
  media?: { id: string; media_product_type?: string };
  timestamp?: number;
};

export async function processCommentChange(value: CommentChangeValue): Promise<void> {
  const commentId = value.id;
  const text = value.text ?? "";
  const fromId = value.from?.id;
  const pageId = process.env["INSTAGRAM_PAGE_ID"];

  if (fromId && pageId && fromId === pageId) return;

  if (repliedComments.has(commentId)) {
    console.info(`[instagram] comentario ${commentId} ya respondido, ignorando`);
    return;
  }

  const intent = classifyComment(text);
  if (intent === "ignore") {
    console.info(`[instagram] comentario ${commentId} sin intención comercial, ignorando`);
    return;
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 3000 + Math.floor(Math.random() * 4000)));

  const reply = intent === "b2b" ? replyTextB2B() : replyTextB2C();
  console.info(`[instagram] respondiendo comentario ${commentId} intent=${intent}`);
  await sendCommentReply(commentId, reply);
  repliedComments.add(commentId);
}
