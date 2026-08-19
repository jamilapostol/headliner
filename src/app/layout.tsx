import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site-url";
import { Space_Grotesk, Inter } from "next/font/google";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "HEADLINE.WORLD — Book it. Run it. Own it.",
    template: "%s",
  },
  description:
    "HEADLINE.WORLD is the all-in-one business platform for independent touring musicians — booking pipeline, tour routing, day sheets, merch inventory, fan CRM, contracts and money, in one place. Book it. Run it. Own it.",
  keywords: [
    "music business management software",
    "tour management app",
    "booking management for musicians",
    "band management software",
    "independent artist tools",
    "tour routing and day sheets",
    "merch inventory tracking",
    "fan CRM for artists",
    "music contract tracking",
    "touring musician finances",
  ],
  applicationName: "HEADLINE.WORLD",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "HEADLINE.WORLD",
    title: "HEADLINE.WORLD — Book it. Run it. Own it.",
    description:
      "The business platform for independent touring musicians — bookings, tours, merch, fans and money in one place.",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "HEADLINE.WORLD — Book it. Run it. Own it." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HEADLINE.WORLD — Book it. Run it. Own it.",
    description:
      "The business platform for independent touring musicians — bookings, tours, merch, fans and money in one place.",
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HEADLINE.WORLD",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d110e",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full bg-canvas text-text antialiased">
        {children}
        <CookieConsentBanner />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "HEADLINE.WORLD",
                  url: "https://www.headline.world",
                  logo: "https://www.headline.world/icon-512.png",
                  slogan: "Book it. Run it. Own it.",
                  email: "support@headline.world",
                  founder: { "@type": "Person", name: "Jamil Apostol" },
                },
                {
                  "@type": "SoftwareApplication",
                  name: "HEADLINE.WORLD",
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  description:
                    "All-in-one business platform for independent touring musicians — booking pipeline, tour routing, day sheets, merch inventory, fan CRM, contracts and finances.",
                  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free plan available" },
                  url: "https://www.headline.world",
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
