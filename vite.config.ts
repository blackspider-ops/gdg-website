import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production optimizations
    minify: true, // Use default esbuild minifier
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'admin-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
    // Increase chunk size warning limit since we have a content-heavy admin panel
    chunkSizeWarningLimit: 1000,
  },
  // Production environment optimizations
  define: {
    // Remove development-only code in production
    __DEV__: mode === 'development',
  },
}));
