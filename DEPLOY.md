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

## GOTF LIVE AI — продаж і сервер ліцензій
Ліцензія привʼязана до **пошти покупця**, не до заліза. Один ключ = до 2 компʼютерів одночасно.

Змінні середовища (Render → Environment):
| Змінна | Обовʼязкова | Що це |
|---|---|---|
| `LICENSE_SIGNING_KEY` | так | Приватний Ed25519-ключ (base64 PKCS#8). Генерується скриптом нижче. **Тільки в Render, ніколи в git.** |
| `GOTF_PRICE_ID` | так | `price_...` товару «GOTF LIVE AI» у Stripe Dashboard (разова ціна) |
| `PUBLIC_SITE_URL` | так | напр. `https://gathering-of-the-fallen-frankfurt.onrender.com` — для посилань у листах |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | так* | Cloudflare R2, де лежить Setup.exe (посилання на 1 годину) |
| `GOTF_SETUP_OBJECT_KEY` | ні | імʼя файлу в R2, за замовчуванням `GOTF-LIVE-AI-Setup.exe` |
| `GOTF_DOWNLOAD_URL` | ні | *запасний варіант замість R2: пряме посилання на інсталятор |
| `LICENSE_IP_SALT` | бажано | будь-який випадковий рядок; IP у статистиці зберігаються лише як HMAC-хеш |
| `SMTP_EMAIL`, `SMTP_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL` | так | ті самі, що вже є |

Ключі підпису (один раз, на своєму компʼютері):
```bash
node artifacts/api-server/scripts/gen-license-keypair.mjs
```
- рядок `LICENSE_SIGNING_KEY=...` → у Render (Secret);
- `raw base64` публічного ключа → вшити в програму GOTF LIVE AI (перевірка токена офлайн). Перевірити, що сервер має правильний ключ: `GET /api/license/public-key`.
- Якщо приватний ключ змінити — старі токени в програмах перестануть перевірятися, програма має просто повторно активуватися.

API для програми:
- `POST /api/license/activate` `{email, key, device_id, device_name}` → `{token, payload}`; токен `GOTF1.<payload>.<підпис>` діє 30 днів (поля `key, email, device_id, issued, expires` у секундах). 409 `device_limit` — ліміт компʼютерів, у відповіді `reset_url`.
- `POST /api/license/deactivate` `{email, key, device_id}` — кнопка «Деактивувати ключ».
- Сторінка `/gotf-live-ai/reset` — скидання всіх активацій через лист (посилання 30 хв, 3 запити/добу на пошту, 10/год на IP).
- `GET /api/owner/license-stats` — статистика для власника (картка внизу `/owner-analytics`).

Stripe: вебхук уже налаштований на `/api/webhook/stripe`; подія `checkout.session.completed` з `metadata.flow = "software"` створює ліцензію і надсилає ключ на пошту покупця.

Тести сервера ліцензій (потрібна локальна PostgreSQL, таблиці в ній перестворюються):
```bash
LICENSE_TEST_DATABASE_URL=postgres://user:pass@localhost/gotf_test pnpm --filter @workspace/api-server test
```

⚠️ Безкоштовна база Render видаляється приблизно через 30 днів — для продажу ліцензій перейдіть на платний план бази (інакше всі ключі зникнуть).

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
