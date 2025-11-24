import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  typescript: {
    // 忽略构建时的类型错误（用于处理第三方库的类型兼容性问题）
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // 解决 pino-pretty 模块缺失问题
    // pino-pretty 是可选依赖，主要用于开发环境的日志美化
    // 使用 IgnorePlugin 忽略对 pino-pretty 的导入
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pino-pretty$/,
      })
    );
    
    // 同时使用 alias 作为备用方案
    config.resolve.alias = {
      ...config.resolve.alias,
      "pino-pretty": false,
    };
    
    return config;
  },
};

export default nextConfig;
