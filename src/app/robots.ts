import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/api/", "/onboarding", "/invite/", "/reset-password", "/forgot-password", "/unsubscribe/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
