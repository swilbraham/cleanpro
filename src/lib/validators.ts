import { z } from "zod";

export const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
  tags: z.array(z.string()).optional(),
});

export const propertySchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
  propertyType: z.string().optional(),
  rooms: z.number().int().positive().optional(),
  sqFootage: z.number().positive().optional(),
  carpetTypes: z.array(z.string()).optional(),
  accessNotes: z.string().optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  unitPrice: z.number().positive("Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  category: z.string().min(1, "Category is required"),
  isActive: z.boolean().optional(),
});

export const quoteLineItemSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.number().positive("Price must be positive"),
});

export const quoteSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
  lineItems: z.array(quoteLineItemSchema).min(1, "At least one item required"),
});

export const jobSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  propertyId: z.string().optional(),
  assignedToId: z.string().optional(),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().optional(),
  duration: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type ServiceFormData = z.infer<typeof serviceSchema>;
export type QuoteFormData = z.infer<typeof quoteSchema>;
export type JobFormData = z.infer<typeof jobSchema>;
