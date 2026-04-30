import type { CalendarBar, CalendarBlockGroup } from "@/lib/db";
import { PrintButton } from "@/components/print-button";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const SEP = /^(.+?)\s*—\s*(.+)$/;

// Paleta — verde apenas nos cabeçalhos
const HDR_BG   = "#1a3d0f";   // cabeçalho do bloco
const HDR_SUB  = "#2e5c1c";   // linha de meses
const HDR_TXT  = "#ffffff";
const LBL_BG   = "#f4f4f4";   // fundo dos rótulos de linha (cinza muito claro)
const LBL_TXT  = "#1a1a1a";
const GRID_BG  = "#ffffff";
const BORDER   = "#c8c8c8";
const GRID_LINE = "#e2e2e2";

// ─── Agrupamento por doença (idêntico ao editor) ──────────────────────────────

type CalendarRowWithBars = CalendarBlockGroup["rows"][number];

type RowGroup =
  | { type: "single"; row: CalendarRowWithBars }
  | { type: "group"; disease: string; rows: CalendarRowWithBars[] };

function groupRows(rows: CalendarRowWithBars[]): RowGroup[] {
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
          rows: rows.filter((r) => {
            const rm = r.row_name.match(SEP);
            return rm && rm[1]!.trim() === disease;
          }),
        });
      }
    } else {
      result.push({ type: "single", row });
    }
  }
  return result;
}

function categoryName(rowName: string): string {
  const m = rowName.match(SEP);
  return m ? m[2]!.trim() : rowName;
}

// ─── Barra de meses ───────────────────────────────────────────────────────────

