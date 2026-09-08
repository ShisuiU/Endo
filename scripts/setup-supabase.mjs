// Crée le projet Supabase, applique la migration et écrit .env.local.
//
// Prérequis : un Personal Access Token Supabase
//   → https://supabase.com/dashboard/account/tokens
//
// Usage :
//   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs
//   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs --region eu-west-3 --name endo
//
// Le script est rejouable : si un projet du même nom existe déjà, il le
// réutilise au lieu d'en créer un second.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://api.supabase.com/v1";
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error(
    "\n  SUPABASE_ACCESS_TOKEN manquant.\n" +
      "  Crée un token sur https://supabase.com/dashboard/account/tokens puis :\n" +
      "    SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs\n"
  );
  process.exit(1);
}

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PROJECT_NAME = arg("--name", "endo");
const REGION = arg("--region", "eu-west-3"); // Paris

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} → ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("→ Organisations…");
  const orgs = await api("/organizations");
  if (!orgs?.length) throw new Error("Aucune organisation sur ce compte Supabase.");
  const org = orgs[0];
  console.log(`  organisation : ${org.name} (${org.id})`);

  const projects = await api("/projects");
  let project = projects.find((p) => p.name === PROJECT_NAME);

  if (project) {
    console.log(`→ Projet "${PROJECT_NAME}" déjà existant (${project.id}), réutilisé.`);
  } else {
    const dbPass = randomBytes(24).toString("base64url");
    console.log(`→ Création du projet "${PROJECT_NAME}" en ${REGION}…`);
    project = await api("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: PROJECT_NAME,
        organization_id: org.id,
        region: REGION,
        db_pass: dbPass,
      }),
    });
    console.log(`  ref : ${project.id}`);
    console.log(`\n  ⚠️  MOT DE PASSE BASE DE DONNÉES (à conserver, non récupérable) :\n      ${dbPass}\n`);
  }

  const ref = project.id;

  process.stdout.write("→ Attente du démarrage du projet");
  for (let i = 0; i < 60; i++) {
    const state = await api(`/projects/${ref}`);
    if (state.status === "ACTIVE_HEALTHY") {
      console.log(" ✓");
      break;
    }
    process.stdout.write(".");
    await sleep(5000);
  }

  console.log("→ Application de la migration…");
  const sql = readFileSync(join(root, "supabase/migrations/0001_init.sql"), "utf-8");
  await api(`/projects/${ref}/database/query`, {
    method: "POST",
    body: JSON.stringify({ query: sql }),
  });
  console.log("  migration appliquée (le script SQL est idempotent, rejouable sans risque).");

  console.log("→ Récupération de la clé anon…");
  const keys = await api(`/projects/${ref}/api-keys`);
  const anon = keys.find((k) => k.name === "anon")?.api_key;
  if (!anon) throw new Error("Clé anon introuvable dans la réponse de l'API.");

  const url = `https://${ref}.supabase.co`;
  const envPath = join(root, ".env.local");
  if (existsSync(envPath)) {
    writeFileSync(`${envPath}.bak`, readFileSync(envPath));
    console.log("  .env.local existant sauvegardé en .env.local.bak");
  }
  writeFileSync(
    envPath,
    `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}\n`
  );

  console.log(`\n✓ Terminé.\n  URL      : ${url}\n  .env.local écrit.\n`);
  console.log("  Pense à reporter ces deux variables dans ton hébergeur (Vercel → Environment Variables).\n");
}

main().catch((error) => {
  console.error("\n✗ Échec :", error.message, "\n");
  process.exit(1);
});
