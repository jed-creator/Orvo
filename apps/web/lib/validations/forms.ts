/**
 * Zod schemas for intake form builder.
 * Supported field types for MVP: text, textarea, email, phone, number,
 * select, checkbox, date. Skip file+signature until Phase 5+ hardening.
 */
import { z } from 'zod';

export const SUPPORTED_FIELD_TYPES = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'select',
  'checkbox',
  'date',
] as const;

export const formTemplateSchema = z.object({
  name: z.string().min(1, { error: 'Form name is required.' }).max(255),
  description: z.string().max(2000).optional().or(z.literal('')),
  is_required: z.coerce.boolean().default(false),
});

export const formFieldSchema = z.object({
  label: z.string().min(1, { error: 'Field label is required.' }).max(255),
  field_type: z.enum(SUPPORTED_FIELD_TYPES),
  placeholder: z.string().max(255).optional().or(z.literal('')),
  help_text: z.string().max(500).optional().or(z.literal('')),
  is_required: z.coerce.boolean().default(false),
  // For select: comma-separated options in the form, stored as JSONB array
  options: z.string().max(1000).optional().or(z.literal('')),
});

export type FormTemplateInput = z.infer<typeof formTemplateSchema>;
export type FormFieldInput = z.infer<typeof formFieldSchema>;
