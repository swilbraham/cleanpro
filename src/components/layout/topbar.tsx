"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-white px-4 lg:px-6">
      <div className="flex-1">
        <h2 className="text-sm font-medium text-muted-foreground lg:hidden">
          CleanPro
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-white text-xs font-semibold">
            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="hidden sm:inline font-medium">
            {session?.user?.name || "User"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          className="h-8 w-8"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
