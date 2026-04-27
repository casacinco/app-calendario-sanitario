/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages com @cloudflare/next-on-pages usa runtime edge por default.
  // Páginas individuais que precisarem do edge runtime declaram via:
  //   export const runtime = "edge";
  reactStrictMode: true,
};

export default nextConfig;
