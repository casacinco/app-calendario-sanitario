import Link from "next/link";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

interface ManejoResumoProps {
  overdue:   number;
  thisMonth: number;
  nextMonth: number;
}

export function ManejoResumo({ overdue, thisMonth, nextMonth }: ManejoResumoProps) {
  const cur     = new Date().getMonth();       // 0-based
  const nxt     = cur === 11 ? 0 : cur + 1;   // 0-based
  const allZero = overdue === 0 && thisMonth === 0 && nextMonth === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Resumo dos manejos</p>
        {allZero && (
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Em dia ✓
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 border-t border-gray-100 divide-x divide-gray-100">
        <MetricLink
          href="/dashboard/calendario#atrasados"
          count={overdue}
          label="Atrasados"
          activeColor="text-amber-600"
          activeBg="bg-amber-50/60"
          active={overdue > 0}
        />
        <MetricLink
          href="/dashboard/calendario#este-mes"
          count={thisMonth}
          label={MONTHS[cur]!}
          activeColor="text-[#CC0000]"
          activeBg=""
          active={thisMonth > 0}
        />
        <MetricLink
          href="/dashboard/calendario#proximo-mes"
          count={nextMonth}
          label={MONTHS[nxt]!}
          activeColor="text-gray-700"
          activeBg=""
          active={nextMonth > 0}
        />
      </div>
    </div>
  );
}

function MetricLink({
  href, count, label, active, activeColor, activeBg,
}: {
  href: string;
  count: number;
  label: string;
  active: boolean;
  activeColor: string;
  activeBg: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center py-5 gap-1.5 ${activeBg} hover:opacity-80 transition-opacity`}
    >
      <span className={`text-3xl font-black leading-none tabular-nums ${active ? activeColor : "text-gray-200"}`}>
        {count}
      </span>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
    </Link>
  );
}
