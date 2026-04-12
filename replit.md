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

Post-apocalyptic themed single-page website for the band "Gathering Of The Fallen".

### Features
- **Boot Sequence**: Terminal-style loading screen with fake BIOS text
- **Animated Fog Background**: Multi-layer CSS fog with SVG turbulence noise, ash particles
- **CRT Scanlines**: Monitor scanline overlay with flicker effect
- **Glitch Effects**: CSS keyframe glitch animations on hover (skew + color channel splitting)
- **Neon Cyan Theme**: Primary accent #00FFFF with rust (#8B4513) secondary
- **Music Player**: Salvaged radio UI with 3 tracks and Lore modals
- **Merch Section (The Factory)**: Product cards with generated images
- **About Section**: Ukrainian/English text styled as recovered data
- **Secret Level**: Type "FALLEN" anywhere to unlock hidden lyrics overlay
- **Communication Terminal Footer**: Social links (YouTube, Instagram, TikTok, Facebook, Email)

### Typography
- Headings: Metal Mania (Google Fonts)
- Special accents: Nosifer (Google Fonts)
- Body/Terminal: Share Tech Mono (Google Fonts)

### Color Palette
- Background: near-black (#0a0a0a)
- Primary: neon cyan (#00FFFF)
- Secondary: rust (#8B4513)
- Destructive: red (#FF0000) for glitch effects
- Dark mode only

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
