import { describe, it, expect } from "vitest";
import {
  CAREER_STEPS,
  getVisibleSteps,
  getSkippedSteps,
  getCurrentStep,
  getProgressPercent,
  getSkipReason,
} from "@/lib/careerSteps";

describe("CareerProgram step gating", () => {
  describe("signed-out user", () => {
    const ctx = { isSignedIn: false, isSubscribed: false, hasEmpCode: false };

    it("shows all 6 steps", () => {
      expect(getVisibleSteps(ctx).map(s => s.num)).toEqual([1, 2, 3, 4, 5, 6]);
    });
    it("skips nothing", () => {
      expect(getSkippedSteps(ctx)).toEqual([]);
    });
    it("current step is 1", () => {
      expect(getCurrentStep(ctx)).toBe(1);
    });
    it("no skip banner", () => {
      expect(getSkipReason(ctx)).toBeNull();
    });
  });

  describe("signed-in, not subscribed", () => {
    const ctx = { isSignedIn: true, isSubscribed: false, hasEmpCode: false };

    it("hides step 1", () => {
      expect(getVisibleSteps(ctx).map(s => s.num)).toEqual([2, 3, 4, 5, 6]);
    });
    it("reports step 1 as skipped", () => {
      expect(getSkippedSteps(ctx).map(s => s.num)).toEqual([1]);
    });
    it("current step is 2", () => {
      expect(getCurrentStep(ctx)).toBe(2);
    });
    it("shows sign-in skip banner", () => {
      expect(getSkipReason(ctx)).toMatch(/already signed in/i);
    });
  });

  describe("signed-in and subscribed", () => {
    const ctx = { isSignedIn: true, isSubscribed: true, hasEmpCode: false };

    it("hides steps 1 and 2", () => {
      expect(getVisibleSteps(ctx).map(s => s.num)).toEqual([3, 4, 5, 6]);
    });
    it("reports steps 1 and 2 as skipped", () => {
      expect(getSkippedSteps(ctx).map(s => s.num)).toEqual([1, 2]);
    });
    it("current step is 3 when no EMP code yet", () => {
      expect(getCurrentStep(ctx)).toBe(3);
    });
    it("shows subscribed skip banner", () => {
      expect(getSkipReason(ctx)).toMatch(/subscribed/i);
    });
  });

  describe("persistence across refresh", () => {
    it("does not demote below a persisted advanced step", () => {
      const ctx = {
        isSignedIn: true,
        isSubscribed: true,
        hasEmpCode: true,
        persistedStep: 5,
      };
      expect(getCurrentStep(ctx)).toBe(5);
    });

    it("uses derived step when persisted is behind", () => {
      const ctx = {
        isSignedIn: true,
        isSubscribed: true,
        hasEmpCode: false,
        persistedStep: 2,
      };
      expect(getCurrentStep(ctx)).toBe(3);
    });

    it("progress percent excludes skipped steps", () => {
      const ctx = {
        isSignedIn: true,
        isSubscribed: true,
        hasEmpCode: true,
        persistedStep: 4,
      };
      // Visible: [3,4,5,6]; current=4; done=[3] => 1/4 = 25%
      expect(getProgressPercent(ctx)).toBe(25);
    });
  });

  it("step definitions are stable", () => {
    expect(CAREER_STEPS).toHaveLength(6);
  });
});
