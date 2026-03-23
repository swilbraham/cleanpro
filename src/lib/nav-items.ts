import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Calendar,
  Receipt,
  MapPin,
  Settings,
  CreditCard,
  Inbox,
  BarChart3,
  Clock,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: "main" | "secondary";
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/requests", label: "Requests", icon: Inbox, group: "main" },
  { href: "/customers", label: "Customers", icon: Users, group: "main" },
  { href: "/quotes", label: "Quotes", icon: FileText, group: "main" },
  { href: "/jobs", label: "Jobs", icon: Briefcase, group: "main" },
  { href: "/calendar", label: "Calendar", icon: Calendar, group: "main" },
  { href: "/invoices", label: "Invoices", icon: Receipt, group: "main" },
  { href: "/route-planner", label: "Route Planner", icon: MapPin, group: "main" },
  { href: "/payments", label: "Payments", icon: CreditCard, group: "main" },
  { href: "/timesheets", label: "Time Sheets", icon: Clock, group: "main" },
  { href: "/reports", label: "Reports", icon: BarChart3, group: "main" },
  { href: "/settings", label: "Settings", icon: Settings, group: "secondary" },
];

export const mainNavItems = navItems.filter((item) => item.group === "main");
export const secondaryNavItems = navItems.filter((item) => item.group === "secondary");
