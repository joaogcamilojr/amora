import type { NextRequest } from "next/server";

import { stripeClient } from "@/lib/billing/stripe";
import { handleStripeEvent } from "@/lib/finance/billing";
import { jsonData, jsonError } from "@/lib/http";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * Webhook do Stripe. Sem sessão: a autenticação é a assinatura (`STRIPE_WEBHOOK_SECRET`) sobre o corpo bruto.
 * Eventos: `checkout.session.completed` e `customer.subscription.created|updated|deleted`.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature)
    return jsonError(400, "INVALID_SIGNATURE", "Invalid signature");
  const payload = await request.text();
  let event;
  try {
    event = stripeClient().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    logError("stripe-webhook-signature", error);
    return jsonError(400, "INVALID_SIGNATURE", "Invalid signature");
  }
  try {
    return jsonData(await handleStripeEvent(event));
  } catch (error) {
    logError("stripe-webhook", error);
    return jsonError(500, "WEBHOOK_FAILED", "Webhook failed");
  }
}
