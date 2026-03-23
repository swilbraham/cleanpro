import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  INVOICED: {
    label: "Invoiced",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  },
};

interface JobStatusBadgeProps {
  status: string;
  className?: string;
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
