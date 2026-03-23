import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW: {
    label: "New",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  CONTACTED: {
    label: "Contacted",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  QUOTED: {
    label: "Quoted",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  },
  WON: {
    label: "Won",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  LOST: {
    label: "Lost",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

interface RequestStatusBadgeProps {
  status: string;
  className?: string;
}

export function RequestStatusBadge({
  status,
  className,
}: RequestStatusBadgeProps) {
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
