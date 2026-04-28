import type { CalendarBlockGroup } from "@/lib/db";
import { cn } from "@/lib/utils";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

interface CalendarGridProps {
  blocks: CalendarBlockGroup[];
}

export function CalendarGrid({ blocks }: CalendarGridProps) {
  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <div className="min-w-[640px] px-4 md:px-0 space-y-6">
        {blocks.map((block) => (
          <section key={block.block_position}>
            <header className="mb-2 flex items-baseline gap-3">
              <h2 className="text-base font-semibold tracking-tight">
                {block.block_position}. {block.block_name}
              </h2>
              <span className="text-xs text-text-muted">
                {block.rows.filter((r) => r.is_active).length} /{" "}
                {block.rows.length} linhas ativas
              </span>
            </header>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Header dos meses */}
              <div className="grid grid-cols-[180px_repeat(12,1fr)] border-b border-border bg-text/[0.02] text-xs text-text-muted">
                <div className="px-3 py-2">Linha</div>
                {MONTHS.map((m, i) => (
                  <div
                    key={i}
                    className="px-1 py-2 text-center border-l border-border"
                  >
                    {m}
                  </div>
                ))}
              </div>

              {block.rows.map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    "grid grid-cols-[180px_repeat(12,1fr)] border-b border-border last:border-0",
                    !row.is_active && "opacity-40",
                  )}
                >
                  <div className="px-3 py-2.5 text-sm flex items-center gap-2">
                    <span className="truncate">{row.row_name}</span>
                    {!row.is_active && (
                      <span className="text-[10px] uppercase text-text-muted ml-auto">
                        off
                      </span>
                    )}
                  </div>

                  {/* Track de meses (12 colunas) */}
                  <div className="col-span-12 relative h-9 border-l border-border">
                    {/* Grid lines */}
                    <div className="absolute inset-0 grid grid-cols-12">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="border-l border-border first:border-l-0"
                        />
                      ))}
                    </div>

                    {/* Bars */}
                    {row.bars.map((bar) => {
                      const startCol = bar.start_month - 1;
                      const span = bar.end_month - bar.start_month + 1;
                      const left = (startCol / 12) * 100;
                      const width = (span / 12) * 100;
                      return (
                        <div
                          key={bar.id}
                          className="absolute top-1.5 bottom-1.5 rounded-sm flex items-center justify-center px-2 text-[11px] font-medium overflow-hidden"
                          style={{
                            left: `calc(${left}% + 2px)`,
                            width: `calc(${width}% - 4px)`,
                            background: bar.alert
                              ? "hsl(var(--red))"
                              : bar.color,
                            color: bar.alert ? "white" : "rgba(0,0,0,0.85)",
                          }}
                          title={
                            bar.label ?? `${bar.start_month}-${bar.end_month}`
                          }
                        >
                          {bar.label && (
                            <span className="truncate">{bar.label}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
