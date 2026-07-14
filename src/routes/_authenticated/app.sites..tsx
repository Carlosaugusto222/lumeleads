
function DomainsPanel({ siteId }: { siteId: string }) {
  const list = useServerFn(listSiteDomains);
  const add = useServerFn(addSiteDomain);
  const verify = useServerFn(verifySiteDomain);
  const del = useServerFn(deleteSiteDomain);
  const qc = useQueryClient();
  const [domain, setDomain] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["site-domains", siteId],
    queryFn: () => list({ data: { siteId } }),
  });

  const addMut = useMutation({
    mutationFn: () => add({ data: { siteId, domain } }),
    onSuccess: () => { toast.success("Domínio adicionado"); setDomain(""); qc.invalidateQueries({ queryKey: ["site-domains", siteId] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const verifyMut = useMutation({
    mutationFn: (id: string) => verify({ data: { id } }),
    onSuccess: (r) => { toast[r.status === "verified" ? "success" : "error"](r.status === "verified" ? "Domínio verificado!" : r.last_error ?? "Falhou"); qc.invalidateQueries({ queryKey: ["site-domains", siteId] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["site-domains", siteId] }); },
  });

  const target = data?.target ?? "lumeleads.lovable.app";

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Conecte um domínio próprio (ex.: <span className="font-mono">seusite.com.br</span>). Para SSL automático, aponte via Cloudflare no modo proxied.
      </p>
      <div className="flex gap-2">
        <Input placeholder="seudominio.com.br" value={domain} onChange={(e) => setDomain(e.target.value)} />
        <Button size="sm" onClick={() => addMut.mutate()} disabled={!domain || addMut.isPending}>
          {addMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Adicionar"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : (data?.domains ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum domínio cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {data!.domains.map((d) => (
            <div key={d.id} className="rounded-lg border border-border/60 bg-background p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-medium">{d.domain}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  d.status === "verified" ? "bg-emerald-500/15 text-emerald-600"
                  : d.status === "failed" ? "bg-red-500/15 text-red-600"
                  : "bg-amber-500/15 text-amber-600"
                }`}>{d.status}</span>
              </div>
              {d.status !== "verified" && (
                <div className="mt-2 space-y-1.5 rounded-md bg-muted/50 p-2 font-mono text-[10px] leading-relaxed">
                  <div><b>CNAME</b> {d.domain} → {target}</div>
                  <div><b>TXT</b> _lume-verify.{d.domain} → {d.verification_token}</div>
                  {d.last_error && <div className="text-red-600">{d.last_error}</div>}
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => verifyMut.mutate(d.id)} disabled={verifyMut.isPending}>
                  {verifyMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verificar DNS"}
                </Button>
                {d.status === "verified" && (
                  <a href={`https://${d.domain}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline"><ExternalLink className="h-3 w-3" /> Abrir</Button>
                  </a>
                )}
                <Button size="sm" variant="ghost" className="ml-auto text-destructive"
                  onClick={() => { if (confirm(`Remover ${d.domain}?`)) delMut.mutate(d.id); }}>Remover</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
