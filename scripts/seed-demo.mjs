#!/usr/bin/env node
/**
 * Remplit un compte avec deux mois de journées plausibles, pour voir à quoi
 * ressemblent le calendrier et les repères une fois habités.
 *
 * ⚠️ Ce sont de **fausses données**. Elles portent la marque `[démo]` en fin
 * de notes, ce qui permet de les retirer ensuite ; mais tant qu'elles sont
 * là, elles se mélangent aux vraies dans le calendrier et les statistiques.
 * Le script n'écrase jamais une journée déjà saisie.
 *
 *   node scripts/seed-demo.mjs <email> [jours] [--full] [--from=AAAA-MM-JJ]
 *   node scripts/seed-demo.mjs <email> --clear
 *
 * `--full` remplit **chaque** journée de la période, sans trou. Sans lui, le
 * script en saute ~12 % : un carnet réel a des jours oubliés.
 *
 * La clé `service_role` contourne la RLS : elle ne doit jamais toucher le
 * front ni être versionnée, et ce script ne l'écrit nulle part.
 */

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ztucdcyfeqaeeogzjzeo.supabase.co";
const REF = new URL(URL_).hostname.split(".")[0];
const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("-"));
const clear = args.includes("--clear");
/** Sans trous : chaque journée de la période est remplie. */
const full = args.includes("--full");
const from = args.find((a) => a.startsWith("--from="))?.slice(7);
const DAYS = clear ? 0 : Number(args.find((a) => /^\d+$/.test(a)) ?? 60);

if (!email) {
  console.error("Usage : SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs <email> [jours] [--full] [--from=AAAA-MM-JJ]");
  console.error("        SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs <email> --clear");
  console.error("   ou : SUPABASE_ACCESS_TOKEN=sbp_...   (la clé est alors récupérée à la volée)");
  process.exit(1);
}

/**
 * La clé `service_role` n'est jamais écrite sur le disque : soit elle vient
 * de l'environnement, soit on la demande à la Management API avec un jeton
 * personnel, et elle ne vit alors que dans ce processus.
 */
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  (process.env.SUPABASE_ACCESS_TOKEN
    ? await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys`, {
        headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` },
      })
        .then((r) => r.json())
        .then((keys) => keys.find((k) => k.name === "service_role")?.api_key)
    : null);

if (!KEY) {
  console.error("Aucune clé service_role : fournis SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ACCESS_TOKEN.");
  process.exit(1);
}

const head = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Générateur déterministe : relancer le script donne exactement les mêmes
// journées, donc rien ne dérive entre deux essais.
let seed = 20260909;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const between = (lo, hi) => lo + Math.round(rnd() * (hi - lo));
const pick = (list) => list[Math.floor(rnd() * list.length)];

const NOTES_CRISE = [
  "Journée difficile, bouillotte toute l'après-midi.",
  "Douleur qui remonte dans le dos.",
  "Obligée de m'allonger en milieu de journée.",
  "Crise arrivée d'un coup ce matin.",
];
const NOTES_CALME = [
  "Journée tranquille.",
  "Marche d'une heure, ça a fait du bien.",
  "Bien dormi pour une fois.",
  "Fatiguée mais sans douleur.",
];
const REPAS = [
  ["riz", "poulet", "salade"],
  ["pâtes", "tomates"],
  ["soupe", "pain"],
  ["poisson", "haricots verts"],
  ["œufs", "fromage", "pomme"],
  ["lentilles", "carottes"],
  ["yaourt", "chocolat"],
];
const MEDICAMENTS = ["Spasfon, 2 comprimés", "Antalgique le soir", "Ibuprofène le midi"];

const users = await fetch(`${URL_}/auth/v1/admin/users?per_page=200`, { headers: head }).then((r) =>
  r.json()
);
const user = users.users?.find((u) => u.email === email);
if (!user) {
  console.error(`Compte introuvable : ${email}`);
  process.exit(1);
}

