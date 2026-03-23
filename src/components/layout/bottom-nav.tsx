"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import {
  LayoutDashboard,
  Briefcase,
  Plus,
  Calendar,
  MoreHorizontal,
  FileText,
  Users,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const onCloseMore = React.useCallback(() => setMoreOpen(false), []);

  const tabs = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "#create", label: "Create", icon: Plus },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "#more", label: "More", icon: MoreHorizontal },
  ];

  return (
    <>
      {/* Create action sheet */}
      {createOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setCreateOpen(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 z-50 rounded-xl bg-white shadow-xl border border-border p-2 lg:hidden">
            <Link
              href="/quotes/new"
              onClick={() => setCreateOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <FileText className="h-5 w-5 text-primary" />
              New Quote
            </Link>
            <Link
              href="/jobs/new"
              onClick={() => setCreateOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Briefcase className="h-5 w-5 text-primary" />
              New Job
            </Link>
            <Link
              href="/customers/new"
              onClick={() => setCreateOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              New Customer
            </Link>
          </div>
        </>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-white border-t border-border">
          <div
            className="flex items-center justify-around"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {tabs.map((tab) => {
              const isCreate = tab.href === "#create";
              const isMore = tab.href === "#more";
              const isActive =
                !isCreate &&
                !isMore &&
                (pathname === tab.href ||
                  (tab.href !== "/" && pathname.startsWith(tab.href)));

              if (isCreate) {
                return (
                  <button
                    key={tab.href}
                    onClick={() => {
                      setCreateOpen(!createOpen);
                      setMoreOpen(false);
                    }}
                    className="relative flex flex-col items-center justify-center -mt-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                      <Plus className="h-6 w-6" />
                    </div>
                    <span className="mt-0.5 text-[10px] font-medium text-primary">
                      Create
                    </span>
                  </button>
                );
              }

              if (isMore) {
                return (
                  <button
                    key={tab.href}
                    onClick={() => {
                      setMoreOpen(!moreOpen);
                      setCreateOpen(false);
                    }}
                    className="flex flex-col items-center justify-center py-2 px-3 min-h-[56px]"
                  >
                    <tab.icon
                      className={cn(
                        "h-5 w-5",
                        moreOpen ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "mt-0.5 text-[10px] font-medium",
                        moreOpen ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => {
                    setCreateOpen(false);
                    setMoreOpen(false);
                  }}
                  className="flex flex-col items-center justify-center py-2 px-3 min-h-[56px]"
                >
                  <tab.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full nav drawer from "More" */}
      <MobileNav open={moreOpen} onClose={onCloseMore} />
    </>
  );
}
