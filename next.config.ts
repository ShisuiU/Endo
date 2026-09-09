import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // « Aujourd'hui » est devenu « Accueil ». L'app déjà posée sur un écran
  // d'accueil démarre encore sur l'ancienne adresse (son `start_url` est figé
  // dans le manifeste installé) : sans cette redirection, elle ouvrirait sur
  // une page introuvable. Temporaire (307) et non permanente, pour ne pas
  // graver la redirection dans le cache de Safari.
  async redirects() {
    return [{ source: "/aujourdhui", destination: "/accueil", permanent: false }];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Le service worker ne doit jamais être servi depuis un cache HTTP
        // intermédiaire : c'est lui qui décide de ce qui est frais ou non.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
