/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,
  // swcMinify: true,

    env:{
      ENDPOINT: process.env.ENDPOINT
    },

  images: {
    domains: ["random.imagecdn.app"],
  },
};

module.exports = nextConfig;
