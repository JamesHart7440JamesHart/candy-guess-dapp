import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const asyncStorageStub = join(__dirname, "src/lib/stubs/asyncStorage.ts");
const pinoPrettyStub = join(__dirname, "src/lib/stubs/pinoPretty.ts");

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin"
        },
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "require-corp"
        }
      ]
    }
  ],
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@react-native-async-storage/async-storage": asyncStorageStub,
      "pino-pretty": pinoPrettyStub
    };

    // Add Node.js polyfills for browser builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  }
};

export default nextConfig;
