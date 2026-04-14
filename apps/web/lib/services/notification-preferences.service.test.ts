/**
 * Tests for the pure shape + vocabulary of the notification
 * preferences service. DB-touching functions (`getPreferences`,
 * `setPreference`, `isOptedIn`) are exercised in integration tests
 * — this file pins the default matrix + vocabulary guardrails.
 */
import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
} from './notification-preferences.service';

describe('NOTIFICATION_CATEGORIES', () => {
  it('includes one entry for each super-app module key', () => {
    expect(NOTIFICATION_CATEGORIES).toContain('eat');
    expect(NOTIFICATION_CATEGORIES).toContain('ride');
    expect(NOTIFICATION_CATEGORIES).toContain('book');
    expect(NOTIFICATION_CATEGORIES).toContain('trips');
    expect(NOTIFICATION_CATEGORIES).toContain('tickets');
    expect(NOTIFICATION_CATEGORIES).toContain('shop');
    expect(NOTIFICATION_CATEGORIES).toContain('market');
    expect(NOTIFICATION_CATEGORIES).toContain('compare');
  });

  it('includes the two meta categories', () => {
    expect(NOTIFICATION_CATEGORIES).toContain('promos');
    expect(NOTIFICATION_CATEGORIES).toContain('system');
  });

  it('has exactly 10 categories — guardrail against accidental additions', () => {
    expect(NOTIFICATION_CATEGORIES).toHaveLength(10);
  });
});

describe('NOTIFICATION_CHANNELS', () => {
  it('exposes push, email, sms in order', () => {
    expect(NOTIFICATION_CHANNELS).toEqual(['push', 'email', 'sms']);
  });
});
