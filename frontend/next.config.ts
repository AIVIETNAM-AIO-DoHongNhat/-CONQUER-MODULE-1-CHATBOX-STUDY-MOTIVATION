import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Ghim workspace root về chính thư mục frontend. Do có lockfile ở D:/PROJECT,
  // Turbopack tự suy ra root là D:/PROJECT và theo dõi cả cây thư mục đó → tăng
  // chi phí watch/bộ nhớ và gây worker crash ("Jest worker … child process
  // exceptions") ở dev. Đường dẫn tuyệt đối tới thư mục chứa file config này.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
