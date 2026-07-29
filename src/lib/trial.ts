// Single source of truth for the free-trial length, referenced by both
// server actions (Stripe checkout, mock checkout, onboarding) and the
// onboarding UI copy — change it here and it's consistent everywhere.
export const TRIAL_DAYS = 7;
export const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;
