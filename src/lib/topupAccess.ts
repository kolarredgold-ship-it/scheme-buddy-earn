export type SubscriptionAccess = {
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
};

export function canPurchaseTopup(profile: SubscriptionAccess | null | undefined, now = Date.now()): boolean {
  if (profile?.subscription_status !== 'active') return false;
  if (!profile.subscription_expires_at) return true;
  return new Date(profile.subscription_expires_at).getTime() > now;
}

export const PRO_UPGRADE_PRICE = 999;