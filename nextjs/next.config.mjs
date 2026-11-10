import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
const dir=path.dirname(fileURLToPath(import.meta.url));
/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  transpilePackages: [],
  webpack(config){
    config.resolve.alias={...config.resolve.alias,'@':path.resolve(dir,'../frontend/src')};
    config.resolve.modules=[path.join(dir,'node_modules'),...(config.resolve.modules||['node_modules'])];
    config.plugins.push(new webpack.DefinePlugin({'process.env.REACT_APP_BACKEND_URL': JSON.stringify(process.env.NEXT_PUBLIC_BACKEND_URL||'')}));
    return config;
  },
};
