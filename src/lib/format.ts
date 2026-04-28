// Formatadores leves usados nas telas admin/aluno.

export function formatDateBR(input: string | null | undefined): string {
  if (!input) return "—";
  // Aceita "YYYY-MM-DD" e ISO completo "YYYY-MM-DD HH:mm:ss" ou "YYYY-MM-DDTHH:mm:ss"
  const datePart = input.slice(0, 10);
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return input;
  return `${d}/${m}/${y}`;
}

export function formatNumberBR(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
}
