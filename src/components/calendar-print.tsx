import type { CalendarBar, CalendarBlockGroup } from "@/lib/db";
import { PrintButton } from "@/components/print-button";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTHS = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
const SEP = /^(.+?)\s*—\s*(.+)$/;

// ─── Cores de rótulo por nome de linha ───────────────────────────────────────

type LabelStyle = { bg: string; text: string };

const DISEASE_MAP: [string, LabelStyle][] = [
  ["PASTEUREL",         { bg: "#5FAF3E", text: "#FFFFFF" }],
  ["CLOSTRIDI",         { bg: "#E67E22", text: "#FFFFFF" }],
  ["LEPTOSPIR",         { bg: "#6C3BFF", text: "#FFFFFF" }],
  ["RAIVA",             { bg: "#E53935", text: "#FFFFFF" }],
  ["LINFADENIT",        { bg: "#2D9CDB", text: "#FFFFFF" }],
  ["CASEOSA",           { bg: "#2D9CDB", text: "#FFFFFF" }],
];

const ROW_MAP: [string, LabelStyle][] = [
  ["ESTAÇÃO DE MONTA",  { bg: "#5FAF3E", text: "#FFFFFF" }],
  ["ESTACAO DE MONTA",  { bg: "#5FAF3E", text: "#FFFFFF" }],
  ["NASCIMENTO",        { bg: "#2D9CDB", text: "#FFFFFF" }],
  ["DESMAMA",           { bg: "#E53935", text: "#FFFFFF" }],
  ["EIMERIOSE",         { bg: "#6C3BFF", text: "#FFFFFF" }],
];

const SUBLINHA: LabelStyle = { bg: "#F2F2F2", text: "#000000" };
const VERMI:    LabelStyle = { bg: "#FF5C5C", text: "#FFFFFF" };
const DEFAULT:  LabelStyle = { bg: "#F2F2F2", text: "#000000" };

function labelStyle(name: string, blockName: string): LabelStyle {
  const upper = name.toUpperCase().trim();
  const block = blockName.toUpperCase();

  for (const [key, style] of DISEASE_MAP) {
    if (upper.includes(key)) return style;
  }

  // Sub-linhas de vacinação
  if (
    upper === "ADULTOS" || upper === "CORDEIROS" || upper === "MATRIZES" ||
    upper.startsWith("OVELHAS") || upper === "REPRODUTORES"
  ) return SUBLINHA;

  for (const [key, style] of ROW_MAP) {
    if (upper.includes(key)) return style;
  }

  if (block.includes("VERMIF")) return VERMI;

  return DEFAULT;
}

// ─── Rótulo da primeira coluna por bloco ─────────────────────────────────────

function colLabel(blockName: string): string {
  const b = blockName.toUpperCase();
  if (b.includes("DISTRIBUI"))                            return "";
  if (b.includes("REPRODU") || b.includes("PROGRAMAÇÃO")) return "ATIVIDADES";
  if (b.includes("VACIN"))                                return "VACINAS";
  if (b.includes("NEONATO") || b.includes("MANEJO COM")) return "MANEJOS";
  if (b.includes("VERMIF"))                               return "MANEJOS";
  return "";
}

// ─── Agrupamento por doença ───────────────────────────────────────────────────

type Row = CalendarBlockGroup["rows"][number];

type RowGroup =
  | { type: "single"; row: Row }
  | { type: "group";  disease: string; rows: Row[] };

function groupRows(rows: Row[]): RowGroup[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const m = row.row_name.match(SEP);
    if (m) counts.set(m[1]!.trim(), (counts.get(m[1]!.trim()) ?? 0) + 1);
  }
  const result: RowGroup[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const m = row.row_name.match(SEP);
    if (m && (counts.get(m[1]!.trim()) ?? 0) > 1) {
      const disease = m[1]!.trim();
      if (!seen.has(disease)) {
        seen.add(disease);
        result.push({
          type: "group",
          disease,
          rows: rows.filter((r) => { const rm = r.row_name.match(SEP); return rm && rm[1]!.trim() === disease; }),
        });
      }
    } else {
      result.push({ type: "single", row });
    }
  }
  return result;
}

function catName(rowName: string): string {
  const m = rowName.match(SEP);
  return m ? m[2]!.trim() : rowName;
}

// ─── Barra ────────────────────────────────────────────────────────────────────

