// Classifies incoming Instagram DM text into one of four segments for La Alemana Foods.

export type Segment = "consumer" | "b2b" | "evento" | "queja" | "vendedor";

const B2B_KEYWORDS = [
  "fiambrería",
  "fiambreria",
  "fiambres",
  "restaurante",
  "restaurant",
  "gastronomía",
  "gastronomia",
  "gastro",
  "eventos",
  "mayorista",
  "por mayor",
  "negocio",
  "local comercial",
  "distribución",
  "distribucion",
  "proveedor",
  "almacén",
  "almacen",
  "supermercado",
  "buffet",
  "catering",
  "hotel",
  "confitería",
  "confiteria",
  "cantina",
  "parrilla",
  "precio comercial",
  "precio al por mayor",
  "precio mayorista",
  "lista de precios",
  "lista precio",
  "revender",
  "revendedor",
  "revendedora",
  "para mi negocio",
  "precios por cantidad",
  "quiero revender",
  "para el local",
];

const QUEJA_KEYWORDS = [
  "queja",
  "reclamo",
  "problema",
  "inconveniente",
  "mal estado",
  "vencido",
  "vencida",
  "podrido",
  "podrida",
  "desagradable",
  "horrible",
  "pésimo",
  "pesimo",
  "no sirve",
  "defecto",
  "defectuoso",
  "dañado",
  "dañada",
  "en mal estado",
  "me hizo mal",
  "intoxicación",
  "intoxicacion",
  "devolución",
  "devolucion",
  "me enfermé",
  "me enferme",
  "está malo",
  "esta malo",
];

const EVENTO_KEYWORDS = [
  "cumpleaños", "cumpleanos", "casamiento", "boda", "bodas",
  "fiesta", "fiestas", "quince", "quinceañera", "quinceañero", "quinceañeras",
  "agasajo", "reunion familiar", "reunión familiar",
  "10 kg", "10kg", "20 kg", "20kg", "30 kg", "30kg",
  "mas de 10 kilo", "más de 10 kilo", "grandes cantidades", "gran cantidad",
  "muchos kilos", "varios kilos", "bastantes kilos",
];

const VENDEDOR_KEYWORDS = [
  "vendedor",
  "vendedora",
  "quiero vender",
  "representante",
  "distribuir",
  "ser distribuidor",
  "agente de ventas",
  "ser representante",
  "comisión de venta",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function classifyMessage(text: string): Segment {
  const lower = normalize(text);

  if (VENDEDOR_KEYWORDS.some((kw) => lower.includes(normalize(kw)))) {
    return "vendedor";
  }
  if (B2B_KEYWORDS.some((kw) => lower.includes(normalize(kw)))) {
    return "b2b";
  }
  if (EVENTO_KEYWORDS.some((kw) => lower.includes(normalize(kw)))) {
    return "evento";
  }
  if (QUEJA_KEYWORDS.some((kw) => lower.includes(normalize(kw)))) {
    return "queja";
  }
  return "consumer";
}