function BarTrack({ bars }: { bars: CalendarBar[] }) {
  return (
    <div style={{ position: "relative", height: "100%", minHeight: "20px" }}>
      {/* Linhas de grade verticais */}
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderLeft: i === 0 ? "none" : `1px solid ${GRID_LINE}`,
            }}
          />
        ))}
      </div>

      {/* Barras */}
      {bars.map((bar) => {
        const left = ((bar.start_month - 1) / 12) * 100;
        const width = ((bar.end_month - bar.start_month + 1) / 12) * 100;
        return (
          <div
            key={bar.id}
            style={{
              position: "absolute",
              top: "3px",
              bottom: "3px",
              left: `calc(${left}% + 2px)`,
              width: `calc(${width}% - 4px)`,
              background: bar.alert ? "#c0392b" : bar.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {bar.label && (
              <span
                style={{
                  fontSize: "7.5px",
                  fontWeight: "700",
                  color: bar.alert ? "#fff" : "rgba(0,0,0,0.8)",
                  letterSpacing: "0",
                  lineHeight: 1,
                }}
              >
                {bar.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Estilos compartilhados de célula ─────────────────────────────────────────

const cellBase: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  padding: 0,
  margin: 0,
};

const labelCell: React.CSSProperties = {
  ...cellBase,
  background: LBL_BG,
  padding: "3px 7px",
  fontSize: "8px",
  fontWeight: "600",
  color: LBL_TXT,
  verticalAlign: "middle",
  lineHeight: "1.3",
  whiteSpace: "normal",
};

const ROW_H = "22px";

// ─── Tabela de um bloco ───────────────────────────────────────────────────────

function BlockTable({ block }: { block: CalendarBlockGroup }) {
  const groups = groupRows(block.rows);
  const visibleNotes = (block.notes ?? []).filter((n) => n.is_visible === 1);

  return (
    <div style={{ marginBottom: "10px", breakInside: "avoid" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          border: `1px solid ${BORDER}`,
        }}
      >
        <colgroup>
          {/* col doença */}
          <col style={{ width: "8%" }} />
          {/* col nome/categoria */}
          <col style={{ width: "12%" }} />
          {/* 12 colunas de mês — 80% / 12 ≈ 6.67% cada */}
          {Array.from({ length: 12 }).map((_, i) => (
            <col key={i} style={{ width: "6.67%" }} />
          ))}
        </colgroup>

        <thead>
          {/* Título do bloco */}
          <tr>
            <th
              colSpan={14}
              style={{
                background: HDR_BG,
                color: HDR_TXT,
                textAlign: "left",
                padding: "4px 8px",
                fontSize: "8.5px",
                fontWeight: "700",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: `1px solid ${HDR_BG}`,
              }}
            >
              {block.block_position}. {block.block_name}
            </th>
          </tr>

          {/* Linha dos meses */}
          <tr>
            <th
              colSpan={2}
              style={{
                background: HDR_SUB,
                color: HDR_TXT,
                padding: "2px 7px",
                fontSize: "7px",
                fontWeight: "600",
                textAlign: "left",
                border: `1px solid ${HDR_SUB}`,
              }}
            >
              Linha
            </th>
            {MONTHS_SHORT.map((m, i) => (
              <th
                key={i}
                style={{
                  background: HDR_SUB,
                  color: HDR_TXT,
                  textAlign: "center",
                  padding: "2px 0",
                  fontSize: "7.5px",
                  fontWeight: "700",
                  border: `1px solid ${HDR_SUB}`,
                  borderLeft: `1px solid rgba(255,255,255,0.2)`,
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
              return [
                <tr
                  key={group.row.id}
                  style={{ opacity: group.row.is_active ? 1 : 0.45, height: ROW_H }}
                >
                  <td colSpan={2} style={labelCell}>
                    {group.row.row_name}
                  </td>
                  <td
                    colSpan={12}
                    style={{ ...cellBase, background: GRID_BG, height: ROW_H, padding: 0 }}
                  >
                    <BarTrack bars={group.row.bars} />
                  </td>
                </tr>,
              ];
            } else {
              return group.rows.map((row, ri) => (
                <tr
                  key={row.id}
                  style={{ opacity: row.is_active ? 1 : 0.45, height: ROW_H }}
                >
                  {ri === 0 && (
                    <td
                      rowSpan={group.rows.length}
                      style={{
                        ...labelCell,
                        textAlign: "center",
                        verticalAlign: "middle",
                        fontWeight: "700",
                        fontSize: "7.5px",
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {group.disease}
                    </td>
                  )}
                  <td style={labelCell}>{categoryName(row.row_name)}</td>
                  <td
                    colSpan={12}
                    style={{ ...cellBase, background: GRID_BG, height: ROW_H, padding: 0 }}
                  >
                    <BarTrack bars={row.bars} />
                  </td>
                </tr>
              ));
            }
          })}
        </tbody>
      </table>

      {/* Observações — só se houver ao menos 1 visível */}
      {visibleNotes.length > 0 && (
        <div
          style={{
            borderLeft: `1px solid ${BORDER}`,
            borderRight: `1px solid ${BORDER}`,
            borderBottom: `1px solid ${BORDER}`,
            padding: "4px 8px 5px",
            background: "#fafafa",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "6.5px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "#555",
              marginBottom: "2px",
            }}
          >
            Observações
          </span>
          {visibleNotes.map((note) => (
            <p
              key={note.id}
              style={{ margin: "1px 0", fontSize: "7.5px", color: "#333", lineHeight: "1.4" }}
            >
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
  blocks: CalendarBlockGroup[];
  ownerName: string;
  farmName: string;
  location: string;
  createdAt: string;
}

export function CalendarPrint({
  blocks,
  ownerName,
  farmName,
  location,
  createdAt,
}: CalendarPrintProps) {
  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 10mm 8mm; }
        *, *::before, *::after {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          box-sizing: border-box;
        }
        html, body {
          background: #ffffff !important;
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #1a1a1a;
        }
        @media screen {
          body { background: #f0f0f0 !important; }
          .print-wrap {
            max-width: 280mm;
            margin: 16px auto;
            background: #ffffff;
            padding: 10mm;
          }
        }
        @media print {
          .no-print { display: none !important; }
          body { background: #ffffff !important; }
        }
      `}</style>

      <div className="print-wrap">

        {/* Barra de ação — só na tela */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "10px",
          }}
        >
          <PrintButton />
        </div>

        {/* ── Cabeçalho ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "6px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ width: "80px", padding: "0 12px 0 0", verticalAlign: "middle" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-vpc.png"
                  alt="VPC"
                  style={{ height: "52px", display: "block" }}
                />
              </td>
              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "900",
                    color: HDR_BG,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                  }}
                >
                  Calendário Sanitário
                </div>
                <div
                  style={{
                    fontSize: "8.5px",
                    color: "#555",
                    marginTop: "3px",
                    letterSpacing: "0.02em",
                  }}
                >
                  Programa Rebanho Blindado 3.0 · por Léo Pinto
                </div>
              </td>
              <td style={{ width: "80px", padding: "0 0 0 12px", verticalAlign: "middle", textAlign: "right" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-rebanho.png"
                  alt="Rebanho Blindado"
                  style={{ height: "52px", display: "inline-block" }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Linha divisória + dados do produtor ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderTop: `2px solid ${HDR_BG}`,
            borderBottom: `1px solid ${BORDER}`,
            marginBottom: "8px",
          }}
        >
          <tbody>
            <tr>
              {(
                [
                  { label: "Proprietário", value: ownerName },
                  { label: "Localização",  value: location  },
                  { label: "Rebanho",      value: farmName  },
                  { label: "Criado em",    value: createdAt },
                ] as const
              ).map((f, i, arr) => (
                <td
                  key={f.label}
                  style={{
                    padding: "4px 10px",
                    borderRight: i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
                    verticalAlign: "top",
                  }}
                >
                  <div
                    style={{
                      fontSize: "6px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#888",
                      marginBottom: "2px",
                    }}
                  >
                    {f.label}
                  </div>
                  <div style={{ fontSize: "9.5px", fontWeight: "600", color: "#111" }}>
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

        {/* ── Rodapé ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "4px",
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "5px 8px", verticalAlign: "top" }}>
                <span style={{ fontSize: "8px", color: "#b45309", fontWeight: "600" }}>⚠ </span>
                <span style={{ fontSize: "7.5px", color: "#555", lineHeight: "1.4" }}>
                  Este calendário é um guia preventivo personalizado. As recomendações devem ser
                  avaliadas por um médico-veterinário habilitado, considerando as condições
                  específicas do rebanho, região e histórico sanitário.
                </span>
              </td>
              <td
                style={{
                  padding: "5px 8px",
                  textAlign: "right",
                  verticalAlign: "middle",
                  whiteSpace: "nowrap",
                  fontSize: "7px",
                  color: "#aaa",
                }}
              >
                Programa Rebanho Blindado 3.0 · VPC Veterinária · Léo Pinto
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </>
  );
}
