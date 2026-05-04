export const RESPONSES = {
  consumer: {
    info(): string {
      return (
        "¡Hola! 😊 Soy La Alemanita Digital, de La Alemana Foods.\n\n" +
        "Para ayudarte de forma más rápida y eficiente, voy a acompañarte en los primeros pasos.\n\n" +
        "¿En qué te puedo ayudar hoy?"
      );
    },
  },

  b2b: {
    askForData(): string {
      return (
        "¡Hola! 👋 Gracias por tu interés en trabajar con La Alemana Foods.\n\n" +
        "Para enviarte nuestra lista de precios, necesito algunos datos:\n\n" +
        "• Nombre completo:\n" +
        "• Teléfono:\n" +
        "• Nombre del negocio:\n" +
        "• Ubicación (barrio/ciudad):\n\n" +
        "¿Podés completarlos? ✍️"
      );
    },

    sendPrices(nombre: string, negocio: string): string {
      void negocio;
      return (
        `¡Perfecto, ${nombre}! 🙌\n\n` +
        "Precios Abril 2026:\n\n" +
        "Pack pequeño (Retail):\n" +
        "Frankfurter $7.466 | Thüringer $7.563\n" +
        "Rinderwurst $8.833 | Wiener $7.466 | Leberwurst $5.506\n\n" +
        "Pack ~1kg (Gastronomía):\n" +
        "Frankfurter $14.484 | Thüringer $14.544\n" +
        "Rinderwurst $16.577 | Wiener $12.463 | Leberwurst $13.262\n\n" +
        "Nuestro equipo comercial te contacta a la brevedad. ¡Gracias por elegirnos! 🥩"
      );
    },
  },

  queja: {
    initial(): string {
      return (
        "Lamentamos mucho que hayas tenido una mala experiencia. 😟\n\n" +
        "Para ayudarte lo antes posible, necesitamos saber:\n\n" +
        "1️⃣ ¿Qué fue lo que pasó?\n" +
        "2️⃣ ¿Dónde compraste el producto? (nombre del local o ciudad)\n" +
        "3️⃣ ¿Podés enviarnos una foto del producto?\n\n" +
        "Nuestro equipo te va a responder a la brevedad. ¡Gracias por avisarnos!"
      );
    },
  },

  vendedor: {
    redirect(): string {
      return (
        "¡Hola! 👋 Gracias por tu interés en representar a La Alemana Foods.\n\n" +
        "Por favor enviá tu consulta con tus datos a:\n\n" +
        "📧 laalemanafoods@gmail.com\n\n" +
        "Nuestro equipo de ventas te va a responder a la brevedad. ¡Gracias!"
      );
    },
  },

  fallback(): string {
    return (
      "¡Hola! 👋 Somos La Alemana Foods, embutidos alemanes artesanales sin TACC.\n\n" +
      "¿En qué te podemos ayudar?\n" +
      "• Información sobre productos\n" +
      "• Recetas y sugerencias de cocción\n" +
      "• Dónde conseguirnos\n" +
      "• Precios para negocios (B2B)"
    );
  },
};
