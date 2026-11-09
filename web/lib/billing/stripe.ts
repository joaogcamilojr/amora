import Stripe from "stripe";

import { ValidationError } from "@/lib/validation";

let client: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Cliente do Stripe. A chave vem de `STRIPE_SECRET_KEY` e nunca é logada nem devolvida em erros. */
export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key)
    throw new ValidationError("NOT_CONFIGURED", "errors.billing.notConfigured");
  client ??= new Stripe(key);
  return client;
}
