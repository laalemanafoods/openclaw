import type { PuntoDeVenta } from "./puntos-de-venta.js";

export const RESPONSES = {
  consumer: {
    askCity(): string {
      return (
        "¡Hola! Qué gusto saludarte 😊 Soy La Alemanita, de La Alemana Foods.\n\n" +
        "¿En qué ciudad o barrio estás? Así te cuento el punto de venta más cercano."
      );
    },

    storeFound(stores: PuntoDeVenta[]): string {
      const shown = stores.slice(0, 3);
      const lines = shown
        .map((s) => {
          const link = s.maps || s.instagram || "";
          return link ? `• ${s.nombre}: ${link}` : `• ${s.nombre}`;
        })
        .join("\n");
      const extra = stores.length > 3 ? `\n...y ${stores.length - 3} más.` : "";
      return `¡Genial! Acá podés conseguirnos:\n\n${lines}${extra}\n\n¿Necesitás algo más? 😊`;
    },

    noStore(tiendaOnline: string): string {
      const link = tiendaOnline
        ? `\n\nPodés comprarnos online acá: ${tiendaOnline} 🛒`
        : "";
      return `Por ahora no tenemos un punto de venta en tu zona 😊${link}\n\n¿Te puedo ayudar con algo más?`;
    },
  },

  b2b: {
    askForData(): string {
      return (
        "¡Qué bueno que quieras sumarte con tu local! 🥩 Tenemos condiciones especiales para revendedores.\n\n" +
        "Para contactarte necesito:\n\n" +
        "• Nombre del negocio:\n" +
        "• Ciudad:\n" +
        "• WhatsApp:\n\n" +
        "¡Completalos y te escribimos pronto! ✍️"
      );
    },

    confirmation(negocio: string): string {
      return (
        `¡Perfecto, ${negocio}! 🙌 Le paso tus datos al equipo comercial y te van a escribir por WhatsApp a la brevedad.\n\n` +
        "¡Gracias por elegirnos!"
      );
    },
  },

  queja: {
    initial(): string {
      return (
        "Ay, lo sentimos mucho 😟 Eso no debería pasar.\n\n" +
        "Contame un poco más para poder ayudarte:\n\n" +
        "1️⃣ ¿Qué pasó?\n" +
        "2️⃣ ¿Dónde compraste el producto?\n" +
        "3️⃣ ¿Podés mandar una foto?\n\n" +
        "Te respondemos lo antes posible, prometido."
      );
    },
  },

  vendedor: {
    redirect(): string {
      return (
        "¡Hola! Qué bueno que te interese sumarte 😊\n\n" +
        "Mandanos tu consulta con tus datos a:\n" +
        "📧 laalemanafoods@gmail.com\n\n" +
        "El equipo comercial te responde pronto. ¡Gracias!"
      );
    },
  },

  fallback(): string {
    return (
      "¡Hola! 😊 Soy La Alemanita, de La Alemana Foods.\n\n" +
      "¿En qué te puedo ayudar?\n" +
      "• Info de productos\n" +
      "• Recetas y cocción\n" +
      "• Dónde conseguirnos\n" +
      "• Precios para negocios"
    );
  },
};
