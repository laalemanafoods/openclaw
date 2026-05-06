import type { PuntoDeVenta } from "./puntos-de-venta.js";

function formatStore(s: PuntoDeVenta): string {
  const dir = s.direccion ? ` 📍 ${s.direccion}` : "";
  const handle = s.instagram ? ` ${s.instagram}` : "";
  return `• **${s.nombre}**${dir}${handle}`;
}

export const RESPONSES = {
  consumer: {
    pricePolicy(): string {
      return "Los precios varían según cada punto de venta minorista, pero te ayudo a encontrar el local más cercano para que consultes ahí directamente. 😊 ¿En qué ciudad o barrio estás?";
    },

    neutralGreeting(): string {
      return "¡Hola! Qué gusto saludarte. Soy La Alemanita Digital, la asistente oficial de La Alemana Foods 😊 ¿En qué puedo ayudarte hoy?";
    },

    askCity(): string {
      return "¡Claro! Decime en qué ciudad o barrio estás así te busco el local más cercano.";
    },

    askCityDirect(): string {
      return "¡Claro! Decime en qué ciudad o barrio estás así te busco el local más cercano.";
    },

    askCityAfterGreeting(): string {
      return "¡Claro! Decime en qué ciudad o barrio estás así te busco el local más cercano.";
    },

    askCityForProduct(): string {
      return "¡Excelente elección! 🌭 Para decirte cuál es el lugar más cercano, ¿en qué ciudad o barrio estás?";
    },

    askHowToHelp(): string {
      return "¡Con mucho gusto! 😊 ¿Querés saber dónde conseguir nuestros productos o tenés alguna otra consulta?";
    },

    noStoreInProvince(province: string): string {
      return `¡Qué bueno es ${province}! 🙌 Por ahora no tenemos puntos de venta físicos allá, pero para compras grandes (+10 kg) enviamos desde fábrica. ¿Te interesa?`;
    },

    askCityNotFound(): string {
      return "No encontré esa ubicación. ¿En qué ciudad o barrio estás? 😊";
    },

    askCityForUnknownBarrio(): string {
      return "No encontré ese barrio en nuestra base. ¿En qué ciudad estás? Así te busco el local más cercano. 😊";
    },

    askCityForBarrio(barrioName: string, cities: string[]): string {
      if (cities.length === 2) {
        return `¿${barrioName} de ${cities[0]} o de ${cities[1]}? 😊`;
      }
      const last = cities[cities.length - 1]!;
      const rest = cities.slice(0, -1).join(", ");
      return `¿En qué ciudad estás: ${rest} o ${last}? 😊`;
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

    confirmation(_negocio: string): string {
      return "¡Excelente! Ya envié tus datos al sector de ventas. Se van a estar comunicando con vos por teléfono a la brevedad. 😊";
    },
  },

  evento: {
    confirmInterest(): string {
      return "¡Claro! Para compras grandes (+10 kg) podemos enviarte desde fábrica. ¿Te interesa?";
    },

    askForData(): string {
      return (
        "¡Perfecto! Necesito estos datos para organizarlo:\n\n" +
        "• Tu nombre:\n" +
        "• WhatsApp:\n" +
        "• Localidad:\n" +
        "• Cantidad estimada (kg):\n\n" +
        "El equipo te confirma todo a la brevedad."
      );
    },

    confirmation(_nombre: string): string {
      return "¡Excelente! Ya envié tus datos al sector de ventas. Se van a estar comunicando con vos por teléfono a la brevedad. 😊";
    },
  },

  queja: {
    askForData(): string {
      return (
        "Lo sentimos mucho, eso no debería pasar 😟\n\n" +
        "Para darte el mejor seguimiento, necesito:\n\n" +
        "• Tu nombre:\n" +
        "• WhatsApp:\n" +
        "• Descripción breve del problema:\n\n" +
        "El equipo te va a contactar a la brevedad."
      );
    },

    confirmation(nombre: string): string {
      return (
        `Gracias ${nombre}, ya le avisé al equipo 🙌\n\n` +
        "Te van a contactar a la brevedad por WhatsApp. ¿Hay algo más en lo que te pueda ayudar?"
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

  confusion: {
    escapeValve(): string {
      return "Veo que tenés dudas muy específicas y no quiero darte información errónea. 😊 ¿Te gustaría que un asesor del sector de ventas se comunique con vos para asesorarte personalmente?";
    },

    askForData(): string {
      return (
        "¡Perfecto! Para que te contacten, necesito:\n\n" +
        "• Tu nombre:\n" +
        "• WhatsApp:\n" +
        "• Tema de tu consulta:"
      );
    },

    confirmation(): string {
      return "¡Excelente! Ya envié tus datos al sector de ventas. Se van a estar comunicando con vos por teléfono a la brevedad. 😊";
    },

    decline(): string {
      return "¡Perfecto! Estoy acá si necesitás algo más. 😊";
    },
  },

  identityGuard(): string {
    return "Soy la asistente de La Alemana Foods 😊 No puedo compartir detalles técnicos, pero sí ayudarte con nuestros productos.";
  },

  clarification(): string {
    return "Perdón, no terminé de entender tu consulta. 🤭 ¿Podrías explicármelo de otra forma así te ayudo mejor?";
  },

  fallback(): string {
    return "¡Hola! Soy La Alemanita Digital 🌭 ¿En qué puedo ayudarte hoy?";
  },
};
