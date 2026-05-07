import type { BarPart } from "@/lib/db";

// Cores oficiais
const C = {
  verde:        "#5FAF3E",
  laranja:      "#E67E22",
  roxo:         "#6C3BFF",
  vermelho:     "#E53935",
  azul:         "#2D9CDB",
  ciano:        "#2EC4B6",
  cinza:        "#4F4F4F",
  vermifugacao: "#FF5C5C",
} as const;

export interface PresetBar {
  rowName: string;
  startMonth: number;
  endMonth: number;
  startPart: BarPart;
  endPart: BarPart;
  label: string;
  color: string;
}

export interface CalendarPreset {
  id: string;
  name: string;
  bars: PresetBar[];
}

// Atalho para barra com posição padrão (start → end)
function bar(rowName: string, s: number, e: number, label: string, color: string): PresetBar;
function bar(rowName: string, s: number, sp: BarPart, e: number, ep: BarPart, label: string, color: string): PresetBar;
function bar(
  rowName: string,
  s: number,
  spOrE: BarPart | number,
  eOrLabel: number | string,
  epOrColor: BarPart | string,
  labelOrUndef?: string,
  colorOrUndef?: string,
): PresetBar {
  if (typeof spOrE === "number") {
    // atalho sem parts: bar(row, start, end, label, color)
    return { rowName, startMonth: s, endMonth: spOrE, startPart: "start", endPart: "end", label: eOrLabel as string, color: epOrColor as string };
  }
  // com parts: bar(row, start, startPart, end, endPart, label, color)
  return { rowName, startMonth: s, startPart: spOrE, endMonth: eOrLabel as number, endPart: epOrColor as BarPart, label: labelOrUndef!, color: colorOrUndef! };
}

