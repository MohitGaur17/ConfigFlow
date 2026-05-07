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
    theme_color: "#6366f1",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-1.svg",
        sizes: "540x720",
        type: "image/svg+xml",
        form_factor: "narrow",
      },
      {
        src: "/screenshot-2.svg",
        sizes: "1920x1080",
        type: "image/svg+xml",
        form_factor: "wide",
      },
    ],
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
      action: "/share",
      method: "POST",
      enctype: "application/x-www-form-urlencoded",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
