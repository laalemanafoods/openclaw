export const RESPONSES = {
  consumer: {
    info(): string {
      return (
        "¡Hola! 😊 Soy La Alemanita, tu asistente de La Alemana Foods.\n\n" +
        "Estoy acá para ayudarte con lo que necesites. ¿En qué te puedo ayudar hoy?"
      );
    },
  },

  b2b: {
    askForData(): string {
      return (
        "¡Hola! Me alegra que quieras trabajar con nosotros 🤝\n\n" +
        "Para mandarte los precios necesito estos datos:\n\n" +
        "• Nombre:\n" +
        "• Teléfono:\n" +
        "• Nombre del negocio:\n" +
        "• Barrio/ciudad:\n\n" +
        "¡Completalos y te mando todo enseguida! ✍️"
      );
    },

    sendPrices(nombre: string, negocio: string): string {
      void negocio;
      return (
        `¡Gracias, ${nombre}! Acá van los precios 👇\n\n` +
        "Pack pequeño (Retail):\n" +
        "Frankfurter $7.466 | Thüringer $7.563\n" +
        "Rinderwurst $8.833 | Wiener $7.466 | Leberwurst $5.506\n\n" +
        "Pack ~1kg (Gastronomía):\n" +
        "Frankfurter $14.484 | Thüringer $14.544\n" +
        "Rinderwurst $16.577 | Wiener $12.463 | Leberwurst $13.262\n\n" +
        "Alguien del equipo te va a escribir pronto. ¡Bienvenido! 🥩"
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
