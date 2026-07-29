// Client-side <input accept="..."> is only a UI hint — a request can set
// any content-type it wants, so uploads that end up publicly served (avatars,
// merch photos) need this checked again server-side. SVG is deliberately
// excluded from the image allowlist: it can embed <script>, and Supabase
// Storage doesn't rewrite content-type on upload.
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ...IMAGE_TYPES,
]);

export function isAllowedImage(file: File): boolean {
  return IMAGE_TYPES.has(file.type);
}

export function isAllowedDocument(file: File): boolean {
  return DOCUMENT_TYPES.has(file.type);
}
