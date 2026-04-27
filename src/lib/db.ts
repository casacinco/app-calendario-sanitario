// =====================================================
// Camada de banco — Cloudflare D1
// =====================================================
// Funções de criação dos recursos principais do onboarding.
// Cada função recebe a binding D1Database (definida em wrangler.toml como `DB`).

export type UserRole = "user" | "admin";

export type RequestStatus =
  | "pending"
  | "in_progress"
  | "delivered"
  | "archived";

// =====================================================
// Tipos de entidades (espelham as tabelas)
// =====================================================

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: number;
  user_id: number;
  name: string;
  city: string | null;
  state: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthQuestionnaire {
  id: number;
  farm_id: number;
  vaccination_history: string | null;
  current_medications: string | null;
  recent_diseases: string | null;
  biosecurity_practices: string | null;
  water_source: string | null;
  feed_source: string | null;
  veterinary_assistance: string | null;
  additional_info: string | null;
  raw_responses: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarRequest {
  id: number;
  user_id: number;
  farm_id: number;
  status: RequestStatus;
  deadline: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarStatus = "draft" | "published";

export interface Calendar {
  id: number;
  request_id: number;
  template_id: number;
  status: CalendarStatus;
  created_by: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarRow {
  id: number;
  calendar_id: number;
  template_row_id: number;
  block_name: string;
  row_name: string;
  block_position: number;
  row_position: number;
  is_active: number;
}

export interface RequestWithDetails extends CalendarRequest {
  user_name: string;
  user_email: string;
  farm_name: string;
  flock_species: string | null;
  flock_total: number | null;
}

// =====================================================
// Inputs (parciais — apenas campos editáveis)
// =====================================================

export interface CreateUserInput {
  email: string;
  name: string;
  role?: UserRole;
}

export interface CreateFarmInput {
  user_id: number;
  name: string;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
}

export interface CreateHealthQuestionnaireInput {
  farm_id: number;
  vaccination_history?: string | null;
  current_medications?: string | null;
  recent_diseases?: string | null;
  biosecurity_practices?: string | null;
  water_source?: string | null;
  feed_source?: string | null;
  veterinary_assistance?: string | null;
  additional_info?: string | null;
  raw_responses?: string | null;
}

export interface CreateCalendarRequestInput {
  user_id: number;
  farm_id: number;
  status?: RequestStatus;
  deadline?: string | null;
  notes?: string | null;
}

// =====================================================
// Helpers
// =====================================================

class DbError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "DbError";
  }
}

async function insertReturning<T>(
  db: D1Database,
  sql: string,
  params: unknown[],
  context: string,
): Promise<T> {
  const row = await db
    .prepare(sql)
    .bind(...params)
    .first<T>();
  if (!row) throw new DbError(`Failed to ${context}: insert returned no row`);
  return row;
}

// =====================================================
// USERS
// =====================================================

export async function createUser(
  db: D1Database,
  input: CreateUserInput,
): Promise<User> {
  return insertReturning<User>(
    db,
    `INSERT INTO users (email, name, role)
     VALUES (?1, ?2, ?3)
     RETURNING *`,
    [input.email, input.name, input.role ?? "user"],
    "create user",
  );
}

export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<User | null> {
  return db
    .prepare(`SELECT * FROM users WHERE email = ?1`)
    .bind(email)
    .first<User>();
}

// =====================================================
// FARMS
// =====================================================

export async function createFarm(
  db: D1Database,
  input: CreateFarmInput,
): Promise<Farm> {
  return insertReturning<Farm>(
    db,
    `INSERT INTO farms (user_id, name, city, state, notes)
     VALUES (?1, ?2, ?3, ?4, ?5)
     RETURNING *`,
    [
      input.user_id,
      input.name,
      input.city ?? null,
      input.state ?? null,
      input.notes ?? null,
    ],
    "create farm",
  );
}

// =====================================================
// HEALTH QUESTIONNAIRE
// =====================================================

export async function createHealthQuestionnaire(
  db: D1Database,
  input: CreateHealthQuestionnaireInput,
): Promise<HealthQuestionnaire> {
  return insertReturning<HealthQuestionnaire>(
    db,
    `INSERT INTO health_questionnaire (
        farm_id,
        vaccination_history,
        current_medications,
        recent_diseases,
        biosecurity_practices,
        water_source,
        feed_source,
        veterinary_assistance,
        additional_info,
        raw_responses
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
     RETURNING *`,
    [
      input.farm_id,
      input.vaccination_history ?? null,
      input.current_medications ?? null,
      input.recent_diseases ?? null,
      input.biosecurity_practices ?? null,
      input.water_source ?? null,
      input.feed_source ?? null,
      input.veterinary_assistance ?? null,
      input.additional_info ?? null,
      input.raw_responses ?? null,
    ],
    "create health questionnaire",
  );
}

// =====================================================
// CALENDAR REQUESTS
// =====================================================

export async function createCalendarRequest(
  db: D1Database,
  input: CreateCalendarRequestInput,
): Promise<CalendarRequest> {
  return insertReturning<CalendarRequest>(
    db,
    `INSERT INTO calendar_requests (user_id, farm_id, status, deadline, notes)
     VALUES (?1, ?2, ?3, ?4, ?5)
     RETURNING *`,
    [
      input.user_id,
      input.farm_id,
      input.status ?? "pending",
      input.deadline ?? null,
      input.notes ?? null,
    ],
    "create calendar request",
  );
}

// =====================================================
// ADMIN — listagens
// =====================================================

export async function listRequestsWithDetails(
  db: D1Database,
): Promise<RequestWithDetails[]> {
  const result = await db
    .prepare(
      `SELECT
         cr.*,
         u.name  AS user_name,
         u.email AS user_email,
         f.name  AS farm_name,
         fd.species       AS flock_species,
         fd.total_animals AS flock_total
       FROM calendar_requests cr
       JOIN users u ON cr.user_id = u.id
       JOIN farms f ON cr.farm_id = f.id
       LEFT JOIN flock_data fd ON fd.farm_id = f.id
       ORDER BY cr.created_at DESC`,
    )
    .all<RequestWithDetails>();
  return result.results;
}

// =====================================================
// CALENDARS — criação a partir de template + publicação
// =====================================================

interface TemplateRowSnapshot {
  template_row_id: number;
  row_name: string;
  row_position: number;
  default_active: number;
  block_name: string;
  block_position: number;
}

export async function createCalendarFromRequest(
  db: D1Database,
  input: { request_id: number; admin_id: number; template_id?: number },
): Promise<Calendar> {
  const templateId = input.template_id ?? 1;

  const request = await db
    .prepare(`SELECT * FROM calendar_requests WHERE id = ?1`)
    .bind(input.request_id)
    .first<CalendarRequest>();
  if (!request) throw new DbError("Request not found");

  const existing = await db
    .prepare(`SELECT id FROM calendars WHERE request_id = ?1`)
    .bind(input.request_id)
    .first<{ id: number }>();
  if (existing) throw new DbError("Calendar already exists for this request");

  const templateRows = await db
    .prepare(
      `SELECT
         r.id        AS template_row_id,
         r.name      AS row_name,
         r.position  AS row_position,
         r.default_active,
         b.name      AS block_name,
         b.position  AS block_position
       FROM calendar_template_rows r
       JOIN calendar_template_blocks b ON r.block_id = b.id
       WHERE b.template_id = ?1
       ORDER BY b.position, r.position`,
    )
    .bind(templateId)
    .all<TemplateRowSnapshot>();

  const calendar = await insertReturning<Calendar>(
    db,
    `INSERT INTO calendars (request_id, template_id, status, created_by)
     VALUES (?1, ?2, 'draft', ?3)
     RETURNING *`,
    [input.request_id, templateId, input.admin_id],
    "create calendar",
  );

  if (templateRows.results.length > 0) {
    const insertRow = db.prepare(
      `INSERT INTO calendar_rows
         (calendar_id, template_row_id, block_name, row_name,
          block_position, row_position, is_active)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    );
    await db.batch(
      templateRows.results.map((r) =>
        insertRow.bind(
          calendar.id,
          r.template_row_id,
          r.block_name,
          r.row_name,
          r.block_position,
          r.row_position,
          r.default_active,
        ),
      ),
    );
  }

  await db
    .prepare(
      `UPDATE calendar_requests
       SET status = 'in_progress', updated_at = datetime('now')
       WHERE id = ?1 AND status = 'pending'`,
    )
    .bind(input.request_id)
    .run();

  return calendar;
}

export async function publishCalendar(
  db: D1Database,
  input: { calendar_id: number; admin_id: number },
): Promise<Calendar> {
  const calendar = await db
    .prepare(`SELECT * FROM calendars WHERE id = ?1`)
    .bind(input.calendar_id)
    .first<Calendar>();
  if (!calendar) throw new DbError("Calendar not found");
  if (calendar.status === "published")
    throw new DbError("Calendar already published");

  await db.batch([
    db
      .prepare(
        `UPDATE calendars
         SET status = 'published',
             published_at = datetime('now'),
             updated_at  = datetime('now')
         WHERE id = ?1`,
      )
      .bind(input.calendar_id),
    db
      .prepare(
        `UPDATE calendar_requests
         SET status = 'delivered', updated_at = datetime('now')
         WHERE id = ?1`,
      )
      .bind(calendar.request_id),
    db
      .prepare(
        `INSERT INTO delivery_logs
           (calendar_id, request_id, delivered_by, event)
         VALUES (?1, ?2, ?3, 'published')`,
      )
      .bind(input.calendar_id, calendar.request_id, input.admin_id),
  ]);

  return {
    ...calendar,
    status: "published",
    published_at: new Date().toISOString(),
  };
}
