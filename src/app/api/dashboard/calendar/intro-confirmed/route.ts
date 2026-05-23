import { cookies } from "next/headers";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

// ── Itens do protocolo de implantação sanitária inicial ───────────────────────

const IMPLANTACAO_ITEMS = [
  { key: "clostridiose",  title: "Clostridiose",           row_name: "Clostridiose",           category_name: "Vacinação",      recommendation: "DOSE + REFORÇO", reforco_days: 30 },
  { key: "pasteurelose",  title: "Pasteurelose",           row_name: "Pasteurelose",           category_name: "Vacinação",      recommendation: "DOSE + REFORÇO", reforco_days: 30 },
  { key: "vermifugo",     title: "Vermífugo",              row_name: "Vermífugo",              category_name: "Vermifugação",   recommendation: "DOSE + REFORÇO", reforco_days: 21 },
  { key: "suplementacao", title: "Suplementação (Catofós)", row_name: "Suplementação (Catofós)", category_name: "Suplementação", recommendation: "DOSE",           reforco_days: 0  },
] as const;

// Palavras-chave para detectar se um evento do calendário anual é da mesma doença/manejo
// que um item de implantação. Verificação case-insensitive sobre title + row_name + category_name.
const MATCH_KEYWORDS: Record<string, string[]> = {
  clostridiose:  ["clostridiose"],
  pasteurelose:  ["pasteurelose", "pasteurose"],
  vermifugo:     ["vermif"],
  suplementacao: ["catof", "suplementa"],
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface MonthEvent {
  id:            number;
  title:         string;
  row_name:      string;
  category_name: string | null;
  month:         number | null;
  due_date:      string | null;
}

interface Body {
  checklist?: Record<string, "done" | "pending">;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = Number(uid);
  const db     = getEnv().DB;

  let body: Body = {};
  try { body = await request.json(); } catch { /* corpo vazio é válido */ }

  // ── 1. Salva confirmação da leitura do aviso ────────────────────────────────
  await db
    .prepare(
      `UPDATE calendar_requests
       SET calendar_intro_confirmed    = 1,
           calendar_intro_confirmed_at = datetime('now')
       WHERE user_id = ?1
         AND calendar_intro_confirmed  = 0
         AND status                    = 'delivered'
         AND solicitation_type         = 'standard'
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(userId)
    .run();

  if (!body.checklist) return Response.json({ ok: true });

  // ── 2. Busca calendário publicado ───────────────────────────────────────────
  const cal = await db
    .prepare(
      `SELECT c.id AS calendar_id, cr.id AS request_id,
              cr.initial_activation_adjustment_completed AS adj_done
       FROM calendars c
       JOIN calendar_requests cr ON cr.id = c.request_id
       WHERE cr.user_id = ?1 AND c.status = 'published'
       ORDER BY c.published_at DESC LIMIT 1`,
    )
    .bind(userId)
    .first<{ calendar_id: number; request_id: number; adj_done: number }>();

  if (!cal) return Response.json({ ok: true });

  // ── 3. Cria eventos de implantação para itens NÃO realizados ────────────────
  const currentMonth = new Date().getMonth() + 1;
  const today        = new Date().toISOString().slice(0, 10);

  const pendingItems = IMPLANTACAO_ITEMS.filter(
    (item) => body.checklist?.[item.key] === "pending",
  );

  if (pendingItems.length > 0) {
    const insertStmts = pendingItems.map((item) =>
      db.prepare(
        `INSERT INTO calendar_events
           (user_id, calendar_id, request_id, block_name, row_name, category_name,
            event_type, title, recommendation, month, start_month, end_month,
            start_part, end_part, status, due_date, event_origin)
         VALUES (?1,?2,?3,'IMPLANTAÇÃO SANITÁRIA',?4,?5,
                 'scheduled',?6,?7,?8,?8,?8,'start','end','pending',?9,'implantacao')`,
      ).bind(
        userId, cal.calendar_id, cal.request_id,
        item.row_name, item.category_name, item.title, item.recommendation,
        currentMonth, today,
      ),
    );
    await db.batch(insertStmts);
  }

  // ── 4. Ajuste do primeiro ciclo (executa apenas uma vez) ────────────────────
  if (cal.adj_done) return Response.json({ ok: true });

  // Busca todos os eventos scheduled do mês de ativação que não são implantação
  const { results: monthEvents } = await db
    .prepare(
      `SELECT id, title, row_name, category_name, month, due_date
       FROM calendar_events
       WHERE user_id = ?1 AND calendar_id = ?2
         AND month = ?3 AND event_origin != 'implantacao'
         AND event_type = 'scheduled' AND status = 'pending'`,
    )
    .bind(userId, cal.calendar_id, currentMonth)
    .all<MonthEvent>();

  const adjustStmts: ReturnType<typeof db.prepare>[] = [];

  if (monthEvents.length > 0 && pendingItems.length > 0) {
    // Maior prazo de reforço entre os itens pendentes (ex: 30d vacinas, 21d vermífugo)
    const maxReforco = Math.max(...pendingItems.map((i) => i.reforco_days));
    // Novos manejos do mês: após o último reforço + 21 dias de intervalo
    const rescheduleDate  = addDays(today, maxReforco + 21);
    const rescheduleMonth = new Date(rescheduleDate + "T00:00:00Z").getUTCMonth() + 1;

    // Palavras-chave dos itens pendentes (para detectar duplicidade)
    const activeKeywords = pendingItems.flatMap((i) => MATCH_KEYWORDS[i.key] ?? []);

    for (const ev of monthEvents) {
      const searchText = [ev.title, ev.row_name, ev.category_name ?? ""]
        .join(" ")
        .toLowerCase();

      const isSameType = activeKeywords.some((kw) => searchText.includes(kw));

      if (isSameType) {
        // Mesmo manejo/doença → ocultar (ação imediata prevalece)
        adjustStmts.push(
          db.prepare(
            `UPDATE calendar_events
             SET status = 'skipped',
                 notes  = COALESCE(notes || ' | ', '') || ?1,
                 updated_at = datetime('now')
             WHERE id = ?2`,
          ).bind("Substituído pela ação imediata inicial.", ev.id),
        );
        adjustStmts.push(
          db.prepare(
            `INSERT INTO calendar_event_adjustments
               (user_id, calendar_id, event_id, adjustment_type, original_due_date, reason)
             VALUES (?1,?2,?3,'superseded',?4,'Substituído pela ação imediata inicial.')`,
          ).bind(userId, cal.calendar_id, ev.id, ev.due_date),
        );
      } else {
        // Manejo diferente → reagendar para após o último reforço + 21 dias
        adjustStmts.push(
          db.prepare(
            `UPDATE calendar_events
             SET due_date = ?1, month = ?2,
                 notes    = COALESCE(notes || ' | ', '') || ?3,
                 updated_at = datetime('now')
             WHERE id = ?4`,
          ).bind(
            rescheduleDate, rescheduleMonth,
            "Reagendado automaticamente por ajuste do primeiro ciclo sanitário.",
            ev.id,
          ),
        );
        adjustStmts.push(
          db.prepare(
            `INSERT INTO calendar_event_adjustments
               (user_id, calendar_id, event_id, adjustment_type,
                original_due_date, new_due_date, reason)
             VALUES (?1,?2,?3,'rescheduled',?4,?5,
                     'Reagendado automaticamente por ajuste do primeiro ciclo sanitário.')`,
          ).bind(userId, cal.calendar_id, ev.id, ev.due_date, rescheduleDate),
        );
      }
    }
  }

  // Marca ajuste como concluído (independente de haver manejos no mês)
  adjustStmts.push(
    db.prepare(
      `UPDATE calendar_requests
       SET initial_activation_adjustment_completed = 1
       WHERE id = ?1`,
    ).bind(cal.request_id),
  );

  // D1 batch: até 100 statements por chamada
  const BATCH = 100;
  for (let i = 0; i < adjustStmts.length; i += BATCH) {
    await db.batch(adjustStmts.slice(i, i + BATCH));
  }

  return Response.json({ ok: true });
}
