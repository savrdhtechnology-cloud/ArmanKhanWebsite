import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(dir, '..'),
  env: {
    REACT_APP_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || '',
  },
  transpilePackages: [],
  webpack(config){
    config.resolve.alias={...config.resolve.alias,'@':path.resolve(dir,'../frontend/src')};
    config.resolve.modules=[path.join(dir,'node_modules'),...(config.resolve.modules||['node_modules'])];
    return config;
  },
};
