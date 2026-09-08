import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "endo — carnet quotidien",
    short_name: "endo",
    description:
      "Carnet quotidien privé pour suivre l'endométriose : crises, douleur, sommeil, médicaments et repas.",
    start_url: "/aujourdhui",
    id: "/aujourdhui",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1016",
    theme_color: "#1a1016",
    lang: "fr",
    categories: ["health", "lifestyle", "medical"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
