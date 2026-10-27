/*
  Local stand-in for Vercel: serves api/grade.js on http://127.0.0.1:3001.
  Vite proxies /api there during `npm run dev` (see vite.config.js).
  Usage: ANTHROPIC_API_KEY=... node eval/dev-api.mjs
  Without a key the function falls back to the rule grader, which is also worth testing.
*/
import http from 'node:http';
import handler from '../api/grade.js';

const port = Number(process.env.PORT) || 3001;
http.createServer((req, res) => {
  if (req.url.startsWith('/api/grade')) return handler(req, res);
  res.statusCode = 404;
  res.end('not found');
}).listen(port, '127.0.0.1', () => {
  console.log(`dev api on http://127.0.0.1:${port}/api/grade (${process.env.ANTHROPIC_API_KEY ? 'model on' : 'rules only'})`);
});
