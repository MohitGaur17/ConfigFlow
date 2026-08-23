import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ConfigFlow: Config driven AI App Generator",
    short_name: "ConfigFlow",
    description: "Generate full-stack web applications from JSON configuration instantly.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0a0a",
    theme_color: "#ff6b00",
    categories: ["productivity", "utilities"],
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
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // screenshots removed
    shortcuts: [
      {
        name: "Create App",
        short_name: "Create",
        description: "Create a new application from config",
        url: "/?action=create",
        icons: [{ src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
      },
      {
        name: "Dashboard",
        short_name: "Apps",
        description: "View your applications",
        url: "/dashboard",
        icons: [{ src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
      },
    ],
    share_target: {
      action: "/",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
