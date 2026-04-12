# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project: Gathering Of The Fallen - Band Website

Multi-page post-apocalyptic themed website for the Ukrainian rock/metal band "Gathering Of The Fallen".

### Pages (7 separate routes)
- `/` — Home: Hero section, slogan, CTA buttons, latest releases
- `/about` — About: Band history, philosophy, lore with generated band image
- `/music` — Music: 6 real YouTube embeds from @gathering-of-the-fallen channel (Through the Ashes, Молодість, Емігрант, Реквієм Народу, Пустеля Душ, Вогонь В Руках) with "Дивитися на YouTube" buttons
- `/songs` — Songs: 12 real tracks with YouTube embeds in horizontal card layout (Із Попелу, Молодість, Емігрант, Старий Хорон, Вогонь В Руках, Реквієм Народу, Пустеля Душ, Несу, Крізь уламки і Дим, Життя, Кобзар, Залізний Спадок)
- `/merch` — Merch: 4 products in CAD (Футболка 49, Худі 79, Бомбер 129, Кепка 45) with PayPal Checkout (sandbox mode, client ID placeholder: PAYPAL_CLIENT_ID_HERE). Order modal with size/quantity/shipping form → PayPal Smart Payment Buttons → success confirmation
- `/forge` — Forge ("Кузня Повалених"): Animated conveyor RUINS → CRYSTAL → MERCH
- `/contacts` — Contacts: Terminal-style social links + contact form

### Features
- **Boot Sequence**: Terminal-style loading screen with fake BIOS text (home page only)
- **Animated Fog Background**: Multi-layer CSS fog with SVG turbulence noise, ash particles
- **CRT Scanlines**: Monitor scanline overlay with flicker effect
- **Glitch Effects**: CSS keyframe glitch animations on hover (skew + color channel splitting)
- **Secret Level**: Type "FALLEN" anywhere to unlock hidden lyrics overlay
- **Sticky Navigation**: Shared layout with nav bar across all pages
- **Fully Ukrainian**: All UI text in Ukrainian language

### Typography
- Headings: Creepster (Google Fonts) with neon glow
- Body/Terminal: Share Tech Mono (Google Fonts)

### Color Palette
- Background: near-black (#0a0a0a)
- Primary: crystal blue (#00f0ff / #00FFFF)
- Secondary: deep purple (#8a2be2)
- Destructive: red (#FF0000) for glitch effects
- Dark mode only

### Social Links
- YouTube: @gathering-of-the-fallen
- Instagram: @alexats2025
- TikTok: @kobzar25
- Facebook: /share/1CYJR7yWJz/
- Email: gatheringofthefallen@gmail.com

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
