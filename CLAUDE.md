# endo — carnet quotidien (PWA personnelle)

Ce fichier est la mémoire du projet entre les sessions. Toute session Claude
Code qui reprend ce travail doit le lire en premier.

## Résumé du projet

**endo** est une PWA personnelle, non commerciale, pour suivre au quotidien
l'endométriose : crise (oui/non + intensité), douleur, sommeil, humeur,
énergie (notes sur 10), médicament pris, repas/aliments libres, et notes.
Elle affiche un calendrier de l'historique et estime l'intervalle moyen
entre deux crises.

Contraintes du projet :
- **Perso, non commercial** — pas de scalabilité à prévoir, mais un niveau
  de finition professionnel.
- **Comptes strictement privés, multi-utilisateurs** — chacun crée son
  compte (email + mot de passe) et ne voit que ses propres données. Pas de
  partage entre comptes en V1.
- **Stockage local + synchronisation cloud** via Supabase (Postgres, RLS).
- **PWA installable sur iPhone**, aspect natif (pas de barre d'adresse),
  fonctionnement correct hors-ligne pour le shell de l'app.
- **Aucun aspect "généré par IA"** — voir § Ce qu'il ne faut PAS faire.

## Direction artistique — "Atelier"

Direction validée : **premium et féminine**, éditoriale, sans tomber dans
les clichés pastel/lavande ni dans l'esthétique "IA générique"
(violet/bleu dégradé, Inter partout, icônes de librairie non retouchées).

**Palette** (définie dans `src/app/globals.css`, tokens Tailwind v4 via
`@theme inline`) :
- `ivory` `#FBF6F1` — fond principal, chaud plutôt que blanc froid.
- `ink` `#3B0F1F` — encre bordeaux profond, texte et CTA principaux.
- `rosewood` `#C98374` — accent (scores, crise, liens actifs).
- `brass` `#B08D57` — filet laiton, utilisé avec parcimonie (séparateurs,
  pastille médicament sur le calendrier).
- `sage` `#90A189` — réservée pour une utilisation future (statuts positifs).
- Mode sombre : fond `charcoal` `#211A1D`, texte `#F3E9E2`, accent
  `rosewood-soft` `#E3B6AB` — bascule automatique via
  `prefers-color-scheme`.

**Typographies** (via `next/font/google`, chargées dans
`src/app/layout.tsx`) :
- **Fraunces** (`--font-fraunces` / classe `font-display`), axes
  optionnels `opsz`/`SOFT`/`WONK` activés, italique 900 pour le
  logotype et les gros chiffres — volontairement irrégulier ("wonky") pour
  ne pas ressembler à un serif corporate lisse.
- **Instrument Sans** (`--font-instrument` / `font-sans`) — interface et
  texte courant. Ni Inter, ni Geist.

**Principes de design** :
- Filets fins (`.hairline`, 1px, `var(--hairline)`) plutôt que des cards à
  ombre portée — esthétique "carnet papier", pas "dashboard SaaS".
- Composants faits main plutôt que primitives de librairie par défaut :
  `ScoreSlider` (réglette 0–10 à pastilles, pas un `<input type="range">`),
  `Toggle` (oui/non à deux libellés), `TagInput` (étiquettes d'aliments),
  calendrier mensuel avec pastilles couleur plutôt qu'une grille chargée.
- Icônes maison en SVG inline (`src/components/icons.tsx`) — trait fin
  1.5, légèrement asymétrique, jamais un import Heroicons/Lucide brut.
- Monogramme "e" en Fraunces 900 italique, cerclé d'un filet laiton avec un
  point rosewood — logotype de l'app et base de toutes les icônes PWA
  (généré par `scripts/generate-icons.mjs`, voir § PWA).
- Micro-interactions : sauvegarde automatique silencieuse (indicateur
  textuel discret "Enregistrement…" / "Enregistré"), pas de fade-in au
  scroll générique.

## Architecture technique

- **Framework** : Next.js 16 (App Router, Turbopack), React 19, TypeScript.
- **Style** : Tailwind CSS v4 (config CSS-first via `@theme inline` dans
  `globals.css`, pas de `tailwind.config.js`).
- **Backend** : Supabase (Postgres + Auth + RLS). Voir
  `supabase/migrations/0001_init.sql` pour le schéma complet.
  - **Projet réel créé** (session du 2026-09-08) : organisation
    `ShisuiU's Org`, ref `ztucdcyfeqaeeogzjzeo`, région `eu-west-3`
    (Paris), URL `https://ztucdcyfeqaeeogzjzeo.supabase.co`. Migration
    appliquée, schéma vérifié en production. Les clés sont dans
    `.env.local` (non versionné) — la clé `anon` est publique par
    conception, c'est la RLS qui protège.
  - **Confirmation par email désactivée** (`mailer_autoconfirm: true`,
    choix validé avec l'utilisateur) : l'inscription ouvre une session
    immédiatement, sans email à cliquer. C'était nécessaire parce que le
    SMTP intégré de Supabase est limité à 2 emails/heure et réservé au
    test — les emails de confirmation ne seraient pas arrivés. Vérifié en
    conditions réelles : `signUp` renvoie bien une session et l'écriture
    en base fonctionne dans la foulée. Si un jour tu veux rétablir la
    vérification d'adresse, il faut d'abord brancher un vrai SMTP
    (Resend a un palier gratuit) puis repasser le réglage à `false`.
  - **`site_url` pointe sur la production** : `https://endo-seven.vercel.app`
    (mis à jour au déploiement, pour que les liens des emails d'auth ne
    pointent plus vers localhost).
  - `profiles` — un profil léger par utilisateur (créé automatiquement à
    l'inscription via trigger `handle_new_user`).
  - `daily_entries` — une ligne par jour et par utilisateur (`unique
    (user_id, entry_date)`) : crise, intensité, douleur, sommeil, humeur,
    énergie, médicament, aliments (`text[]`), notes.
  - RLS activé sur les deux tables, policies `auth.uid() = user_id` /
    `auth.uid() = id` — comptes strictement privés.
- **Auth** : `@supabase/ssr`, cookies HTTP-only, session rafraîchie dans
  `src/proxy.ts` (le fichier `middleware.ts` a été renommé `proxy.ts` —
  convention Next.js 16). Redirige vers `/connexion` si non connecté,
  vers `/aujourdhui` si déjà connecté sur les pages d'auth.
- **Structure des dossiers** :
  ```
  src/app/
    (auth)/connexion, (auth)/inscription, (auth)/actions.ts   — auth (Server Actions)
    (app)/aujourdhui, (app)/calendrier, (app)/jour/[date],
          (app)/statistiques, (app)/layout.tsx                — zone connectée (nav, garde d'auth)
    manifest.ts, layout.tsx, globals.css                       — shell + PWA
  src/components/
    ui/            — Button, Card, ScoreSlider, Toggle, TagInput, Wordmark
    icons.tsx       — set d'icônes maison
    daily/          — formulaire de saisie quotidienne (réutilisé par /aujourdhui et /jour/[date])
    calendar/       — grille mensuelle
    stats/          — courbes de tendance dessinées à la main
    pwa/            — enregistrement du service worker, invite iOS "à l'écran d'accueil"
    app-shell/      — barre de navigation basse
  src/lib/
    supabase/       — clients browser/server/proxy + types
    entries-client.ts, date.ts, stats.ts, cn.ts
  supabase/migrations/0001_init.sql
  scripts/generate-icons.mjs   — génère public/icons + public/splash
  ```
- **Pourquoi Supabase** : palier gratuit généreux, Postgres + Auth + RLS
  gérés, évite d'écrire un backend/API maison pour un projet perso — choix
  validé avec l'utilisateur en cadrage.

## Déploiement

- **Hébergement : Vercel**, projet `endo` (compte `thebestsam37-1731`),
  déployé via la CLI (`vercel deploy --prod`), pas encore relié à Git.
  Production : **https://endo-seven.vercel.app**
- Les deux variables `NEXT_PUBLIC_SUPABASE_*` sont posées sur le projet
  Vercel (cibles production/preview/development) — `.env.local` n'est
  jamais envoyé. Vérifié : elles sont bien compilées dans le bundle
  client servi en production.
- **`ssoProtection` a été désactivée** sur le projet Vercel. Elle est
  active par défaut et exigeait une connexion *Vercel* pour ouvrir le
  site, ce qui rend une PWA ininstallable sur iPhone. Les données ne sont
  pas exposées pour autant : l'app a sa propre authentification Supabase
  et la RLS. Ne pas la réactiver sans mesurer cet effet.
- **Pas encore de déploiement automatique** : `vercel git connect`
  relierait le dépôt pour redéployer à chaque push sur la branche par
  défaut. À faire si tu veux ce confort.
- Le dépôt a maintenant une branche `main` (même contenu que la branche
  de travail). Elle n'est pas encore la branche *par défaut* côté GitHub
  — ce réglage n'est pas modifiable depuis une session Claude Code, à
  changer à la main dans Settings → Branches.

## MCP / Skills utilisés

- **`artifact-design` / `artifact-capabilities`** : non utilisés — le
  livrable est une vraie app Next.js déployable, pas un artifact.
- **MCP Figma** : disponible dans l'environnement mais non utilisé — la
  direction artistique a été définie et itérée directement en code
  (tokens Tailwind + composants), avec vérification visuelle via des
  captures d'écran Playwright/Chromium (déjà installés dans
  l'environnement), ce qui était plus rapide qu'un aller-retour Figma pour
  ce projet solo.
- **MCP 21st (21st.dev)** demandé dans la mission : **non disponible dans
  cet environnement** (aucun serveur MCP de ce nom n'est connecté à cette
  session). À défaut, l'inspiration UI vient d'une direction artistique
  définie à la main (palette/typo signées) plutôt que de composants
  préfabriqués, ce qui sert justement la contrainte anti-générique.
  → Si tu relances une session avec ce MCP disponible, il peut être
  utilisé pour explorer des variations de composants, en gardant la
  palette/typo définies ci-dessus.
- **Sharp + @resvg/resvg-js + @fontsource/fraunces + wawoff2** (npm,
  gratuits/open-source) : utilisés une fois par
  `scripts/generate-icons.mjs` pour rasteriser le monogramme SVG en PNG
  (icônes PWA + splash screens iOS) avec la vraie police Fraunces
  embarquée, sans dépendre des fonts système. Pas des MCP, mais notés ici
  car ce sont des outils "supplémentaires" installés pendant la session.

## Conventions de code

- Composants en **français dans l'UI**, noms de fichiers/variables en
  anglais (standard du code), commentaires en français quand ils
  expliquent une décision de design ou un choix non évident.
- Un composant par fichier, `PascalCase` pour les composants,
  `kebab-case` pour les fichiers.
- État serveur minimal : les pages de la zone connectée sont des Server
  Components qui vérifient juste la session (`(app)/layout.tsx`) ; la
  logique de saisie/lecture de données passe par le client Supabase
  navigateur (`src/lib/entries-client.ts`) depuis des Client Components —
  plus simple à garder réactif/optimiste pour une app de saisie rapide.
- Dates toujours au format `YYYY-MM-DD` calculé en **heure locale**
  (`src/lib/date.ts`), jamais `toISOString()` seul (décalage UTC).
- Tailwind v4 : tous les tokens de couleur/police passent par
  `@theme inline` dans `globals.css` — ne pas ajouter de couleurs en dur
  dans les composants, étendre la palette là-bas.
- Pas de librairie de composants UI (shadcn, MUI...) ni de librairie de
  charts — tout est fait main pour tenir la direction artistique.

## PWA

- **Manifest** : `src/app/manifest.ts` (route générée
  `/manifest.webmanifest`), `display: standalone`, `start_url:
  /aujourdhui`, icônes 192/512 + variante `maskable` 512.
- **Icônes** : générées par `scripts/generate-icons.mjs` dans
  `public/icons/` (16, 32, apple-touch-icon 180, 192, 512, 512 maskable)
  et `public/splash/` (5 résolutions iPhone courantes). Le script embarque
  la police Fraunces (décompressée depuis `@fontsource/fraunces` avec
  `wawoff2`) pour un rendu fidèle sans dépendre des polices système —
  relancer `node scripts/generate-icons.mjs` si le monogramme change.
- **Meta tags Apple** : `appleWebApp` (capable, status bar
  `black-translucent`) dans `metadata`, `apple-touch-startup-image` par
  media query dans `src/app/layout.tsx` (`SPLASH_SCREENS`).
- **Service worker** : `public/sw.js`, écrit à la main (pas de Workbox) —
  cache le shell (page hors-ligne + manifest + icônes) à l'install,
  stratégie réseau-d'abord avec repli cache pour la navigation, cache-
  d'abord pour `/_next/static/*`, stale-while-revalidate pour le reste.
  Page de repli : `public/offline.html` (statique, autonome).
  Enregistré côté client par `src/components/pwa/service-worker-register.tsx`.
- **Invite d'installation iOS** : `src/components/pwa/install-prompt.tsx`
  — Safari iOS n'a pas de `beforeinstallprompt`, donc on explique le geste
  (Partager → Sur l'écran d'accueil) plutôt que de simuler un faux bouton.
- **À faire par toi une fois le projet Supabase créé** : renseigner
  `.env.local` (voir `.env.example`), appliquer
  `supabase/migrations/0001_init.sql` (SQL editor Supabase ou `supabase db
  push`), puis tester réellement l'ajout à l'écran d'accueil sur un
  iPhone (Safari → Partager → Sur l'écran d'accueil) : vérifier l'icône,
  l'absence de barre d'adresse en mode standalone, et le lancement hors
  connexion.

## Ce qu'il ne faut PAS faire

Rappel explicite pour toute session future : **ce projet ne doit jamais
ressembler à un site généré par IA.**
- Ne pas réintroduire Inter, Geist, ou une police sans personnalité.
- Ne pas utiliser de dégradé violet/bleu, ni la palette Tailwind par
  défaut (`zinc`, `indigo`...) — rester sur les tokens `ivory/ink/
  rosewood/brass` définis dans `globals.css`.
- Ne pas importer un set d'icônes (Heroicons, Lucide, Feather...) tel
  quel — étendre `src/components/icons.tsx` à la main.
- Ne pas ajouter de librairie de composants (shadcn/MUI/Chakra) ni de
  librairie de charts (Recharts/Chart.js...) — composer avec les
  primitives existantes dans `src/components/ui/` et `src/components/
  stats/`.
- Ne pas revenir à des cards à ombre portée générique — garder les filets
  fins (`.hairline`).
- Ne pas ajouter d'animation "fade-in au scroll" par défaut sans
  intention précise.

## État d'avancement

**Fait :**
- Cadrage complet (objet, fonctionnalités V1, stockage, auth, direction
  artistique) validé avec l'utilisateur.
- Scaffold Next.js 16 + Tailwind v4 + TypeScript, direction artistique
  "Atelier" appliquée (tokens, fonts, composants maison, icônes SVG).
- PWA complète : manifest, icônes (dont maskable), splash iOS, service
  worker fait main, page hors-ligne, invite d'installation iOS,
  en-têtes de sécurité + cache pour `sw.js`.
- Schéma Supabase (`profiles`, `daily_entries`) avec RLS strictement
  privée, triggers `updated_at` et création de profil automatique.
- Auth complète (inscription avec gestion de la confirmation email,
  connexion, déconnexion) via Server Actions + `@supabase/ssr`.
- Écran **Aujourd'hui** : saisie rapide (crise + intensité, douleur,
  sommeil, humeur, énergie, médicament + notes, aliments en étiquettes,
  notes libres), sauvegarde automatique debouncée.
- Écran **Calendrier** : grille mensuelle, pastilles crise/médicament,
  navigation mois précédent/suivant, clic sur un jour → édition
  (`/jour/[date]`, réutilise le même formulaire).
- Écran **Repères** : intervalle moyen entre crises + estimation de la
  prochaine échéance, courbes de tendance (douleur/sommeil/humeur) sur 21
  jours dessinées à la main.
- `next build`, `tsc --noEmit` et `eslint` passent sans erreur.
- Vérification visuelle (capture d'écran Chromium) de l'écran de
  connexion — rendu conforme à la direction artistique.
- **Migration validée sur un vrai PostgreSQL 16** (local, avec un stub du
  schéma `auth` de Supabase : `auth.users` + `auth.uid()`). 8 vérifications
  passées : création auto des profils par trigger, écriture par le
  propriétaire, isolation RLS en lecture/écriture/suppression entre deux
  comptes, refus d'écrire au nom d'autrui, upsert `on conflict
  (user_id, entry_date)` (celui de `entries-client.ts`) avec `updated_at`
  rafraîchi, et bornes 0–10 sur les scores.
- Migration rendue **idempotente** (`drop policy/trigger if exists`) :
  elle peut être rejouée sans erreur, vérifié sur 3 passages consécutifs.
- `scripts/setup-supabase.mjs` : crée le projet via la Management API,
  applique la migration, récupère la clé anon et écrit `.env.local`.
- **Projet Supabase réel créé et branché**, puis vérifié de bout en bout
  contre la vraie base : inscription de deux comptes, création
  automatique des profils par trigger, connexion via l'UI, écriture
  d'une entrée, isolation RLS confirmée (un compte ne voit, ne modifie
  ni ne supprime rien de l'autre ; un visiteur non connecté ne lit
  rien), et toutes les fonctions de `entries-client.ts` (fetchEntry,
  fetchEntriesInRange, fetchAllCrisisDates, upsertEntry) testées contre
  la vraie base. Données de test supprimées ensuite.
- **Déployé en production sur Vercel** (https://endo-seven.vercel.app) et
  vérifié en ligne : accès public, en-têtes de sécurité, `manifest.webmanifest`,
  `sw.js` servi en `application/javascript` avec `no-cache`, icônes, splash
  screens et page hors-ligne tous accessibles, meta tags Apple présents,
  et les quatre pages authentifiées répondent 200 avec une vraie session
  (donc Vercel valide bien le jeton auprès de Supabase).
- Confirmation par email désactivée puis **inscription revérifiée de bout
  en bout** : session ouverte immédiatement, écriture en base dans la
  foulée. Comptes de test supprimés, base laissée vide.
- **Deux plantages corrigés**, trouvés en faisant tourner l'app pour de
  vrai (ils n'apparaissaient ni au build, ni au typecheck, ni au lint) :
  1. `/statistiques` tombait en 500 à chaque ouverture — `friendlyDate`
     était appelée sur `dates[0]` alors que le tableau est vide au
     premier rendu.
  2. `/jour/<date invalide>` tombait en 500 — `Intl.DateTimeFormat` lève
     sur une date invalide, et le segment vient de l'URL. Ajout de
     `isValidISODate()` dans `src/lib/date.ts` et d'un `notFound()`.

**Reste à faire :**
- **Tester sur un vrai iPhone** — c'est le dernier vrai test qui manque,
  et il ne peut pas être fait depuis une session Claude Code : Safari →
  Partager → Sur l'écran d'accueil, puis vérifier l'icône, l'absence de
  barre d'adresse en standalone, le splash screen et le lancement hors
  connexion.
- Éventuel : `vercel git connect` pour les déploiements automatiques à
  chaque push, et définir `main` comme branche par défaut côté GitHub.

- Éventuel : export CSV des données, rappel de médicament programmable,
  édition/suppression explicite d'une entrée depuis le calendrier (l'édition
  fonctionne déjà via `/jour/[date]`, mais pas de suppression dédiée).
- Icône `favicon.ico` actuelle est un simple PNG 32×32 renommé — suffisant
  pour tous les navigateurs modernes, mais pas un vrai multi-résolution
  `.ico` si besoin d'une compatibilité IE historique (non pertinent ici).
