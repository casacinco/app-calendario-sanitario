export interface LabelStyle {
  bg: string;
  text: string;
}

const SEP = /^(.+?)\s*—\s*(.+)$/;

export function diseaseColor(name: string): LabelStyle | null {
  const n = name.toUpperCase().trim();
  if (n.includes("PASTEUREL"))                             return { bg: "#5FAF3E", text: "#FFFFFF" };
  if (n.includes("CLOSTRIDI"))                             return { bg: "#E67E22", text: "#FFFFFF" };
  if (n.includes("LEPTOSPIR"))                             return { bg: "#6C3BFF", text: "#FFFFFF" };
  if (n === "RAIVA" || n.startsWith("RAIVA"))              return { bg: "#E53935", text: "#FFFFFF" };
  if (n.includes("LINFADENIT") || n.includes("CASEOSA"))   return { bg: "#2D9CDB", text: "#FFFFFF" };
  return null;
}

export function rowColor(rowName: string, blockName: string): LabelStyle {
  const raw = rowName.match(SEP)?.[1]?.trim() ?? rowName;
  const r = raw.toUpperCase().trim();
  const b = blockName.toUpperCase();

  const dc = diseaseColor(r);
  if (dc) return dc;

  if (r.includes("ESTAÇÃO DE MONTA") || r.includes("MONTA")) return { bg: "#5FAF3E", text: "#FFFFFF" };
  if (r.includes("NASCIMENTO"))                              return { bg: "#2D9CDB", text: "#FFFFFF" };
  if (r.includes("DESMAMA"))                                 return { bg: "#E53935", text: "#FFFFFF" };
  if (r.includes("UMBIGO") || r.includes("CURA"))            return { bg: "#4F4F4F", text: "#FFFFFF" };
  if (r.includes("EIMERIOSE"))                               return { bg: "#6C3BFF", text: "#FFFFFF" };
  if (b.includes("VERMIF"))                                  return { bg: "#FF5C5C", text: "#FFFFFF" };
  return { bg: "#4F4F4F", text: "#FFFFFF" };
}
