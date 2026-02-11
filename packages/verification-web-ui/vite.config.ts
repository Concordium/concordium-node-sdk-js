import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
  const isLibrary = mode === 'library';

  const baseConfig = {
    css: {
      postcss: './postcss.config.ts',
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  };

  if (isLibrary) {
    return {
      ...baseConfig,
      plugins: [
        dts({
          insertTypesEntry: true,
          copyDtsFiles: true,
          include: ['src/**/*.ts', 'src/**/*.d.ts'],
          exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', '**/*.config.ts'],
          outDir: 'dist',
          entryRoot: 'src',
        }),
      ],
      build: {
        lib: {
          entry: {
            index: resolve(__dirname, 'src/index.ts'),
            vue: resolve(__dirname, 'src/vue.ts'),
            react: resolve(__dirname, 'src/react.ts'),
          },
          name: 'ConcordiumVerificationWebUI',
          fileName: (format, entryName) => {
            if (entryName === 'index') {
              return `verification-web-ui${format === 'es' ? '' : '.' + format}.js`;
            }
            return `${entryName}.js`;
          },
          formats: ['es'], // Only ES format for multiple entries
        },
        rollupOptions: {
          // Externalize deps that shouldn't be bundled
          external: [
            'react',
            'vue',
            '@vue/runtime-core',
            '@walletconnect/sign-client',
            /^@walletconnect\/.*/,
            'qrcode',
          ],
          output: {
            globals: {
              react: 'React',
              vue: 'Vue',
              '@vue/runtime-core': 'Vue',
              '@walletconnect/sign-client': 'WalletConnectSignClient',
              qrcode: 'QRCode',
            },
            // Use ES module format
            format: 'es',
            // Preserve module structure to avoid duplicate declarations
            preserveModules: true,
            preserveModulesRoot: 'src',
            // Set entry file names
            entryFileNames: '[name].js',
            // Handle assets
            assetFileNames: assetInfo => {
              const info = assetInfo.name?.split('.') || [];
              const extType = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                return `assets/[name][extname]`;
              }
              // Use consistent naming for CSS files
              if (extType === 'css') {
                return `verification-web-ui.css`;
              }
              return `assets/[name].[hash][extname]`;
            },
          },
        },
        sourcemap: true,
        emptyOutDir: true,
        cssCodeSplit: false, // Bundle all CSS into one file
        // Copy assets to dist folder
        assetsDir: 'assets',
        // Inline small assets as base64
        assetsInlineLimit: 0, // Don't inline assets, copy them instead
        // Disable minification to prevent variable name collisions with preserveModules
        minify: false,
      },
    };
  }

  return baseConfig;
});
