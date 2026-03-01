"use client";

import { useQuery, useMutation } from "convex/react";
import { useConvexAvailable } from "@/app/providers";

/**
 * Safe wrapper around Convex useQuery that returns undefined when
 * ConvexProvider is not available (e.g., during build, SSR, or when
 * NEXT_PUBLIC_CONVEX_URL is not configured).
 *
 * This avoids the "Could not find Convex client" error that occurs
 * when useQuery is called outside of a ConvexProvider.
 */
export function useSafeQuery(
  functionReference: any,
  args: any
): any {
  const convexAvailable = useConvexAvailable();

  // Always call the hook (React rules), but skip when Convex isn't available
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const result = convexAvailable ? useQuery(functionReference, args) : undefined;
  return result;
}

/**
 * Safe wrapper around Convex useMutation that returns a noop function
 * when ConvexProvider is not available.
 */
export function useSafeMutation(
  functionReference: any
): ((args: any) => void) | null {
  const convexAvailable = useConvexAvailable();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mutation = convexAvailable ? useMutation(functionReference) : null;
  return mutation;
}
