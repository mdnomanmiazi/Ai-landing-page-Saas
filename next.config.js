/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // <--- THIS LINE IS CRITICAL FOR DOCKER
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
