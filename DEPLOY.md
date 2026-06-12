# Деплой сайту «Gathering Of The Fallen»

Це повний вихідний код сайту. Нижче — як його опублікувати.

## Що всередині
- `artifacts/web` — фронтенд (React + Vite)
- `artifacts/api-server` — бекенд (Express), він же роздає зібраний фронтенд
- `lib/` — спільні бібліотеки (база даних, API-схеми)
- `render.yaml` — готове «креслення» для Render.com (1 веб-сервіс + 1 база PostgreSQL)

## Потрібно
- Node.js 24
- pnpm (`corepack enable`)
- База даних PostgreSQL

## Змінні середовища (Environment Variables)
Обовʼязкові:
- `DATABASE_URL` — рядок підключення до PostgreSQL
- `NODE_ENV=production`

Для оплат і пошти (опційно, якщо потрібні):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `SMTP_EMAIL`
- `SMTP_PASSWORD`

## Варіант A — Render.com (найпростіший, є render.yaml)
1. Завантаж цей код у репозиторій GitHub (через сайт github.com → New repository → завантажити файли, або через Git).
2. На Render: **New + → Blueprint** → обери репозиторій → Render знайде `render.yaml`.
3. Введи секретні ключі (Stripe, SMTP), коли попросить.
4. **Apply**. Render сам збере і запустить сайт + базу.
5. Після деплою додай у Stripe адресу вебхука: `https://<твій-сайт>.onrender.com/api/webhook/stripe`

## Варіант B — будь-який сервер вручну
```bash
corepack enable
pnpm install
pnpm --filter @workspace/web run build
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/db run push   # створює таблиці в БД
NODE_ENV=production pnpm --filter @workspace/api-server run start
```
Сервер слухає порт зі змінної `PORT` (за замовчуванням свій). Перевірка живучості: `/api/healthz`.

## Примітки
- Фронтенд звертається до API за відносним шляхом `/api`, тому сайт і API мають бути на **одному домені** (саме так і налаштовано — Express роздає фронтенд).
- Безкоштовний план Render «засинає» після ~15 хв простою; перший запит після сну буде повільнішим.
