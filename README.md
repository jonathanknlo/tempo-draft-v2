# Tempo Draft V2

A real-time multiplayer draft app for Toronto Tempo WNBA season tickets.

## Features

- Create draft rooms with shareable links
- Real-time synchronization between players
- 18-game draft with snake draft order
- Family-friendly and marquee game badges
- 5-second undo window
- Calendar export (.ics)
- Mobile-first responsive design

## Tech Stack

- SvelteKit
- TypeScript
- Supabase (PostgreSQL + Realtime)
- Neo-brutalist design

## Development

```bash
npm install
npm run dev
```

## Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

Deploy to Vercel:
```bash
vercel --prod
```

## Critical Fixes Applied

1. Room expiry: 1 hour (not 24h)
2. Undo rule: until opponent picks OR 5 seconds
3. No name uniqueness validation
4. Timezone: use game local time for family-friendly check
5. No presence table (removed over-engineered feature)
