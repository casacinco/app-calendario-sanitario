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

export interface FlockData {
  id: number;
  farm_id: number;
  species: string;
  total_animals: number | null;
  housing_type: string | null;
  age_groups: string | null;
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

export interface CreateFlockDataInput {
  farm_id: number;
  species: string;
  total_animals?: number | null;
  housing_type?: string | null;
  age_groups?: string | null;
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

export async function getUserById(
  db: D1Database,
  userId: number,
): Promise<User | null> {
  return db
    .prepare(`SELECT * FROM users WHERE id = ?1`)
    .bind(userId)
    .first<User>();
}

export interface UserWithHash extends User {
  password_hash: string | null;
}

export async function getUserByEmailWithHash(
  db: D1Database,
  email: string,
): Promise<UserWithHash | null> {
  return db
    .prepare(`SELECT * FROM users WHERE email = ?1`)
    .bind(email)
    .first<UserWithHash>();
}

export async function createUserWithPassword(
  db: D1Database,
  input: { email: string; name: string; password_hash: string },
): Promise<User> {
  return insertReturning<User>(
    db,
    `INSERT INTO users (email, name, role, password_hash)
     VALUES (?1, ?2, 'user', ?3)
     RETURNING id, email, name, role, created_at, updated_at`,
    [input.email, input.name, input.password_hash],
    "create user with password",
  );
}

const SYSTEM_ADMIN_EMAIL = "system@vpc.local";

export async function getOrCreateSystemAdmin(db: D1Database): Promise<User> {
  const existing = await getUserByEmail(db, SYSTEM_ADMIN_EMAIL);
  if (existing) return existing;
  return createUser(db, {
    email: SYSTEM_ADMIN_EMAIL,
    name: "Sistema VPC",
    role: "admin",
  });
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
// FLOCK DATA
// =====================================================

export async function createFlockData(
  db: D1Database,
  input: CreateFlockDataInput,
): Promise<FlockData> {
  return insertReturning<FlockData>(
    db,
    `INSERT INTO flock_data (farm_id, species, total_animals, housing_type, age_groups, notes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     RETURNING *`,
    [
      input.farm_id,
      input.species,
      input.total_animals ?? null,
      input.housing_type ?? null,
      input.age_groups ?? null,
      input.notes ?? null,
    ],
    "create flock data",
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

export interface CalendarBar {
  id: number;
  calendar_row_id: number;
  start_month: number;
  end_month: number;
  label: string | null;
  color: string;
  alert: number;
  position: number;
  created_at: string;
}

export interface CalendarRowWithBars extends CalendarRow {
  bars: CalendarBar[];
}

export interface CalendarBlockGroup {
  block_name: string;
  block_position: number;
  rows: CalendarRowWithBars[];
}

export interface CalendarFullDetails {
  calendar: Calendar;
  request: CalendarRequest;
  user: User;
  farm: Farm;
  blocks: CalendarBlockGroup[];
}

export async function getCalendarFullDetails(
  db: D1Database,
  calendarId: number,
): Promise<CalendarFullDetails | null> {
  const calendar = await db
    .prepare(`SELECT * FROM calendars WHERE id = ?1`)
    .bind(calendarId)
    .first<Calendar>();
  if (!calendar) return null;

  const [request, rowsResult, barsResult] = await Promise.all([
    db
      .prepare(`SELECT * FROM calendar_requests WHERE id = ?1`)
      .bind(calendar.request_id)
      .first<CalendarRequest>(),
    db
      .prepare(
        `SELECT * FROM calendar_rows
         WHERE calendar_id = ?1
         ORDER BY block_position, row_position`,
      )
      .bind(calendarId)
      .all<CalendarRow>(),
    db
      .prepare(
        `SELECT b.*
         FROM calendar_bars b
         JOIN calendar_rows r ON r.id = b.calendar_row_id
         WHERE r.calendar_id = ?1
         ORDER BY b.position, b.id`,
      )
      .bind(calendarId)
      .all<CalendarBar>(),
  ]);
  if (!request) throw new DbError("Inconsistent data: request missing");

  const [user, farm] = await Promise.all([
    db
      .prepare(`SELECT * FROM users WHERE id = ?1`)
      .bind(request.user_id)
      .first<User>(),
    db
      .prepare(`SELECT * FROM farms WHERE id = ?1`)
      .bind(request.farm_id)
      .first<Farm>(),
  ]);
  if (!user || !farm)
    throw new DbError("Inconsistent data: user or farm missing");

  const barsByRow = new Map<number, CalendarBar[]>();
  for (const bar of barsResult.results) {
    const list = barsByRow.get(bar.calendar_row_id) ?? [];
    list.push(bar);
    barsByRow.set(bar.calendar_row_id, list);
  }

  const blocksMap = new Map<string, CalendarBlockGroup>();
  for (const row of rowsResult.results) {
    const key = `${row.block_position}|${row.block_name}`;
    let group = blocksMap.get(key);
    if (!group) {
      group = {
        block_name: row.block_name,
        block_position: row.block_position,
        rows: [],
      };
      blocksMap.set(key, group);
    }
    group.rows.push({
      ...row,
      bars: barsByRow.get(row.id) ?? [],
    });
  }

  const blocks = Array.from(blocksMap.values()).sort(
    (a, b) => a.block_position - b.block_position,
  );

  return { calendar, request, user, farm, blocks };
}

export interface RequestFullDetails {
  request: CalendarRequest;
  user: User;
  farm: Farm;
  flock: FlockData | null;
  questionnaire: HealthQuestionnaire | null;
  calendar: Calendar | null;
}

export async function getRequestFullDetails(
  db: D1Database,
  requestId: number,
): Promise<RequestFullDetails | null> {
  const request = await db
    .prepare(`SELECT * FROM calendar_requests WHERE id = ?1`)
    .bind(requestId)
    .first<CalendarRequest>();
  if (!request) return null;

  const [user, farm, flock, questionnaire, calendar] = await Promise.all([
    db
      .prepare(`SELECT * FROM users WHERE id = ?1`)
      .bind(request.user_id)
      .first<User>(),
    db
      .prepare(`SELECT * FROM farms WHERE id = ?1`)
      .bind(request.farm_id)
      .first<Farm>(),
    db
      .prepare(
        `SELECT * FROM flock_data WHERE farm_id = ?1 ORDER BY id DESC LIMIT 1`,
      )
      .bind(request.farm_id)
      .first<FlockData>(),
    db
      .prepare(
        `SELECT * FROM health_questionnaire WHERE farm_id = ?1 ORDER BY id DESC LIMIT 1`,
      )
      .bind(request.farm_id)
      .first<HealthQuestionnaire>(),
    db
      .prepare(`SELECT * FROM calendars WHERE request_id = ?1`)
      .bind(requestId)
      .first<Calendar>(),
  ]);

  if (!user || !farm) throw new DbError("Inconsistent data: user or farm missing");

  return { request, user, farm, flock, questionnaire, calendar };
}

export interface AdminRequestRow {
  id: number;
  user_id: number;
  farm_id: number;
  status: RequestStatus;
  deadline: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
  farm_name: string;
  farm_city: string | null;
  farm_state: string | null;
  flock_species: string | null;
  flock_total: number | null;
  raw_responses: string | null;
}

export async function listAdminRequests(
  db: D1Database,
): Promise<AdminRequestRow[]> {
  const result = await db
    .prepare(
      `SELECT
         cr.id, cr.user_id, cr.farm_id, cr.status, cr.deadline,
         cr.created_at,
         u.name  AS user_name,
         u.email AS user_email,
         f.name  AS farm_name,
         f.city  AS farm_city,
         f.state AS farm_state,
         (SELECT species FROM flock_data
          WHERE farm_id = f.id ORDER BY id DESC LIMIT 1) AS flock_species,
         (SELECT total_animals FROM flock_data
          WHERE farm_id = f.id ORDER BY id DESC LIMIT 1) AS flock_total,
         (SELECT raw_responses FROM health_questionnaire
          WHERE farm_id = f.id ORDER BY id DESC LIMIT 1) AS raw_responses
       FROM calendar_requests cr
       JOIN users u ON cr.user_id = u.id
       JOIN farms f ON cr.farm_id = f.id
       ORDER BY cr.created_at DESC`,
    )
    .all<AdminRequestRow>();
  return result.results;
}

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

export interface CreateBarInput {
  calendar_row_id: number;
  start_month: number;
  end_month: number;
  label?: string | null;
  color?: string;
  alert?: boolean;
  position?: number;
}

export async function createBar(
  db: D1Database,
  input: CreateBarInput,
): Promise<CalendarBar> {
  if (input.start_month < 1 || input.start_month > 12)
    throw new DbError("start_month must be between 1 and 12");
  if (input.end_month < 1 || input.end_month > 12)
    throw new DbError("end_month must be between 1 and 12");
  if (input.start_month > input.end_month)
    throw new DbError("start_month must be <= end_month");

  return insertReturning<CalendarBar>(
    db,
    `INSERT INTO calendar_bars
       (calendar_row_id, start_month, end_month, label, color, alert, position)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     RETURNING *`,
    [
      input.calendar_row_id,
      input.start_month,
      input.end_month,
      input.label ?? null,
      input.color ?? "#2BA152",
      input.alert ? 1 : 0,
      input.position ?? 0,
    ],
    "create bar",
  );
}

export interface UpdateBarInput {
  start_month?: number;
  end_month?: number;
  label?: string | null;
  color?: string;
  alert?: boolean;
}

export async function updateBar(
  db: D1Database,
  barId: number,
  input: UpdateBarInput,
): Promise<CalendarBar> {
  const existing = await db
    .prepare(`SELECT * FROM calendar_bars WHERE id = ?1`)
    .bind(barId)
    .first<CalendarBar>();
  if (!existing) throw new DbError("Bar not found");

  const start = input.start_month ?? existing.start_month;
  const end = input.end_month ?? existing.end_month;
  if (start < 1 || start > 12 || end < 1 || end > 12)
    throw new DbError("months must be between 1 and 12");
  if (start > end) throw new DbError("start_month must be <= end_month");

  const updated = await db
    .prepare(
      `UPDATE calendar_bars
       SET start_month = ?1,
           end_month   = ?2,
           label       = ?3,
           color       = ?4,
           alert       = ?5
       WHERE id = ?6
       RETURNING *`,
    )
    .bind(
      start,
      end,
      input.label !== undefined ? input.label : existing.label,
      input.color ?? existing.color,
      input.alert !== undefined ? (input.alert ? 1 : 0) : existing.alert,
      barId,
    )
    .first<CalendarBar>();
  if (!updated) throw new DbError("Failed to update bar");
  return updated;
}

export async function deleteBar(db: D1Database, barId: number): Promise<void> {
  const result = await db
    .prepare(`DELETE FROM calendar_bars WHERE id = ?1`)
    .bind(barId)
    .run();
  if (result.meta.changes === 0) throw new DbError("Bar not found");
}

export async function toggleCalendarRow(
  db: D1Database,
  rowId: number,
): Promise<CalendarRow> {
  const updated = await db
    .prepare(
      `UPDATE calendar_rows
       SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
       WHERE id = ?1
       RETURNING *`,
    )
    .bind(rowId)
    .first<CalendarRow>();
  if (!updated) throw new DbError("Row not found");
  return updated;
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
