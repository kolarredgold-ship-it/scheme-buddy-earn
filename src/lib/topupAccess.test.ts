import { describe, it, expect } from 'vitest';
import { canPurchaseTopup, PRO_UPGRADE_PRICE } from './topupAccess';

describe('Pro before top-ups', () => {
  it('requires the ₹999 Pro upgrade', () => expect(PRO_UPGRADE_PRICE).toBe(999));
  it('refuses free members', () => expect(canPurchaseTopup({ subscription_status: 'free' })).toBe(false));
  it('refuses guests and unloaded profiles', () => expect(canPurchaseTopup(null)).toBe(false));
  it('allows active Pro members', () => expect(canPurchaseTopup({ subscription_status: 'active', subscription_expires_at: '2027-01-01' }, Date.parse('2026-11-20'))).toBe(true));
  it('requires renewal after expiry', () => expect(canPurchaseTopup({ subscription_status: 'active', subscription_expires_at: '2026-11-19' }, Date.parse('2026-11-20'))).toBe(false));
});