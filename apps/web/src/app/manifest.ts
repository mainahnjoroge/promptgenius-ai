import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PromptGenius AI",
    short_name: "PromptGenius",
    description:
      "Generate high-performance, structured prompts for any industry. Bundle, price, and ship them as a product.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#534AB7",
    categories: ["productivity", "business", "utilities"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        // @ts-expect-error — form_factor is valid PWA manifest but not yet in Next.js types
        form_factor: "wide",
        label: "PromptGenius AI Dashboard",
      },
    ],
  };
}
