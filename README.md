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

### Option A — automatique (une seule commande)

Nécessite un [Personal Access Token](https://supabase.com/dashboard/account/tokens)
Supabase. Le script crée le projet, applique la migration, récupère la clé
anon et écrit `.env.local` :

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs
```

Il affiche une fois le mot de passe de la base — à conserver, Supabase ne
le remontre jamais. Le script est rejouable : si un projet `endo` existe
déjà, il le réutilise.

### Option B — manuelle

1. Créer un projet sur [supabase.com](https://supabase.com) (palier
   gratuit suffisant pour cet usage).
2. Dans **SQL Editor**, coller et exécuter `supabase/migrations/0001_init.sql`.
   Le script est idempotent : le rejouer ne casse rien.
3. Dans **Project Settings → API**, copier `Project URL` et `anon public
   key` dans `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

> La clé `anon` est publique par conception (elle part dans le navigateur) :
> ce sont les policies RLS qui protègent les données, pas le secret de la clé.
> Ne jamais mettre la clé `service_role` dans le front.

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
