/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // sharp ships a native binary loaded at runtime, not through a plain
  // require() Next.js's bundler can trace statically. Left off this list,
  // the binary gets dropped from the serverless function bundle and sharp
  // throws the moment it's actually called — which only happens once a
  // document has a real logo to normalize, so it looked like an
  // Authority-Matrix-specific bug rather than a packaging one.
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/api/tools/generate-pdf": ["./src/lib/pdf/fonts/**"],
    "/api/tools/generate-pdf-preview": ["./src/lib/pdf/fonts/**"],
  },
};

module.exports = nextConfig;
