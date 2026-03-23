import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SENT: { label: "Sent", variant: "outline" },
  ACCEPTED: { label: "Accepted", variant: "default" },
  DECLINED: { label: "Declined", variant: "destructive" },
  CONVERTED: { label: "Converted", variant: "default" },
};

interface QuoteStatusBadgeProps {
  status: string;
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
