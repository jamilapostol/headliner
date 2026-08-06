import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://headline.world";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/login", "/signup", "/terms", "/privacy"];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
