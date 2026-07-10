// Geração e gerenciamento de calendar_events a partir das barras do calendário publicado.

export type CalendarEventType   = "scheduled" | "continuous";
export type CalendarEventStatus = "pending" | "completed" | "postponed" | "skipped";

export interface CalendarEvent {
  id: number;
  user_id: number;
  calendar_id: number;
  request_id: number;
  source_bar_id: number | null;
  block_name: string;
  row_name: string;
  category_name: string | null;
  event_type: CalendarEventType;
  title: string;
  description: string | null;
  recommendation: string | null;
  month: number | null;
  start_month: number | null;
  end_month: number | null;
  start_part: string | null;
  end_part: string | null;
  status: CalendarEventStatus;
  due_date: string | null;
  completed_at: string | null;
  postponed_to: string | null;
  notes: string | null;
  parent_event_id: number | null;
  is_reforco: number;
  generated_automatically: number;
  application_date: string | null;
  event_origin: string; // 'calendar' | 'implantacao'
  created_at: string;
  updated_at: string;
}

// Mapeia block_name para categoria amigável
function blockToCategory(blockName: string): string {
  const b = blockName.toUpperCase();
  if (b.includes("VACIN"))                           return "Vacinação";
  if (b.includes("VERMIF"))                          return "Vermifugação";
  if (b.includes("NEONATO") || b.includes("NEONAT")) return "Neonato";
  if (b.includes("REPRODU"))                         return "Reprodução";
  if (b.includes("CHUVA"))                           return "Chuvas";
  return blockName;
}

// Classifica uma barra como contínua ou agendada.
// Contínua = cobre o ano inteiro (1→12) ou >= 10 meses (protocolo anual/neonatal).
function isContinuous(startMonth: number, endMonth: number): boolean {
  if (startMonth === 1 && endMonth === 12) return true;
  if (endMonth - startMonth >= 9) return true;
  return false;
}

interface BarRow {
  id: number;
  start_month: number;
  end_month: number;
  label: string | null;
  description: string | null;
  start_part: string | null;
  end_part: string | null;
  block_name: string;
  row_name: string;
}

// Gera (ou regenera) os calendar_events para um calendário publicado.
// Apaga eventos existentes e recria a partir das barras ativas.
export async function generateCalendarEvents(
  db: D1Database,
  calendarId: number,
): Promise<void> {
  const calendar = await db
    .prepare(`SELECT id, request_id FROM calendars WHERE id = ?1`)
    .bind(calendarId)
    .first<{ id: number; request_id: number }>();
  if (!calendar) throw new Error("Calendar not found");

  const request = await db
    .prepare(`SELECT id, user_id FROM calendar_requests WHERE id = ?1`)
    .bind(calendar.request_id)
    .first<{ id: number; user_id: number }>();
  if (!request) throw new Error("Request not found");

  // Remove eventos anteriores deste calendário
  await db
    .prepare(`DELETE FROM calendar_events WHERE calendar_id = ?1`)
    .bind(calendarId)
    .run();

  // Busca barras ativas com info da linha e bloco
  const { results: bars } = await db
    .prepare(
      `SELECT b.id, b.start_month, b.end_month, b.label, b.description,
              b.start_part, b.end_part, r.block_name, r.row_name
       FROM calendar_bars b
       JOIN calendar_rows r ON r.id = b.calendar_row_id
       WHERE r.calendar_id = ?1 AND r.is_active = 1 AND b.start_month IS NOT NULL
       ORDER BY r.block_position, r.row_position, b.position`,
    )
    .bind(calendarId)
    .all<BarRow>();

  if (bars.length === 0) return;

  const currentYear = new Date().getFullYear();

  const stmts = bars.map((bar) => {
    const continuous = isContinuous(bar.start_month, bar.end_month);
    const eventType  = continuous ? "continuous" : "scheduled";
    const category   = blockToCategory(bar.block_name);
    const recommendation = bar.description ?? bar.label ?? null;
    const dueDate = !continuous
      ? `${currentYear}-${String(bar.start_month).padStart(2, "0")}-01`
      : null;

    return db.prepare(
      `INSERT INTO calendar_events
         (user_id, calendar_id, request_id, source_bar_id,
          block_name, row_name, category_name, event_type,
          title, recommendation, month, start_month, end_month,
          start_part, end_part, status, due_date)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,'pending',?16)`,
    ).bind(
      request.user_id,
      calendarId,
      request.id,
      bar.id,
      bar.block_name,
      bar.row_name,
      category,
      eventType,
      bar.row_name,
      recommendation,
      continuous ? null : bar.start_month,
      bar.start_month,
      bar.end_month,
      bar.start_part ?? "start",
      bar.end_part ?? "end",
      dueDate,
    );
  });

  // D1 batch aceita até 100 statements por chamada
  const BATCH = 100;
  for (let i = 0; i < stmts.length; i += BATCH) {
    await db.batch(stmts.slice(i, i + BATCH));
  }
}

