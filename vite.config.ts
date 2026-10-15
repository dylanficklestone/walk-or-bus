import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function apiDevFallbackPlugin() {
  return {
    name: 'api-dev-fallback',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
          const parsedUrl = new URL(req.url || '', 'http://localhost');
          if (parsedUrl.pathname === '/api/busarrival' || parsedUrl.pathname === '/api/bus-arrival') {
            const { handleBusArrivalQuery } = await import('./api/busarrival');
            const stop = parsedUrl.searchParams.get('BusStopCode') || '';
            const srv = parsedUrl.searchParams.get('ServiceNo') || '';
            const result = await handleBusArrivalQuery(stop, srv);
            for (const [k, v] of Object.entries(result.headers)) {
              res.setHeader(k, v);
            }
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = result.status;
            res.end(JSON.stringify(result.data));
            return;
          }
          if (parsedUrl.pathname === '/api/health') {
            const { checkSystemHealth } = await import('./api/health');
            const report = await checkSystemHealth();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = report.status === 'ERROR' ? 503 : 200;
            res.end(JSON.stringify(report));
            return;
          }
        } catch (err) {
          console.error('Vite dev middleware error:', err);
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevFallbackPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
