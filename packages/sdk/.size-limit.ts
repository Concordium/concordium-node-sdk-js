import type { SizeLimitConfig } from 'size-limit';

module.exports = [
    {
        name: "GRPC web client tree shaking",
        path: "lib/esm/index.js",
        limit: "100 KB",
        import: "{ ConcordiumGRPCWebClient }"
    }
] satisfies SizeLimitConfig;
