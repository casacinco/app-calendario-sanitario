import type { CalendarBar, CalendarBlockGroup } from "@/lib/db";
import { PrintButton } from "@/components/print-button";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const SEP = /^(.+?)\s*—\s*(.+)$/;

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

const C = {
  darkGreen: "#1d3a12",
  midGreen: "#2d5a14",
  lightGreen: "#eaf5e1",
  border: "#cccccc",
  lightBorder: "#e8e8e8",
} as const;

function barFontSize(label: string, span: number): string {
  const density = label.length / span;
  if (density > 20) return "5px";
  if (density > 14) return "6px";
  if (density > 10) return "7px";
  if (density > 8) return "8px";
  return "9px";
}

function BarTrack({ bars }: { bars: CalendarBar[] }) {
  return (
    <div style={{ position: "relative", height: "100%", minHeight: "24px" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderLeft: i === 0 ? "none" : `1px solid ${C.lightBorder}`,
            }}
          />
        ))}
      </div>

      {bars.map((bar) => {
        const startCol = bar.start_month - 1;
        const span = bar.end_month - bar.start_month + 1;
        const left = (startCol / 12) * 100;
        const width = (span / 12) * 100;
        const fontSize = bar.label ? barFontSize(bar.label, span) : "9px";

        return (
          <div
            key={bar.id}
            style={{
              position: "absolute",
              top: "3px",
              bottom: "3px",
              left: `calc(${left}% + 2px)`,
              width: `calc(${width}% - 4px)`,
              background: bar.alert ? "#dc2626" : bar.color,
              borderRadius: "2px",
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
                  fontSize,
                  fontWeight: "700",
                  color: bar.alert ? "white" : "rgba(0,0,0,0.85)",
                  lineHeight: "1",
                  letterSpacing: "-0.02em",
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

const tdBase: React.CSSProperties = {
  borderBottom: `1px solid ${C.border}`,
  borderRight: `1px solid ${C.border}`,
  padding: 0,
};

const nameCellStyle: React.CSSProperties = {
  ...tdBase,
  background: C.lightGreen,
  padding: "3px 6px",
  fontSize: "8px",
  fontWeight: "600",
  color: C.darkGreen,
  verticalAlign: "middle",
  lineHeight: "1.3",
};

const ROW_HEIGHT = "24px";

function BlockTable({ block }: { block: CalendarBlockGroup }) {
  const groups = groupRows(block.rows);
  const visibleNotes = (block.notes ?? []).filter((n) => n.is_visible === 1);

  return (
    <div style={{ pageBreakInside: "avoid", marginBottom: "7px" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          border: `1px solid ${C.border}`,
          borderTop: `2px solid ${C.darkGreen}`,
        }}
      >
        <colgroup>
          {/* disease col */}
          <col style={{ width: "8%" }} />
          {/* name col */}
          <col style={{ width: "11%" }} />
          {/* 12 month cols — (100 - 19) / 12 ≈ 6.75% each */}
          {Array.from({ length: 12 }).map((_, i) => (
            <col key={i} style={{ width: "6.75%" }} />
          ))}
        </colgroup>

        <thead>
          {/* Block name */}
          <tr>
            <th
              colSpan={14}
              style={{
                background: C.darkGreen,
                color: "white",
                textAlign: "left",
                padding: "4px 8px",
                fontSize: "9px",
                fontWeight: "700",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {block.block_position}. {block.block_name}
            </th>
          </tr>

          {/* Month labels */}
          <tr>
            <th
              colSpan={2}
              style={{
                background: C.midGreen,
                color: "white",
                padding: "2px 6px",
                fontSize: "7px",
                fontWeight: "600",
                textAlign: "left",
                borderRight: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              Linha
            </th>
            {MONTHS.map((m, i) => (
              <th
                key={i}
                style={{
                  background: C.midGreen,
                  color: "white",
                  padding: "2px",
                  textAlign: "center",
                  fontSize: "8px",
                  fontWeight: "700",
                  borderLeft: "1px solid rgba(255,255,255,0.25)",
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
                  style={{ opacity: group.row.is_active ? 1 : 0.4, height: ROW_HEIGHT }}
                >
                  <td colSpan={2} style={nameCellStyle}>
                    {group.row.row_name}
                  </td>
                  <td colSpan={12} style={{ ...tdBase, height: ROW_HEIGHT }}>
                    <BarTrack bars={group.row.bars} />
                  </td>
                </tr>,
              ];
            } else {
              return group.rows.map((row, ri) => (
                <tr
                  key={row.id}
                  style={{ opacity: row.is_active ? 1 : 0.4, height: ROW_HEIGHT }}
                >
                  {ri === 0 && (
                    <td
                      rowSpan={group.rows.length}
                      style={{
                        background: C.midGreen,
                        color: "white",
                        padding: "3px 4px",
                        fontSize: "7px",
                        fontWeight: "700",
                        textAlign: "center",
                        verticalAlign: "middle",
                        borderBottom: `1px solid ${C.border}`,
                        borderRight: "1px solid rgba(255,255,255,0.25)",
                        lineHeight: "1.25",
                        textTransform: "uppercase",
                      }}
                    >
                      {group.disease}
                    </td>
                  )}
                  <td style={nameCellStyle}>{categoryName(row.row_name)}</td>
                  <td colSpan={12} style={{ ...tdBase, height: ROW_HEIGHT }}>
                    <BarTrack bars={row.bars} />
                  </td>
                </tr>
              ));
            }
          })}
        </tbody>
      </table>

      {visibleNotes.length > 0 && (
        <div
          style={{
            border: `1px solid ${C.border}`,
            borderTop: "none",
            padding: "4px 8px 5px",
            background: "#f9f9f9",
          }}
        >
          <p
            style={{
              margin: "0 0 2px",
              fontSize: "6.5px",
              fontWeight: "700",
              color: C.darkGreen,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Observações
          </p>
          {visibleNotes.map((note) => (
            <p
              key={note.id}
              style={{
                margin: "1px 0",
                fontSize: "8px",
                color: "#222",
                lineHeight: "1.4",
              }}
            >
              • {note.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

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
        @page { size: A4 landscape; margin: 8mm; }
        *, *::before, *::after { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
        html, body { background: white !important; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
        @media screen {
          body { background: #dedede !important; }
          .pp { max-width: 277mm; margin: 20px auto; background: white; padding: 8mm; box-shadow: 0 4px 28px rgba(0,0,0,0.2); }
        }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="pp">
        {/* Screen-only toolbar */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            paddingBottom: "10px",
            borderBottom: "1px solid #ddd",
          }}
        >
          <span style={{ fontSize: "13px", color: "#555" }}>
            Pré-visualização de impressão
          </span>
          <PrintButton />
        </div>

        {/* ── Header ── */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "5px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-vpc.png"
            alt="VPC"
            style={{ height: "58px", objectFit: "contain", flexShrink: 0 }}
          />
          <div style={{ flex: 1, textAlign: "center" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "19px",
                fontWeight: "900",
                color: C.darkGreen,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              Calendário Sanitário
            </h1>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "9px",
                color: "#555",
                letterSpacing: "0.02em",
              }}
            >
              Programa Rebanho Blindado 3.0 por Léo Pinto
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-rebanho.png"
            alt="Rebanho Blindado"
            style={{ height: "58px", objectFit: "contain", flexShrink: 0 }}
          />
        </header>

        {/* ── Producer info bar ── */}
        <div
          style={{
            display: "flex",
            borderTop: `2px solid ${C.darkGreen}`,
            borderBottom: `1px solid ${C.border}`,
            marginBottom: "9px",
          }}
        >
          {(
            [
              { label: "Proprietário", value: ownerName, flex: 2 },
              { label: "Localização", value: location, flex: 2 },
              { label: "Rebanho", value: farmName, flex: 2 },
              { label: "Criado em", value: createdAt, flex: 1 },
            ] as const
          ).map((field, i, arr) => (
            <div
              key={field.label}
              style={{
                flex: field.flex,
                padding: "4px 10px",
                borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "6px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#888",
                }}
              >
                {field.label}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "#111",
                }}
              >
                {field.value || "—"}
              </p>
            </div>
          ))}
        </div>

        {/* ── Blocks ── */}
        <div>
          {blocks.map((block) => (
            <BlockTable key={block.block_position} block={block} />
          ))}
        </div>

        {/* ── Footer ── */}
        <footer style={{ marginTop: "6px" }}>
          <div
            style={{
              background: "#fff8e1",
              border: "1px solid #f59e0b",
              borderRadius: "3px",
              padding: "5px 8px",
              display: "flex",
              alignItems: "flex-start",
              gap: "6px",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "12px", flexShrink: 0 }}>⚠️</span>
            <p
              style={{
                margin: 0,
                fontSize: "7.5px",
                color: "#78350f",
                lineHeight: "1.45",
              }}
            >
              Este calendário sanitário é um guia preventivo personalizado. As
              recomendações devem ser avaliadas e adaptadas por um
              médico-veterinário habilitado, considerando as condições
              específicas do seu rebanho, região e histórico sanitário.
            </p>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "7px",
              color: "#aaa",
              textAlign: "center",
            }}
          >
            Calendário Sanitário · Programa Rebanho Blindado 3.0 · VPC
            Veterinária · Léo Pinto
          </p>
        </footer>
      </div>
    </>
  );
}
