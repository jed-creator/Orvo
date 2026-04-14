/**
 * Square Appointments adapter (stub).
 *
 * Minimum-viable implementation — declares `search` + `details`
 * capabilities, returns an empty search result set, and throws on
 * `getDetails`. This exists so the registry can list Square Appointments
 * as a known provider while the real connector is being negotiated.
 * Replace the method bodies (and expand capabilities) when a real
 * client lands.
 */
import type { IntegrationAdapter } from '../../../core';

export const squareAppointmentsAdapter: IntegrationAdapter = {
  key: 'square_appointments',
  category: 'general-booking',
  displayName: 'Square Appointments',
  capabilities: ['search', 'details'],

  async search() {
    return [];
  },

  async getDetails() {
    throw new Error('Square Appointments adapter: not implemented');
  },
};
