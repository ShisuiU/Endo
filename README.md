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

## Déployer sur Vercel

Le palier gratuit (Hobby) suffit largement pour un usage perso.

```bash
npx vercel deploy --prod --token=<TOKEN> --yes
```

Les deux variables Supabase doivent être définies **côté projet Vercel**
(`.env.local` n'est jamais envoyé) :

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production --token=<TOKEN>
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token=<TOKEN>
```

**Après le premier déploiement**, passer `site_url` sur l'URL de
production dans Supabase (Authentication → URL Configuration), sinon les
liens des emails d'auth pointeront vers `localhost:3000` :

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/ztucdcyfeqaeeogzjzeo/config/auth" \
  -H "Authorization: Bearer <SUPABASE_TOKEN>" -H "Content-Type: application/json" \
  -d '{"site_url": "https://<domaine-vercel>"}'
```

> HTTPS est obligatoire pour qu'une PWA s'installe sur iPhone et pour que
> le service worker s'enregistre. Vercel le fournit d'office, y compris
> sur les domaines `*.vercel.app`.

## Skills et MCP (outillage Claude Code)

Tout est versionné dans le dépôt : n'importe quelle session Claude Code
les trouve automatiquement, sans rien réinstaller.

- **`.claude/skills/`** — 8 skills : `ui-ux-pro-max` (règles UI/UX,
  accessibilité, palettes, typographie, avec ses données locales) et les
  7 skills `21st-*` (recherche de composants, revue et génération d'UI).
- **`.mcp.json`** — déclare le serveur MCP de 21st.dev.

### La clé API 21st

`.mcp.json` ne contient **aucun secret** : il lit la variable
d'environnement `TWENTYFIRST_API_KEY`. Le dépôt étant public, la clé ne
doit jamais y être écrite en clair.

À définir une fois, là où tu lances Claude Code :

```bash
# macOS / Linux — dans ~/.zshrc ou ~/.bashrc
export TWENTYFIRST_API_KEY="21st_sk_..."
```

Sur Claude Code web, la variable se règle dans les réglages de
l'environnement d'exécution. Sans elle, les 8 skills fonctionnent
quand même : seul le serveur MCP 21st reste inactif.

> Le CLI `21st` (`npx @21st-dev/cli`), lui, lit `TWENTYFIRST_TOKEN` ou
> `API_KEY_21ST`. Définir les trois avec la même valeur évite les
> surprises.

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
