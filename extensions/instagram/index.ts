import { definePluginEntry, type OpenClawPluginApi } from "./api.js";
import { createInstagramWebhookHandler } from "./src/handler.js";

const DEFAULT_WEBHOOK_PATH = "/plugins/instagram/webhook";

export default definePluginEntry({
  id: "instagram",
  name: "Instagram DM Router",
  description:
    "Clasifica mensajes de Instagram en segmentos B2B, Consumidor, Quejas y Vendedores. Envía notificaciones a Telegram para leads B2B y quejas.",
  register(api: OpenClawPluginApi) {
    const pluginConfig = api.pluginConfig as { webhookPath?: string } | undefined;
    const webhookPath = pluginConfig?.webhookPath?.trim() || DEFAULT_WEBHOOK_PATH;

    const handler = createInstagramWebhookHandler();

    api.registerHttpRoute({
      path: webhookPath,
      auth: "plugin",
      match: "exact",
      replaceExisting: true,
      handler,
    });

    api.logger.info?.(
      `[instagram] Webhook registrado en ${webhookPath}. ` +
        `Variables requeridas: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_PAGE_ID, ` +
        `INSTAGRAM_VERIFY_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID`,
    );
  },
});
