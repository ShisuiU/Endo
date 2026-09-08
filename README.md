# endo

Carnet quotidien privé pour suivre l'endométriose — PWA installable sur
iPhone. Voir [`CLAUDE.md`](./CLAUDE.md) pour le résumé du projet, la
direction artistique et l'état d'avancement détaillé.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # renseigner les clés Supabase (voir plus bas)
npm run dev
```

## Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (palier
   gratuit suffisant pour cet usage).
2. Dans **SQL Editor**, exécuter le contenu de
   `supabase/migrations/0001_init.sql`.
3. Dans **Project Settings → API**, copier `Project URL` et `anon public
   key` dans `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

## Regénérer les icônes / splash screens

```bash
node scripts/generate-icons.mjs
```

Régénère `public/icons/*` et `public/splash/*` à partir du monogramme
défini dans le script (à modifier si le logotype change).

## Scripts

- `npm run dev` — développement (Turbopack).
- `npm run build` / `npm start` — build de production.
- `npm run lint` — ESLint.
