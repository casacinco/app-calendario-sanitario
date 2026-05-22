import { cookies } from "next/headers";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

// Itens do protocolo de implantação sanitária inicial
const IMPLANTACAO_ITEMS = [
  {
    key:            "clostridiose",
    title:          "Clostridiose",
    row_name:       "Clostridiose",
    category_name:  "Vacinação",
    recommendation: "DOSE + REFORÇO",
  },
  {
    key:            "pasteurelose",
    title:          "Pasteurelose",
    row_name:       "Pasteurelose",
    category_name:  "Vacinação",
    recommendation: "DOSE + REFORÇO",
  },
  {
    key:            "vermifugo",
    title:          "Vermífugo",
    row_name:       "Vermífugo",
    category_name:  "Vermifugação",
    recommendation: "DOSE + REFORÇO",
  },
  {
    key:            "suplementacao",
    title:          "Suplementação (Catofós)",
    row_name:       "Suplementação (Catofós)",
    category_name:  "Suplementação",
    recommendation: "DOSE",
  },
] as const;

interface Body {
  checklist?: Record<string, "done" | "pending">;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = Number(uid);
  const db = getEnv().DB;

  let body: Body = {};
  try { body = await request.json(); } catch { /* corpo vazio é válido */ }

  // Salva confirmação da leitura do aviso
  await db
    .prepare(
      `UPDATE calendar_requests
       SET calendar_intro_confirmed    = 1,
           calendar_intro_confirmed_at = datetime('now')
       WHERE user_id = ?1
         AND calendar_intro_confirmed  = 0
         AND status                    = 'delivered'
         AND solicitation_type         = 'standard'
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(userId)
    .run();

  // Cria eventos de implantação para itens marcados como "NÃO realizei"
  if (body.checklist) {
    const cal = await db
      .prepare(
        `SELECT c.id AS calendar_id, cr.id AS request_id
         FROM calendars c
         JOIN calendar_requests cr ON cr.id = c.request_id
         WHERE cr.user_id = ?1 AND c.status = 'published'
         ORDER BY c.published_at DESC LIMIT 1`,
      )
      .bind(userId)
      .first<{ calendar_id: number; request_id: number }>();

    if (cal) {
      const currentMonth = new Date().getMonth() + 1;
      const today        = new Date().toISOString().slice(0, 10);

      const stmts = IMPLANTACAO_ITEMS
        .filter((item) => body.checklist?.[item.key] === "pending")
        .map((item) =>
          db.prepare(
            `INSERT INTO calendar_events
               (user_id, calendar_id, request_id, block_name, row_name, category_name,
                event_type, title, recommendation, month, start_month, end_month,
                start_part, end_part, status, due_date, event_origin)
             VALUES (?1,?2,?3,'IMPLANTAÇÃO SANITÁRIA',?4,?5,
                     'scheduled',?6,?7,?8,?8,?8,'start','end','pending',?9,'implantacao')`,
          ).bind(
            userId,
            cal.calendar_id,
            cal.request_id,
            item.row_name,
            item.category_name,
            item.title,
            item.recommendation,
            currentMonth,
            today,
          ),
        );

      if (stmts.length > 0) await db.batch(stmts);
    }
  }

  return Response.json({ ok: true });
}
