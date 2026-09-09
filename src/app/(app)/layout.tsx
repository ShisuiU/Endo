import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/ui/wordmark";
import Link from "next/link";
import { SettingsIcon } from "@/components/icons";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PendingSync } from "@/components/daily/pending-sync";

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
        className="hairline-b flex items-center justify-between px-6 pb-4 bg-background sticky top-0 z-20"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <Wordmark />
        {/* La déconnexion a rejoint les réglages : elle n'a rien à faire en
            permanence sous le pouce, à côté du logotype. */}
        <Link
          href="/reglages"
          aria-label="Réglages"
          className="w-11 h-11 -mr-2 flex items-center justify-center text-muted hover:text-foreground"
        >
          <SettingsIcon className="w-5 h-5" />
        </Link>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <PendingSync />
      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
