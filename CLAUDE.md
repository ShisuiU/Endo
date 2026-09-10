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
  `MonthRing`, `TrendLine`, `Nombre` (un nombre composé en Bodoni dans le
  fil du texte — le remplaçant des vignettes de chiffres). Aucune librairie de composants ni de charts.
  **Il n'y a volontairement pas de composant `Card`** — il a existé, il a été
  supprimé avec les blocs qu'il servait. `src/components/ui/card.tsx` ne
  contient plus que l'intertitre `CardLabel`, et dit pourquoi.
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
  **Trois niveaux de trait** : journée notée (franc), crise (épais, corail),
  journée laissée vide (court et pâle, 0.22 d'opacité). L'anneau dessinait
  auparavant le même trait dans tous les cas — un mois entièrement rempli
  était visuellement identique à un mois vide, ce qui n'est apparu qu'en
  peuplant un compte pour de vrai.
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
          (app)/statistiques, (app)/reglages,
          (app)/layout.tsx                                     — zone connectée (nav, garde d'auth)
    manifest.ts, layout.tsx, globals.css                       — shell + PWA
  src/components/
    ui/            — Button, CardLabel, ScoreSlider, Toggle, TagInput,
                      Wordmark, Nombre (chiffre en Bodoni dans le texte)
    icons.tsx       — set d'icônes maison
    daily/          — DayWizard (la journée, une question par écran),
                      DaySummary (le résumé de l'accueil), DailyEntryForm
                      (état + sauvegarde, réutilisé par /accueil et /jour/[date])
    calendar/       — le mois en anneau (MonthRing)
    stats/          — courbes de tendance dessinées à la main
    pwa/            — enregistrement du service worker, invite iOS "à l'écran d'accueil"
    app-shell/      — navigation : capsule basse (téléphone), barre d'en-tête
                      (écran large), items et onglet actif partagés, et
                      ReadingColumn (la largeur de colonne, par route)
  src/lib/
    supabase/       — clients browser/server/proxy + types
    entries-client.ts, profile-client.ts, pending-entries.ts,
    csv.ts, date.ts, stats.ts, foods.ts, cn.ts
  supabase/migrations/0001_init.sql
  scripts/generate-icons.mjs   — génère public/icons + public/splash
  ```
- **Pourquoi Supabase** : palier gratuit généreux, Postgres + Auth + RLS
  gérés, évite d'écrire un backend/API maison pour un projet perso — choix
  validé avec l'utilisateur en cadrage.

## Déploiement

- **Hébergement : Vercel**, projet `endo` (compte `thebestsam37-1731`, offre
  Hobby), déployé via la CLI (`vercel deploy --prod`), pas encore relié à
  Git. Production : **https://endo-seven.vercel.app**
- **`vercel.json` fixe la région des fonctions à `cdg1` (Paris)**, au plus
  près de la base. À ne pas supprimer — voir § Vitesse de navigation pour
  les mesures. Le choix de région fonctionne bien en offre Hobby, contrairement
  à ce qu'on pourrait craindre.
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
  pour coller des composants tout faits dans l'app — la direction Nocturne
  est faite main exprès.
  **Usage qui marche vraiment, éprouvé** : chercher dans le catalogue le
  motif qu'on s'apprête à dessiner, pour vérifier qu'on n'est *pas* en train
  de refaire le composant le plus courant du marché. C'est ainsi que les
  deux vignettes de chiffres ont été confondues (voir § Le jour où deux
  blocs génériques sont passés). Et quand un résultat sort du lot — ici un
  « Editorial Testimonial », grand chiffre pâle posé à côté du texte, sans
  boîte — en retenir l'**idée** (le nombre comme ornement typographique,
  pas comme badge coloré), jamais le code.
- **Skill `ui-ux-pro-max`** : interrogée sur les cibles et espacements
  tactiles pendant cette refonte. Utile comme garde-fou chiffré (44 pt iOS,
  8 px entre deux cibles adjacentes), pas comme source de direction
  artistique.
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

### Ce qu'on ressent, et ce que ça coûte vraiment

Mesuré en production avec une vraie session : un changement d'onglet demande
un aller-retour serveur d'environ **500 ms**, mais **l'écran répond en
~100 ms** — la pastille suit l'appui et l'écran d'attente est déjà en cache.
Les deux chiffres sont vrais, ils ne mesurent pas la même chose ; ne pas
« optimiser » le second en croyant corriger le premier.

Deux corrections avaient rendu la barre vive, sans toucher au modèle
d'authentification :
- **`src/app/(app)/loading.tsx`** — sans frontière de chargement, Next.js ne
  peut *rien* précharger d'une route dynamique : le `<Link>` de la barre
  n'avait rien en cache et l'écran restait figé sur la page précédente. Avec
  elle, la coquille est préchargée dès que la barre est visible et s'affiche à
  l'appui. Le gabarit reprend le rythme réel des écrans (filets fins, mêmes
  marges) pour que la transition passe inaperçue.
- **Pastille optimiste** dans `BottomNav` (voir § Direction artistique).

### ⚠️ La fonction doit rester à Paris (`vercel.json`)

Les fonctions Vercel tournaient à **Washington (`iad1`)**, la base Supabase
est à **Paris (`eu-west-3`)** : chaque accès à la base traversait
l'Atlantique. `vercel.json` fixe désormais `"regions": ["cdg1"]` (Paris).
**Ne pas retirer ce fichier** — le réglage du projet côté Vercel, lui, est
toujours sur `iad1`, c'est `vercel.json` qui le remplace au déploiement.

Mesuré par A/B, avec une sonde temporaire qui chronométrait depuis la
fonction elle-même (déployée, mesurée, retirée) :

| depuis la fonction | `iad1` (Washington) | `cdg1` (Paris) |
| --- | --- | --- |
| valider une session | 285 ms | **32 ms** |
| une requête sur la base | 277 ms | **36 ms** |

Piège de méthode, à retenir : **mesuré depuis un conteneur américain, le
changement ne se voyait pas** — rapprocher la fonction de la base l'éloignait
d'autant de moi, et les deux effets s'annulaient. Il a fallu chronométrer
*à l'intérieur* de la fonction pour voir le gain. Pour quelqu'un en France,
où le point d'entrée Vercel est déjà Paris, il n'y a pas de contrepartie :
c'est tout bénéfice.

Si un jour il faut aller plus loin, le levier restant est le **doublon de
validation** : le proxy et `(app)/layout.tsx` appellent tous deux `getUser()`.
En retirer un économiserait une trentaine de millisecondes — beaucoup moins
qu'avant le changement de région, donc la question n'est plus vraiment
posée. C'est de toute façon un choix de sécurité à peser : l'app ne lit
aucune donnée côté serveur, tout passe par la RLS côté client, mais ça
mérite d'être décidé, pas subi.

## La journée entière, une question par écran

L'écran d'accueil était un long formulaire : crise, intensité, quatre notes,
médicament, aliments, notes libres, tout empilé. Il fallait décider soi-même
par où commencer, et la page se déroulait sans fin. À la demande de
l'utilisatrice, **tout est passé derrière un seul bouton**
(`src/components/daily/day-wizard.tsx`), et l'accueil ne montre plus que le
**résumé du jour** (`src/components/daily/day-summary.tsx`).

Le parcours, dans l'ordre : crise → [intensité] → douleur → sommeil →
humeur → énergie → médicament (+ détail) → repas → notes. Huit questions,
neuf s'il y a eu une crise.

Trois règles tiennent le parcours :
- **rien n'est obligatoire** — « Suivant » avance toujours, une note peut
  rester vide (« non renseigné », jamais zéro) ;
- **chaque réponse part vers le brouillon tout de suite**, pas à la fin : on
  peut fermer au milieu sans rien perdre, ce qui compte quand on abandonne
  parce que la douleur reprend ;
- **les questions sans objet disparaissent** — pas d'intensité sans crise,
  pas de détail de médicament sans médicament. La liste des étapes est
  recalculée à chaque réponse, et le compteur suit (1/8 ↔ 1/9). L'index
  courant est borné (`safeIndex`) : répondre « non » à la crise pourrait
  sinon pointer au-delà de la liste.

**L'appel à noter la journée est le premier élément de l'accueil**
(`src/components/daily/day-call.tsx`). Une session de cette app, c'est très
souvent *ça et rien d'autre* : on ouvre, on remplit, on referme. Il porte donc
le seul mouvement de la page — un halo corail qui respire lentement (7 s,
opacité et échelle uniquement) derrière un bouton de 64 px. **Le halo s'éteint
dès que les quatre notes sont données** : il n'y a plus rien à réclamer, et
l'accueil redevient un écran de lecture. Le titre change avec l'état
(« Comment s'est passée ta journée ? » / « Il reste des questions. » /
« Journée notée. »).

L'accueil ne sert plus à saisir, mais à **relire**. Le résumé est **une
phrase**, comme dans un carnet papier : « Crise à 7/10. Douleur 3, sommeil 4,
humeur 5, énergie 6. Spasfon, 14 h. Riz. « Journée difficile. » » — les
nombres composés en Bodoni dans le fil du texte, la crise seule en corail.
**Chaque fragment est tapable** et rouvre le parcours à sa question, pour
corriger sans repasser par le reste.

Ce sont des cibles *en ligne dans un texte* : la règle de taille minimale
(WCAG 2.5.8) les exempte explicitement, et l'interligne à 2.1 donne de toute
façon des lignes d'environ 44 px. Les fragments qui ouvrent une phrase
prennent une majuscule d'attaque — le texte vient de la saisie, et sans ça on
lisait « Spasfon, 14 h. riz. »

**Trois versions ont été nécessaires**, les deux premières écartées par
l'utilisatrice : un bloc-carte, puis une suite de lignes « libellé — valeur ».
Une liste de paires reste un tableau, quelle que soit la peinture qu'on met
dessus. Ne pas « ranger » ce résumé en colonnes, en vignettes ou en lignes.
Tant que la journée est vierge, le résumé laisse place à une simple
invitation. Le bouton dit ce
qu'il fait : « Évaluer la journée » / « Compléter la journée » (une note
manque) / « Revoir la journée ».

⚠️ **Piège rencontré, à ne pas réintroduire** : l'effet qui donne le focus au
dialogue partageait ses dépendances avec l'écouteur d'Échap, donc `onClose` —
une fonction recréée à chaque rendu du parent. Il se rejouait à **chaque
réponse** et reprenait le focus : au clavier, une seule flèche était prise en
compte, les suivantes tombaient dans le vide. Le focus a maintenant son
propre effet monté une seule fois, et le parent passe des callbacks stables
(`useCallback`). Trouvé en testant, invisible au build et au lint.

L'animation entre questions ne touche qu'`opacity` et `transform`, jamais la
géométrie (leçon de la barre de navigation), et disparaît sous
`prefers-reduced-motion`.

### Ce qui revient souvent — proposé en toutes lettres

Le carnet se remplit en douleur, au lit, au pouce, et « riz », « poulet »,
« Spasfon, 2 comprimés » sont retapés à l'identique des dizaines de fois.
`fetchHabits()` (`entries-client.ts`) tire d'**une seule requête** sur les
90 derniers jours les six aliments les plus notés et le dernier médicament
écrit. Volontairement borné à 90 jours : ce sont des *habitudes actuelles*,
pas un historique — un aliment abandonné depuis six mois n'a rien à faire
sous le champ. À fréquence égale, départage alphabétique : sans lui la liste
changeait d'ordre d'une ouverture à l'autre et on ne pouvait plus viser de
mémoire.

⚠️ **La forme n'est pas négociable, et le catalogue 21st explique pourquoi.**
Interrogé sur « tag input with suggestions », il donne deux réponses, et ce
sont exactement les deux à éviter : la **liste déroulante d'autocomplétion**
sous le champ, et la **rangée de pastilles** — ce second motif étant, dans
huit résultats sur dix, la rangée de suggestions d'un chat d'IA. Autant
signer l'app.

Ce qui est en place reprend l'idiome que le résumé du jour a déjà installé :
**des mots tapables dans une phrase**. « Souvent : riz, poulet, pain… » sous
le champ des repas, « La dernière fois : Spasfon, 2 comprimés. » sous celui
du médicament. Aucune boîte, aucune pastille, aucun panneau flottant.

- Les mots font **44,8 px de haut** (1 rem sur un interligne de 2.8),
  mesurés. À 0.95 rem et 2.6 ils n'en faisaient que 40 — WCAG 2.5.8 exempte
  les cibles en ligne dans un texte, mais la règle des 44 px est ce qui a
  motivé toute la refonte de l'app, on ne s'en dispense pas.
- Un aliment déjà choisi **quitte la phrase**.
- La proposition de médicament n'apparaît **que si le champ est vide** :
  une fois qu'on écrit, une proposition qui reste affichée devient du bruit.
  Elle revient si on vide le champ.
- Les habitudes sont chargées **à part du brouillon** et leur échec est
  avalé : c'est un confort, il ne doit jamais retarder la saisie ni la faire
  échouer. Hors-ligne, le champ reste simplement nu.

#### Une liste d'amorce, pour le premier soir

Sur un compte neuf, les habitudes sont vides et le champ des repas était nu
le soir où l'on a le moins envie de taper. `src/lib/foods.ts` porte une
courte liste d'aliments courants qui comble ce démarrage à froid, et sert
ensuite d'aide-mémoire — « ah oui, du café ». Demandée par l'utilisatrice
(« une liste d'aliment générique à sélectionner et possibilité d'en
ajouter »).

- **Elle recule à mesure que le carnet apprend.** Le total affiché reste
  autour de dix mots : `commonSuggestions()` rend `10 − nombre d'habitudes`,
  avec un plancher de cinq. Au bout de deux semaines, ce qui s'affiche vient
  presque entièrement de la personne. Le plancher garde une amorce visible
  même avec six habitudes bien installées — c'est là que l'aide-mémoire sert,
  pour l'aliment qu'on ne mange qu'une fois par mois.
- **Deux lignes, deux sources** : « Souvent : … » (ce qui a déjà été noté),
  puis « Ou bien : … ». Sans habitudes, la seconde s'annonce « Par
  exemple : … » — « ou bien » suppose une première liste.
- **Comparaison souple** (`normaliseFood`, casse et accents) : le champ est
  libre, « Fromage » et « fromage » sont le même aliment. Sans ça la liste
  reproposait ce qui venait d'être choisi.
- **Ordre fixe**, comme celui des habitudes : une liste qui bouge d'une
  ouverture à l'autre ne se vise plus de mémoire.
- ⚠️ **Ce n'est pas une liste de déclencheurs.** Des aliments ordinaires d'un
  repas français, pas une nomenclature et pas un tri « bon / mauvais » :
  l'app note ce qui a été mangé, elle ne donne pas d'avis médical. Pour la
  même raison, **le médicament n'a pas de liste d'amorce** — proposer des
  noms de molécules, c'est orienter vers un produit ; il garde son unique
  « La dernière fois : … », tiré de ce que la personne a elle-même écrit.
- Rien n'y est enfermé : le champ reste libre, et ce qu'on y tape devient une
  habitude au bout de quelques journées. C'est ça, la « possibilité d'en
  ajouter » — pas un écran de gestion de liste.

25 assertions Playwright : ordre par fréquence puis alphabétique, six
habitudes au plus, amorce qui ne répète jamais une habitude ni un aliment
déjà choisi, total borné, casse et accents, hauteur de cible mesurée (45 px),
absence de fond et de bordure sur les mots (donc pas de pastille), ajout au
champ depuis les deux lignes, apparition et disparition de la proposition de
médicament, et carnet vierge où l'amorce propose bien dix aliments.

**Renommage `/aujourdhui` → `/accueil`** : l'onglet et la route s'appellent
désormais « Accueil ». Deux précautions pour ne pas casser une app déjà
posée sur un écran d'accueil :
- `next.config.ts` redirige `/aujourdhui` vers `/accueil` (307, non
  permanente — pour ne pas graver la redirection dans le cache de Safari) :
  le `start_url` figé dans le manifeste installé continue de fonctionner ;
- **`id` du manifeste reste `/aujourdhui`**. C'est lui qui identifie l'app
  installée : le changer ferait apparaître un second raccourci au lieu de
  mettre à jour le premier. Ne pas « corriger » cette incohérence apparente.

## Statistiques — ce que les repères ont le droit de dire

### Crises groupées en épisodes

Une crise d'endométriose dure rarement une seule journée. `stats.ts`
comptait chaque **jour** de crise comme une crise, si bien que trois jours
consécutifs produisaient deux intervalles d'un jour qui écrasaient la
moyenne : sur deux mois de données réalistes, l'app annonçait
« 6 jours entre deux crises » au lieu de 18. `groupEpisodes()` regroupe
les jours consécutifs, et les intervalles se mesurent **d'un début
d'épisode au suivant**.

### La moyenne ne suffit pas — et parfois elle ment

Des intervalles de 6 et 29 jours donnent une moyenne de 18, un intervalle
qui **n'est jamais arrivé**. L'écran affiche donc l'étendue réelle sous la
moyenne (« dans les faits, elles se sont espacées de 6 à 29 jours »), et
`stats.regular` coupe l'estimation quand l'étendue dépasse la moyenne :
« Trop irrégulier pour une estimation » plutôt qu'une fausse échéance. Sur
un carnet de santé, une prédiction confiante tirée de trois points est pire
que pas de prédiction du tout — ne pas « améliorer » ça en réactivant
l'estimation dans tous les cas.

Deux chiffres complètent la section, tirés de données déjà collectées mais
jusque-là muettes : la **durée moyenne d'un épisode** et le **nombre de jours
avec médicament** sur la fenêtre de 21 jours. Ils sont **écrits dans une
phrase**, les nombres composés en Bodoni dans le fil du texte — et en couleur
de texte, pas en corail : l'accent est déjà pris par l'intervalle juste
au-dessus, et trois nombres coraux dans la même section ne font plus ressortir
aucun. Ici la hiérarchie vient de la taille et de la police, pas de la
couleur.

### « À rattraper » : supprimé

Un bloc listait sur l'accueil les journées vides des sept derniers jours, pour
les rattraper d'un geste. **Retiré à la demande de l'utilisatrice** — ne pas
le réintroduire sans le lui redemander. Le calendrier reste la porte d'entrée
des jours passés, et son anneau distingue désormais un jour noté d'un jour
vide (voir § Direction artistique), ce qui suffit à les repérer.

## `scripts/seed-demo.mjs` — peupler un compte

`SUPABASE_ACCESS_TOKEN=sbp_... node scripts/seed-demo.mjs <email> [jours]
[--full] [--from=AAAA-MM-JJ]` écrit des journées vraisemblables (crises groupées en début de cycle de 27 à
30 jours, douleur/sommeil/humeur/énergie corrélés, médicament surtout les
jours de crise, ~12 % de journées non saisies pour que le carnet ait des
trous — `--full` les remplit toutes). Générateur déterministe : relancer
donne exactement les mêmes journées.

⚠️ La poussée isolée hors cycle n'est ajoutée qu'au-delà de 45 jours de
période. Ajoutée systématiquement, elle rapprochait trop les crises sur une
période courte et faussait l'intervalle moyen affiché dans les repères
(11 jours au lieu de 18).

Garde-fous, à conserver si le script évolue :
- il **n'écrase jamais** une vraie journée ; il ne réécrit que les siennes,
  reconnues à leur marque `[démo]` ;
- chaque journée écrite porte la marque `[démo]` en fin de notes, et
  `--clear` ne supprime **que** celles-là ;
- la clé `service_role` n'est **jamais écrite sur le disque** : soit elle
  vient de l'environnement, soit le script la demande à la Management API et
  elle ne vit que dans le processus.

⚠️ Ce sont de fausses données : tant qu'elles sont là, elles se mélangent aux
vraies dans le calendrier et les repères.

## Réglages — `/reglages`

Quatrième écran, **volontairement absent de la barre du bas** : elle reste à
trois onglets (sa géométrie en tiers en dépend, voir § Direction
artistique). On y accède par l'icône de l'en-tête — deux réglettes décalées
plutôt qu'une roue dentée, parce que l'app est faite de réglettes et que le
réflexe de la roue dentée est générique.

- **Ton compte** — email, prénom, déconnexion. Le prénom (`profiles.
  display_name`) était recueilli à l'inscription et stocké par le trigger,
  mais **jamais relu nulle part** : les réglages le rendent enfin visible et
  modifiable. Il s'enregistre au fil de la frappe, comme le carnet.
  La déconnexion reste une Server Action — c'est le serveur qui doit effacer
  les cookies de session. Vérifié : plus aucun cookie `sb-*-auth-token`
  après coup.
- **Tes données** — export CSV et effacement total.
- **L'app** — le geste d'installation iOS, rappelé au calme (l'invite
  automatique, elle, ne s'affiche qu'une fois).

### Export CSV

`src/lib/csv.ts`. Deux choix qui ne s'improvisent pas :
- **séparateur `;` et BOM UTF-8** — c'est ce qu'attend Excel en
  configuration française. Sans le BOM les accents sortent en mojibake ;
  avec une virgule, tout atterrit dans une seule colonne ;
- **échappement** des champs contenant `;`, `"` ou un saut de ligne
  (guillemets doublés) — les notes libres en contiennent forcément un jour.

Sur iPhone, un `<a download>` en mode standalone ne donne rien de fiable. On
passe donc par `navigator.share({ files })` quand le navigateur l'accepte —
la feuille de partage sait où envoyer le fichier (Fichiers, Mail, un message
au médecin) — et on retombe sur le téléchargement classique ailleurs.
Annuler la feuille de partage lève une `AbortError` : ce n'est pas un échec,
elle est absorbée sans message d'erreur.

### Suppressions

Deux niveaux, tous deux à confirmation en deux temps :
- **une journée**, depuis `/jour/[date]` uniquement — l'accueil ne se
  supprime pas lui-même, on y revient tous les jours. La journée en attente
  éventuelle est retirée de la file locale **avant** l'appel réseau, sinon
  `PendingSync` la réécrirait juste après ;
- **toutes les journées**, depuis les réglages, avec un rappel de faire un
  export d'abord.

Les deux requêtes filtrent sur `user_id` en plus de la RLS : même si une
policy venait à changer, la suppression ne peut viser que ses propres lignes.

21 assertions Playwright : accès depuis l'en-tête, barre du bas toujours à
trois onglets, prénom relu puis enregistré sans validation, nom de fichier
daté, BOM, en-têtes, échappement des guillemets et points-virgules,
confirmation et renoncement, retour au calendrier après suppression,
effacement total.

## Écran large — l'app tient aussi sur un ordinateur

Elle était dessinée pour 390 px de large et n'avait aucune borne : sur une
fenêtre de 1440 px, le texte s'étirait sur toute la largeur (mesure de
lecture illisible), le bouton principal faisait 1400 px, et la barre pensée
pour le pouce flottait en bas d'un écran où la souris ne va jamais.

Trois décisions, à `md` (768 px) :

- **Une colonne de lecture de 34 rem** (`ReadingColumn`, dans
  `src/components/app-shell/`), partagée par l'en-tête et le contenu. C'est
  la largeur d'une colonne de magazine : l'app reste un carnet, elle ne
  devient pas un tableau de bord parce que l'écran est grand. L'en-tête, lui,
  tient toute la largeur — son filet doit filer d'un bord à l'autre — mais
  son contenu s'aligne sur la colonne.
  ⚠️ **La marge latérale est *dans* la colonne, pas sur l'en-tête.** Posée
  sur `<header>` elle rentrait dans le calcul du centrage, et le logotype
  finissait 24 px à gauche du texte de la page sur un grand écran — invisible
  à 390 px, où les deux sont collés au bord. Une assertion compare
  maintenant les deux axes à chaque largeur.
- **La navigation passe dans l'en-tête** (`HeaderNav`), trois mots avec un
  filet corail sous celui où l'on est ; la capsule du bas devient
  `md:hidden`. Une pastille glissante dans un en-tête ferait décoration.
  ⚠️ Les deux barres sont **montées en même temps** (l'une cachée par CSS) :
  c'est pourquoi `HeaderNav` n'utilise pas `layoutId` — deux pastilles
  partageant le même identifiant se disputeraient l'animation. Le choix de
  l'onglet actif est partagé par `useActiveHref()`
  (`src/components/app-shell/nav-items.ts`), y compris l'optimisme au clic.
- **Le parcours pas à pas devient une colonne de page**, bordée de deux
  filets sur un voile sombre, à la largeur de la colonne — pas une carte
  flottante (le projet n'en veut pas), et pas non plus une question perdue au
  milieu de 1440 px.

Copie neutralisée : « Touche un jour… » → « **Choisis** un jour… ». Le même
texte est lu au doigt et à la souris.

### ⚠️ Débordement horizontal trouvé au passage

Le halo de l'accueil débordait de 40 px de chaque côté (`inset-x-[-2.5rem]`)
et ajoutait **7 px de défilement horizontal** sur un écran de 390 px — donc
sur le téléphone, et seulement les jours non notés, ceux où le halo
s'affiche. Invisible à l'œil, mais la page partait de travers au doigt. Le
halo est désormais `inset-x-0`, avec un dégradé élargi pour compenser.
Une assertion vérifie l'absence de débordement sur les quatre écrans à
390, 768, 1024 et 1440 px.

### Faire respirer le calendrier et les repères (`lg`, 1024 px)

Une colonne unique partout, c'était l'app « la même partout ». Mais deux
écrans ne sont pas du texte : le calendrier et les repères sont des
**figures**, un anneau et des courbes, et une figure a besoin de place. À
partir de `lg`, `ReadingColumn` les laisse aller jusqu'à **58 rem** ; le
carnet (accueil, une journée, réglages) garde sa mesure de 34 rem partout.

C'est la raison d'être de `ReadingColumn` : le **même** composant décide de
la largeur de l'en-tête et de celle du contenu, donc le logotype, la
navigation et le bord gauche du texte restent sur un seul axe. Décidée écran
par écran, la largeur aurait laissé l'en-tête à 34 rem pendant que les
repères s'étalaient à 58 — un titre de section démarrant 17 rem à gauche du
logotype. La largeur suit la route, jamais l'appui : le changement tombe
pile au moment où le contenu est remplacé par la coquille de chargement,
donc il ne se voit pas.

Ce que la place gagnée sert à faire — jamais un simple agrandissement :

- **Calendrier** : l'anneau passe à gauche (616 px au lieu de 496), et tout
  ce qui était empilé dessous vient à sa droite. Ce n'est pas qu'une
  question de largeur : sur un portable la fenêtre est **basse**, et
  l'empilement mobile touchait le bas de l'écran. Mêmes éléments reflowés —
  aucun n'est monté deux fois, contrairement aux deux barres de navigation.
  - **Chaque jour porte son numéro** (tous les cinq seulement sur téléphone,
    où trente-et-un nombres se toucheraient), les repères de cinq restant
    plus francs pour garder le rythme. ⚠️ La taille des numéros est reprise
    en unités SVG (`lg:[font-size:7.5px]`) : 11 unités donnent 11 px sur un
    anneau de 340 px, mais 20 px sur celui de 616 — les numéros criaient
    plus fort que les traits qu'ils repèrent.
  - **Le récit du mois** apparaît à côté — « 9 journées notées sur 30. 4
    jours de crise. » — en prose, nombres en Bodoni, sans boîte. Il n'existe
    qu'au large : c'est la place gagnée qui le paie.
  - Les deux flèches de mois **se rapprochent** en une paire centrée.
    Écartées de 600 px aux deux bouts de l'anneau, elles ne se lisaient plus
    ensemble. Sur téléphone elles restent aux bords, là où le pouce les
    trouve.
- **Repères** : les **trois courbes passent de front**. À 21 points elles se
  comparent bien mieux côte à côte — on voit d'un coup si la douleur monte
  pendant que le sommeil descend, ce que l'empilement obligeait à faire de
  mémoire. Et l'intervalle moyen passe **à gauche** du texte plutôt
  qu'au-dessus, comme la lettrine d'un article ; la mesure du texte, elle,
  ne bouge quasiment pas (34 → 42 ch).

Le blanc à droite de la première section est voulu : sur ces écrans, c'est
le blanc qui fait respirer. Ne pas le remplir d'une troisième colonne de
chiffres — on retomberait sur le tableau de bord que le projet s'interdit.

**70 assertions Playwright** aux quatre largeurs : pas de débordement,
largeur de colonne attendue **route par route**, en-tête et contenu sur le
même axe, une seule navigation visible à la fois, la bonne selon la largeur,
le parcours à la bonne taille et centré, la légende à côté de l'anneau et
les trois courbes sur une rangée à partir de 1024 px (empilées en dessous).

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

## ⚠️ Le jour où deux blocs génériques sont passés

Trois blocs ont été rejetés par l'utilisatrice — « des blocs qui ressemblent
à n'importe quelle IA ». Deux venaient de ma propre initiative, le troisième
a suivi dans la foulée :
- **deux vignettes de chiffres côte à côte** (`grid-cols-2`, filet, fond
  relevé, libellé en petites capitales) sur l'écran Repères ;
- **des pastilles carrées alignées** pour les jours à rattraper, façon
  sélecteur de dates ;
- **le résumé du jour** de l'accueil, bloc arrondi sur fond relevé — puis,
  au tour suivant, sa version en lignes « libellé — valeur ». Une liste de
  paires reste un tableau, quelle que soit la peinture. Il a fallu une
  troisième version, en prose, pour que ça passe.

Les deux respectaient pourtant la palette, les filets fins et les cibles
tactiles. Ce n'était pas la peinture qui clochait, c'était **le motif** : la
vignette de KPI et la rangée de pastilles sont les patrons les plus courants
des bibliothèques de composants. Vérifié en interrogeant le catalogue 21st
sur « stat display » : **sept résultats sur huit s'appellent littéralement
« Stat Card » / « Statistics Card » / « KPI stat card »**.

Ce qui les a remplacés : des phrases avec les nombres composés dans le fil du
texte, et des lignes séparées par des filets. Aucune boîte.

**Règle à retenir** : dans ce projet, un chiffre ou une liste **ne se met pas
dans une boîte**. La page est un carnet, pas un tableau de bord — la
hiérarchie passe par la taille, la police et les filets. Avant d'ajouter un
bloc, se demander : est-ce que je viens de dessiner une carte de KPI ?

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

- **Journée entière en parcours pas à pas** (`DayWizard`) : crise,
  intensité, les quatre notes, médicament, repas, notes libres. L'accueil est
  devenu un résumé relisible dont chaque ligne rouvre sa question. Onglet
  « Aujourd'hui » renommé « Accueil », avec redirection de l'ancienne route.
  23 assertions Playwright au vert.

- **Appel à noter la journée en tête d'accueil**, avec halo respirant qui
  s'éteint une fois la journée notée. 28 assertions Playwright.
- **Crises groupées en épisodes** dans les statistiques (défaut révélé par
  deux mois de données simulées), et `scripts/seed-demo.mjs` pour peupler un
  compte.

- **Écran Réglages** (`/reglages`) : compte, prénom enfin relu et
  modifiable, déconnexion, export CSV, effacement total, rappel du geste
  d'installation. 21 assertions Playwright.
- **Suppression d'une journée** depuis son écran, et **export CSV** — les
  deux dernières tâches en attente de la liste.

- **Repères plus honnêtes** : étendue des intervalles sous la moyenne, pas
  d'estimation quand c'est trop irrégulier, durée moyenne d'un épisode et
  jours avec médicament.
- **Ce qui revient souvent, proposé en toutes lettres** sous les champs
  repas et médicament — des mots tapables dans une phrase, pas une liste
  déroulante ni une rangée de pastilles. Complété par une **liste d'amorce**
  d'aliments courants pour le premier soir, qui recule à mesure que le
  carnet apprend. 25 assertions Playwright.
- **Résumé du jour en prose**, chaque fragment tapable (troisième version,
  voir § La journée entière). Bloc « À rattraper » retiré.
  30 assertions Playwright.

- **Utilisable sur ordinateur** : colonne de lecture bornée, navigation en
  en-tête sur écran large, parcours en colonne de page. Débordement
  horizontal de 7 px corrigé au passage.
- **Calendrier et repères qui respirent au large** (`lg`) : anneau élargi
  avec chaque jour numéroté et le récit du mois à côté, trois courbes de
  front, intervalle moyen en lettrine. Décalage de 24 px entre le logotype
  et le texte des pages corrigé au passage. 70 assertions Playwright à
  quatre largeurs.

**Reste à faire :**
- **Tester sur un vrai iPhone** — c'est le dernier vrai test qui manque,
  et il ne peut pas être fait depuis une session Claude Code : Safari →
  Partager → Sur l'écran d'accueil, puis vérifier l'icône, l'absence de
  barre d'adresse en standalone, le splash screen et le lancement hors
  connexion.
- Éventuel : `vercel git connect` pour les déploiements automatiques à
  chaque push, et définir `main` comme branche par défaut côté GitHub.

- Éventuel : rappel de médicament programmable — suppose des notifications
  push, que Safari iOS ne sert qu'en mode standalone et au prix d'un vrai
  travail (permission, service worker, envoi côté serveur). Rien d'autre
  n'est en attente : export CSV et suppression sont faits.
- Icône `favicon.ico` actuelle est un simple PNG 32×32 renommé — suffisant
  pour tous les navigateurs modernes, mais pas un vrai multi-résolution
  `.ico` si besoin d'une compatibilité IE historique (non pertinent ici).
