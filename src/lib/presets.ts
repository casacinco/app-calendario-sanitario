// Cores oficiais
const C = {
  verde:       "#5FAF3E",
  laranja:     "#E67E22",
  roxo:        "#6C3BFF",
  vermelho:    "#E53935",
  azul:        "#2D9CDB",
  ciano:       "#2EC4B6",
  cinza:       "#4F4F4F",
  vermifugacao:"#FF5C5C",
} as const;

export interface PresetBar {
  rowName: string;
  startMonth: number;
  endMonth: number;
  label: string;
  color: string;
}

export interface CalendarPreset {
  id: string;
  name: string;
  bars: PresetBar[];
}

export const PRESETS: CalendarPreset[] = [
  {
    id: "sul-sem-estacao-chuvas",
    name: "SUL SEM ESTAÇÃO CHUVAS SET,OUT,NOV,DEZ",
    bars: [
      // ── DISTRIBUIÇÃO ────────────────────────────────────────────────────────
      { rowName: "Período das chuvas",                  startMonth:  9, endMonth: 12, label: "PERÍODO DAS CHUVAS",                                                                 color: C.azul },

      // ── PROGRAMAÇÃO REPRODUTIVA ─────────────────────────────────────────────
      { rowName: "Estação de monta",                    startMonth:  1, endMonth: 12, label: "ESTAÇÃO DE MONTA",                                                                   color: C.verde },
      { rowName: "Nascimento",                          startMonth:  1, endMonth: 12, label: "NASCIMENTO",                                                                         color: C.azul },
      { rowName: "Desmama",                             startMonth:  1, endMonth: 12, label: "DESMAMA",                                                                            color: C.vermelho },

      // ── VACINAÇÃO ───────────────────────────────────────────────────────────
      { rowName: "Pasteurelose — Cordeiros",            startMonth:  1, endMonth: 12, label: "1ª DOSE APÓS 60 DIAS + REFORÇO",                                                    color: C.verde },
      { rowName: "Pasteurelose — Adultos",              startMonth:  2, endMonth:  3, label: "DOSE + REFORÇO",                                                                    color: C.verde },
      { rowName: "Pasteurelose — Adultos",              startMonth:  8, endMonth:  8, label: "DOSE",                                                                              color: C.verde },

      { rowName: "Clostridiose — Cordeiros",            startMonth:  1, endMonth: 12, label: "1ª DOSE ENTRE 30 E 60 DIAS + REFORÇO",                                             color: C.laranja },
      { rowName: "Clostridiose — Adultos",              startMonth:  2, endMonth:  3, label: "DOSE + REFORÇO",                                                                    color: C.laranja },
      { rowName: "Clostridiose — Adultos",              startMonth:  8, endMonth:  8, label: "DOSE",                                                                              color: C.laranja },

      { rowName: "Leptospirose — Cordeiras",            startMonth:  1, endMonth: 12, label: "1ª DOSE APÓS 150 DIAS + REFORÇO",                                                  color: C.roxo },
      { rowName: "Leptospirose — Matrizes",             startMonth:  6, endMonth:  7, label: "DOSE + REFORÇO",                                                                    color: C.roxo },

      { rowName: "Raiva — Cordeiros",                   startMonth:  1, endMonth: 12, label: "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                   color: C.vermelho },
      { rowName: "Raiva — Adultos",                     startMonth:  8, endMonth:  8, label: "DOSE",                                                                              color: C.vermelho },

      { rowName: "Foot-rot — Cordeiros",                startMonth:  1, endMonth: 12, label: "1ª DOSE APÓS 90 DIAS + REFORÇO",                                                   color: C.ciano },
      { rowName: "Foot-rot — Adultos",                  startMonth:  1, endMonth:  2, label: "DOSE + REFORÇO",                                                                    color: C.ciano },

      // ── MANEJO COM O NEONATO ────────────────────────────────────────────────
      { rowName: "Cura do umbigo",                      startMonth:  1, endMonth: 12, label: "REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + PROBEZERRO + CATOFÓS",               color: C.cinza },
      { rowName: "Prevenção de eimeriose",              startMonth:  1, endMonth: 12, label: "REALIZAR TRATAMENTO PREVENTIVO CONTRA EIMERIOSE",                                  color: C.roxo },

      // ── VERMIFUGAÇÃO ────────────────────────────────────────────────────────
      { rowName: "Cordeiros",                           startMonth:  1, endMonth: 12, label: "1ª DOSE + REFORÇO AOS 30 DIAS E 2ª DOSE APARTAÇÃO + REFORÇO",                     color: C.vermifugacao },
      { rowName: "Adultos",                             startMonth:  1, endMonth:  2, label: "DOSE + REFORÇO",                                                                    color: C.vermifugacao },
      { rowName: "Adultos",                             startMonth:  4, endMonth:  5, label: "DOSE + REFORÇO",                                                                    color: C.vermifugacao },
      { rowName: "Adultos",                             startMonth:  8, endMonth:  9, label: "DOSE + REFORÇO",                                                                    color: C.vermifugacao },
      { rowName: "Adultos",                             startMonth: 11, endMonth: 12, label: "DOSE + REFORÇO",                                                                    color: C.vermifugacao },
      { rowName: "Ovelhas prenhes",                     startMonth:  1, endMonth: 12, label: "TERÇO FINAL DA GESTAÇÃO VERMIFUGAÇÃO + REFORÇO (USAR DROGA COMPATÍVEL)",           color: C.vermifugacao },
    ],
  },
];
