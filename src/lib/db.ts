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

export type BarPart = "start" | "middle" | "end";

export interface CalendarBar {
  id: number;
  calendar_row_id: number;
  start_month: number;
  end_month: number;
  label: string | null;
  color: string;
  alert: number;
  position: number;
  description: string | null;
  animal_category: string | null;
  start_part: BarPart | null;
  end_part: BarPart | null;
  created_at: string;
}

export interface CalendarRowWithBars extends CalendarRow {
  bars: CalendarBar[];
}

export interface CalendarBlockNote {
  id: number;
  calendar_id: number;
  block_position: number;
  text: string;
  is_visible: number;
  position: number;
  created_at: string;
}

export interface CalendarBlockGroup {
  block_name: string;
  block_position: number;
  rows: CalendarRowWithBars[];
  notes?: CalendarBlockNote[];
}

export interface CalendarFullDetails {
  calendar: Calendar;
  request: CalendarRequest;
  user: User;
  farm: Farm;
  blocks: CalendarBlockGroup[];
  rawResponses: string | null;
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

  const [request, rowsResult, barsResult, notesResult] = await Promise.all([
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
    db
      .prepare(
        `SELECT * FROM calendar_block_notes
         WHERE calendar_id = ?1
         ORDER BY block_position, position`,
      )
      .bind(calendarId)
      .all<CalendarBlockNote>(),
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

  const questionnaireRow = await db
    .prepare(
      `SELECT raw_responses FROM health_questionnaire WHERE farm_id = ?1 ORDER BY id DESC LIMIT 1`,
    )
    .bind(farm.id)
    .first<{ raw_responses: string | null }>();
  const rawResponses = questionnaireRow?.raw_responses ?? null;

  const barsByRow = new Map<number, CalendarBar[]>();
  for (const bar of barsResult.results) {
    const list = barsByRow.get(bar.calendar_row_id) ?? [];
    list.push(bar);
    barsByRow.set(bar.calendar_row_id, list);
  }

  const notesByBlock = new Map<number, CalendarBlockNote[]>();
  for (const note of notesResult.results) {
    const list = notesByBlock.get(note.block_position) ?? [];
    list.push(note);
    notesByBlock.set(note.block_position, list);
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
        notes: notesByBlock.get(row.block_position) ?? [],
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

  return { calendar, request, user, farm, blocks, rawResponses };
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
  delivered_at: string | null;
  calendar_id: number | null;
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
         c.published_at AS delivered_at,
         c.id AS calendar_id,
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
       LEFT JOIN calendars c ON c.request_id = cr.id
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

  await insertDefaultBlockNotes(db, calendar.id);

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
  description?: string | null;
  animal_category?: string | null;
  start_part?: BarPart | null;
  end_part?: BarPart | null;
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
       (calendar_row_id, start_month, end_month, label, color, alert, position, description, animal_category, start_part, end_part)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
     RETURNING *`,
    [
      input.calendar_row_id,
      input.start_month,
      input.end_month,
      input.label ?? null,
      input.color ?? "#2BA152",
      input.alert ? 1 : 0,
      input.position ?? 0,
      input.description ?? null,
      input.animal_category ?? null,
      input.start_part ?? "start",
      input.end_part ?? "end",
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
  description?: string | null;
  animal_category?: string | null;
  start_part?: BarPart | null;
  end_part?: BarPart | null;
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
       SET start_month      = ?1,
           end_month        = ?2,
           label            = ?3,
           color            = ?4,
           alert            = ?5,
           description      = ?6,
           animal_category  = ?7,
           start_part       = ?8,
           end_part         = ?9
       WHERE id = ?10
       RETURNING *`,
    )
    .bind(
      start,
      end,
      input.label !== undefined ? input.label : existing.label,
      input.color ?? existing.color,
      input.alert !== undefined ? (input.alert ? 1 : 0) : existing.alert,
      input.description !== undefined ? input.description : existing.description,
      input.animal_category !== undefined ? input.animal_category : existing.animal_category,
      input.start_part !== undefined ? input.start_part : (existing.start_part ?? "start"),
      input.end_part   !== undefined ? input.end_part   : (existing.end_part   ?? "end"),
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

export async function deleteAllCalendarBars(db: D1Database, calendarId: number): Promise<void> {
  await db
    .prepare(
      `DELETE FROM calendar_bars
       WHERE calendar_row_id IN (
         SELECT id FROM calendar_rows WHERE calendar_id = ?1
       )`,
    )
    .bind(calendarId)
    .run();
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

// =====================================================
// CALENDAR ROWS — create / rename / delete
// =====================================================

export async function createCalendarRow(
  db: D1Database,
  input: {
    calendar_id: number;
    block_name: string;
    block_position: number;
    row_name: string;
    row_position: number;
  },
): Promise<CalendarRow> {
  return insertReturning<CalendarRow>(
    db,
    `INSERT INTO calendar_rows
       (calendar_id, template_row_id, block_name, row_name, block_position, row_position, is_active)
     VALUES (?1, 0, ?2, ?3, ?4, ?5, 1)
     RETURNING *`,
    [input.calendar_id, input.block_name, input.row_name, input.block_position, input.row_position],
    "create calendar row",
  );
}

export async function updateCalendarRowName(
  db: D1Database,
  rowId: number,
  name: string,
): Promise<CalendarRow> {
  const updated = await db
    .prepare(`UPDATE calendar_rows SET row_name = ?2 WHERE id = ?1 RETURNING *`)
    .bind(rowId, name)
    .first<CalendarRow>();
  if (!updated) throw new DbError("Row not found");
  return updated;
}

export async function deleteCalendarRow(
  db: D1Database,
  rowId: number,
): Promise<void> {
  await db
    .prepare(`DELETE FROM calendar_bars WHERE calendar_row_id = ?1`)
    .bind(rowId)
    .run();
  const result = await db
    .prepare(`DELETE FROM calendar_rows WHERE id = ?1`)
    .bind(rowId)
    .run();
  if (result.meta.changes === 0) throw new DbError("Row not found");
}

export async function renameCalendarBlock(
  db: D1Database,
  input: { calendar_id: number; block_position: number; new_name: string },
): Promise<void> {
  await db
    .prepare(
      `UPDATE calendar_rows SET block_name = ?3
       WHERE calendar_id = ?1 AND block_position = ?2`,
    )
    .bind(input.calendar_id, input.block_position, input.new_name)
    .run();
}

export async function deleteCalendarBlock(
  db: D1Database,
  input: { calendar_id: number; block_position: number },
): Promise<void> {
  await db
    .prepare(
      `DELETE FROM calendar_bars
       WHERE calendar_row_id IN (
         SELECT id FROM calendar_rows
         WHERE calendar_id = ?1 AND block_position = ?2
       )`,
    )
    .bind(input.calendar_id, input.block_position)
    .run();
  await db
    .prepare(
      `DELETE FROM calendar_rows WHERE calendar_id = ?1 AND block_position = ?2`,
    )
    .bind(input.calendar_id, input.block_position)
    .run();
}

// =====================================================
// CALENDAR BLOCK NOTES — create / update / delete
// =====================================================

const DEFAULT_BLOCK_NOTES: { block_position: number; text: string; position: number }[] = [
  { block_position: 3, position: 1, text: "As doses reforço das vacinas devem ser administradas entre 21 e 30 dias após a 1ª dose;" },
  { block_position: 3, position: 2, text: "A vacinação contra LINFADEITE CASEOSA não deve ser realizada em animais que já possuam a enfermidade, vacinar apenas os animais que tenham sido imunizados quando cordeiros;" },
  { block_position: 3, position: 3, text: "A vacina contra leptospirose tem sua indicação de uso em todos os animais destinados à reprodução, entretanto, animais destinados ao abate, se mantidos junto ao rebanho, também devem ser vacinados;" },
  { block_position: 3, position: 4, text: "ATENÇÃO: A dose reforço é obrigatória para todos os animais PRIMOVACINADOS (1ª vez). A partir do segundo ano, se já receberam a mesma vacina no ano anterior, não é necessário reforço em adultos;" },
  { block_position: 3, position: 5, text: "OBS: Se mudar a marca da vacina, é obrigatório fazer dose reforço." },
  { block_position: 4, position: 1, text: "Realizar a cura do umbigo com iodo 10% logo após o nascimento ou produto compatível + PROBEZERRO + CATOFÓS;" },
  { block_position: 4, position: 2, text: "Recomendação de tratamento preventivo contra EIMERIOSE com uma dose entre 21 e 30 dias após o nascimento (produtos à base de Toltrazuril)." },
  { block_position: 5, position: 1, text: "ATENÇÃO ao vermifugar ovelhas com prenhez positiva: usar droga compatível com a categoria." },
  { block_position: 5, position: 2, text: "A dose reforço do vermífugo deve ser administrado entre 17 e 21 dias após a 1ª dose." },
];

export async function insertDefaultBlockNotes(
  db: D1Database,
  calendarId: number,
): Promise<void> {
  const posResult = await db
    .prepare(`SELECT DISTINCT block_position FROM calendar_rows WHERE calendar_id = ?1`)
    .bind(calendarId)
    .all<{ block_position: number }>();
  const existing = new Set(posResult.results.map((r) => r.block_position));
  const toInsert = DEFAULT_BLOCK_NOTES.filter((n) => existing.has(n.block_position));
  if (toInsert.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
     VALUES (?1, ?2, ?3, 1, ?4)`,
  );
  await db.batch(toInsert.map((n) => stmt.bind(calendarId, n.block_position, n.text, n.position)));
}

export async function createCalendarBlockNote(
  db: D1Database,
  input: { calendar_id: number; block_position: number; text: string; position: number },
): Promise<CalendarBlockNote> {
  return insertReturning<CalendarBlockNote>(
    db,
    `INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
     VALUES (?1, ?2, ?3, 1, ?4)
     RETURNING *`,
    [input.calendar_id, input.block_position, input.text, input.position],
    "create block note",
  );
}

export async function updateCalendarBlockNote(
  db: D1Database,
  noteId: number,
  input: { text?: string; is_visible?: number },
): Promise<CalendarBlockNote> {
  const existing = await db
    .prepare(`SELECT * FROM calendar_block_notes WHERE id = ?1`)
    .bind(noteId)
    .first<CalendarBlockNote>();
  if (!existing) throw new DbError("Note not found");
  const updated = await db
    .prepare(
      `UPDATE calendar_block_notes
       SET text = ?2, is_visible = ?3
       WHERE id = ?1
       RETURNING *`,
    )
    .bind(
      noteId,
      input.text !== undefined ? input.text : existing.text,
      input.is_visible !== undefined ? input.is_visible : existing.is_visible,
    )
    .first<CalendarBlockNote>();
  if (!updated) throw new DbError("Failed to update note");
  return updated;
}

export async function deleteCalendarBlockNote(
  db: D1Database,
  noteId: number,
): Promise<void> {
  const result = await db
    .prepare(`DELETE FROM calendar_block_notes WHERE id = ?1`)
    .bind(noteId)
    .run();
  if (result.meta.changes === 0) throw new DbError("Note not found");
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

export async function unpublishCalendar(
  db: D1Database,
  calendar_id: number,
): Promise<Calendar> {
  const calendar = await db
    .prepare(`SELECT * FROM calendars WHERE id = ?1`)
    .bind(calendar_id)
    .first<Calendar>();
  if (!calendar) throw new DbError("Calendar not found");
  if (calendar.status === "draft") throw new DbError("Calendar is not published");

  await db.batch([
    db
      .prepare(
        `UPDATE calendars
         SET status = 'draft',
             published_at = NULL,
             updated_at   = datetime('now')
         WHERE id = ?1`,
      )
      .bind(calendar_id),
    db
      .prepare(
        `UPDATE calendar_requests
         SET status = 'pending', updated_at = datetime('now')
         WHERE id = ?1`,
      )
      .bind(calendar.request_id),
  ]);

  return { ...calendar, status: "draft", published_at: null };
}

// =====================================================
// CUSTOM PRESETS
// =====================================================

export interface CustomPreset {
  id: number;
  name: string;
  bars_json: string;
  created_at: string;
}

export async function listCustomPresets(db: D1Database): Promise<CustomPreset[]> {
  const result = await db
    .prepare(`SELECT * FROM calendar_presets ORDER BY created_at ASC`)
    .all<CustomPreset>();
  return result.results;
}

export async function saveCustomPreset(
  db: D1Database,
  input: { name: string; bars_json: string },
): Promise<CustomPreset> {
  const existing = await db
    .prepare(`SELECT id FROM calendar_presets WHERE name = ?1`)
    .bind(input.name)
    .first();
  if (existing) throw new DbError(`Já existe um modelo com o nome "${input.name}"`);

  return insertReturning<CustomPreset>(
    db,
    `INSERT INTO calendar_presets (name, bars_json) VALUES (?1, ?2) RETURNING *`,
    [input.name, input.bars_json],
    "save custom preset",
  );
}

// =====================================================
// MEMBERS
// =====================================================

export type MemberStatus           = "active" | "blocked";
export type MemberProfile          = "user" | "support" | "admin";
export type MemberAccessType       = "30d" | "90d" | "365d" | "lifetime";
export type MemberSubStatus        = "active" | "canceled" | "expired" | "refunded" | "chargedback";
export type MemberPaymentStatus    = "approved" | "pending" | "refunded" | "chargedback";
export type ExternalPlatform       = "hotmart" | "kiwify" | "perfectpay" | "eduzz" | "manual" | "outro";
export type ExternalEventType      =
  | "purchase"
  | "renewal"
  | "expiration"
  | "refund"
  | "cancellation"
  | "chargeback";

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  product: string | null;
  status: MemberStatus;
  profile: MemberProfile;
  access_type: MemberAccessType;
  expires_at: string | null;
  last_access: string | null;
  password: string | null;
  device_info: string | null;
  onboarding_completed: number; // 0 = pending, 1 = done
  origin: string | null;
  notes: string | null;
  calendar_request_id: number | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
  // ── Campos de compra/plataforma (migration 0019) ──────────────────────────
  platform:               string | null;
  transaction_id:         string | null;
  product_id:             string | null;
  product_name:           string | null;
  buyer_email:            string | null;
  buyer_name:             string | null;
  purchase_date:          string | null;
  access_start_date:      string | null;
  subscription_status:    string; // MemberSubStatus — default 'active'
  payment_status:         string; // MemberPaymentStatus — default 'approved'
  last_event_received_at: string | null;
}

// ── Histórico de eventos ────────────────────────────────────────────────────

export interface MemberEvent {
  id: number;
  member_id: number;
  event_type: string;   // ExternalEventType
  platform: string | null;
  transaction_id: string | null;
  payload: string | null;
  action_taken: string | null;
  created_at: string;
}

export interface CreateMemberEventInput {
  member_id: number;
  event_type: ExternalEventType;
  platform?: string | null;
  transaction_id?: string | null;
  payload?: string | null;
  action_taken?: string | null;
}

// ── Evento externo (input unificado para todas as plataformas) ──────────────

export interface ExternalEvent {
  platform: ExternalPlatform | string;
  event_type: ExternalEventType;
  transaction_id?: string | null;
  email: string;
  name?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  access_days?: number | null;   // null = vitalício
  payload?: string | null;       // JSON do payload original
}

export interface ProcessEventResult {
  member: Member;
  action: string;
  created: boolean;
}

export interface MemberWithRequest extends Member {
  request_status: string | null;
  calendar_id: number | null;
  cal_status: string | null;       // calendars.status ("draft" | "published")
  cal_published_at: string | null; // calendars.published_at
  user_name: string | null;
  farm_name: string | null;
}

export interface CreateMemberInput {
  name: string;
  email: string;
  phone?: string | null;
  product?: string | null;
  status?: MemberStatus;
  profile?: MemberProfile;
  access_type?: MemberAccessType;
  expires_at?: string | null;
  password?: string | null;
  origin?: string | null;
  notes?: string | null;
  calendar_request_id?: number | null;
  entry_date?: string;
  // Campos de compra
  platform?: string | null;
  transaction_id?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  buyer_email?: string | null;
  buyer_name?: string | null;
  purchase_date?: string | null;
  access_start_date?: string | null;
  subscription_status?: MemberSubStatus;
  payment_status?: MemberPaymentStatus;
  last_event_received_at?: string | null;
}

export interface UpdateMemberInput extends Partial<CreateMemberInput> {}

export async function listMembers(db: D1Database): Promise<MemberWithRequest[]> {
  const result = await db
    .prepare(
      `SELECT m.*,
              cr.status       AS request_status,
              c.id            AS calendar_id,
              c.status        AS cal_status,
              c.published_at  AS cal_published_at,
              u.name          AS user_name,
              f.name          AS farm_name
       FROM members m
       LEFT JOIN calendar_requests cr ON cr.id = m.calendar_request_id
       LEFT JOIN calendars          c  ON c.request_id = cr.id
       LEFT JOIN users              u  ON u.id = cr.user_id
       LEFT JOIN farms              f  ON f.id = cr.farm_id
       ORDER BY m.created_at DESC`,
    )
    .all<MemberWithRequest>();
  return result.results;
}

export async function getMember(db: D1Database, id: number): Promise<MemberWithRequest | null> {
  return db
    .prepare(
      `SELECT m.*,
              cr.status       AS request_status,
              c.id            AS calendar_id,
              c.status        AS cal_status,
              c.published_at  AS cal_published_at,
              u.name          AS user_name,
              f.name          AS farm_name
       FROM members m
       LEFT JOIN calendar_requests cr ON cr.id = m.calendar_request_id
       LEFT JOIN calendars          c  ON c.request_id = cr.id
       LEFT JOIN users              u  ON u.id = cr.user_id
       LEFT JOIN farms              f  ON f.id = cr.farm_id
       WHERE m.id = ?1`,
    )
    .bind(id)
    .first<MemberWithRequest>();
}

export async function createMember(db: D1Database, input: CreateMemberInput): Promise<Member> {
  const existing = await db
    .prepare(`SELECT id FROM members WHERE email = ?1`)
    .bind(input.email)
    .first();
  if (existing) throw new DbError(`Já existe um usuário com o e-mail "${input.email}"`);

  return insertReturning<Member>(
    db,
    `INSERT INTO members (
       name, email, phone, product, status, profile, access_type, expires_at,
       password, origin, notes, calendar_request_id, entry_date,
       platform, transaction_id, product_id, product_name,
       buyer_email, buyer_name, purchase_date, access_start_date,
       subscription_status, payment_status, last_event_received_at
     ) VALUES (
       ?1,  ?2,  ?3,  ?4,  ?5,  ?6,  ?7,  ?8,  ?9,  ?10, ?11, ?12, ?13,
       ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24
     ) RETURNING *`,
    [
      input.name,
      input.email,
      input.phone ?? null,
      input.product ?? null,
      input.status ?? "active",
      input.profile ?? "user",
      input.access_type ?? "30d",
      input.expires_at ?? null,
      input.password ?? null,
      input.origin ?? null,
      input.notes ?? null,
      input.calendar_request_id ?? null,
      input.entry_date ?? new Date().toISOString().split("T")[0],
      input.platform ?? null,
      input.transaction_id ?? null,
      input.product_id ?? null,
      input.product_name ?? null,
      input.buyer_email ?? null,
      input.buyer_name ?? null,
      input.purchase_date ?? null,
      input.access_start_date ?? null,
      input.subscription_status ?? "active",
      input.payment_status ?? "approved",
      input.last_event_received_at ?? null,
    ],
    "create member",
  );
}

export async function updateMember(
  db: D1Database,
  id: number,
  patch: UpdateMemberInput,
): Promise<Member> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (patch.name !== undefined)                { fields.push(`name = ?${idx++}`);                params.push(patch.name); }
  if (patch.email !== undefined)               { fields.push(`email = ?${idx++}`);               params.push(patch.email); }
  if (patch.phone !== undefined)               { fields.push(`phone = ?${idx++}`);               params.push(patch.phone); }
  if (patch.product !== undefined)             { fields.push(`product = ?${idx++}`);             params.push(patch.product); }
  if (patch.status !== undefined)              { fields.push(`status = ?${idx++}`);              params.push(patch.status); }
  if (patch.profile !== undefined)             { fields.push(`profile = ?${idx++}`);             params.push(patch.profile); }
  if (patch.access_type !== undefined)         { fields.push(`access_type = ?${idx++}`);         params.push(patch.access_type); }
  if (patch.expires_at !== undefined)          { fields.push(`expires_at = ?${idx++}`);          params.push(patch.expires_at); }
  if (patch.password !== undefined)            { fields.push(`password = ?${idx++}`);            params.push(patch.password); }
  if (patch.origin !== undefined)              { fields.push(`origin = ?${idx++}`);              params.push(patch.origin); }
  if (patch.notes !== undefined)               { fields.push(`notes = ?${idx++}`);               params.push(patch.notes); }
  if (patch.calendar_request_id !== undefined)     { fields.push(`calendar_request_id = ?${idx++}`);     params.push(patch.calendar_request_id); }
  if (patch.entry_date !== undefined)              { fields.push(`entry_date = ?${idx++}`);              params.push(patch.entry_date); }
  if (patch.platform !== undefined)                { fields.push(`platform = ?${idx++}`);                params.push(patch.platform); }
  if (patch.transaction_id !== undefined)          { fields.push(`transaction_id = ?${idx++}`);          params.push(patch.transaction_id); }
  if (patch.product_id !== undefined)              { fields.push(`product_id = ?${idx++}`);              params.push(patch.product_id); }
  if (patch.product_name !== undefined)            { fields.push(`product_name = ?${idx++}`);            params.push(patch.product_name); }
  if (patch.buyer_email !== undefined)             { fields.push(`buyer_email = ?${idx++}`);             params.push(patch.buyer_email); }
  if (patch.buyer_name !== undefined)              { fields.push(`buyer_name = ?${idx++}`);              params.push(patch.buyer_name); }
  if (patch.purchase_date !== undefined)           { fields.push(`purchase_date = ?${idx++}`);           params.push(patch.purchase_date); }
  if (patch.access_start_date !== undefined)       { fields.push(`access_start_date = ?${idx++}`);       params.push(patch.access_start_date); }
  if (patch.subscription_status !== undefined)     { fields.push(`subscription_status = ?${idx++}`);     params.push(patch.subscription_status); }
  if (patch.payment_status !== undefined)          { fields.push(`payment_status = ?${idx++}`);          params.push(patch.payment_status); }
  if (patch.last_event_received_at !== undefined)  { fields.push(`last_event_received_at = ?${idx++}`);  params.push(patch.last_event_received_at); }

  if (fields.length === 0) {
    const existing = await db.prepare(`SELECT * FROM members WHERE id = ?1`).bind(id).first<Member>();
    if (!existing) throw new DbError("Usuário não encontrado");
    return existing;
  }

  fields.push(`updated_at = datetime('now')`);
  params.push(id);

  return insertReturning<Member>(
    db,
    `UPDATE members SET ${fields.join(", ")} WHERE id = ?${idx} RETURNING *`,
    params,
    "update member",
  );
}

export async function toggleMemberStatus(db: D1Database, id: number): Promise<Member> {
  return insertReturning<Member>(
    db,
    `UPDATE members
     SET status = CASE WHEN status = 'active' THEN 'blocked' ELSE 'active' END,
         updated_at = datetime('now')
     WHERE id = ?1
     RETURNING *`,
    [id],
    "toggle member status",
  );
}

export async function extendMemberAccess(
  db: D1Database,
  id: number,
  input: { days?: number; type?: "lifetime" },
): Promise<Member> {
  if (input.type === "lifetime") {
    return insertReturning<Member>(
      db,
      `UPDATE members
       SET access_type = 'lifetime', expires_at = NULL, status = 'active',
           updated_at = datetime('now')
       WHERE id = ?1
       RETURNING *`,
      [id],
      "make member lifetime",
    );
  }

  const days = input.days ?? 30;
  const interval = `+${days} days`;
  const accessType = days <= 30 ? "30d" : days <= 90 ? "90d" : "365d";

  return insertReturning<Member>(
    db,
    `UPDATE members
     SET expires_at = date(CASE WHEN expires_at > date('now') THEN expires_at ELSE date('now') END, ?2),
         access_type = ?3,
         status = 'active',
         updated_at = datetime('now')
     WHERE id = ?1
     RETURNING *`,
    [id, interval, accessType],
    "extend member access",
  );
}

export async function deleteMember(db: D1Database, id: number): Promise<void> {
  await db.prepare(`DELETE FROM members WHERE id = ?1`).bind(id).run();
}

export async function getMemberByEmail(db: D1Database, email: string): Promise<Member | null> {
  return db
    .prepare(`SELECT * FROM members WHERE email = ?1`)
    .bind(email)
    .first<Member>();
}

export async function completeMemberOnboarding(
  db: D1Database,
  email: string,
  requestId: number,
): Promise<void> {
  await db
    .prepare(
      `UPDATE members
       SET onboarding_completed = 1, calendar_request_id = ?2, updated_at = datetime('now')
       WHERE email = ?1`,
    )
    .bind(email, requestId)
    .run();
}

// =====================================================
// MEMBER EVENTS — histórico de eventos externos
// =====================================================

export async function createMemberEvent(
  db: D1Database,
  input: CreateMemberEventInput,
): Promise<MemberEvent> {
  return insertReturning<MemberEvent>(
    db,
    `INSERT INTO member_events (member_id, event_type, platform, transaction_id, payload, action_taken)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     RETURNING *`,
    [
      input.member_id,
      input.event_type,
      input.platform ?? null,
      input.transaction_id ?? null,
      input.payload ?? null,
      input.action_taken ?? null,
    ],
    "create member event",
  );
}

export async function getMemberEvents(
  db: D1Database,
  memberId: number,
  limit = 50,
): Promise<MemberEvent[]> {
  const result = await db
    .prepare(
      `SELECT * FROM member_events
       WHERE member_id = ?1
       ORDER BY created_at DESC
       LIMIT ?2`,
    )
    .bind(memberId, limit)
    .all<MemberEvent>();
  return result.results;
}

// =====================================================
// PROCESS EXTERNAL EVENT — lógica de negócio unificada
// =====================================================

function calcExpiresAt(days: number | null | undefined, baseDate?: string | null): string | null {
  if (days === null || days === undefined) return null; // vitalício
  const base = baseDate && new Date(baseDate) > new Date() ? new Date(baseDate) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().split("T")[0] ?? null;
}

function daysToAccessType(days: number | null | undefined): MemberAccessType {
  if (!days) return "lifetime";
  if (days <= 30)  return "30d";
  if (days <= 90)  return "90d";
  if (days <= 365) return "365d";
  return "lifetime";
}

export async function processExternalEvent(
  db: D1Database,
  event: ExternalEvent,
): Promise<ProcessEventResult> {
  // ── Idempotência: rejeitar evento duplicado ──────────────────────────────
  if (event.transaction_id) {
    const dup = await db
      .prepare(`SELECT id FROM member_events WHERE transaction_id = ?1 AND event_type = ?2 LIMIT 1`)
      .bind(event.transaction_id, event.event_type)
      .first();
    if (dup) throw new DbError(`Evento duplicado: ${event.transaction_id} / ${event.event_type}`);
  }

  // ── Localizar ou criar membro ────────────────────────────────────────────
  let member = await getMemberByEmail(db, event.email);
  let created = false;
  const today = new Date().toISOString().split("T")[0];

  if (!member) {
    if (event.event_type !== "purchase") {
      throw new DbError(`Membro não encontrado para o e-mail: ${event.email}`);
    }
    const expires_at = calcExpiresAt(event.access_days ?? null);
    member = await createMember(db, {
      name:             event.name ?? (event.email.split("@")[0] ?? event.email),
      email:            event.email,
      origin:           event.platform,
      platform:         event.platform,
      transaction_id:   event.transaction_id ?? null,
      product_id:       event.product_id ?? null,
      product_name:     event.product_name ?? null,
      buyer_email:      event.email,
      buyer_name:       event.name ?? null,
      purchase_date:    today,
      access_start_date: today,
      access_type:      daysToAccessType(event.access_days ?? null),
      expires_at,
      subscription_status: "active",
      payment_status:   "approved",
      last_event_received_at: new Date().toISOString(),
    });
    created = true;
  }

  // ── Executar a ação conforme o tipo de evento ────────────────────────────
  let patch: UpdateMemberInput = {
    platform:               event.platform,
    transaction_id:         event.transaction_id ?? member.transaction_id,
    product_id:             event.product_id ?? member.product_id,
    product_name:           event.product_name ?? member.product_name,
    buyer_email:            event.email,
    buyer_name:             event.name ?? member.buyer_name,
    last_event_received_at: new Date().toISOString(),
  };
  let action: string;

  switch (event.event_type) {
    case "purchase": {
      if (!created) {
        const expires_at = calcExpiresAt(event.access_days ?? null);
        patch = {
          ...patch,
          status:             "active",
          subscription_status: "active",
          payment_status:     "approved",
          purchase_date:      today,
          access_start_date:  today,
          access_type:        daysToAccessType(event.access_days ?? null),
          expires_at,
        };
      }
      action = event.access_days
        ? `access_granted_${event.access_days}d`
        : "access_granted_lifetime";
      break;
    }
    case "renewal": {
      const expires_at = calcExpiresAt(event.access_days ?? null, member.expires_at);
      patch = {
        ...patch,
        status:             "active",
        subscription_status: "active",
        payment_status:     "approved",
        access_type:        daysToAccessType(event.access_days ?? null),
        expires_at,
      };
      action = event.access_days
        ? `access_extended_${event.access_days}d`
        : "access_extended_lifetime";
      break;
    }
    case "expiration": {
      patch = { ...patch, status: "blocked", subscription_status: "expired" };
      action = "access_blocked_expired";
      break;
    }
    case "refund": {
      patch = {
        ...patch,
        status:             "blocked",
        subscription_status: "refunded",
        payment_status:     "refunded",
      };
      action = "access_blocked_refunded";
      break;
    }
    case "cancellation": {
      // Acesso continua até expirar; apenas marca a assinatura como cancelada
      patch = { ...patch, subscription_status: "canceled" };
      action = "subscription_canceled";
      break;
    }
    case "chargeback": {
      patch = {
        ...patch,
        status:             "blocked",
        subscription_status: "chargedback",
        payment_status:     "chargedback",
      };
      action = "access_blocked_chargeback";
      break;
    }
    default:
      throw new DbError(`Tipo de evento desconhecido: ${event.event_type}`);
  }

  if (!created) {
    member = await updateMember(db, member.id, patch);
  }

  // ── Registrar evento no histórico ────────────────────────────────────────
  await createMemberEvent(db, {
    member_id:      member.id,
    event_type:     event.event_type,
    platform:       event.platform,
    transaction_id: event.transaction_id ?? null,
    payload:        event.payload ?? null,
    action_taken:   action,
  });

  return { member, action, created };
}
