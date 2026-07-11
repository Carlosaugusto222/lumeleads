import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/app" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="inline-block h-6 w-6 rounded-md bg-gradient-primary" />
            Sitelume
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/app" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="mr-1 inline h-4 w-4" /> Meus sites
            </Link>
            <Link to="/app/new">
              <Button size="sm" className="bg-gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4" /> Novo site
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={handleSignOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
