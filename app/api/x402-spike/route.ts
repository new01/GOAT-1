/**
 * x402 Spike API Route — Phase 1 Mock
 *
 * This is a Phase 1 spike to validate the Next.js API route handler shape
 * for x402 integration. It mocks the full x402 request/response cycle
 * (402 challenge → payment proof → settlement) without any real SDK,
 * credentials, or on-chain transactions.
 *
 * In Phase 4, this becomes a real x402-protected endpoint using
 * @x402/next middleware with GOAT Testnet3 (eip155:48816) support.
 *
 * See: .planning/phases/01-foundation-wizard-shell/01-RESEARCH.md
 * Pattern 6 for the planned real implementation.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  // Simulate a successful x402 flow
  const mockResponse = {
    status: "success",
    message: "x402 spike: API route handler shape works",
    mock402Challenge: {
      status: 402,
      headers: {
        "X-Payment-Required": "true",
        "X-Payment-Amount": "0.1",
        "X-Payment-Currency": "USDC",
        "X-Payment-Network": "eip155:48816",
      },
    },
    mockSettlement: {
      txHash: "0x" + "a".repeat(64),
      network: "GOAT Testnet3",
      amount: "0.1 USDC",
    },
    spikeResult: "PASS",
  };

  return NextResponse.json(mockResponse);
}

export async function POST(request: NextRequest) {
  // Simulate receiving a payment proof and settling
  const body = await request.json();

  return NextResponse.json({
    status: "settled",
    paymentProof: body.paymentProof ?? "mock-proof",
    result: "x402 spike: POST handler shape confirmed",
  });
}
