// Free-plan caps advertised on the pricing page — enforced here so they're
// not just marketing copy. Paid plans are uncapped.
export const BOOKING_LIMITS: Record<string, number> = { free: 5, pro: Infinity, touring: Infinity, team: Infinity };
export const CONTACT_LIMITS: Record<string, number> = { free: 50, pro: Infinity, touring: Infinity, team: Infinity };
