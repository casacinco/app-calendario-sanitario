import { Clock } from "lucide-react";
import { BackButton } from "@/components/producer/back-button";

export const runtime = "edge";

export default function HistoricoPage() {
  return (
    <div className="bg-[#F6F6F6] min-h-screen">

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <BackButton />
          <h1 className="text-base font-bold text-gray-900">Histórico</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-900">Histórico em breve</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-xs mx-auto">
            Aqui você poderá acompanhar o histórico completo de manejos e eventos sanitários do seu rebanho.
          </p>
        </div>
      </main>

    </div>
  );
}
