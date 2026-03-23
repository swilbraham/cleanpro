"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wrench, Users, CreditCard, Building2 } from "lucide-react";

const settingsLinks = [
  {
    title: "Service Catalog",
    description: "Manage the services you offer, set prices and categories",
    href: "/settings/services",
    icon: Wrench,
  },
  {
    title: "Team Members",
    description: "Manage your team, roles and permissions",
    href: "/settings/team",
    icon: Users,
  },
  {
    title: "Billing & Payments",
    description: "Configure payment methods and Stripe integration",
    href: "/settings/billing",
    icon: CreditCard,
  },
  {
    title: "Company Details",
    description: "Update your business name, address and branding",
    href: "/settings/company",
    icon: Building2,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business configuration
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="transition-colors hover:bg-accent/50 cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {link.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
