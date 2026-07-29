// A client sends the parsed CSV rows straight to the server action, so this
// cap has to be enforced here — a client-side row limit alone can be
// bypassed by anyone calling the action directly. Bounds the size of a
// single createMany() call against real production traffic.
export const MAX_IMPORT_ROWS = 5000;
