"use client";

import { useEffect, useRef, useState } from "react";
import { CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { DownloadIcon, LogoutIcon, TrashIcon } from "@/components/icons";
import { deleteAllEntries, fetchAllEntries } from "@/lib/entries-client";
import { fetchProfile, updateDisplayName } from "@/lib/profile-client";
import { entriesToCSV } from "@/lib/csv";
import { todayISO } from "@/lib/date";
import { cn } from "@/lib/cn";

type Busy = "idle" | "export" | "wipe";

export function SettingsView({ onSignOut }: { onSignOut: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [busy, setBusy] = useState<Busy>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const hydrated = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchProfile()
      .then(({ profile, email }) => {
        setEmail(email);
        setName(profile?.display_name ?? "");
        hydrated.current = true;
      })
      .catch(() => {
        hydrated.current = true;
      });
  }, []);

  // Même parti pris que le carnet : on enregistre au fil de la frappe,
  // il n'y a rien à valider.
  useEffect(() => {
    if (!hydrated.current) return;
    setNameStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      updateDisplayName(name.trim())
        .then(() => setNameStatus("saved"))
        .catch(() => setNameStatus("idle"));
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [name]);

  /**
   * Export CSV.
   *
   * Sur iPhone, un `<a download>` en mode standalone ne donne rien de
   * fiable : la feuille de partage, elle, sait où envoyer le fichier
   * (Fichiers, Mail, un message au médecin). On passe donc par
   * `navigator.share` quand le navigateur l'accepte, et on retombe sur le
   * téléchargement classique partout ailleurs.
   */
  async function exportCSV() {
    setBusy("export");
    setMessage(null);
    try {
      const entries = await fetchAllEntries();
      if (entries.length === 0) {
        setMessage("Il n'y a encore rien à exporter.");
        return;
      }
      const name = `endo-${todayISO()}.csv`;
      const file = new File([entriesToCSV(entries)], name, { type: "text/csv;charset=utf-8" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Mon carnet endo" });
        setMessage(`${entries.length} journées exportées.`);
        return;
      }

      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`${entries.length} journées exportées.`);
    } catch (error) {
      // Annuler la feuille de partage lève : ce n'est pas un échec.
      if ((error as Error)?.name === "AbortError") return;
      setMessage("L'export n'a pas abouti. Réessaie une fois connectée au réseau.");
    } finally {
      setBusy("idle");
    }
  }

  async function wipe() {
    setBusy("wipe");
    setMessage(null);
    try {
      const removed = await deleteAllEntries();
      setMessage(`${removed} journée${removed > 1 ? "s" : ""} supprimée${removed > 1 ? "s" : ""}.`);
      setConfirmWipe(false);
    } catch {
      setMessage("La suppression n'a pas abouti.");
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div className="flex-1 px-6 pt-7 pb-12">
      <h1 className="font-display text-[2.6rem] leading-none tracking-[-0.02em]">Réglages</h1>

      <section className="py-8 hairline-b">
        <CardLabel>Ton compte</CardLabel>
        <p className="text-[0.9rem] text-muted">{email ?? "…"}</p>

        <div className="mt-6">
          <Field
            label="Prénom"
            value={name}
            onChange={(event) => setName(event.target.value)}
            hint={
              nameStatus === "saving"
                ? "Enregistrement…"
                : nameStatus === "saved"
                  ? "Enregistré"
                  : undefined
            }
          />
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-full px-5 hairline text-[0.9rem] text-muted transition-colors hover:text-foreground"
        >
          <LogoutIcon className="h-4 w-4" /> Se déconnecter
        </button>
      </section>

      <section className="py-8 hairline-b">
        <CardLabel>Tes données</CardLabel>
        <p className="text-[0.9rem] leading-relaxed text-muted">
          Un fichier tableur avec une ligne par journée : crise, notes, médicament,
          repas. De quoi garder une copie, ou l&apos;apporter à un rendez-vous.
        </p>

        <Button
          variant="ghost"
          className="mt-5 w-full justify-between"
          onClick={exportCSV}
          disabled={busy !== "idle"}
        >
          {busy === "export" ? "Export en cours…" : "Exporter en CSV"}
          <DownloadIcon className="h-5 w-5" />
        </Button>

        <div className="mt-8">
          {confirmWipe ? (
            <div role="alert" className="hairline rounded-2xl border-accent/40 p-4">
              <p className="text-[0.85rem] leading-relaxed">
                Toutes tes journées seront effacées, sans retour possible.{" "}
                <span className="text-muted">
                  Pense à faire un export avant, si tu veux en garder une trace.
                </span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={wipe}
                  disabled={busy !== "idle"}
                  className="min-h-[44px] rounded-full bg-accent px-5 text-[0.85rem] font-medium text-ground disabled:opacity-50"
                >
                  {busy === "wipe" ? "Suppression…" : "Oui, tout supprimer"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmWipe(false)}
                  className="min-h-[44px] rounded-full px-5 text-[0.85rem] text-muted hover:text-foreground"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmWipe(true)}
              className="inline-flex min-h-[52px] items-center gap-2 rounded-full px-5 hairline text-[0.9rem] text-muted transition-colors hover:text-foreground"
            >
              <TrashIcon className="h-4 w-4" /> Supprimer toutes mes journées
            </button>
          )}
        </div>

        {message && (
          <p aria-live="polite" className={cn("mt-5 text-[0.85rem]", "text-accent")}>
            {message}
          </p>
        )}
      </section>

      <section className="py-8">
        <CardLabel>L&apos;app</CardLabel>
        <p className="text-[0.9rem] leading-relaxed text-muted">
          Pour l&apos;avoir comme une vraie application, sans barre d&apos;adresse :
          dans Safari, <span className="text-foreground">Partager</span> puis{" "}
          <span className="text-foreground">Sur l&apos;écran d&apos;accueil</span>. Le
          carnet s&apos;ouvre alors même sans réseau, et ce que tu notes repart tout
          seul au retour de la connexion.
        </p>
      </section>
    </div>
  );
}
