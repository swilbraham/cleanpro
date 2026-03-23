"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavItems, secondaryNavItems } from "@/lib/nav-items";
import { Plus, FileText, Briefcase, Users, ChevronDown } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = React.useState(false);
  const createRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar">
      {/* Logo */}
      <div className="flex items-center h-16 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CP</span>
          </div>
          <span className="font-bold text-lg text-white">CleanPro</span>
        </Link>
      </div>

      {/* Create Button */}
      <div className="px-4 mb-2" ref={createRef}>
        <button
          onClick={() => setCreateOpen(!createOpen)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create
          <ChevronDown className={cn("h-3 w-3 transition-transform", createOpen && "rotate-180")} />
        </button>
        {createOpen && (
          <div className="mt-1 rounded-lg bg-sidebar-hover border border-white/10 overflow-hidden">
            <Link
              href="/quotes/new"
              onClick={() => setCreateOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-active hover:text-white transition-colors"
            >
              <FileText className="h-4 w-4" />
              New Quote
            </Link>
            <Link
              href="/jobs/new"
              onClick={() => setCreateOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-active hover:text-white transition-colors"
            >
              <Briefcase className="h-4 w-4" />
              New Job
            </Link>
            <Link
              href="/customers/new"
              onClick={() => setCreateOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-active hover:text-white transition-colors"
            >
              <Users className="h-4 w-4" />
              New Customer
            </Link>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-4">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-active text-sidebar-active-text"
                      : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-3 border-t border-white/10" />

        {/* Secondary Nav */}
        <ul className="space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-active text-sidebar-active-text"
                      : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 text-xs text-sidebar-foreground/50">
        CleanPro v1.0
      </div>
    </aside>
  );
}
