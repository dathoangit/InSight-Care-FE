function collectAllowedDevOrigins() {
  const origins = new Set(['localhost', '127.0.0.1']);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
    try {
      const hostname = new URL(apiUrl).hostname;

      if (hostname) {
        origins.add(hostname);
      }
    } catch {
      // Ignore invalid API URL during config load.
    }
  }

  const extraOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(',') ?? [];

  for (const origin of extraOrigins) {
    const trimmed = origin.trim();

    if (trimmed) {
      origins.add(trimmed);
    }
  }

  return [...origins];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: collectAllowedDevOrigins(),
};

module.exports = nextConfig;
