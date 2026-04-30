/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Security headers for production
  async headers() {
    // Get environment variables for dynamic CSP configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Build connect-src with all allowed origins
    const connectSrc = isDevelopment
      ? `connect-src 'self' http://localhost:8000 ${supabaseUrl} ${apiUrl}`
      : `connect-src 'self' ${supabaseUrl} ${apiUrl}`;

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enforce HTTPS in production
          {
            key: 'Strict-Transport-Security',
            value: isDevelopment
              ? 'max-age=0'
              : 'max-age=63072000; includeSubDomains; preload',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Control browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              isDevelopment
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com",
              connectSrc,
              "media-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
