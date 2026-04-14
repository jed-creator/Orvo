/**
 * Unit tests for the accessibility-settings shape + defaults.
 * `getSettings`/`upsertSettings` are exercised in integration tests;
 * this file only pins the default matrix + the static export.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from './accessibility.service';

describe('DEFAULT_ACCESSIBILITY_SETTINGS', () => {
  it('defaults theme to system', () => {
    expect(DEFAULT_ACCESSIBILITY_SETTINGS.theme).toBe('system');
  });

  it('defaults font_scale to 1.0', () => {
    expect(DEFAULT_ACCESSIBILITY_SETTINGS.font_scale).toBe(1.0);
  });

  it('defaults reduced_motion + high_contrast to false', () => {
    expect(DEFAULT_ACCESSIBILITY_SETTINGS.reduced_motion).toBe(false);
    expect(DEFAULT_ACCESSIBILITY_SETTINGS.high_contrast).toBe(false);
  });
});
