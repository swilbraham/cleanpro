"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users, Briefcase, Receipt, Inbox } from "lucide-react";

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  type: string;
}

interface SearchResults {
  customers: SearchResult[];
  jobs: SearchResult[];
  invoices: SearchResult[];
  requests: SearchResult[];
}

const categoryConfig = {
  customers: { label: "Customers", icon: Users, path: "/customers" },
  jobs: { label: "Jobs", icon: Briefcase, path: "/jobs" },
  invoices: { label: "Invoices", icon: Receipt, path: "/invoices" },
  requests: { label: "Requests", icon: Inbox, path: "/requests" },
} as const;

type Category = keyof typeof categoryConfig;

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when modal opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  function navigateTo(type: string, id: string) {
    const config = categoryConfig[type + "s" as Category] || categoryConfig[type as Category];
    if (config) {
      router.push(`${config.path}/${id}`);
    }
    setOpen(false);
  }

  const hasResults =
    results &&
    (results.customers.length > 0 ||
      results.jobs.length > 0 ||
      results.invoices.length > 0 ||
      results.requests.length > 0);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Search panel */}
          <div className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-white shadow-2xl">
            {/* Input row */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search customers, jobs, invoices, requests..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground border rounded px-1.5 py-0.5 hover:bg-muted"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              )}

              {!loading && query.length >= 2 && !hasResults && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No results found for &quot;{query}&quot;
                </div>
              )}

              {!loading && hasResults && (
                <div className="py-2">
                  {(Object.keys(categoryConfig) as Category[]).map((category) => {
                    const items = results[category];
                    if (!items || items.length === 0) return null;

                    const config = categoryConfig[category];
                    const Icon = config.icon;

                    return (
                      <div key={category}>
                        <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {config.label}
                        </div>
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => navigateTo(item.type, item.id)}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {item.label}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {item.sublabel}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && query.length < 2 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
