import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://headliner-teal.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/api/", "/onboarding", "/invite/", "/reset-password", "/forgot-password", "/unsubscribe/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
