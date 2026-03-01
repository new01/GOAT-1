// Convex schema for Hello GOAT onboarding wizard.
// Run `npx convex dev` to push this schema and generate types in convex/_generated/.
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  builders: defineTable({
    walletAddress: v.string(),
    completedSteps: v.array(v.number()),
    currentStep: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_wallet", ["walletAddress"]),
});
