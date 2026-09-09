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

## Direction artistique — "Nocturne"

Direction **implémentée** (validée par l'utilisatrice après comparaison de
trois pistes, voir `design/themes.html`). **Premium et féminine**, éditoriale,
sans cliché pastel/lavande ni esthétique "IA générique".

**Pourquoi un fond sombre** : ce carnet se remplit le soir et pendant la
douleur. Un fond ivoire éblouit dans le noir. L'aubergine est chaud, jamais
gris ni noir clinique.

**Palette** (`src/app/globals.css`, tokens Tailwind v4 via `@theme inline`).
Contrastes **calculés** WCAG 2.1 contre le fond `#1A1016` :
- `ground` `#1A1016` — aubergine profond, fond de l'app.
- `surface` `#241820` / `surface-2` `#2E2029` — plans relevés.
- `text` `#F4EAE6` — 15.72:1.
- `muted` `#C3AEB0` — 8.85:1.
- `coral` `#F0937B` — accent : crise, scores, liens actifs. 8.11:1.
- `brass` `#D4A64A` — pastille médicament. 8.28:1.
- `sage` `#9DBA97` — tendances positives (sommeil, humeur). 8.77:1.

L'app est sombre par nature : pas de bascule clair/sombre, `color-scheme: dark`.

**Typographies** (`next/font/google`, dans `src/app/layout.tsx`) :
- **Libre Bodoni** (`--font-bodoni` / classe `font-display`) — contraste
  typographique de la presse de mode. Porte le logotype, les dates et les
  scores. Choisi contre Playfair Display, trop vu et glissant vers le
  générique.
- **Public Sans** (`--font-public-sans` / `font-sans`) — interface et texte
  courant. Ni Inter, ni Geist.

**Principes de design** :
- **Cibles tactiles d'abord** : crans de réglette à 44 px, pilules à 52 px,
  boutons de nav à 56 px. C'est la contrainte qui a dicté le dessin — la
  version précédente affichait des pastilles de 5 px, quasi invisables
  pendant une crise.
- Filets fins (`.hairline`) plutôt que des cards à ombre portée. Sur fond
  sombre, c'est l'écart de valeur qui sépare les plans.
- Composants faits main : `Toggle`, `TagInput`, `Field` (libellé montant),
  `MonthRing`, `TrendLine`. Aucune librairie de composants ni de charts.
