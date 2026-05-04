// Sends replies to Instagram DMs via the Meta Graph API.

export async function sendInstagramReply(params: {
  recipientId: string;
  text: string;
}): Promise<void> {
  const accessToken = process.env["INSTAGRAM_ACCESS_TOKEN"];
  const pageId = process.env["INSTAGRAM_PAGE_ID"];

  if (!accessToken || !pageId) {
    console.warn(
      "[instagram] Instagram API no configurada: faltan INSTAGRAM_ACCESS_TOKEN o INSTAGRAM_PAGE_ID",
    );
    return;
  }

  const MAX_CHARS = 990;
  const text =
    params.text.length > MAX_CHARS
      ? params.text.slice(0, MAX_CHARS - 3).trimEnd() + "..."
      : params.text;

  try {
    const resp = await fetch(`https://graph.instagram.com/v25.0/${pageId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: params.recipientId },
        message: { text },
        messaging_type: "RESPONSE",
        access_token: accessToken,
      }),
    });

    if (!resp.ok) {
      console.error(`[instagram] Meta Graph API error ${resp.status}: ${await resp.text()}`);
    }
  } catch (err) {
    console.error("[instagram] Error enviando respuesta Instagram:", err);
  }
}
