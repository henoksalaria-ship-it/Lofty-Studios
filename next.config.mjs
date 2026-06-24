import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const workspaceRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: workspaceRoot,
  },
}

export default nextConfig
