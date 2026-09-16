/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/tools/generate-pdf": ["./src/lib/pdf/fonts/**"],
    "/api/tools/generate-pdf-preview": ["./src/lib/pdf/fonts/**"],
  },
};

module.exports = nextConfig;
