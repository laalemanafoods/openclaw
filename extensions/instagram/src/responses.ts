import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readKnowledgeFile(filename: string): string {
  try {
    return readFileSync(resolve(process.cwd(), "conocimiento", filename), "utf-8");
  } catch {
    return "";
  }
}

export const RESPONSES = {
  consumer: {
    info(): string {
      const productos = readKnowledgeFile("productos_detalle.md");
      const base =
        "¡Hola! 👋 Somos La Alemana Foods, embutidos alemanes artesanales sin TACC.\n\n";
      const catalogue = productos
        ? `Estos son nuestros productos:\n\n${productos}\n\n`
        : "";
      return `${base}${catalogue}¿En qué te puedo ayudar? Consultame sobre recetas, ingredientes o dónde conseguir nuestros productos.`;
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
      const precios = readKnowledgeFile("precios_abril.md");
      const priceLine = precios
        ? `\n\nAquí están nuestras listas de precios para ${negocio}:\n\n${precios}`
        : "";
      return (
        `¡Perfecto, ${nombre}! 🙌${priceLine}\n\n` +
        "Nuestro equipo comercial se va a comunicar con vos a la brevedad. ¡Gracias por elegirnos! 🥩"
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
