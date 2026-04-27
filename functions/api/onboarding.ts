// POST /api/onboarding
// Cria (ou reaproveita) usuário, fazenda, questionário e solicitação.

import {
  createCalendarRequest,
  createFarm,
  createHealthQuestionnaire,
  createUser,
  getUserByEmail,
} from "../../src/lib/db";

interface Env {
  DB: D1Database;
}

interface OnboardingBody {
  user: { email: string; name: string };
  farm: {
    name: string;
    city?: string;
    state?: string;
    notes?: string;
  };
  questionnaire?: {
    vaccination_history?: string;
    current_medications?: string;
    recent_diseases?: string;
    biosecurity_practices?: string;
    water_source?: string;
    feed_source?: string;
    veterinary_assistance?: string;
    additional_info?: string;
    raw_responses?: string;
  };
  deadline?: string;
  notes?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: OnboardingBody;
  try {
    body = await context.request.json<OnboardingBody>();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.user?.email || !body?.user?.name || !body?.farm?.name) {
    return Response.json(
      { error: "Missing required fields: user.email, user.name, farm.name" },
      { status: 400 },
    );
  }

  const db = context.env.DB;

  try {
    let user = await getUserByEmail(db, body.user.email);
    if (!user) user = await createUser(db, body.user);

    const farm = await createFarm(db, { ...body.farm, user_id: user.id });

    const questionnaire = body.questionnaire
      ? await createHealthQuestionnaire(db, {
          farm_id: farm.id,
          ...body.questionnaire,
        })
      : null;

    const request = await createCalendarRequest(db, {
      user_id: user.id,
      farm_id: farm.id,
      deadline: body.deadline,
      notes: body.notes,
    });

    return Response.json(
      { user, farm, questionnaire, request },
      { status: 201 },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
};
