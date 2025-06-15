const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

// Универсальный fetch для Node.js 16+ и 18+
const fetch = global.fetch || ((...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)));

app.get('/api/courses', async (req, res) => {
  try {
    // Формируем параметры для поиска: q=search&query=...
    const params = new URLSearchParams();
    // Coursera API требует q=search и query=...
    params.set('q', 'search');
    if (req.query.q) params.set('query', req.query.q);
    if (req.query.limit) params.set('limit', req.query.limit);

    // Добавьте любые другие фильтры, которые поддерживает официальный API

    const url = `https://api.coursera.org/api/courses.v1?${params.toString()}`;
    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      // Логируем ответ Coursera для отладки
      console.error('Coursera API error:', response.status, text);
      return res.status(500).json({ error: 'Coursera API error', details: text });
    }

    // Парсим только если статус ok
    const data = JSON.parse(text);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Proxy error', details: e.message });
  }
});

app.listen(3001, () => console.log('Proxy server running on http://localhost:3002'));