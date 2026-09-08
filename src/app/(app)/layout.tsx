import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";
import { Wordmark } from "@/components/ui/wordmark";
import { LogoutIcon } from "@/components/icons";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  return (
    <div className="flex-1 flex flex-col min-h-full">
      <header
        className="hairline-b flex items-center justify-between px-5 py-3.5 bg-background/95 backdrop-blur sticky top-0 z-20"
        style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))" }}
      >
        <Wordmark />
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Se déconnecter"
            className="text-muted hover:text-foreground"
          >
            <LogoutIcon className="w-5 h-5" />
          </button>
        </form>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
