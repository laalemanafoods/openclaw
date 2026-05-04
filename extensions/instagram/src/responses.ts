import type { PuntoDeVenta } from "./puntos-de-venta.js";

export const RESPONSES = {
  consumer: {
    askCity(): string {
      return (
        "¡Hola! Qué gusto saludarte. Soy La Alemanita Digital, la asistente oficial de La Alemana Foods 😊\n\n" +
        "¿En qué ciudad o barrio estás? Así te cuento el punto de venta más cercano."
      );
    },

    storeFound(stores: PuntoDeVenta[]): string {
      const shown = stores.slice(0, 3);
      const lines = shown
        .map((s) => {
          const barrio = s.barrio && s.barrio !== s.ciudad ? ` (${s.barrio})` : "";
          const dir = s.direccion ? ` — ${s.direccion}` : "";
          const link = s.maps || s.instagram || "";
          return link ? `• ${s.nombre}${barrio}${dir}\n  ${link}` : `• ${s.nombre}${barrio}${dir}`;
        })
        .join("\n");
      const extra = stores.length > 3 ? `\n...y ${stores.length - 3} más.` : "";
      return `Acá podés conseguirnos 📍\n\n${lines}${extra}\n\n¿Necesitás algo más?`;
    },

    noStore(tiendaOnline: string): string {
      const link = tiendaOnline
        ? `Podés comprarnos online acá: ${tiendaOnline}`
        : "Consultame y veo cómo ayudarte.";
      return `Por ahora no tenemos un punto de venta en tu zona 😊 ${link}\n\n¿Te puedo ayudar con algo más?`;
    },
  },

  b2b: {
    askForData(): string {
      return (
        "¡Qué bueno que quieras sumarte con tu local! Tenemos condiciones especiales para revendedores 🥩\n\n" +
        "Para contactarte necesito:\n\n" +
        "• Nombre del negocio:\n" +
        "• Ciudad:\n" +
        "• WhatsApp:\n\n" +
        "¿Me los pasás?"
      );
    },

    confirmation(negocio: string): string {
      return (
        `¡Perfecto, ${negocio}! Le paso tus datos al equipo comercial y te escriben por WhatsApp a la brevedad 🙌\n\n` +
        "¿Hay algo más en lo que te pueda ayudar?"
      );
    },
  },

  queja: {
    initial(): string {
      return (
        "Lo sentimos mucho, eso no debería pasar 😟\n\n" +
        "Contame qué pasó, dónde compraste el producto y si podés mandarnos una foto.\n\n" +
        "Nuestro equipo humano te va a responder a la brevedad. ¿Podés contarnos más?"
      );
    },
  },

  vendedor: {
    redirect(): string {
      return (
        "¡Qué bueno que te interese sumarte! Mandanos tus datos a laalemanafoods@gmail.com y el equipo comercial te responde pronto 📧\n\n" +
        "¿Hay algo más en lo que te pueda ayudar?"
      );
    },
  },

  fallback(): string {
    return (
      "¡Hola! Soy La Alemanita Digital, la asistente de La Alemana Foods 😊\n\n" +
      "¿En qué te puedo ayudar hoy?"
    );
  },
};