export const PRESETS: CalendarPreset[] = [
  {
    id: "sul-sem-estacao-chuvas",
    name: "SUL SEM ESTAÇÃO CHUVAS SET,OUT,NOV,DEZ",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",               9, 12, "PERÍODO DAS CHUVAS",                                                               C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                 1, 12, "ESTAÇÃO DE MONTA",                                                                  C.verde),
      bar("Nascimento",                       1, 12, "NASCIMENTO",                                                                        C.azul),
      bar("Desmama",                          1, 12, "DESMAMA",                                                                           C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",         1, 12, "1ª DOSE APÓS 60 DIAS + REFORÇO",                                                   C.verde),
      bar("Pasteurelose — Adultos",           2,  3, "DOSE + REFORÇO",                                                                   C.verde),
      bar("Pasteurelose — Adultos",           8,  8, "DOSE",                                                                             C.verde),

      bar("Clostridiose — Cordeiros",         1, 12, "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                                            C.laranja),
      bar("Clostridiose — Adultos",           2,  3, "DOSE + REFORÇO",                                                                   C.laranja),
      bar("Clostridiose — Adultos",           8,  8, "DOSE",                                                                             C.laranja),

      bar("Leptospirose — Cordeiras",         1, 12, "1ª DOSE APÓS 150 DIAS + REFORÇO",                                                 C.roxo),
      bar("Leptospirose — Matrizes",          5,  6, "DOSE + REFORÇO",                                                                   C.roxo),

      bar("Raiva — Cordeiros",                1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                  C.vermelho),
      bar("Raiva — Adultos",                  8,  8, "DOSE",                                                                             C.vermelho),

      bar("Foot-rot — Cordeiros",             1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                  C.ciano),
      bar("Foot-rot — Adultos",               4,  5, "DOSE + REFORÇO",                                                                   C.ciano),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                   1, 12, "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",              C.cinza),
      bar("Prevenção de eimeriose",           1, 12, "REALIZAR TRATAMENTO PREVENTIVO CONTRA EIMERIOSE",                                 C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                        1, 12, "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                    C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                      C.vermifugacao),
      bar("Adultos",   4, "end",    6, "start",  "DOSE + REFORÇO",                                                                      C.vermifugacao),
      bar("Adultos",   8, "middle", 9, "end",    "DOSE + REFORÇO",                                                                      C.vermifugacao),
      bar("Adultos",  10, "end",   12, "start",  "DOSE + REFORÇO",                                                                      C.vermifugacao),
      bar("Ovelhas prenhes",                  1, 12, "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",          C.vermifugacao),
    ],
  },
  {
    id: "sul-com-estacao-chuvas",
    name: "SUL ESTAÇÃO MARÇO CHUVAS MAI,JUN,JUL,AGO",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",               4,  7, "PERÍODO DAS CHUVAS",                                                               C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                 3,  3, "ESTAÇÃO DE MONTA",                                                                  C.verde),
      bar("Nascimento",        7, "end",      9, "start",  "NASCIMENTO",                                                                 C.azul),
      bar("Desmama",          10, "end",     12, "start",  "DESMAMA",                                                                    C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",         9, "end",  12, "end",    "1ª DOSE ENTRE 30 A 60 DIAS + REFORÇO",                          C.verde),
      bar("Pasteurelose — Adultos",           4, "start", 5, "middle", "DOSE + REFORÇO",                                                C.verde),
      bar("Pasteurelose — Adultos",          10, 10, "DOSE",                                                                            C.verde),

      bar("Clostridiose — Cordeiros",         9, "end",  12, "end",    "1ª DOSE ENTRE 30 A 60 DIAS + REFORÇO",                         C.laranja),
      bar("Clostridiose — Adultos",           4, "start", 5, "middle", "DOSE + REFORÇO",                                               C.laranja),
      bar("Clostridiose — Adultos",          10, 10, "DOSE",                                                                           C.laranja),

      bar("Leptospirose — Cordeiras",         1, "end",   4, "end",    "1ª DOSE APÓS 150 DIAS + REFORÇO",                              C.roxo),
      bar("Leptospirose — Matrizes",          5, "start", 6, "middle", "DOSE + REFORÇO",                                               C.roxo),

      bar("Raiva — Cordeiros",                9, "end",  12, "end",    "1ª DOSE APÓS 60 DIAS + REFORÇO",                               C.vermelho),
      bar("Raiva — Adultos",                 10, 10, "DOSE",                                                                         C.vermelho),

      bar("Foot-rot — Cordeiros",             1, "start", 4, "middle", "1ª DOSE APÓS 90 DIAS + REFORÇO",                               C.ciano),
      bar("Foot-rot — Adultos",               1,  2, "DOSE + REFORÇO",                                                                 C.ciano),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                   7, "end",  12, "middle", "CURA DO UMBIGO + PROBEZERRO + CATOFÓS",                        C.cinza),
      bar("Prevenção de eimeriose",           8, "middle",12, "end",   "PREVENTIVO EIMERIOSE",                                         C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                        1, "start",12, "middle", "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO", C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                     C.vermifugacao),
      bar("Adultos",   4, "end",    6, "start",  "DOSE + REFORÇO",                                                                     C.vermifugacao),
      bar("Adultos",   7, "middle", 8, "middle", "DOSE + REFORÇO",                                                                     C.vermifugacao),
      bar("Adultos",   9, "middle",10, "middle", "DOSE + REFORÇO",                                                                     C.vermifugacao),
      bar("Ovelhas prenhes",                  1, "start",12, "middle", "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)", C.vermifugacao),
    ],
  },
  {
    id: "sul-estacao-jan-abr-chuvas-mar-jul",
    name: "SUL ESTAÇÃO JAN,FEV,MAR,ABRI CHUVAS MAR,ABRI,MAIO,JUN,JUL",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",               3,  3, "PERÍODO DAS CHUVAS",                                                               C.azul),
      bar("Período das chuvas",               9,  9, "PERÍODO DAS CHUVAS",                                                               C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                 1,  4, "ESTAÇÃO DE MONTA",                                                                  C.verde),
      bar("Nascimento",        7, "start",   10, "start",  "NASCIMENTO",                                                                 C.azul),
      bar("Desmama",           9, 12, "DESMAMA",                                                                                         C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",         7, "start", 11, "start", "1ª DOSE ENTRE 30 A 60 DIAS + REFORÇO",                          C.verde),
      bar("Pasteurelose — Adultos",           3, "middle", 4, "end",   "DOSE + REFORÇO",                                                C.verde),
      bar("Pasteurelose — Adultos",           9,  9, "DOSE",                                                                            C.verde),

      bar("Clostridiose — Cordeiros",         7, "start", 11, "start", "1ª DOSE ENTRE 30 A 60 DIAS + REFORÇO",                         C.laranja),
      bar("Clostridiose — Adultos",           3, "middle", 4, "end",   "DOSE + REFORÇO",                                               C.laranja),
      bar("Clostridiose — Adultos",           9,  9, "DOSE",                                                                           C.laranja),

      bar("Leptospirose — Cordeiras",         9, "end",  12, "end",    "1ª DOSE APÓS 150 DIAS + REFORÇO",                              C.roxo),
      bar("Leptospirose — Matrizes",          2,  3, "DOSE + REFORÇO",                                                                 C.roxo),

      bar("Raiva — Cordeiros",                8, "start", 12, "start", "1ª DOSE APÓS 60 DIAS + REFORÇO",                               C.vermelho),
      bar("Raiva — Adultos",                  2,  2, "DOSE",                                                                            C.vermelho),

      bar("Foot-rot — Cordeiros",             9, "end",  12, "end",    "1ª DOSE APÓS 15 DIAS + REFORÇO",                               C.ciano),
      bar("Foot-rot — Adultos",              11, "start", 12, "middle", "DOSE + REFORÇO",                                              C.ciano),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                   6, "start", 10, "middle", "CURA DO UMBIGO + PROBEZERRO + CATOFÓS",                       C.cinza),
      bar("Prevenção de eimeriose",           6, "end",   11, "start",  "PREVENTIVO EIMERIOSE",                                        C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                        1, "start", 12, "middle", "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO", C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                     C.vermifugacao),
      bar("Adultos",   6, "middle", 7, "middle", "DOSE + REFORÇO",                                                                     C.vermifugacao),
      bar("Adultos",   9, "middle",10, "middle", "DOSE + REFORÇO",                                                                     C.vermifugacao),
      bar("Ovelhas prenhes",                  1, "start", 12, "middle", "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)", C.vermifugacao),
    ],
  },
  {
    id: "sem-estacao-chuvas-mar-mai",
    name: "SEM ESTAÇÃO CHUVAS MAR,ABR,MAI",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",                          3,  5, "PERÍODO DAS CHUVAS",                                                                  C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                            1, 12, "ESTAÇÃO DE MONTA",                                                                    C.verde),
      bar("Nascimento",                                  1, 12, "NASCIMENTO",                                                                          C.azul),
      bar("Desmama",                                     1, 12, "DESMAMA",                                                                             C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                                               C.verde),
      bar("Pasteurelose — Adultos",                      1,  2, "DOSE + REFORÇO",                                                                     C.verde),
      bar("Pasteurelose — Adultos",                      7,  7, "DOSE",                                                                               C.verde),

      bar("Clostridiose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                                              C.laranja),
      bar("Clostridiose — Adultos",                      1,  2, "DOSE + REFORÇO",                                                                    C.laranja),
      bar("Clostridiose — Adultos",                      7,  7, "DOSE",                                                                              C.laranja),

      bar("Leptospirose — Cordeiras",                    1, 12, "1ª DOSE APÓS 150 DIAS + REFORÇO",                                                   C.roxo),
      bar("Leptospirose — Matrizes",                    10, 11, "DOSE + REFORÇO",                                                                    C.roxo),

      bar("Raiva — Cordeiros",                           1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.vermelho),
      bar("Raiva — Adultos",                            11, 11, "DOSE",                                                                              C.vermelho),

      bar("Linfadeite caseosa — Cordeiros",              1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.azul),
      bar("Linfadeite caseosa — Adulto imunizado",      10, 10, "DOSE",                                                                              C.azul),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                              1, 12, "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",                 C.cinza),
      bar("Prevenção de eimeriose",                      1, 12, "REALIZAR TRATAMENTO PREVENTIVO CONTRA EMERIOSE",                                     C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                                   1, 12, "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                       C.vermifugacao),
      bar("Adultos",   2, "start",  3, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   4, "end",    6, "start",  "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   7, "middle", 8, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",  11, "middle",12, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Ovelhas prenhes",                             1, 12, "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",             C.vermifugacao),
    ],
  },
  {
    id: "sem-estacao-chuvas-mai-jul",
    name: "SEM ESTAÇÃO CHUVAS MAI,JUN,JUL",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",                          5,  7, "PERÍODO DAS CHUVAS",                                                                  C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                            1, 12, "ESTAÇÃO DE MONTA",                                                                    C.verde),
      bar("Nascimento",                                  1, 12, "NASCIMENTO",                                                                          C.azul),
      bar("Desmama",                                     1, 12, "DESMAMA",                                                                             C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",                    1, 12, "1ª DOSE APÓS 60 DIAS + REFORÇO",                                                     C.verde),
      bar("Pasteurelose — Adultos",                      3,  4, "DOSE + REFORÇO",                                                                     C.verde),
      bar("Pasteurelose — Adultos",                      9,  9, "DOSE",                                                                               C.verde),

      bar("Clostridiose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                                              C.laranja),
      bar("Clostridiose — Adultos",                      3,  4, "DOSE + REFORÇO",                                                                    C.laranja),
      bar("Clostridiose — Adultos",                      9,  9, "DOSE",                                                                              C.laranja),

      bar("Leptospirose — Cordeiras",                    1, 12, "1ª DOSE APÓS 150 DIAS + REFORÇO",                                                   C.roxo),
      bar("Leptospirose — Matrizes",                     1,  2, "DOSE + REFORÇO",                                                                    C.roxo),

      bar("Raiva — Cordeiros",                           1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.vermelho),
      bar("Raiva — Adultos",                             2,  2, "DOSE",                                                                              C.vermelho),

      bar("Linfadeite caseosa — Cordeiros",              1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.azul),
      bar("Linfadeite caseosa — Adulto imunizado",       1,  1, "DOSE",                                                                              C.azul),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                              1, 12, "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",                 C.cinza),
      bar("Prevenção de eimeriose",                      1, 12, "REALIZAR TRATAMENTO PREVENTIVO CONTRA EMERIOSE",                                     C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                                   1, 12, "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                       C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   5, "middle", 6, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   7, "middle", 8, "end",    "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   9, "end",   11, "start",  "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Ovelhas prenhes",                             1, 12, "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",             C.vermifugacao),
    ],
  },
  {
    id: "sem-estacao-chuvas-jun-set",
    name: "SEM ESTAÇÃO CHUVAS JUN,JUL,AGO,SET",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",                          6,  9, "PERÍODO DAS CHUVAS",                                                                  C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                            1, 12, "ESTAÇÃO DE MONTA",                                                                    C.verde),
      bar("Nascimento",                                  1, 12, "NASCIMENTO",                                                                          C.azul),
      bar("Desmama",                                     1, 12, "DESMAMA",                                                                             C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",                    1, 12, "1ª DOSE APÓS 60 DIAS + REFORÇO",                                                     C.verde),
      bar("Pasteurelose — Adultos",                      4,  5, "DOSE + REFORÇO",                                                                     C.verde),
      bar("Pasteurelose — Adultos",                     10, 10, "DOSE",                                                                               C.verde),

      bar("Clostridiose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                                              C.laranja),
      bar("Clostridiose — Adultos",                      4,  5, "DOSE + REFORÇO",                                                                    C.laranja),
      bar("Clostridiose — Adultos",                     10, 10, "DOSE",                                                                              C.laranja),

      bar("Leptospirose — Cordeiras",                    1, 12, "1ª DOSE APÓS 150 DIAS + REFORÇO",                                                   C.roxo),
      bar("Leptospirose — Matrizes",                     1,  2, "DOSE + REFORÇO",                                                                    C.roxo),

      bar("Raiva — Cordeiros",                           1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.vermelho),
      bar("Raiva — Adultos",                             2,  2, "DOSE",                                                                              C.vermelho),

      bar("Linfadeite caseosa — Cordeiros",              1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.azul),
      bar("Linfadeite caseosa — Adulto imunizado",       1,  1, "DOSE",                                                                              C.azul),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                              1, 12, "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",                 C.cinza),
      bar("Prevenção de eimeriose",                      1, 12, "REALIZAR TRATAMENTO PREVENTIVO CONTRA EMERIOSE",                                     C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                                   1, 12, "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                       C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   5, "middle", 6, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   7, "end",    9, "start",  "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",  10, "middle",11, "end",    "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Ovelhas prenhes",                             1, 12, "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",             C.vermifugacao),
    ],
  },
  {
    id: "sem-estacao-chuvas-jan-abr",
    name: "SEM ESTAÇÃO CHUVAS JAN,FEV,MAR,ABR",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",                          1,  4, "PERÍODO DAS CHUVAS",                                                                  C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                            1, 12, "ESTAÇÃO DE MONTA",                                                                    C.verde),
      bar("Nascimento",                                  1, 12, "NASCIMENTO",                                                                          C.azul),
      bar("Desmama",                                     1, 12, "DESMAMA",                                                                             C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",                    1, 12, "1ª DOSE APÓS 60 DIAS + REFORÇO",                                                     C.verde),
      bar("Pasteurelose — Adultos",                      5,  6, "DOSE + REFORÇO",                                                                     C.verde),
      bar("Pasteurelose — Adultos",                     11, 11, "DOSE",                                                                               C.verde),

      bar("Clostridiose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                                              C.laranja),
      bar("Clostridiose — Adultos",                      5,  6, "DOSE + REFORÇO",                                                                    C.laranja),
      bar("Clostridiose — Adultos",                     11, 11, "DOSE",                                                                              C.laranja),

      bar("Leptospirose — Cordeiras",                    1, 12, "1ª DOSE APÓS 150 DIAS + REFORÇO",                                                   C.roxo),
      bar("Leptospirose — Matrizes",                     9, 10, "DOSE + REFORÇO",                                                                    C.roxo),

      bar("Raiva — Cordeiros",                           1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.vermelho),
      bar("Raiva — Adultos",                            10, 10, "DOSE",                                                                              C.vermelho),

      bar("Linfadeite caseosa — Cordeiros",              1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.azul),
      bar("Linfadeite caseosa — Adulto imunizado",       9,  9, "DOSE",                                                                              C.azul),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                              1, 12, "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",                 C.cinza),
      bar("Prevenção de eimeriose",                      1, 12, "REALIZAR TRATAMENTO PREVENTIVO CONTRA EMERIOSE",                                     C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                                   1, 12, "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                       C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   3, "middle", 4, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   5, "middle", 6, "end",    "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   9, "middle",10, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Ovelhas prenhes",                             1, 12, "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",             C.vermifugacao),
    ],
  },
  {
    id: "sem-estacao-chuvas-jan-mai",
    name: "SEM ESTAÇÃO CHUVAS JAN,FEV,MAR,ABR,MAIO",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",                          1,  5, "PERÍODO DAS CHUVAS",                                                                  C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                            1, 12, "ESTAÇÃO DE MONTA",                                                                    C.verde),
      bar("Nascimento",                                  1, 12, "NASCIMENTO",                                                                          C.azul),
      bar("Desmama",                                     1, 12, "DESMAMA",                                                                             C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",                    1, 12, "1ª DOSE APÓS 60 DIAS + REFORÇO",                                                     C.verde),
      bar("Pasteurelose — Adultos",                      5,  6, "DOSE + REFORÇO",                                                                     C.verde),
      bar("Pasteurelose — Adultos",                     12, 12, "DOSE",                                                                               C.verde),

      bar("Clostridiose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                                              C.laranja),
      bar("Clostridiose — Adultos",                      5,  6, "DOSE + REFORÇO",                                                                    C.laranja),
      bar("Clostridiose — Adultos",                     12, 12, "DOSE",                                                                              C.laranja),

      bar("Leptospirose — Cordeiras",                    1, 12, "1ª DOSE APÓS 150 DIAS + REFORÇO",                                                   C.roxo),
      bar("Leptospirose — Matrizes",                     9, 10, "DOSE + REFORÇO",                                                                    C.roxo),

      bar("Raiva — Cordeiros",                           1, 12, "1ª DOSE APÓS 60 DIAS + REFORÇO APÓS 30 DIAS",                                       C.vermelho),
      bar("Raiva — Adultos",                            10, 10, "DOSE",                                                                              C.vermelho),

      bar("Linfadeite caseosa — Cordeiros",              1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO APÓS 30 DIAS",                                       C.azul),
      bar("Linfadeite caseosa — Adulto imunizado",       9,  9, "DOSE",                                                                              C.azul),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                              1, 12, "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",                 C.cinza),
      bar("Prevenção de eimeriose",                      1, 12, "REALIZAR TRATAMENTO PREVENTIVO CONTRA EMERIOSE",                                     C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                                   1, 12, "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                       C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   3, "middle", 4, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   7, "start",  8, "start",  "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",  10, "end",   12, "start",  "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Ovelhas prenhes",                             1, 12, "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",             C.vermifugacao),
    ],
  },
  {
    id: "sem-estacao-chuvas-jan-abr-out-dez",
    name: "SEM ESTAÇÃO CHUVAS JAN,FEV,MAR,ABR,OUT,NOV,DEZ",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",                          1,  4, "PERÍODO DAS CHUVAS",                                                                  C.azul),
      bar("Período das chuvas",                         10, 12, "PERÍODO DAS CHUVAS",                                                                  C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                            1, 12, "ESTAÇÃO DE MONTA",                                                                    C.verde),
      bar("Nascimento",                                  1, 12, "NASCIMENTO",                                                                          C.azul),
      bar("Desmama",                                     1, 12, "DESMAMA",                                                                             C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 A 60 DIAS + REFORÇO APÓS 30 DIAS",                                  C.verde),
      bar("Pasteurelose — Adultos",                      4,  5, "DOSE + REFORÇO",                                                                     C.verde),
      bar("Pasteurelose — Adultos",                     11, 11, "DOSE",                                                                               C.verde),

      bar("Clostridiose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 A 60 DIAS + REFORÇO APÓS 30 DIAS",                                 C.laranja),
      bar("Clostridiose — Adultos",                      4,  5, "DOSE + REFORÇO",                                                                    C.laranja),
      bar("Clostridiose — Adultos",                     11, 11, "DOSE",                                                                              C.laranja),

      bar("Leptospirose — Cordeiras",                    1, 12, "1ª DOSE APÓS 150 DIAS + REFORÇO APÓS 30 DIAS",                                      C.roxo),
      bar("Leptospirose — Matrizes",                     8,  9, "DOSE + REFORÇO",                                                                    C.roxo),

      bar("Raiva — Cordeiros",                           1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO APÓS 30 DIAS",                                       C.vermelho),
      bar("Raiva — Adultos",                             9,  9, "DOSE",                                                                              C.vermelho),

      bar("Linfadeite caseosa — Cordeiros",              1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO APÓS 30 DIAS",                                       C.azul),
      bar("Linfadeite caseosa — Adulto imunizado",       8,  8, "DOSE",                                                                              C.azul),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                              1, 12, "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",                 C.cinza),
      bar("Prevenção de eimeriose",                      1, 12, "REALIZAR TRATAMENTO PREVENTIVO CONTRA EMERIOSE",                                     C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                                   1, 12, "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                       C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   3, "middle", 4, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   5, "end",    7, "start",  "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   9, "middle",10, "end",    "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Ovelhas prenhes",                             1, 12, "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",             C.vermifugacao),
    ],
  },
  {
    id: "sem-estacao-chuvas-abr-jul",
    name: "SEM ESTAÇÃO CHUVAS ABRI,MAIO,JUN,JUL",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",                          4,  7, "PERÍODO DAS CHUVAS",                                                                  C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                            1, 12, "ESTAÇÃO DE MONTA",                                                                    C.verde),
      bar("Nascimento",                                  1, 12, "NASCIMENTO",                                                                          C.azul),
      bar("Desmama",                                     1, 12, "DESMAMA",                                                                             C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",                    1, 12, "1ª DOSE APÓS 60 DIAS + REFORÇO",                                                     C.verde),
      bar("Pasteurelose — Adultos",                      2,  3, "DOSE + REFORÇO",                                                                     C.verde),
      bar("Pasteurelose — Adultos",                      8,  8, "DOSE",                                                                               C.verde),

      bar("Clostridiose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                                              C.laranja),
      bar("Clostridiose — Adultos",                      2,  3, "DOSE + REFORÇO",                                                                    C.laranja),
      bar("Clostridiose — Adultos",                      8,  8, "DOSE",                                                                              C.laranja),

      bar("Leptospirose — Cordeiras",                    1, 12, "1ª DOSE APÓS 150 DIAS + REFORÇO",                                                   C.roxo),
      bar("Leptospirose — Matrizes",                    10, 11, "DOSE + REFORÇO",                                                                    C.roxo),

      bar("Raiva — Cordeiros",                           1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.vermelho),
      bar("Raiva — Adultos",                            11, 11, "DOSE",                                                                              C.vermelho),

      bar("Linfadeite caseosa — Cordeiros",              1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                    C.azul),
      bar("Linfadeite caseosa — Adulto imunizado",      10, 10, "DOSE",                                                                              C.azul),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                              1, 12, "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",                 C.cinza),
      bar("Prevenção de eimeriose",                      1, 12, "REALIZAR TRATAMENTO PREVENTIVO CONTRA EMERIOSE",                                     C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                                   1, 12, "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                       C.vermifugacao),
      bar("Adultos",   3, "middle", 4, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   5, "middle", 6, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   7, "end",    8, "end",    "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",  11, "middle",12, "end",    "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Ovelhas prenhes",                             1, 12, "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",             C.vermifugacao),
    ],
  },
  {
    id: "sem-estacao-chuvas-set-dez",
    name: "SEM ESTAÇÃO CHUVAS SET,OUT,NOV,DEZ",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",                          9, 12, "PERÍODO DAS CHUVAS",                                                                  C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                            1, 12, "ESTAÇÃO DE MONTA",                                                                    C.verde),
      bar("Nascimento",                                  1, 12, "NASCIMENTO",                                                                          C.azul),
      bar("Desmama",                                     1, 12, "DESMAMA",                                                                             C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 A 60 DIAS + REFORÇO APÓS 30 DIAS",                                  C.verde),
      bar("Pasteurelose — Adultos",                      1,  2, "DOSE + REFORÇO",                                                                     C.verde),
      bar("Pasteurelose — Adultos",                      8,  8, "DOSE",                                                                               C.verde),

      bar("Clostridiose — Cordeiros",                    1, 12, "1ª DOSE ENTRE 30 A 60 DIAS + REFORÇO APÓS 30 DIAS",                                 C.laranja),
      bar("Clostridiose — Adultos",                      1,  2, "DOSE + REFORÇO",                                                                    C.laranja),
      bar("Clostridiose — Adultos",                      8,  8, "DOSE",                                                                              C.laranja),

      bar("Leptospirose — Cordeiras",                    1, 12, "1ª DOSE APÓS 150 DIAS + REFORÇO APÓS 30 DIAS",                                      C.roxo),
      bar("Leptospirose — Matrizes",                     5,  6, "DOSE + REFORÇO",                                                                    C.roxo),

      bar("Raiva — Cordeiros",                           1, 12, "1ª DOSE APÓS 60 DIAS + REFORÇO APÓS 30 DIAS",                                       C.vermelho),
      bar("Raiva — Adultos",                             6,  6, "DOSE",                                                                              C.vermelho),

      bar("Linfadeite caseosa — Cordeiros",              1, 12, "1ª DOSE APÓS 90 DIAS + REFORÇO APÓS 30 DIAS",                                       C.azul),
      bar("Linfadeite caseosa — Adulto imunizado",       5,  5, "DOSE",                                                                              C.azul),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                              1, 12, "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",                 C.cinza),
      bar("Prevenção de eimeriose",                      1, 12, "REALIZAR TRATAMENTO PREVENTIVO CONTRA EMERIOSE",                                     C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                                   1, 12, "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                       C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   4, "middle", 5, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   8, "middle", 9, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",  10, "end",   12, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Ovelhas prenhes",                             1, 12, "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",             C.vermifugacao),
    ],
  },
  {
    id: "com-estacao-abril-chuvas-jan-mar-out-dez",
    name: "COM ESTAÇÃO ABRIL CHUVAS JAN,FEV,MAR,OUT,NOV,DEZ",
    bars: [
      // ── DISTRIBUIÇÃO ──────────────────────────────────────────────────────────
      bar("Período das chuvas",                          1,  3, "PERÍODO DAS CHUVAS",                                                                  C.azul),
      bar("Período das chuvas",                         10, 12, "PERÍODO DAS CHUVAS",                                                                  C.azul),

      // ── PROGRAMAÇÃO REPRODUTIVA ───────────────────────────────────────────────
      bar("Estação de monta",                            4,  4, "ESTAÇÃO DE MONTA",                                                                    C.verde),
      bar("Nascimento",                                  9,  9, "NASCIMENTO",                                                                          C.azul),
      bar("Desmama",                                    12, 12, "DESMAMA",                                                                             C.vermelho),

      // ── VACINAÇÃO ─────────────────────────────────────────────────────────────
      bar("Pasteurelose — Cordeiros",                   9, "middle", 12, "end",   "1ª DOSE ENTRE 30 A 60 DIAS + REFORÇO",                             C.verde),
      bar("Pasteurelose — Adultos",                      4,  5, "DOSE + REFORÇO",                                                                     C.verde),
      bar("Pasteurelose — Adultos",                     10, 10, "DOSE",                                                                               C.verde),

      bar("Clostridiose — Cordeiros",                   9, "middle", 12, "end",   "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                            C.laranja),
      bar("Clostridiose — Adultos",                      4,  5, "DOSE + REFORÇO",                                                                    C.laranja),
      bar("Clostridiose — Adultos",                     10, 10, "DOSE",                                                                              C.laranja),

      bar("Leptospirose — Cordeiras",                   2, "end",    5, "middle", "1ª DOSE APÓS 150 DIAS + REFORÇO",                                 C.roxo),
      bar("Leptospirose — Matrizes",                    6, "start",  7, "middle", "DOSE + REFORÇO",                                                  C.roxo),

      bar("Raiva — Cordeiros",                          10, 12, "1ª DOSE APÓS 60 DIAS + REFORÇO",                                                    C.vermelho),
      bar("Raiva — Adultos",                             4,  4, "DOSE",                                                                              C.vermelho),

      bar("Linfadeite caseosa — Cordeiros",             2, "end",    5, "middle", "1ª DOSE APÓS 150 DIAS + REFORÇO",                                 C.ciano),
      bar("Linfadeite caseosa — Adulto imunizado",       3,  3, "REFORÇO",                                                                           C.ciano),

      // ── MANEJO COM O NEONATO ──────────────────────────────────────────────────
      bar("Cura do umbigo",                              8, 11, "CURA DO UMBIGO + PROBEZERRO + CATOFÓS",                                              C.cinza),
      bar("Prevenção de eimeriose",                     9, "start", 10, "end",   "ENTRE 21 E 30 DIAS",                                               C.roxo),

      // ── VERMIFUGAÇÃO ──────────────────────────────────────────────────────────
      bar("Cordeiros",                                  1, "start", 12, "middle", "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",     C.vermifugacao),
      bar("Adultos",   1, "start",  2, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   3, "middle", 4, "end",    "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",   7, "middle", 8, "middle", "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Adultos",  10, "end",   12, "start",  "DOSE + REFORÇO",                                                                                   C.vermifugacao),
      bar("Ovelhas prenhes",                            1, "start", 12, "middle", "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)", C.vermifugacao),
    ],
  },
];
