// Classifies incoming Instagram DM text into one of four segments for La Alemana Foods.

export type Segment = "consumer" | "b2b" | "queja" | "vendedor";

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

const VENDEDOR_KEYWORDS = [
  "vendedor",
  "vendedora",
  "quiero vender",
  "revender",
  "revendedor",
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
  if (QUEJA_KEYWORDS.some((kw) => lower.includes(normalize(kw)))) {
    return "queja";
  }
  if (B2B_KEYWORDS.some((kw) => lower.includes(normalize(kw)))) {
    return "b2b";
  }
  return "consumer";
}
