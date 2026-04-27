// GET /api/admin/requests
// Lista todas as solicitações de calendário com dados de usuário e fazenda.

import { listRequestsWithDetails } from "../../../src/lib/db";

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const requests = await listRequestsWithDetails(context.env.DB);
    return Response.json({ requests });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
};