// Busca eventos para o dashboard do produtor (separados por tipo).
// Se não houver eventos mas existir um calendário publicado, gera automaticamente.
export async function getEventsByUser(
  db: D1Database,
  userId: number,
): Promise<{ scheduled: CalendarEvent[]; continuous: CalendarEvent[] }> {
  const { results } = await db
    .prepare(
      `SELECT * FROM calendar_events
       WHERE user_id = ?1
         AND status NOT IN ('completed','skipped')
       ORDER BY event_type, due_date, id`,
    )
    .bind(userId)
    .all<CalendarEvent>();

  // Auto-geração para calendários publicados antes desta feature
  if (results.length === 0) {
    const cal = await db
      .prepare(
        `SELECT c.id FROM calendars c
         JOIN calendar_requests cr ON cr.id = c.request_id
         WHERE cr.user_id = ?1 AND c.status = 'published'
         ORDER BY c.published_at DESC LIMIT 1`,
      )
      .bind(userId)
      .first<{ id: number }>();

    if (cal) {
      await generateCalendarEvents(db, cal.id);
      const { results: fresh } = await db
        .prepare(
          `SELECT * FROM calendar_events
           WHERE user_id = ?1
             AND status NOT IN ('completed','skipped')
           ORDER BY event_type, due_date, id`,
        )
        .bind(userId)
        .all<CalendarEvent>();
      const scheduled  = fresh.filter((e) => e.event_type === "scheduled");
      const continuous = fresh.filter((e) => e.event_type === "continuous");
      return { scheduled, continuous };
    }
  }

  const scheduled  = results.filter((e) => e.event_type === "scheduled");
  const continuous = results.filter((e) => e.event_type === "continuous");
  return { scheduled, continuous };
}

// Busca o activation_month do calendário publicado do usuário.
// activation_month define o ponto de início do protocolo sanitário —
// eventos em meses anteriores não são atrasados, simplesmente não existem para este ciclo.
async function getActivationMonth(db: D1Database, userId: number): Promise<number> {
  const row = await db
    .prepare(
      `SELECT c.activation_month
       FROM calendars c
       JOIN calendar_requests cr ON cr.id = c.request_id
       WHERE cr.user_id = ?1 AND c.status = 'published'
       ORDER BY c.published_at DESC LIMIT 1`,
    )
    .bind(userId)
    .first<{ activation_month: number | null }>();
  // Fallback: janeiro (comportamento conservador se a coluna ainda não foi preenchida)
  return row?.activation_month ?? 1;
}

// Determina se um evento de determinado mês é "atrasado" com base no mês de ativação.
// Trata corretamente o caso de virada de ano (ex: ativação em nov, consulta em fev).
function isOverdue(month: number, activationMonth: number, cur: number): boolean {
  if (cur >= activationMonth) {
    // Mesmo ciclo anual: atrasado se >= ativação e < mês atual
    return month >= activationMonth && month < cur;
  } else {
    // Virada de ano (ex: ativação nov=11, agora fev=2):
    // atrasado se está no fim do ano anterior (>= ativação) OU no começo do ano atual (< mês atual)
    return month >= activationMonth || month < cur;
  }
}

// Determina se um evento deve ser exibido (oculta meses anteriores ao início do protocolo).
function isVisible(month: number, activationMonth: number, cur: number): boolean {
  if (cur >= activationMonth) {
    // Sem virada: oculta meses anteriores à ativação
    return month >= activationMonth;
  }
  // Com virada de ano: todos os meses são relevantes
  return true;
}

// Retorna o primeiro mês futuro (> cur) com eventos visíveis, ou null se não houver.
function findNextEventMonth(
  visible: CalendarEvent[],
  cur: number,
): number | null {
  const months = [
    ...new Set(
      visible
        .filter((e) => e.month !== null && e.month > cur)
        .map((e) => e.month as number),
    ),
  ].sort((a, b) => a - b);
  return months[0] ?? null;
}

// Contagens para o card resumo na home (exclui eventos de implantação)
export async function getEventCounts(
  db: D1Database,
  userId: number,
): Promise<{ overdue: number; thisMonth: number; nextMonth: number; nextMonthIndex: number | null }> {
  const cur             = new Date().getMonth() + 1;
  const activationMonth = await getActivationMonth(db, userId);
  const { scheduled }   = await getEventsByUser(db, userId);
  const regular         = scheduled.filter((e) => e.event_origin !== "implantacao");
  const visible         = regular.filter((e) => e.month === null || isVisible(e.month, activationMonth, cur));
  const nextMonthIndex  = findNextEventMonth(visible, cur);
  return {
    overdue:        visible.filter((e) => e.month !== null && isOverdue(e.month, activationMonth, cur)).length,
    thisMonth:      visible.filter((e) => e.month === cur).length,
    nextMonth:      nextMonthIndex !== null ? visible.filter((e) => e.month === nextMonthIndex).length : 0,
    nextMonthIndex,
  };
}

// Eventos agrupados para a aba Calendário (visão operacional completa).
// Eventos de implantação são retornados separadamente — não entram como atrasados.
export async function getEventsGrouped(
  db: D1Database,
  userId: number,
): Promise<{
  overdue:        CalendarEvent[];
  thisMonth:      CalendarEvent[];
  nextMonth:      CalendarEvent[];
  nextMonthIndex: number | null;
  continuous:     CalendarEvent[];
  implantacao:    CalendarEvent[];
}> {
  const cur             = new Date().getMonth() + 1;
  const activationMonth = await getActivationMonth(db, userId);
  const { scheduled, continuous } = await getEventsByUser(db, userId);

  const implantacao = scheduled.filter((e) => e.event_origin === "implantacao");
  const regular     = scheduled.filter((e) => e.event_origin !== "implantacao");

  const visible        = regular.filter((e) => e.month === null || isVisible(e.month, activationMonth, cur));
  const nextMonthIndex = findNextEventMonth(visible, cur);
  return {
    overdue:        visible.filter((e) => e.month !== null && isOverdue(e.month, activationMonth, cur)),
    thisMonth:      visible.filter((e) => e.month === cur),
    nextMonth:      nextMonthIndex !== null ? visible.filter((e) => e.month === nextMonthIndex) : [],
    nextMonthIndex,
    continuous,
    implantacao,
  };
}
