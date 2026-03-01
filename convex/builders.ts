import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Look up a builder by wallet address.
 * Returns the builder document or null if not found.
 */
export const getByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const wallet = args.walletAddress.toLowerCase();
    return await ctx.db
      .query("builders")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet))
      .unique();
  },
});

/**
 * Upsert a builder record.
 * If the builder exists (by wallet), patches currentStep and completedSteps.
 * If not, inserts a new record.
 */
export const upsertBuilder = mutation({
  args: {
    walletAddress: v.string(),
    currentStep: v.number(),
    completedSteps: v.array(v.number()),
    startedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const wallet = args.walletAddress.toLowerCase();
    const existing = await ctx.db
      .query("builders")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet))
      .unique();

    const patch: Record<string, unknown> = {
      currentStep: args.currentStep,
      completedSteps: args.completedSteps,
    };
    if (args.startedAt !== undefined) {
      patch.startedAt = args.startedAt;
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("builders", {
      walletAddress: wallet,
      completedSteps: args.completedSteps,
      currentStep: args.currentStep,
      startedAt: args.startedAt,
    });
  },
});

/**
 * Mark a step as complete for a builder.
 * If the builder exists, adds the step to completedSteps (if not already present)
 * and advances currentStep. If not, creates a new builder record.
 */
export const completeStep = mutation({
  args: {
    walletAddress: v.string(),
    stepNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const wallet = args.walletAddress.toLowerCase();
    const builder = await ctx.db
      .query("builders")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet))
      .unique();

    if (builder) {
      const completedSteps = builder.completedSteps.includes(args.stepNumber)
        ? builder.completedSteps
        : [...builder.completedSteps, args.stepNumber];
      const nextStep = Math.min(Math.max(...completedSteps) + 1, 4);
      await ctx.db.patch(builder._id, {
        completedSteps,
        currentStep: nextStep,
      });
    } else {
      await ctx.db.insert("builders", {
        walletAddress: wallet,
        completedSteps: [args.stepNumber],
        currentStep: Math.min(args.stepNumber + 1, 4),
      });
    }
  },
});
