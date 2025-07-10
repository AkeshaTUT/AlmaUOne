# TypeScript WebRTC Signaling Server & Client

## Быстрый старт (локально)

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Соберите проект:
   ```bash
   npm run build
   ```
3. Запустите сервер:
   ```bash
   npm start
   ```
4. Откройте в браузере:
   ```
   http://localhost:3000
   ```

## Структура
- `server.ts` — signaling-сервер (Express + Socket.IO, TypeScript)
- `public/` — фронтенд (index.html, style.css, script.ts)

## Для деплоя на Firebase Functions (если нужно)
- Перенесите signaling-логику из `server.ts` в Cloud Functions (см. пример в firebase-ts-app/functions/src/server.ts)
- В `firebase.json` настройте rewrite для `/socket.io/**` на функцию
- Фронтенд деплойте на Firebase Hosting

## Важно
- Для работы звонков на вашем сайте нужен публичный signaling-сервер (например, на Render, Vercel, Railway, либо в Firebase Functions)
- Фронтенд должен подключаться к этому серверу через Socket.IO

---

**Этот README написан так, чтобы любой ИИ или разработчик сразу понял, как развернуть проект локально или интегрировать с Firebase Functions.** 