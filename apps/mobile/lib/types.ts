/**
 * Mobile-side database types — mirror of apps/web/lib/supabase/types.ts.
 * We re-declare here so mobile doesn't need to import across workspace
 * boundaries (Metro has some monorepo bundling quirks).
 */

export type UserRole = 'consumer' | 'provider' | 'provider_staff' | 'admin';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_emoji: string | null;
  display_order: number;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  operating_hours: Record<string, { open: string; close: string } | null> | null;
  avg_rating: number;
  total_reviews: number;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  price_type: 'fixed' | 'starting_at' | 'hourly' | 'free';
  duration_minutes: number;
  buffer_minutes: number;
  deposit_required: boolean;
  deposit_amount_cents: number | null;
  intake_form_id: string | null;
  is_active: boolean;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  consumer: { first_name: string | null; last_name: string | null } | null;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  is_required: boolean;
}

export interface FormField {
  id: string;
  form_id: string;
  label: string;
  field_type: string;
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  options: string[] | null;
  display_order: number;
}

export function formatPrice(
  cents: number,
  type: Service['price_type'],
): string {
  const dollars = (cents / 100).toFixed(2);
  switch (type) {
    case 'hourly':
      return `$${dollars}/hr`;
    case 'starting_at':
      return `From $${dollars}`;
    case 'free':
      return 'Free';
    default:
      return `$${dollars}`;
  }
}
