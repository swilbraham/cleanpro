import type {
  Customer,
  Property,
  Quote,
  QuoteLineItem,
  Job,
  JobLineItem,
  Invoice,
  Payment,
  Service,
  Note,
  User,
} from "@prisma/client";

export type CustomerWithRelations = Customer & {
  properties?: Property[];
  quotes?: Quote[];
  jobs?: (Job & { lineItems?: JobLineItem[] })[];
  invoices?: Invoice[];
  notes?: (Note & { author: Pick<User, "id" | "name"> })[];
};

export type QuoteWithRelations = Quote & {
  customer: Customer;
  lineItems: (QuoteLineItem & { service: Service })[];
};

export type JobWithRelations = Job & {
  customer: Customer;
  property?: Property | null;
  quote?: Quote | null;
  assignedTo?: User | null;
  lineItems: (JobLineItem & { service: Service })[];
  invoice?: Invoice | null;
};

export type InvoiceWithRelations = Invoice & {
  job: Job & { customer: Customer };
  customer: Customer;
  payments: Payment[];
};

export type DashboardStats = {
  todayJobs: JobWithRelations[];
  weekJobCount: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  outstandingCount: number;
  outstandingTotal: number;
  overdueCount: number;
  overdueTotal: number;
};
