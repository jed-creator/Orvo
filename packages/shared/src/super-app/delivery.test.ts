import { describe, it, expect } from 'vitest';
import {
  DeliveryMerchantSchema,
  DeliveryItemSchema,
  DeliveryOrderItemSchema,
  DeliveryOrderSchema,
  DeliveryMerchantCategorySchema,
  DeliveryOrderStatusSchema,
} from './delivery';

describe('delivery schemas', () => {
  it('parses a delivery merchant', () => {
    const m = DeliveryMerchantSchema.parse({
      id: 'm_1',
      provider: 'uber-eats',
      externalId: 'rest_abc',
      name: 'Pai Northern Thai',
      category: 'restaurant',
      location: { lat: 43.65, lng: -79.38 },
      rating: 4.8,
      avgPrepTimeMinutes: 25,
    });
    expect(m.category).toBe('restaurant');
    expect(m.rating).toBe(4.8);
  });

  it('accepts all merchant categories', () => {
    for (const c of ['restaurant', 'grocery', 'convenience', 'retail'] as const) {
      expect(DeliveryMerchantCategorySchema.parse(c)).toBe(c);
    }
  });

  it('rejects a merchant with an out-of-range rating', () => {
    expect(() =>
      DeliveryMerchantSchema.parse({
        id: 'm_1',
        provider: 'uber-eats',
        externalId: 'rest_abc',
        name: 'Pai Northern Thai',
        category: 'restaurant',
        location: { lat: 43.65, lng: -79.38 },
        rating: 6,
      })
    ).toThrow();
  });

  it('parses a delivery item', () => {
    const item = DeliveryItemSchema.parse({
      id: 'i_1',
      merchantId: 'm_1',
      name: 'Pad See Ew',
      description: 'Wide rice noodles with broccoli',
      price: { amount: 1599, currency: 'USD' },
      media: [],
    });
    expect(item.price.amount).toBe(1599);
  });

  it('parses a delivery order item', () => {
    const oi = DeliveryOrderItemSchema.parse({
      id: 'oi_1',
      orderId: 'ord_1',
      itemId: 'i_1',
      quantity: 2,
      unitPrice: { amount: 1599, currency: 'USD' },
      notes: 'no peanuts',
    });
    expect(oi.quantity).toBe(2);
  });

  it('rejects a delivery order item with zero quantity', () => {
    expect(() =>
      DeliveryOrderItemSchema.parse({
        id: 'oi_1',
        orderId: 'ord_1',
        itemId: 'i_1',
        quantity: 0,
        unitPrice: { amount: 1599, currency: 'USD' },
      })
    ).toThrow();
  });

  it('accepts all order statuses', () => {
    for (const s of [
      'pending',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ] as const) {
      expect(DeliveryOrderStatusSchema.parse(s)).toBe(s);
    }
  });

  it('parses a complete delivery order', () => {
    const order = DeliveryOrderSchema.parse({
      id: 'ord_1',
      userId: 'u_1',
      merchantId: 'm_1',
      provider: 'uber-eats',
      status: 'pending',
      items: [
        {
          id: 'oi_1',
          orderId: 'ord_1',
          itemId: 'i_1',
          quantity: 2,
          unitPrice: { amount: 1599, currency: 'USD' },
        },
      ],
      subtotal: { amount: 3198, currency: 'USD' },
      fees: { amount: 499, currency: 'USD' },
      total: { amount: 3697, currency: 'USD' },
      deliveryAddress: { lat: 43.65, lng: -79.38 },
      placedAt: '2026-04-14T12:00:00Z',
    });
    expect(order.items).toHaveLength(1);
    expect(order.status).toBe('pending');
  });

  it('rejects a delivery order with a bad placedAt', () => {
    expect(() =>
      DeliveryOrderSchema.parse({
        id: 'ord_1',
        userId: 'u_1',
        merchantId: 'm_1',
        provider: 'uber-eats',
        status: 'pending',
        items: [],
        subtotal: { amount: 0, currency: 'USD' },
        fees: { amount: 0, currency: 'USD' },
        total: { amount: 0, currency: 'USD' },
        deliveryAddress: { lat: 43.65, lng: -79.38 },
        placedAt: 'yesterday',
      })
    ).toThrow();
  });
});
