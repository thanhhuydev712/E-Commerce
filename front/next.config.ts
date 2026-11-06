import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

// Windows không cho tài khoản dev xóa cache do sandbox sở hữu (và ngược lại).
// Hash danh tính OS để mỗi tài khoản có output ổn định, không phụ thuộc biến env.
const windowsCacheOwner =
  process.platform === "win32"
    ? createHash("sha256")
        .update(
          execFileSync("whoami.exe", [], {
            encoding: "utf8",
            windowsHide: true,
          })
            .trim()
            .toLowerCase(),
        )
        .digest("hex")
        .slice(0, 12)
    : null;

const nextConfig: NextConfig = {
  // Linux build/start giữ cùng đường dẫn, kể cả khi đổi UID trong container.
  distDir:
    process.env.NEXT_DIST_DIR ??
    (windowsCacheOwner ? `.next-local-${windowsCacheOwner}` : ".next-local"),
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001"}/api/v1/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