- **Exception assumée** : `RangeSlider`
  (`src/components/ui/be-ui-range-slider.tsx`) est adapté d'un composant du
  catalogue 21st, à la demande de l'utilisatrice. Il porte les notes de 0 à
  10 via `ScoreSlider`. Adapté, pas collé : piste à 48 px au lieu de 40,
  tokens Nocturne au lieu des variables shadcn, `cn` du projet au lieu d'un
  doublon, prop `unset` ajoutée pour distinguer « 0 » de « non renseigné »,
  et repères réalignés (l'original les décale jusqu'à 9 px de la poignée à
  fond d'échelle). Apporte les dépendances `motion`, `clsx`,
  `tailwind-merge`.
- **Calendrier en anneau** (`MonthRing`) plutôt qu'en grille : une grille de
  tableur ne raconte rien d'un cycle. Les jours restent ouvrables grâce à
  des secteurs de clic transparents (72 × 56 px de boîte englobante, mesuré).
- Icônes maison en SVG inline (`src/components/icons.tsx`), trait 1.5.
- Logotype : "endo" en Libre Bodoni italique, sans cartouche.
- **Navigation basse en capsule** (`BottomNav`) : les trois écrans sont des
  pictogrammes, seul l'écran courant s'ouvre en pastille pour dire son nom,
  et la pastille glisse d'un onglet à l'autre (`layoutId` de `motion`).
  Reprend le principe d'une barre repérée par l'utilisatrice sur 21st ;
  réécrite avec les tokens Nocturne, les icônes maison et des cibles de
  56 px, pas collée. La capsule est `sticky` : elle reste au pouce sans
  jamais recouvrir la fin du formulaire (une position collante garde sa
  place dans le flux). Le libellé visible est `aria-hidden`, le nom passe
  par `aria-label` — les trois destinations s'annoncent pareil, ouvertes
  ou repliées.
  **Deux points de géométrie appris à l'usage, à ne pas défaire :**
  1. Les trois emplacements font exactement le même tiers de la barre
     (`flex-1 min-w-0`) et la pastille occupe précisément le sien
     (`absolute inset-0`). Deux versions ont échoué avant, toutes deux
     signalées par l'utilisatrice : l'une élargissait l'onglet actif — les
     icônes voisines sautaient d'un coup en CSS pendant que la pastille
     glissait sur un ressort ; l'autre laissait la pastille s'ajuster à son
     libellé — elle **débordait de la capsule** dans le coin arrondi. À
     taille fixe la pastille ne fait plus que se translater : les deux
     tracés sont concentriques (6 px d'écart partout) et un onglet non
     concerné ne bouge pas d'un pixel. Vérifié à 375, 390 et 430 px de
     large : pastille dans la capsule et libellé dans la pastille, sur les
     trois onglets.
  2. La pastille suit l'appui, pas le serveur (`tapped` optimiste, la
     route reprend la main à son arrivée) : 128 ms de réaction au lieu
     d'attendre l'aller-retour.
  3. **Pas de `backdrop-blur` sur la capsule.** Un fond flouté qui se
     recalcule à chaque image pendant qu'un libellé s'ouvre au-dessus,
     c'est ce qui rendait le texte saccadé sur iPhone — Safari repeint
     toute la zone floutée à chaque frame. La capsule est opaque, le
     dégradé du conteneur suffit à décoller le contenu qui passe derrière.
- Micro-interactions : sauvegarde automatique silencieuse mais **jamais
  muette en cas d'échec** (voir § Sauvegarde), transitions d'état des
  contrôles. `prefers-reduced-motion` coupe tout globalement, y compris
  les animations `motion` (via `useReducedMotion`).

## Thèmes — `design/themes.html`

Les trois directions visuelles explorées sont réunies dans un fichier unique,
**`design/themes.html`** (ouvrir dans un navigateur) : palettes avec contrastes
WCAG calculés, typographies, composants signature, et les blocs de tokens prêts
à coller dans `@theme inline` de `globals.css`.

- **Nocturne** — aubergine profond, Libre Bodoni + Public Sans, calendrier en
  anneau. Pensée pour la saisie de nuit, en douleur. **C'est la direction en
  place.**
- **Sérum** — clair, Syne + Manrope, calendrier en code-barres. Très lisible
  pour la donnée, mais moins féminine et le code-barres n'est pas tapable
  jour par jour.
- **Herbier** — crème, Newsreader + Public Sans, formes organiques, calendrier
  en grille souple (le plus facile à taper des trois).

**Nocturne est implémentée** (§ Direction artistique ci-dessus). Les deux
autres restent documentées comme alternatives : la planche sert de référence
si tu veux revenir en arrière ou repartir sur l'une d'elles. « Atelier », la
toute première direction, n'existe plus que dans l'historique Git.

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
- **Auth** : `@supabase/ssr`, session en cookies (⚠️ **pas** `HttpOnly` :
  `@supabase/ssr` les pose en `httpOnly: false` par conception, car
  `createBrowserClient` doit lire la session depuis `document.cookie` pour
  la couche de données côté client — c'est inhérent à la librairie, pas un
  oubli ; sans faille XSS dans l'app, il n'y a pas de chemin d'exploitation,
  mais ne pas le documenter à tort comme HttpOnly), rafraîchie dans
  `src/proxy.ts` (le fichier `middleware.ts` a été renommé `proxy.ts` —
  convention Next.js 16). Redirige vers `/connexion` si non connecté,
  vers `/accueil` si déjà connecté sur les pages d'auth.
- **Structure des dossiers** :
  ```
  src/app/
    (auth)/connexion, (auth)/inscription, (auth)/actions.ts   — auth (Server Actions)
    (app)/accueil, (app)/calendrier, (app)/jour/[date],
          (app)/statistiques, (app)/layout.tsx                — zone connectée (nav, garde d'auth)
    manifest.ts, layout.tsx, globals.css                       — shell + PWA
  src/components/
    ui/            — Button, Card, ScoreSlider, Toggle, TagInput, Wordmark
    icons.tsx       — set d'icônes maison
    daily/          — formulaire de saisie quotidienne (réutilisé par /accueil et /jour/[date])
                      + ScoreWizard (les quatre notes, une par écran)
    calendar/       — grille mensuelle
    stats/          — courbes de tendance dessinées à la main
    pwa/            — enregistrement du service worker, invite iOS "à l'écran d'accueil"
    app-shell/      — barre de navigation basse (capsule + pastille glissante)
  src/lib/
    supabase/       — clients browser/server/proxy + types
    entries-client.ts, pending-entries.ts, date.ts, stats.ts, cn.ts
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
- **MCP 21st (21st.dev)** : **installé** (session du 2026-09-08). Déclaré
  dans `.mcp.json` à la racine, versionné, avec la clé lue depuis la
  variable d'environnement `TWENTYFIRST_API_KEY` — jamais en clair, le
  dépôt étant public. Attention : un serveur MCP ajouté en cours de
  session n'est chargé qu'au démarrage de la suivante.
- **8 skills versionnées dans `.claude/skills/`** pour être disponibles
  à chaque session sans réinstallation :
  - `ui-ux-pro-max` (nextlevelbuilder/ui-ux-pro-max-skill, MIT, 3,6 Mo) —
    119 règles UX, 192 palettes, 74 associations de polices, catalogues
    d'icônes et de stacks, le tout en données locales interrogeables via
    `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<requête>" --domain ux`.
    Code relu avant installation : aucun appel réseau, aucun subprocess,
    aucun eval, aucune écriture de fichier.
  - `21st-ai`, `21st-cli-use`, `21st-design-sync`, `21st-registry`,
    `21st-ui-build`, `21st-ui-explore`, `21st-ui-review` — installées par
    `npx @21st-dev/cli install-skill` puis versionnées. Ce sont de simples
    SKILL.md qui pilotent le CLI `21st`.
  ⚠️ Ne pas les réinstaller par commande : elles sont dans le dépôt. Les
  réinstaller au niveau du conteneur (`~/.claude/skills/`) ne survivrait
  pas à la fin de la session.
- **Rappel anti-générique** : le MCP 21st sert à piocher des composants
  dans une bibliothèque partagée, ce qui va frontalement contre la
  contrainte n°1 du projet. À utiliser pour l'audit et l'inspiration, pas
  pour coller des composants tout faits dans l'app — la direction
  "Atelier" est faite main exprès.
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
  charts — tout est fait main pour tenir la direction artistique. Seule
  exception à ce jour : `RangeSlider`, adapté du catalogue 21st sur demande
  explicite (voir § Direction artistique).
- `cn` (`src/lib/cn.ts`) s'appuie sur `clsx` + `tailwind-merge` : les
  conflits de classes Tailwind sont résolus, la dernière l'emporte. Un
  composant peut donc accepter un `className` qui écrase ses valeurs par
  défaut.

## Sauvegarde — ce qui se passe quand le réseau lâche

Le carnet se remplit le soir, souvent au lit, parfois sans réseau. La
sauvegarde automatique avalait l'échec en silence : l'app affichait
« Enregistré », rien n'était parti, et la journée disparaissait au
rechargement. Sur un carnet de douleur, c'est la panne la plus grave
possible — on note une crise une fois, on ne la reconstitue pas après coup.

Le dispositif tient en trois pièces :
- `src/lib/pending-entries.ts` — file d'attente dans `localStorage`, une
  entrée par journée, **clé portant l'identifiant du compte**
  (`endo:pending:<user_id>:<date>`) : deux personnes peuvent partager un
  téléphone, une journée en attente ne doit jamais partir dans le compte de
  l'autre. Tous les accès sont enveloppés — Safari en navigation privée
  lève sur `localStorage`.
- `DailyEntryForm` — l'échec passe le statut à `error`, écrit la journée
  dans la file, affiche un encart `role="alert"` (« ta journée est gardée
  sur cet appareil ») avec un bouton « Réessayer maintenant », et relance
  l'envoi tout seul sur l'événement `online`. Au chargement, une journée en
  attente **prime sur ce que renvoie le serveur** : c'est la saisie qui n'a
  jamais pu partir, donc la plus récente.
- `PendingSync` (monté dans `(app)/layout.tsx`) — rejoue les journées
  restées en attente sur *d'autres* dates, sans rien afficher. Sans lui, une
  journée saisie hors-ligne n'aurait redémarré qu'en rouvrant exactement cet
  écran-là. Un verrou (`claimDate`/`releaseDate`) l'empêche de doubler le
  formulaire ouvert.

Corrigé au passage : le garde-fou `hydrated` ne bloquait pas la sauvegarde
déclenchée par le chargement (la ref passait à `true` dans le même tour que
le `setDraft`), si bien qu'**ouvrir une journée l'écrivait en base**, y
compris une journée vide. La comparaison porte maintenant sur une empreinte
du brouillon (`saved.current`), donc rien ne part si rien n'a bougé.

Vérifié en conditions réelles : 19 assertions Playwright (Supabase simulé au
niveau réseau, ce qui permet de couper l'envoi à l'instant voulu) — échec
annoncé, journée gardée, saisie retrouvée après rechargement hors-ligne,
reprise manuelle, reprise automatique au retour du réseau, rattrapage depuis
un autre écran, cloisonnement entre comptes, et aucune écriture parasite à
l'ouverture d'une journée.

## Vitesse de navigation

Mesuré en production (avec une vraie session) : un changement d'onglet
coûtait **400 à 900 ms** d'aller-retour serveur, pendant lesquelles rien ne
bougeait à l'écran. Les trois écrans sont dynamiques (`ƒ`) parce que
`(app)/layout.tsx` lit les cookies pour vérifier la session ; s'y ajoute le
`getUser()` du proxy (~150 ms) sur chaque requête, y compris les requêtes RSC.

Deux corrections, sans toucher au modèle d'authentification :
- **`src/app/(app)/loading.tsx`** — sans frontière de chargement, Next.js ne
  peut *rien* précharger d'une route dynamique : le `<Link>` de la barre
  n'avait rien en cache et l'écran restait figé sur la page précédente. Avec
  elle, la coquille est préchargée dès que la barre est visible et s'affiche à
  l'appui. Le gabarit reprend le rythme réel des écrans (filets fins, mêmes
  marges) pour que la transition passe inaperçue.
