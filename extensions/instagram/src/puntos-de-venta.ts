import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type PuntoDeVenta = {
  nombre: string;
  ciudad: string;
  barrio?: string;
  direccion?: string;
  maps?: string;
  instagram?: string;
};

function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function load(): { tienda_online: string; puntos: PuntoDeVenta[] } {
  try {
    const raw = readFileSync(
      resolve(process.cwd(), "conocimiento", "puntos_de_venta.json"),
      "utf-8",
    );
    return JSON.parse(raw) as { tienda_online: string; puntos: PuntoDeVenta[] };
  } catch {
    return { tienda_online: "", puntos: [] };
  }
}

export function findStoresByLocation(query: string): PuntoDeVenta[] {
  const { puntos } = load();
  const q = norm(query);
  return puntos.filter((p) => {
    const ciudad = norm(p.ciudad);
    const barrio = norm(p.barrio ?? "");
    return (
      q.includes(ciudad) ||
      ciudad.includes(q) ||
      (barrio && (q.includes(barrio) || barrio.includes(q)))
    );
  });
}

export function getOnlineStoreUrl(): string {
  return load().tienda_online ?? "";
}
