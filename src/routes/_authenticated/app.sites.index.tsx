import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink, Pencil, Rocket, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMySites, deleteSite, setPublished } from "@/lib/sites.functions";

export const Route = createFileRoute("/_authenticated/app/sites/")({
  component: SitesList,
});

function SitesList() {
  const list = useServerFn(listMySites);
  const del = useServerFn(deleteSite);
  const pub = useServerFn(setPublished);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["my-sites"], queryFn: () => list() });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Site excluído"); qc.invalidateQueries({ queryKey: ["my-sites"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const publishMut = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => pub({ data: { id, published } }),
    onSuccess: (_r, v) => { toast.success(v.published ? "Publicado!" : "Despublicado"); qc.invalidateQueries({ queryKey: ["my-sites"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Meus sites</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie, edite e publique suas landing pages.</p>
        </div>
        <Link to="/app/new"><Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" /> Novo site</Button></Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
          <h3 className="font-display text-xl font-semibold">Nenhum site ainda</h3>
          <p className="mt-2 text-sm text-muted-foreground">Crie sua primeira landing page em menos de 1 minuto.</p>
          <Link to="/app/new"><Button className="mt-6 bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" /> Criar primeiro site</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((s) => (
            <div key={s.id} className="group rounded-2xl border border-border/60 bg-card/60 p-5 transition-colors hover:border-primary/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{s.title}</h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">/s/{s.slug}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.published ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                  {s.published ? "Publicado" : "Rascunho"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/app/sites/$id" params={{ id: s.id }}><Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" /> Editar</Button></Link>
                <Button size="sm" variant="outline" onClick={() => publishMut.mutate({ id: s.id, published: !s.published })} disabled={publishMut.isPending}>
                  <Rocket className="h-3.5 w-3.5" />{s.published ? "Despublicar" : "Publicar"}
                </Button>
                {s.published && (<a href={`/s/${s.slug}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" /> Abrir</Button></a>)}
                <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => { if (confirm(`Excluir "${s.title}"?`)) deleteMut.mutate(s.id); }} disabled={deleteMut.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
