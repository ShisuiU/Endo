import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "endo — carnet quotidien",
    template: "%s · endo",
  },
  description:
    "Un carnet quotidien privé pour suivre l'endométriose : crises, douleur, sommeil, médicaments et repas.",
  applicationName: "endo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "endo",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

// Splash screens iOS — Safari ne les déduit pas du manifest, il faut des
// <link rel="apple-touch-startup-image"> ciblés par media query d'écran.
const SPLASH_SCREENS: Array<{ href: string; media: string }> = [
  {
    href: "/splash/iphone-se.png",
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
  },
  {
    href: "/splash/iphone-se-plus.png",
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    href: "/splash/iphone-12-13-14.png",
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3), (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    href: "/splash/iphone-15-16.png",
    media:
      "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3), (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    href: "/splash/iphone-pro-max.png",
    media:
      "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3), (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
  },
];

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#211a1d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${instrument.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {SPLASH_SCREENS.map((screen) => (
          <link key={screen.href} rel="apple-touch-startup-image" href={screen.href} media={screen.media} />
        ))}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
