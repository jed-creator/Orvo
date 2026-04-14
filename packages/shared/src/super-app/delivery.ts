/**
 * Orvo super-app — food delivery & grocery.
 *
 * Models merchant listings (restaurants, grocers, convenience stores),
 * their menu items, and orders placed through Orvo that are fulfilled by
 * third-party providers (Uber Eats, DoorDash, Instacart, etc.).
 */
import { z } from 'zod';
import { MoneySchema, MediaAssetSchema, GeoPointSchema } from './common';

export const DeliveryMerchantCategorySchema = z.enum([
  'restaurant',
  'grocery',
  'convenience',
  'retail',
]);
export type DeliveryMerchantCategory = z.infer<typeof DeliveryMerchantCategorySchema>;

export const DeliveryMerchantSchema = z.object({
  id: z.string(),
  provider: z.string(),
  externalId: z.string(),
  name: z.string().min(1),
  category: DeliveryMerchantCategorySchema,
  location: GeoPointSchema,
  rating: z.number().min(0).max(5).optional(),
  avgPrepTimeMinutes: z.number().int().nonnegative().optional(),
});
export type DeliveryMerchant = z.infer<typeof DeliveryMerchantSchema>;

export const DeliveryItemSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  price: MoneySchema,
  media: z.array(MediaAssetSchema),
  category: z.string().optional(),
});
export type DeliveryItem = z.infer<typeof DeliveryItemSchema>;

export const DeliveryOrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  itemId: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: MoneySchema,
  notes: z.string().optional(),
});
export type DeliveryOrderItem = z.infer<typeof DeliveryOrderItemSchema>;

export const DeliveryOrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);
export type DeliveryOrderStatus = z.infer<typeof DeliveryOrderStatusSchema>;

export const DeliveryOrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  merchantId: z.string(),
  provider: z.string(),
  status: DeliveryOrderStatusSchema,
  items: z.array(DeliveryOrderItemSchema),
  subtotal: MoneySchema,
  fees: MoneySchema,
  total: MoneySchema,
  deliveryAddress: GeoPointSchema,
  placedAt: z.iso.datetime(),
});
export type DeliveryOrder = z.infer<typeof DeliveryOrderSchema>;