function BarTrack({ bars }: { bars: CalendarBar[] }) {
  return (
    <div style={{ position: "relative", height: "100%", minHeight: "18px" }}>
      {/* Grade vertical */}
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{ flex: 1, borderLeft: i === 0 ? "none" : "1px solid #D9D9D9" }}
          />
        ))}
      </div>

      {bars.map((bar) => {
        const left  = ((bar.start_month - 1) / 12) * 100;
        const width = ((bar.end_month - bar.start_month + 1) / 12) * 100;
        return (
          <div
            key={bar.id}
            style={{
              position: "absolute",
              top: "2px", bottom: "2px",
              left: `calc(${left}% + 1px)`,
              width: `calc(${width}% - 2px)`,
              background: bar.alert ? "#c0392b" : bar.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {bar.label && (
              <span style={{ fontSize: "7px", fontWeight: "700", color: bar.alert ? "#fff" : "rgba(0,0,0,0.85)", lineHeight: 1, letterSpacing: "0" }}>
                {bar.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tabela de bloco ──────────────────────────────────────────────────────────

const GRID_BORDER = "1px solid #D9D9D9";
const ROW_H = "17px";

function BlockTable({ block }: { block: CalendarBlockGroup }) {
  const groups      = groupRows(block.rows);
  const colLbl      = colLabel(block.block_name);
  const visNotes    = (block.notes ?? []).filter((n) => n.is_visible === 1);

  const tdLabel = (style: LabelStyle, text: string, extra?: React.CSSProperties): React.CSSProperties => ({
    background: style.bg,
    color:      style.text,
    padding:    "2px 5px",
    fontSize:   "7px",
    fontWeight: "600",
    verticalAlign: "middle",
    lineHeight: "1.2",
    borderRight: GRID_BORDER,
    borderBottom: GRID_BORDER,
    whiteSpace: "normal",
    ...extra,
  });

  return (
    <div style={{ marginBottom: "5px", breakInside: "avoid", pageBreakInside: "avoid" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", border: GRID_BORDER }}>
        <colgroup>
          <col style={{ width: "8%" }} />   {/* doença */}
          <col style={{ width: "11%" }} />  {/* categoria/nome */}
          {Array.from({ length: 12 }).map((_, i) => (
            <col key={i} style={{ width: "6.75%" }} />
          ))}
        </colgroup>

        <thead>
          {/* Título do bloco — fundo #000 */}
          <tr>
            <th
              colSpan={14}
              style={{
                background: "#000000",
                color: "#FFFFFF",
                textAlign: "center",
                padding: "4px 8px",
                fontSize: "8px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderBottom: GRID_BORDER,
              }}
            >
              {block.block_name}
            </th>
          </tr>

          {/* Cabeçalho dos meses */}
          <tr>
            <th
              colSpan={2}
              style={{
                background: "#000000",
                color: "#FFFFFF",
                padding: "2px 5px",
                fontSize: "6.5px",
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: "0.06em",
                borderRight: GRID_BORDER,
                borderBottom: GRID_BORDER,
              }}
            >
              {colLbl}
            </th>
            {MONTHS.map((m, i) => (
              <th
                key={i}
                style={{
                  background: "#000000",
                  color: "#FFFFFF",
                  textAlign: "center",
                  padding: "2px 0",
                  fontSize: "7px",
                  fontWeight: "700",
                  borderLeft: "1px solid #333",
                  borderBottom: GRID_BORDER,
                }}
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groups.flatMap((group) => {
            if (group.type === "single") {
              const ls = labelStyle(group.row.row_name, block.block_name);
              return [
                <tr key={group.row.id} style={{ opacity: group.row.is_active ? 1 : 0.45, height: ROW_H }}>
                  <td
                    colSpan={2}
                    style={tdLabel(ls, group.row.row_name)}
                  >
                    {group.row.row_name}
                  </td>
                  <td
                    colSpan={12}
                    style={{ background: "#FFFFFF", borderBottom: GRID_BORDER, padding: 0, height: ROW_H }}
                  >
                    <BarTrack bars={group.row.bars} />
                  </td>
                </tr>,
              ];
            } else {
              const disLs = labelStyle(group.disease, block.block_name);
              return group.rows.map((row, ri) => {
                const catLs = labelStyle(catName(row.row_name), block.block_name);
                return (
                  <tr key={row.id} style={{ opacity: row.is_active ? 1 : 0.45, height: ROW_H }}>
                    {ri === 0 && (
                      <td
                        rowSpan={group.rows.length}
                        style={tdLabel(disLs, group.disease, {
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontWeight: "700",
                          fontSize: "6.5px",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        })}
                      >
                        {group.disease}
                      </td>
                    )}
                    <td style={tdLabel(catLs, catName(row.row_name))}>
                      {catName(row.row_name)}
                    </td>
                    <td
                      colSpan={12}
                      style={{ background: "#FFFFFF", borderBottom: GRID_BORDER, padding: 0, height: ROW_H }}
                    >
                      <BarTrack bars={row.bars} />
                    </td>
                  </tr>
                );
              });
            }
          })}
        </tbody>
      </table>

      {/* Observações */}
      {visNotes.length > 0 && (
        <div style={{ borderLeft: GRID_BORDER, borderRight: GRID_BORDER, borderBottom: GRID_BORDER, padding: "3px 6px", background: "#fafafa" }}>
          {visNotes.map((note) => (
            <p key={note.id} style={{ margin: "1px 0", fontSize: "7px", color: "#333", lineHeight: "1.35" }}>
              {note.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface CalendarPrintProps {
  blocks:    CalendarBlockGroup[];
  ownerName: string;
  farmName:  string;
  location:  string;
  createdAt: string;
}

export function CalendarPrint({ blocks, ownerName, farmName, location, createdAt }: CalendarPrintProps) {
  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 7mm 8mm; }
        *, *::before, *::after { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
        html, body { background: #ffffff !important; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #000; }
        @media screen {
          body { background: #e8e8e8 !important; }
          .pw  { max-width: 280mm; margin: 16px auto; background: #ffffff; padding: 7mm 8mm; }
        }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="pw">

        {/* Botão de impressão — só na tela */}
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <PrintButton />
        </div>

        {/* ── Cabeçalho — fundo #000 ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#000000", marginBottom: "4px" }}>
          <tbody>
            <tr>
              <td style={{ width: "70px", padding: "6px 10px", verticalAlign: "middle" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-vpc.png" alt="VPC" style={{ height: "44px", display: "block", objectFit: "contain" }} />
              </td>
              <td style={{ textAlign: "center", verticalAlign: "middle", padding: "6px 0" }}>
                <div style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1 }}>
                  CALENDÁRIO SANITÁRIO
                </div>
                <div style={{ fontSize: "8px", color: "#FFFFFF", marginTop: "3px", letterSpacing: "0.02em" }}>
                  Programa Rebanho Blindado 3.0 por Léo Pinto
                </div>
              </td>
              <td style={{ width: "70px", padding: "6px 10px", verticalAlign: "middle", textAlign: "right" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-rebanho.png" alt="Rebanho Blindado" style={{ height: "44px", display: "inline-block", objectFit: "contain" }} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Dados do produtor ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #D9D9D9", marginBottom: "5px" }}>
          <tbody>
            <tr>
              {(
                [
                  { label: "PROPRIETÁRIO", value: ownerName },
                  { label: "LOCALIZAÇÃO",  value: location  },
                  { label: "REBANHO",      value: farmName  },
                  { label: "CRIADO EM",    value: createdAt },
                ] as const
              ).map((f, i, arr) => (
                <td
                  key={f.label}
                  style={{
                    padding: "3px 8px",
                    borderRight: i < arr.length - 1 ? "1px solid #D9D9D9" : "none",
                    verticalAlign: "top",
                  }}
                >
                  <div style={{ fontSize: "5.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: "1px" }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: "9px", fontWeight: "600", color: "#000" }}>
                    {f.value || "—"}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* ── Blocos ── */}
        {blocks.map((block) => (
          <BlockTable key={block.block_position} block={block} />
        ))}

        {/* ── Bloco de alerta ── */}
        <div
          style={{
            background: "#FFE5E5",
            border: "1px solid #D9D9D9",
            padding: "5px 8px",
            marginBottom: "4px",
            breakInside: "avoid",
            pageBreakInside: "avoid",
          }}
        >
          <p style={{ margin: "0 0 2px", fontSize: "7px", fontWeight: "700", color: "#7A1C1C" }}>
            ⚠️ ATENÇÃO: Este calendário sanitário foi elaborado de forma personalizada, considerando as características específicas deste rebanho, sistema de criação e condições regionais.
          </p>
          <p style={{ margin: "1px 0", fontSize: "7px", color: "#7A1C1C", lineHeight: "1.35" }}>
            Este material é de uso exclusivo do contratante, sendo vedada sua reprodução, compartilhamento ou utilização em outras propriedades sem a devida adequação técnica.
          </p>
          <p style={{ margin: "1px 0", fontSize: "7px", color: "#7A1C1C", lineHeight: "1.35" }}>
            O uso indevido em realidades distintas pode comprometer a eficácia das estratégias de controle sanitário, resultando em prejuízos produtivos e sanitários.
          </p>
          <p style={{ margin: "1px 0 0", fontSize: "7px", color: "#7A1C1C", lineHeight: "1.35" }}>
            Para garantir resultados seguros, cada rebanho deve ser avaliado individualmente.
          </p>
        </div>

        {/* ── Rodapé ── */}
        <div style={{ textAlign: "center", padding: "3px 0" }}>
          <span style={{ fontSize: "7.5px", fontWeight: "600", color: "#000000", letterSpacing: "0.03em" }}>
            www.vamosproduzircordeiros.com.br&nbsp;&nbsp;|&nbsp;&nbsp;ESCOLA DE OVINOCULTORES&nbsp;&nbsp;|&nbsp;&nbsp;@leopinto.cordeiros
          </span>
        </div>

      </div>
    </>
  );
}
