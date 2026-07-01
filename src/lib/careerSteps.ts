// Pure helpers for CareerProgram step gating.
// Extracted so we can unit-test the skip logic for signed-out,
// signed-in-not-subscribed, and subscribed users.

export interface StepDef {
  num: number;
  title: string;
}

export const CAREER_STEPS: StepDef[] = [
  { num: 1, title: "Registration" },
  { num: 2, title: "Subscribe" },
  { num: 3, title: "Get Referral Code" },
  { num: 4, title: "Promote" },
  { num: 5, title: "Performance" },
  { num: 6, title: "Get Hired" },
];

export interface StepContext {
  isSignedIn: boolean;
  isSubscribed: boolean;
  hasEmpCode: boolean;
  /** Persisted step from the server (career_progress.current_step). */
  persistedStep?: number | null;
}

export function getVisibleSteps(ctx: StepContext, steps: StepDef[] = CAREER_STEPS) {
  return steps.filter(s => {
    if (s.num === 1 && ctx.isSignedIn) return false;
    if (s.num === 2 && ctx.isSubscribed) return false;
    return true;
  });
}

export function getSkippedSteps(ctx: StepContext, steps: StepDef[] = CAREER_STEPS) {
  return steps.filter(s => !getVisibleSteps(ctx, steps).includes(s));
}

/**
 * Resolve the active step. Server-persisted `current_step` wins whenever it is
 * ahead of what the auth/subscription state alone would compute — so a refresh
 * never demotes a user back through skipped steps.
 */
export function getCurrentStep(ctx: StepContext): number {
  const derived = !ctx.isSignedIn ? 1
    : !ctx.isSubscribed ? 2
    : !ctx.hasEmpCode ? 3
    : 3;
  const persisted = ctx.persistedStep ?? 0;
  return Math.max(derived, persisted);
}

export function getProgressPercent(ctx: StepContext, steps: StepDef[] = CAREER_STEPS): number {
  const visible = getVisibleSteps(ctx, steps);
  if (visible.length === 0) return 100;
  const current = getCurrentStep(ctx);
  const done = visible.filter(s => s.num < current).length;
  return Math.round((done / visible.length) * 100);
}

export function getSkipReason(ctx: StepContext): string | null {
  if (ctx.isSubscribed) {
    return "You're already signed in and subscribed — Registration and Subscription steps are complete.";
  }
  if (ctx.isSignedIn) {
    return "You're already signed in — the Registration step has been skipped.";
  }
  return null;
}
