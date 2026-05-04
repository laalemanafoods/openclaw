// Sends Telegram notifications for B2B leads and complaints.

export type TelegramParams =
  | { segment: "b2b"; negocio: string; ciudad: string; whatsapp: string; senderId: string }
  | { segment: "queja"; nombre: string; whatsapp: string; descripcion: string; senderId: string };

function buildMessage(params: TelegramParams): string {
  const igLink = `https://www.instagram.com/direct/t/${params.senderId}`;
  if (params.segment === "b2b") {
    return (
      `🏷️ <b>Nuevo Interesado Mayorista</b>\n` +
      `${params.negocio} | 📍 ${params.ciudad} | 📱 WhatsApp: ${params.whatsapp}\n` +
      `🔗 IG: ${igLink}`
    );
  }
  return (
    `⚠️ <b>Nuevo Reclamo Recibido</b>\n` +
    `Cliente: ${params.nombre} | 📱 WhatsApp: ${params.whatsapp}\n` +
    `📋 Problema: ${params.descripcion.slice(0, 300)}\n` +
    `🔗 IG: ${igLink}`
  );
}

export async function sendTelegramNotification(params: TelegramParams): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];

  if (!token || !chatId) {
    console.warn("[instagram] Telegram no configurado: faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID");
    return;
  }

  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(params),
        parse_mode: "HTML",
      }),
    });

    if (!resp.ok) {
      console.error(`[instagram] Telegram API error ${resp.status}: ${await resp.text()}`);
    }
  } catch (err) {
    console.error("[instagram] Error enviando notificación Telegram:", err);
  }
}
