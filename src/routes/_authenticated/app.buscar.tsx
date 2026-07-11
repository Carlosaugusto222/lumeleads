import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, Globe, Star, MapPin, Phone, Plus, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchPlaces, savePlacesAsLeads, type PlaceResult } from "@/lib/places.functions";

export const Route = createFileRoute("/_authenticated/app/buscar")({
  component: BuscarPage,
});

const BR_STATES = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"],
  ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"],
  ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"],
  ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"], ["PE", "Pernambuco"], ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SP", "São Paulo"],
  ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

const COMMON_CATEGORIES = [
  "Barbearia", "Salão de beleza", "Restaurante", "Pizzaria", "Lanchonete", "Padaria",
  "Academia", "Clínica odontológica", "Clínica médica", "Advogado", "Contador",
  "Pet shop", "Autoescola", "Oficina mecânica", "Loja de roupas", "Ótica",
  "Imobiliária", "Estúdio de tatuagem", "Manicure", "Escola de idiomas",
];

function BuscarPage() {
  const searchFn = useServerFn(searchPlaces);
  const saveFn = useServerFn(savePlacesAsLeads);
  const qc = useQueryClient();

  const [country] = useState("Brasil");
  const [state, setState] = useState("SP");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Barbearia");
  const [limit, setLimit] = useState(20);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const searchMut = useMutation({
    mutationFn: () =>
      searchFn({
        data: {
          country,
          state: BR_STATES.find((s) => s[0] === state)?.[1] ?? state,
          city,
          category,
          limit,
        },
      }),
    onSuccess: (r) => {
      setResults(r.results);
      setSelected(new Set(r.results.map((x) => x.place_id)));
      if (!r.results.length) toast.info("Nenhum resultado encontrado.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro na busca"),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const picked = results.filter((r) => selected.has(r.place_id));
      return saveFn({ data: { places: picked } });
    },
    onSuccess: (r) => {
      toast.success(`${r.inserted} leads adicionados`);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dash-stats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const withoutSite = results.filter((r) => !r.has_website).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Buscar Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Encontre negócios locais por categoria e localização
        </p>
      </header>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <div className="grid gap-3 md:grid-cols-[110px_150px_1fr_1fr_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs">País</Label>
            <Select value={country} disabled>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Brasil">Brasil</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Estado</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {BR_STATES.map(([uf, name]) => (
                  <SelectItem key={uf} value={uf}>{uf} — {name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: São Paulo" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Input
              list="cats"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Barbearia"
            />
            <datalist id="cats">
              {COMMON_CATEGORIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => searchMut.mutate()}
              disabled={!city || !category || searchMut.isPending}
              className="w-full bg-gradient-primary text-primary-foreground md:w-auto"
            >
              {searchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <input
              type="range" min={20} max={60} step={20}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>20</span><span>40</span><span>60</span>
            </div>
          </div>
          <div className="text-sm font-semibold text-primary">{limit} leads</div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Sem site" value={withoutSite} accent />
          <Stat label="Total" value={results.length} />
          <div className="flex items-center gap-2">
            <Button
              onClick={() => saveMut.mutate()}
              disabled={selected.size === 0 || saveMut.isPending}
              className="w-full bg-gradient-primary text-primary-foreground"
            >
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar {selected.size} aos meus leads
            </Button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={() =>
              setSelected(selected.size === results.length ? new Set() : new Set(results.map((r) => r.place_id)))
            }
          >
            {selected.size === results.length
              ? <CheckSquare className="h-4 w-4" />
              : <Square className="h-4 w-4" />}
            Selecionar todos
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => {
          const isSel = selected.has(r.place_id);
          return (
            <div key={r.place_id}
              onClick={() => toggle(r.place_id)}
              className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                isSel ? "border-primary/60 bg-primary/5" : "border-border/60 bg-card/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.category}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  r.has_website ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                }`}>
                  {r.has_website ? "Tem site" : "Sem site"}
                </span>
              </div>
              {r.rating != null && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                  <Star className="h-3 w-3 fill-current" /> {r.rating} · {r.reviews_count ?? 0}
                </div>
              )}
              {r.address && (
                <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" /><span className="line-clamp-2">{r.address}</span>
                </div>
              )}
              {r.phone && (
                <div className="mt-1 flex items-center gap-1 text-xs">
                  <Phone className="h-3 w-3" /> {r.phone}
                </div>
              )}
              {r.website && (
                <div className="mt-1 flex items-center gap-1 truncate text-xs text-primary">
                  <Globe className="h-3 w-3" /> {r.website}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!results.length && !searchMut.isPending && (
        <div className="mt-8 rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
          Escolha estado, cidade e categoria e clique em <b>Buscar</b> para encontrar negócios locais.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card/50"}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
