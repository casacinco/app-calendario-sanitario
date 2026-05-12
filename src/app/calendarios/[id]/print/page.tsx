import { notFound } from "next/navigation";
import { getCalendarFullDetails } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { formatDateBR } from "@/lib/format";
import { CalendarPrint } from "@/components/calendar-print";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface PageProps {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ embed?: string }>;
}

export default async function PrintPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const calendarId = Number(id);
  if (!Number.isInteger(calendarId) || calendarId <= 0) notFound();

  const data = await getCalendarFullDetails(getEnv().DB, calendarId);
  if (!data) notFound();

  const { calendar, user, farm, blocks } = data;
  const location = [farm.city, farm.state].filter(Boolean).join("/") || "—";

  return (
    <CalendarPrint
      blocks={blocks}
      ownerName={user.name}
      farmName={farm.name}
      location={location}
      createdAt={formatDateBR(calendar.created_at)}
      hideActions={sp.embed === "1"}
    />
  );
}
