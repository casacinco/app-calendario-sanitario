import { Badge } from "@/components/ui/badge";
import type { RequestStatus } from "@/lib/db";

const labels: Record<RequestStatus, string> = {
  pending: "Pendente",
  in_progress: "Em produção",
  delivered: "Entregue",
  archived: "Arquivado",
};

const variants: Record<
  RequestStatus,
  "default" | "muted" | "success" | "danger"
> = {
  pending: "default",
  in_progress: "default",
  delivered: "success",
  archived: "muted",
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
