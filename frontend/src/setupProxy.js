// import { createProxyMiddleware } from 'http-proxy-middleware';

// export default function(app) {
//   app.use(
//     '/api/reports',
//     createProxyMiddleware({
//       target: 'https://5e95654a042e.ngrok-free.app',
//       changeOrigin: true,
//       pathRewrite: {
//         '^/api/reports': '/admin/reports',
//       },
//       headers: {
//         'ngrok-skip-browser-warning': 'true',
//       },
//       onProxyReq: (proxyReq, req, res) => {
//         console.log('🔄 Proxying request to:', proxyReq.path);
//       },
//       onError: (err, req, res) => {
//         console.error('❌ Proxy error:', err);
//       }
//     })
//   );
// };
