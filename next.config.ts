import type { NextConfig } from "next";
import withPWA from "next-pwa";

const runtimeCaching = [
  {
    urlPattern: /^\/qr-generator$/,
    handler: "NetworkFirst",
    options: {
      cacheName: "app-shell",
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 86400,
      },
    },
  },
  {
    urlPattern: /^\/_next\/static\//,
    handler: "CacheFirst",
    options: {
      cacheName: "static-assets",
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 31536000,
      },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-stylesheets",
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 31536000,
      },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-webfonts",
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 31536000,
      },
    },
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

const pwaOptions = {
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching,
};

export default withPWA(pwaOptions)(nextConfig);
