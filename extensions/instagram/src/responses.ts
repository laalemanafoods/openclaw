import type { PuntoDeVenta } from "./puntos-de-venta.js";

function formatStore(s: PuntoDeVenta): string {
  const dir = s.direccion ? ` 📍 ${s.direccion}` : "";
  const handle = s.instagram ? ` ${s.instagram}` : "";
  return `• **${s.nombre}**${dir}${handle}`;
}

export const RESPONSES = {
  consumer: {
    askCity(): string {
      return (
        "¡Hola! Qué gusto saludarte. Soy La Alemanita Digital, la asistente oficial de La Alemana Foods 😊\n\n" +
        "¿En qué ciudad o barrio estás? Así te cuento el punto de venta más cercano."
      );
    },

    askCityDirect(): string {
      return "¡Hola! Qué gusto saludarte. 😊 Claro, te ayudo con eso. ¿En qué ciudad o barrio estás?";
    },

    askBarrio(cityName: string): string {
      return (
        `¡Qué bueno! En ${cityName} tenemos muchísimos puntos de venta 😊\n\n` +
        "¿En qué barrio o zona estás específicamente? Así te paso los que te queden más cómodos."
      );
    },

    storeFound(locationName: string, stores: PuntoDeVenta[]): string {
      const lines = stores.map(formatStore).join("\n");
      return `¡Claro! Te cuento dónde podés encontrar nuestros productos en ${locationName}:\n\n${lines}\n\n¿Necesitás algo más? 😊`;
    },

    storeFoundGrouped(locationName: string, groups: Map<string, PuntoDeVenta[]>): string {
      const body = Array.from(groups.entries())
        .map(([barrio, stores]) => {
          const lines = stores.map(formatStore).join("\n");
          return `${barrio.toUpperCase()}\n${lines}`;
        })
        .join("\n\n");
      return `¡Claro! Te cuento dónde podés encontrar nuestros productos en ${locationName}:\n\n${body}\n\n¿Necesitás algo más? 😊`;
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
        `¡Perfecto, ${negocio}! Le paso tus datos al equipo comercial y te van a escribir por WhatsApp a la brevedad 🙌\n\n` +
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
