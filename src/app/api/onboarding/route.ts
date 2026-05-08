import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarRequest,
  createFarm,
  createFlockData,
  createHealthQuestionnaire,
  createUser,
  getUserByEmail,
  completeMemberOnboarding,
} from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface OnboardingBody {
  user: { email: string; name: string };
  farm: {
    name: string;
    city?: string;
    state?: string;
    notes?: string;
  };
  flock?: {
    species: string;
    total_animals?: number;
    housing_type?: string;
    age_groups?: string;
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

export async function POST(request: NextRequest) {
  let body: OnboardingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.user?.email || !body?.user?.name || !body?.farm?.name) {
    return NextResponse.json(
      { error: "Missing required fields: user.email, user.name, farm.name" },
      { status: 400 },
    );
  }

  const db = getEnv().DB;

  try {
    let user = await getUserByEmail(db, body.user.email);
    if (!user) user = await createUser(db, body.user);

    const farm = await createFarm(db, { ...body.farm, user_id: user.id });

    const flock = body.flock
      ? await createFlockData(db, { farm_id: farm.id, ...body.flock })
      : null;

    const questionnaire = body.questionnaire
      ? await createHealthQuestionnaire(db, {
          farm_id: farm.id,
          ...body.questionnaire,
        })
      : null;

    const calendarRequest = await createCalendarRequest(db, {
      user_id: user.id,
      farm_id: farm.id,
      deadline: body.deadline,
      notes: body.notes,
    });

    // Auto-link member if one exists with this email
    await completeMemberOnboarding(db, body.user.email, calendarRequest.id);

    const res = NextResponse.json(
      { user, farm, flock, questionnaire, request: calendarRequest },
      { status: 201 },
    );
    // Clear onboarding gate cookie
    res.cookies.set("rb_onboarding", "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