if (clear) {
  // Ne supprime que ce que ce script a écrit — les journées marquées
  // `[démo]`. Une vraie journée n'est jamais touchée.
  const doomed = await fetch(
    `${URL_}/rest/v1/daily_entries?user_id=eq.${user.id}&notes=like.*%5Bd%C3%A9mo%5D*&select=entry_date`,
    { headers: head }
  ).then((r) => r.json());
  const res = await fetch(
    `${URL_}/rest/v1/daily_entries?user_id=eq.${user.id}&notes=like.*%5Bd%C3%A9mo%5D*`,
    { method: "DELETE", headers: head }
  );
  console.log(`${doomed.length} journées de démonstration supprimées (${res.status}).`);
  process.exit(res.ok ? 0 : 1);
}

const existing = await fetch(
  `${URL_}/rest/v1/daily_entries?user_id=eq.${user.id}&select=entry_date,notes`,
  { headers: head }
).then((r) => r.json());
// Une journée déjà écrite par ce script (marquée `[démo]`) peut être
// réécrite ; une vraie journée, jamais.
const real = new Set(existing.filter((r) => !r.notes?.includes("[démo]")).map((r) => r.entry_date));
const demo = new Set(existing.filter((r) => r.notes?.includes("[démo]")).map((r) => r.entry_date));

// Modèle : des crises groupées en début de cycle (27 à 30 jours), plus une
// poussée isolée. La douleur, le sommeil, l'humeur et l'énergie suivent —
// sinon les courbes des repères ne raconteraient rien.
const today = new Date();
// `--from` fixe le premier jour ; sinon on remonte de `DAYS` jours.
const span = from
  ? Math.round((today - new Date(`${from}T12:00:00`)) / 86400000)
  : DAYS;
const crisisDays = new Set();
let cursor = span - 4;
while (cursor > 0) {
  const length = between(2, 4);
  for (let i = 0; i < length && cursor - i > 0; i += 1) crisisDays.add(cursor - i);
  cursor -= between(27, 30);
}
// Une poussée isolée hors cycle — mais seulement sur une période assez
// longue pour qu'elle reste l'exception. Ajoutée systématiquement, elle
// rapprochait les crises au point de fausser l'intervalle moyen affiché
// dans les repères (11 jours au lieu de 18 sur deux mois).
if (span >= 45) crisisDays.add(between(12, 18));

const rows = [];
for (let back = span; back >= 1; back -= 1) {
  const date = new Date(today);
  date.setDate(date.getDate() - back);
  const day = iso(date);
  if (real.has(day)) continue;
  // Sans `--full`, on laisse quelques trous : un carnet réel en a.
  if (!full && rnd() < 0.12) continue;

  const offset = span - back;
  const crisis = crisisDays.has(offset);
  const near = !crisis && (crisisDays.has(offset + 1) || crisisDays.has(offset - 1));
  const medication = crisis ? rnd() < 0.9 : rnd() < 0.15;
  const note = crisis ? pick(NOTES_CRISE) : rnd() < 0.25 ? pick(NOTES_CALME) : null;

  rows.push({
    user_id: user.id,
    entry_date: day,
    had_crisis: crisis,
    crisis_intensity: crisis ? between(5, 9) : null,
    pain_score: crisis ? between(6, 9) : near ? between(3, 5) : between(0, 3),
    sleep_score: crisis ? between(2, 5) : between(5, 8),
    mood_score: crisis ? between(3, 5) : between(6, 9),
    energy_score: crisis ? between(2, 4) : between(5, 8),
    medication_taken: medication,
    medication_notes: medication ? pick(MEDICAMENTS) : null,
    foods: pick(REPAS),
    // La marque permet de retrouver et de retirer ces journées plus tard.
    notes: note ? `${note} [démo]` : "[démo]",
  });
}

const res = await fetch(`${URL_}/rest/v1/daily_entries?on_conflict=user_id,entry_date`, {
  method: "POST",
  headers: { ...head, Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(rows),
});
if (!res.ok) {
  console.error(res.status, await res.text());
  process.exit(1);
}
console.log(
  `${rows.length} journées écrites pour ${email} (${rows.at(0).entry_date} → ${rows.at(-1).entry_date}), ` +
    `dont ${rows.filter((r) => r.had_crisis).length} avec crise, ` +
    `${rows.filter((r) => demo.has(r.entry_date)).length} réécrites. ` +
    `${real.size} vraie(s) journée(s) laissée(s) intacte(s).`
);
