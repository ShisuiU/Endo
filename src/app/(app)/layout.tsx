import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/ui/wordmark";
import Link from "next/link";
import { SettingsIcon } from "@/components/icons";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { HeaderNav } from "@/components/app-shell/header-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PendingSync } from "@/components/daily/pending-sync";
import { cn } from "@/lib/cn";

/**
 * La colonne de lecture, partagée par l'en-tête et le contenu.
 *
 * L'app est dessinée pour 390 px de large ; sans borne, une fenêtre de
 * 1440 px étirait le texte sur toute la largeur (mesure de lecture
 * illisible) et donnait un bouton principal de 1400 px. 34 rem, c'est la
 * largeur d'une colonne de magazine — l'app reste un carnet, elle ne devient
 * pas un tableau de bord parce que l'écran est grand.
 */
const COLUMN = "mx-auto w-full max-w-[34rem]";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  return (
    <div className="flex-1 flex flex-col min-h-full">
      <header
        // Fond opaque, pas de `backdrop-blur` : à 95 % d'opacité le flou ne se
        // voyait pas, mais Safari repeignait toute la bande à chaque image des
        // animations qui passent dessous — c'est ce qui hachait la navigation.
        className="hairline-b px-6 pb-4 bg-background sticky top-0 z-20"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        {/* L'en-tête tient toute la largeur (le filet doit filer d'un bord à
            l'autre), mais son contenu s'aligne sur la colonne de lecture. */}
        <div className={cn(COLUMN, "flex items-center justify-between gap-6")}>
          <Wordmark />
          <HeaderNav />
          {/* La déconnexion a rejoint les réglages : elle n'a rien à faire en
              permanence sous le pouce, à côté du logotype. */}
          <Link
            href="/reglages"
            aria-label="Réglages"
            className="w-11 h-11 -mr-2 flex items-center justify-center text-muted hover:text-foreground md:ml-auto"
          >
            <SettingsIcon className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className={cn(COLUMN, "flex flex-1 flex-col")}>{children}</div>
      </main>

      <PendingSync />
      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
