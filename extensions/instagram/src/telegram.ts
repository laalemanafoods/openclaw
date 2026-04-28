// Sends Telegram notifications when a B2B lead completes data or a complaint is received.

export type TelegramParams = {
  clientName: string;
  segment: "b2b" | "queja";
  senderId: string;
  extraInfo?: string;
};

export async function sendTelegramNotification(params: TelegramParams): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];

  if (!token || !chatId) {
    console.warn("[instagram] Telegram no configurado: faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID");
    return;
  }

  const segmentLabel = params.segment === "b2b" ? "📦 Cliente B2B" : "⚠️ Queja";
  const igLink = `https://www.instagram.com/direct/t/${params.senderId}`;

  const lines = [
    `<b>${segmentLabel} — La Alemana Foods</b>`,
    `👤 Cliente: ${params.clientName}`,
    `🔗 Conversación IG: ${igLink}`,
  ];
  if (params.extraInfo) {
    lines.push(`📝 Detalles: ${params.extraInfo.slice(0, 300)}`);
  }

  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
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
