import type { CalendarBar, CalendarBlockGroup } from "@/lib/db";
import { PrintButton } from "@/components/print-button";
import { diseaseColor, rowColor, type LabelStyle } from "@/lib/row-colors";

// ─── Meses ────────────────────────────────────────────────────────────────────

const MONTHS = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
const SEP    = /^(.+?)\s*—\s*(.+)$/;

// ─── Rótulo da primeira coluna por bloco ─────────────────────────────────────

function colLabel(blockName: string): string {
  const b = blockName.toUpperCase();
  if (b.includes("DISTRIBUI"))                             return "";
  if (b.includes("REPRODU") || b.includes("PROGRAMAÇÃO")) return "ATIVIDADES";
  if (b.includes("VACIN"))                                 return "VACINAS";
  if (b.includes("NEONATO") || b.includes("MANEJO COM"))  return "MANEJOS";
  if (b.includes("VERMIF"))                                return "MANEJOS";
  return "";
}

// ─── Agrupamento por doença ───────────────────────────────────────────────────

type Row = CalendarBlockGroup["rows"][number];
type RowGroup =
  | { type: "single"; row: Row }
  | { type: "group";  disease: string; color: LabelStyle; rows: Row[] };

function groupRows(rows: Row[], blockName: string): RowGroup[] {
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
        // A cor das sublinhas herda a cor da doença
        const color = diseaseColor(disease) ?? rowColor(disease, blockName);
        result.push({
          type: "group",
          disease,
          color,
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
          <div key={i} style={{ flex: 1, borderLeft: i === 0 ? "none" : "1px solid #D9D9D9" }} />
        ))}
      </div>

      {/* Barras — usa o mesmo campo que o editor: description ?? label */}
      {bars.map((bar) => {
        const span        = bar.end_month - bar.start_month + 1;
        const left        = ((bar.start_month - 1) / 12) * 100;
        const width       = (span / 12) * 100;
        const displayText = bar.description ?? bar.label;
        const textLen     = displayText?.length ?? 0;

        // Tamanho de fonte por densidade (min 8px)
        const density  = textLen / span;
        const fontSize = Math.max(8,
          density > 20 ? 7  :
          density > 14 ? 8  :
          density > 10 ? 9  :
          density > 8  ? 10 :
          density > 6  ? 11 : 12,
        );

        // Compressão horizontal: cada mês ≈ 46px (A4 portrait 194mm * 76% / 12)
        // Largura de char bold Inter ≈ fontSize * 0.58
        const availPx = span * 46;
        const textPx  = textLen * fontSize * 0.58;
        const scaleX  = textLen > 0 ? Math.min(1, availPx / Math.max(textPx, 1)) : 1;

        return (
          <div
            key={bar.id}
            style={{
              position: "absolute",
              top: "2px", bottom: "2px",
              left:  `calc(${left}% + 1px)`,
              width: `calc(${width}% - 2px)`,
              background: bar.alert ? "#c0392b" : bar.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {displayText && (
              <span style={{
                display: "block",
                whiteSpace: "nowrap",
                fontSize: `${fontSize}px`,
                fontWeight: "700",
                color: bar.alert ? "#fff" : "rgba(0,0,0,0.85)",
                lineHeight: 1,
                ...(scaleX < 1 && {
                  transform: `scaleX(${scaleX.toFixed(3)})`,
                  transformOrigin: "center",
                }),
              }}>
                {displayText}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tabela de bloco ──────────────────────────────────────────────────────────

const BORDER    = "1px solid #D9D9D9";
const ROW_H     = "18px";
const MONTH_BG  = "#E67E22";   // fundo da linha de meses — laranja em todos os blocos

function BlockTable({ block }: { block: CalendarBlockGroup }) {
  const groups   = groupRows(block.rows, block.block_name);
  const lbl      = colLabel(block.block_name);
  const visNotes = (block.notes ?? []).filter((n) => n.is_visible === 1);

  function cell(ls: LabelStyle, content: string, extra?: React.CSSProperties): React.CSSProperties {
    return {
      background:    ls.bg,
      color:         ls.text,
      padding:       "2px 5px",
      fontSize:      "7px",
      fontWeight:    "600",
      verticalAlign: "middle",
      lineHeight:    "1.2",
      borderRight:   BORDER,
      borderBottom:  BORDER,
      whiteSpace:    "normal",
      wordBreak:     "break-word",
      ...extra,
    };
  }

  return (
    <div style={{ marginBottom: "5px", breakInside: "avoid", pageBreakInside: "avoid" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", border: BORDER }}>
        <colgroup>
          <col style={{ width: "14%" }} />  {/* doença — largo o suficiente para LINFADENITE CASEOSA */}
          <col style={{ width: "10%" }} />
          {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: "6.33%" }} />)}
        </colgroup>

        <thead>
          {/* Título do bloco */}
          <tr>
            <th colSpan={14} style={{
              background: "#000000", color: "#FFFFFF",
              textAlign: "center", padding: "4px 8px",
              fontSize: "10px", fontWeight: "700",
              letterSpacing: "0.08em", textTransform: "uppercase",
              borderBottom: BORDER,
            }}>
              {block.block_name}
            </th>
          </tr>

          {/* Linha dos meses — fundo laranja */}
          <tr>
            <th colSpan={2} style={{
              background: MONTH_BG, color: "#FFFFFF",
              padding: "2px 5px", fontSize: "6.5px", fontWeight: "700",
              textAlign: "center", letterSpacing: "0.05em",
              borderRight: BORDER, borderBottom: BORDER,
            }}>
              {lbl}
            </th>
            {MONTHS.map((m, i) => (
              <th key={i} style={{
                background: MONTH_BG, color: "#FFFFFF",
                textAlign: "center", padding: "2px 0",
                fontSize: "7px", fontWeight: "700",
                borderLeft: "1px solid rgba(255,255,255,0.3)",
                borderBottom: BORDER,
              }}>
                {m}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groups.flatMap((group) => {
            if (group.type === "single") {
              const ls = rowColor(group.row.row_name, block.block_name);
              return [
                <tr key={group.row.id} style={{ opacity: group.row.is_active ? 1 : 0.45, height: ROW_H }}>
                  <td colSpan={2} style={cell(ls, group.row.row_name)}>
                    {group.row.row_name}
                  </td>
                  <td colSpan={12} style={{ background: "#FFFFFF", borderBottom: BORDER, padding: 0, height: ROW_H }}>
                    <BarTrack bars={group.row.bars} />
                  </td>
                </tr>,
              ];
            } else {
              // Sublinhas herdam a cor da doença
              const disLs = group.color;
              return group.rows.map((row, ri) => (
                <tr key={row.id} style={{ opacity: row.is_active ? 1 : 0.45, height: ROW_H }}>
                  {ri === 0 && (
                    <td rowSpan={group.rows.length} style={cell(disLs, group.disease, {
                      textAlign: "center", verticalAlign: "middle",
                      fontWeight: "700", fontSize: "6.5px",
                      textTransform: "uppercase", letterSpacing: "0.03em",
                      whiteSpace: "nowrap", wordBreak: "normal",
                    })}>
                      {group.disease}
                    </td>
                  )}
                  {/* Sublinha herda cor da doença */}
                  <td style={cell(disLs, catName(row.row_name))}>
                    {catName(row.row_name)}
                  </td>
                  <td colSpan={12} style={{ background: "#FFFFFF", borderBottom: BORDER, padding: 0, height: ROW_H }}>
                    <BarTrack bars={row.bars} />
                  </td>
                </tr>
              ));
            }
          })}
        </tbody>
      </table>

      {/* Observações */}
      {visNotes.length > 0 && (
        <div style={{ borderLeft: BORDER, borderRight: BORDER, borderBottom: BORDER, padding: "3px 6px", background: "#fafafa" }}>
          {visNotes.map((note) => (
            <p key={note.id} style={{ margin: "2px 0", fontSize: "8.5px", color: "#000000", lineHeight: "1.4" }}>
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
        @page { size: A4 portrait; margin: 7mm 8mm; }
        *, *::before, *::after { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
        html, body { background: #ffffff !important; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #000; }
        .pw { display: flex; flex-direction: column; min-height: 283mm; }
        @media screen {
          body { background: #e0e0e0 !important; }
          .pw  { max-width: 210mm; margin: 16px auto; background: #ffffff; padding: 7mm 8mm; }
        }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="pw">

        {/* Botão de impressão — só na tela */}
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <PrintButton />
        </div>

        {/* ── Cabeçalho ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#000000", marginBottom: "4px" }}>
          <tbody>
            <tr>
              <td style={{ width: "66px", padding: "6px 8px", verticalAlign: "middle" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-vpc.png" alt="VPC" style={{ height: "40px", display: "block", objectFit: "contain" }} />
              </td>
              <td style={{ textAlign: "center", verticalAlign: "middle", padding: "6px 0" }}>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1 }}>
                  CALENDÁRIO SANITÁRIO
                </div>
                <div style={{ fontSize: "7.5px", color: "#FFFFFF", marginTop: "3px", letterSpacing: "0.02em" }}>
                  Programa Rebanho Blindado 3.0 por Léo Pinto
                </div>
              </td>
              <td style={{ width: "66px", padding: "6px 8px", verticalAlign: "middle", textAlign: "right" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-rebanho.png" alt="Rebanho Blindado" style={{ height: "40px", display: "inline-block", objectFit: "contain" }} />
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
                <td key={f.label} style={{
                  padding: "3px 8px",
                  borderRight: i < arr.length - 1 ? "1px solid #D9D9D9" : "none",
                  verticalAlign: "top",
                }}>
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

        {/* Conteúdo principal — cresce para empurrar rodapé para baixo */}
        <div style={{ flex: 1 }}>

          {/* ── Blocos ── */}
          {blocks.map((block) => (
            <BlockTable key={block.block_position} block={block} />
          ))}

          {/* ── Bloco de alerta ── */}
          <div style={{
            background: "#FFE5E5", border: "1px solid #D9D9D9",
            padding: "5px 8px", marginBottom: "4px",
            breakInside: "avoid", pageBreakInside: "avoid",
          }}>
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

        </div>

        {/* ── Rodapé — fixo na base da página ── */}
        <div style={{ textAlign: "center", padding: "4px 0", borderTop: "1px solid #D9D9D9" }}>
          <span style={{ fontSize: "7.5px", fontWeight: "600", color: "#000000", letterSpacing: "0.03em" }}>
            www.vamosproduzircordeiros.com.br&nbsp;&nbsp;|&nbsp;&nbsp;ESCOLA DE OVINOCULTORES&nbsp;&nbsp;|&nbsp;&nbsp;@leopinto.cordeiros
          </span>
        </div>

      </div>
    </>
  );
}
