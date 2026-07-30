// Referral program constants. Referrer earns a flat account credit (one
// month of Pro) when a friend they invite converts to a paying plan; the
// referred friend gets a percentage off their first billing cycle. Kept
// here so the reward amounts have one source of truth across the signup
// action, the Stripe checkout/webhook code, and the settings UI copy.
export const REFERRAL_QUERY_PARAM = "ref";
export const REFERRAL_REWARD_CENTS = 2400; // one month of Pro
export const REFERRAL_REWARD_LABEL = "a free month of Pro ($24 value)";
export const REFEREE_COUPON_ID = "REFERRAL10";
export const REFEREE_DISCOUNT_PERCENT = 10;

export function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function referralLink(workspaceId: string) {
  return `${baseUrl()}/signup?${REFERRAL_QUERY_PARAM}=${workspaceId}`;
}
