import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Users, Kanban, CalendarDays, Sparkles, CreditCard, Globe, Search, Shield, Settings } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyPlan } from "@/lib/plans.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; adminOnly?: boolean };
const NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/buscar", label: "Buscar Leads", icon: Search },
  { to: "/app/leads", label: "Meus Leads", icon: Users },
  { to: "/app/crm", label: "CRM", icon: Kanban },
  { to: "/app/agenda", label: "Agendamentos", icon: CalendarDays },
  { to: "/app/sites", label: "Meus sites", icon: Globe },
  { to: "/app/new", label: "Criar site", icon: Sparkles },
  { to: "/app/billing", label: "Planos", icon: CreditCard },
  { to: "/app/admin", label: "Super Admin", icon: Shield, adminOnly: true },
];

function AppShell() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const planFn = useServerFn(getMyPlan);
  const planQ = useQuery({ queryKey: ["my-plan"], queryFn: () => planFn() });
  const isAdmin = planQ.data?.isAdmin ?? false;
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);


  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border/50 bg-card/40 backdrop-blur-xl lg:flex">
        <Link to="/app" className="flex items-center gap-2 px-5 py-5 font-display text-lg font-bold">
          <span className="inline-block h-7 w-7 rounded-md bg-gradient-primary" />
          Sitelume
        </Link>
        <nav className="flex-1 space-y-0.5 px-3">
          {items.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/50 p-3 space-y-1">
          <Link to="/app/settings"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname.startsWith("/app/settings")
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}>
            <Settings className="h-4 w-4" /> Configurações
          </Link>
          <Button size="sm" variant="ghost" onClick={handleSignOut} className="w-full justify-start text-muted-foreground">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/app" className="flex items-center gap-2 font-display text-base font-bold">
            <span className="inline-block h-6 w-6 rounded-md bg-gradient-primary" />
            Sitelume
          </Link>
          <Button size="sm" variant="ghost" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 pb-2">
          {items.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${active ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="lg:pl-60">
        <Outlet />
      </main>
    </div>
  );
}