- **Pastille optimiste** dans `BottomNav` (voir § Direction artistique).

Si un jour il faut aller plus loin, le levier restant est le `getUser()` du
proxy : le remplacer par une vérification locale du JWT rendrait la
navigation encore plus rapide, mais c'est un vrai choix de sécurité à
peser — ne pas le faire à la légère (l'app ne lit aucune donnée côté
serveur, tout passe par la RLS côté client, donc le risque est faible, mais
ça mérite d'être décidé, pas subi).

## Évaluer la journée — les notes, une par écran

L'écran d'accueil empilait quatre réglettes (douleur, sommeil, humeur,
énergie) : quatre questions à tenir en tête d'un coup, et une page longue
avant d'arriver au reste. À la demande de l'utilisatrice, elles sont passées
derrière **un seul bouton**, et se remplissent une par écran avec
« Suivant » (`src/components/daily/score-wizard.tsx`).

- Le bloc « Ressenti » de l'accueil ne garde que ce qui se lit d'un coup
  d'œil : « Évaluer la journée » tant que rien n'est noté, sinon les quatre
  notes en résumé. Le bloc entier est le bouton (98 px de haut).
- Rouvrir repart **à la première question sans réponse**, pas au début.
- Chaque note part vers le brouillon dès qu'elle bouge, pas à la fin : on
  peut fermer au milieu sans rien perdre — ce qui compte quand on abandonne
  parce que la douleur reprend. « Suivant » n'exige rien, une note peut
  rester vide (« non renseigné », pas zéro).
- L'animation entre questions ne touche qu'`opacity` et `transform`, jamais
  la géométrie (leçon de la barre de navigation), et disparaît sous
  `prefers-reduced-motion`.

⚠️ **Piège rencontré, à ne pas réintroduire** : l'effet qui donne le focus au
dialogue partageait ses dépendances avec l'écouteur d'Échap, donc `onClose` —
une fonction recréée à chaque rendu du parent. Il se rejouait à **chaque
note saisie** et reprenait le focus : au clavier, une seule flèche était
prise en compte, les suivantes tombaient dans le vide. Le focus a maintenant
son propre effet monté une seule fois, et le parent passe des callbacks
stables (`useCallback`). Trouvé en testant, invisible au build et au lint.

**Renommage `/aujourdhui` → `/accueil`** : l'onglet et la route s'appellent
désormais « Accueil ». Deux précautions pour ne pas casser une app déjà
posée sur un écran d'accueil :
- `next.config.ts` redirige `/aujourdhui` vers `/accueil` (307, non
  permanente — pour ne pas graver la redirection dans le cache de Safari) :
  le `start_url` figé dans le manifeste installé continue de fonctionner ;
- **`id` du manifeste reste `/aujourdhui`**. C'est lui qui identifie l'app
  installée : le changer ferait apparaître un second raccourci au lieu de
  mettre à jour le premier. Ne pas « corriger » cette incohérence apparente.

## PWA

- **Manifest** : `src/app/manifest.ts` (route générée
  `/manifest.webmanifest`), `display: standalone`, `start_url:
  /aujourdhui`, icônes 192/512 + variante `maskable` 512.
- **Icônes** : générées par `scripts/generate-icons.mjs` dans
  `public/icons/` (16, 32, apple-touch-icon 180, 192, 512, 512 maskable)
  et `public/splash/` (5 résolutions iPhone courantes). Relancer
  `node scripts/generate-icons.mjs` si le monogramme change.
  ⚠️ **Le glyphe est converti en tracé vectoriel par `opentype.js`, jamais
  rendu comme du `<text>`.** Raison : `resvg` ignore silencieusement la
  police passée via `fontBuffers` et retombe sur les polices système —
  vérifié en comparant les empreintes, le rendu avec tampon de police est
  bit à bit identique au rendu avec les polices système. Les icônes des
  premières sessions étaient donc en police de repli sans que ça se voie,
  alors que la doc affirmait le contraire. En tracé, c'est déterministe.
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
  défaut (`zinc`, `indigo`...) — rester sur les tokens `ground/surface/
  text/coral/brass/sage` définis dans `globals.css`.
- Ne pas descendre sous 44 px pour une cible tactile : c'est la contrainte
  qui a motivé la refonte, la reperdre annulerait le gain principal.
- Ne pas importer un set d'icônes (Heroicons, Lucide, Feather...) tel
  quel — étendre `src/components/icons.tsx` à la main.
- Ne pas ajouter de librairie de composants (shadcn/MUI/Chakra) ni de
  librairie de charts (Recharts/Chart.js...) — composer avec les
  primitives existantes dans `src/components/ui/` et `src/components/
  stats/`. Un composant tiers ne s'intègre qu'adapté : tokens du projet,
  cibles tactiles ≥ 44 px, `cn` du projet, et vérification que
  l'interaction reste possible sans glisser (WCAG 2.5.7).
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

- **Sauvegarde à l'épreuve du réseau** : file d'attente locale cloisonnée
  par compte, échec annoncé, reprise manuelle et automatique, rattrapage en
  arrière-plan (voir § Sauvegarde). 19 assertions Playwright au vert.
- **Navigation basse refondue en capsule** avec pastille glissante et trois
  icônes dessinées pour ces écrans (`JournalIcon`, `RingIcon`, `TrendIcon`).

- **Navigation rendue instantanée** : frontière de chargement pour permettre
  le préchargement, pastille optimiste, emplacements de largeur fixe.
  6 assertions Playwright (avec latence serveur simulée).

- **Notes de la journée en parcours pas à pas** (`ScoreWizard`) et onglet
  « Aujourd'hui » renommé « Accueil », avec redirection de l'ancienne route.
  15 assertions Playwright au vert.

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
