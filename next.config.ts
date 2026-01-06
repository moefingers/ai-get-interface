/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is now the default in Next.js 16
  // No explicit configuration needed
  
  // Strict mode for React 19
  reactStrictMode: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
}

export default nextConfig
