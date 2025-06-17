require('dotenv').config({ path: '.coursera.env' });
require('dotenv').config({ path: '.hh.env' });
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

// Coursera API configuration
const COURSERA_API_KEY = process.env.COURSERA_API_KEY;
const COURSERA_API_SECRET = process.env.COURSERA_API_SECRET;
const COURSERA_API_BASE_URL = process.env.COURSERA_API_BASE_URL;
const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || 'ru';
const DEFAULT_LIMIT = process.env.DEFAULT_LIMIT || 20;
const DEFAULT_LEVEL = process.env.DEFAULT_LEVEL || 'beginner';
const CACHE_DURATION = process.env.CACHE_DURATION || 3600;

// HH.ru API configuration
const HH_ACCESS_TOKEN = process.env.HH_ACCESS_TOKEN;
const HH_REFRESH_TOKEN = process.env.HH_REFRESH_TOKEN;
const HH_TOKEN_TYPE = process.env.HH_TOKEN_TYPE;
const HH_USER_AGENT = process.env.HH_USER_AGENT || 'AlmaUOne/1.0 (alma-u-one@example.com)';

if (!COURSERA_API_KEY || !COURSERA_API_SECRET) {
  console.error('Error: Coursera API credentials are not set in .coursera.env');
  process.exit(1);
}

if (!HH_ACCESS_TOKEN) {
  console.error('Error: HH.ru API credentials are not set in .hh.env');
  process.exit(1);
}

// Универсальный fetch для Node.js
const fetch = global.fetch || ((...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)));

// Простой кэш для результатов
const cache = new Map();

app.get('/api/courses', async (req, res) => {
  try {
    // Проверяем кэш
    const cacheKey = JSON.stringify(req.query);
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION * 1000) {
      return res.json(cachedData.data);
    }

    // Формируем параметры для поиска
    const params = new URLSearchParams();
    params.set('q', 'search');
    if (req.query.q) params.set('query', req.query.q);
    params.set('limit', req.query.limit || DEFAULT_LIMIT);
    params.set('language', req.query.language || DEFAULT_LANGUAGE);
    params.set('level', req.query.level || DEFAULT_LEVEL);
    if (req.query.category) params.set('category', req.query.category);

    // Добавляем аутентификацию
    const auth = Buffer.from(`${COURSERA_API_KEY}:${COURSERA_API_SECRET}`).toString('base64');

    const url = `${COURSERA_API_BASE_URL}?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Coursera API error:', response.status);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return res.status(response.status).json({ 
        error: 'Coursera API error', 
        status: response.status,
        details: errorText 
      });
    }

    const data = await response.json();
    
    // Трансформируем данные в нужный формат
    const transformedData = {
      elements: data.elements.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        instructorName: course.instructorName || 'Coursera Instructor',
        rating: course.rating || 0,
        numReviews: course.numReviews || 0,
        enrolledCount: course.enrolledCount || 0,
        duration: course.duration || course.estimatedEffort || '',
        level: course.level || DEFAULT_LEVEL,
        category: course.category,
        photoUrl: course.photoUrl || 'https://example.com/default-course.jpg',
        url: course.url,
        price: course.price || 0,
        language: course.language || DEFAULT_LANGUAGE,
        skills: course.skills || []
      }))
    };

    // Сохраняем в кэш
    cache.set(cacheKey, {
      data: transformedData,
      timestamp: Date.now()
    });

    res.json(transformedData);
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      details: e.message 
    });
  }
});

// Добавляем эндпоинт для получения деталей курса
app.get('/api/courses/:id', async (req, res) => {
  try {
    // Проверяем кэш
    const cacheKey = `course_${req.params.id}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION * 1000) {
      return res.json(cachedData.data);
    }

    const auth = Buffer.from(`${COURSERA_API_KEY}:${COURSERA_API_SECRET}`).toString('base64');
    
    const response = await fetch(`${COURSERA_API_BASE_URL}/${req.params.id}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Coursera API error:', response.status);
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: 'Coursera API error', 
        status: response.status,
        details: errorText 
      });
    }

    const course = await response.json();
    
    // Трансформируем данные курса
    const transformedCourse = {
      id: course.id,
      name: course.name,
      description: course.description,
      instructorName: course.instructorName || 'Coursera Instructor',
      rating: course.rating || 0,
      numReviews: course.numReviews || 0,
      enrolledCount: course.enrolledCount || 0,
      duration: course.duration || course.estimatedEffort || '',
      level: course.level || DEFAULT_LEVEL,
      category: course.category,
      photoUrl: course.photoUrl || 'https://example.com/default-course.jpg',
      url: course.url,
      price: course.price || 0,
      language: course.language || DEFAULT_LANGUAGE,
      skills: course.skills || []
    };

    // Сохраняем в кэш
    cache.set(cacheKey, {
      data: transformedCourse,
      timestamp: Date.now()
    });

    res.json(transformedCourse);
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      details: e.message 
    });
  }
});

// Добавляем эндпоинт для очистки кэша
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully' });
});

// HH.ru API endpoint for vacancy search
app.get('/api/hh', async (req, res) => {
  try {
    const response = await fetch(`https://api.hh.ru/vacancies?${new URLSearchParams(req.query)}`, {
      headers: {
        'Authorization': `${HH_TOKEN_TYPE} ${HH_ACCESS_TOKEN}`,
        'HH-User-Agent': HH_USER_AGENT
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HH.ru API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'HH.ru API error', 
        status: response.status,
        details: errorText 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      details: e.message 
    });
  }
});

// HH.ru API endpoint for vacancy details
app.get('/api/hh/vacancies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const response = await fetch(`https://api.hh.ru/vacancies/${id}`, {
      headers: {
        'Authorization': token,
        'HH-User-Agent': HH_USER_AGENT
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HH.ru API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'HH.ru API error', 
        status: response.status,
        details: errorText 
      });
    }

    const vacancy = await response.json();
    res.json(vacancy);
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      details: e.message 
    });
  }
});

app.listen(3001, () => {
  console.log('Proxy server running on http://localhost:3001');
  console.log('Using Coursera API configuration:');
  console.log(`- Base URL: ${COURSERA_API_BASE_URL}`);
  console.log(`- Default Language: ${DEFAULT_LANGUAGE}`);
  console.log(`- Default Limit: ${DEFAULT_LIMIT}`);
  console.log(`- Cache Duration: ${CACHE_DURATION} seconds`);
});