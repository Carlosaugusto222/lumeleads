import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import {
  getMyWhatsappCredentials,
  saveMyWhatsappCredentials,
  deleteMyWhatsappCredentials,
  sendWhatsappTemplate,
  listMyWhatsappMessages,
} from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/_authenticated/app/whatsapp")({
  head: () => ({ meta: [{ title: "WhatsApp Business — LumeLeads" }] }),
  component: WhatsappPage,
});

function WhatsappPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyWhatsappCredentials);
  const saveFn = useServerFn(saveMyWhatsappCredentials);
  const delFn = useServerFn(deleteMyWhatsappCredentials);
  const sendFn = useServerFn(sendWhatsappTemplate);
  const listFn = useServerFn(listMyWhatsappMessages);

  const credsQ = useQuery({ queryKey: ["wa-creds"], queryFn: () => getFn() });
  const msgsQ = useQuery({ queryKey: ["wa-msgs"], queryFn: () => listFn() });

  const [form, setForm] = useState({
    access_token: "",
    phone_number_id: "",
    business_account_id: "",
    verify_token: "",
    default_template_name: "",
    default_template_language: "pt_BR",
  });

  const [test, setTest] = useState({ to: "", template_name: "", template_language: "pt_BR", variables: "" });

  const saveMut = useMutation({
    mutationFn: (data: typeof form) => saveFn({ data }),
    onSuccess: () => {
      toast.success("Credenciais salvas");
      setForm((f) => ({ ...f, access_token: "" }));
      qc.invalidateQueries({ queryKey: ["wa-creds"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: () => delFn(),
    onSuccess: () => {
      toast.success("Credenciais removidas");
      qc.invalidateQueries({ queryKey: ["wa-creds"] });
    },
  });

  const sendMut = useMutation({
    mutationFn: (data: { to: string; template_name: string; template_language: string; variables?: string[] }) =>
      sendFn({ data }),
    onSuccess: (r) => {
      toast.success(`Enviado (${r.wa_message_id ?? "ok"})`);
      qc.invalidateQueries({ queryKey: ["wa-msgs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const creds = credsQ.data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Business API</h1>
          <p className="text-sm text-muted-foreground">Configure suas próprias credenciais da Meta para enviar templates aprovados.</p>
        </div>
        {creds?.is_active && <Badge variant="secondary" className="ml-auto">Ativo</Badge>}
      </div>

      <Tabs defaultValue="creds">
        <TabsList>
          <TabsTrigger value="creds">Credenciais</TabsTrigger>
          <TabsTrigger value="send">Enviar teste</TabsTrigger>
          <TabsTrigger value="log">Histórico</TabsTrigger>
          <TabsTrigger value="howto">Como obter</TabsTrigger>
        </TabsList>

        <TabsContent value="creds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suas credenciais</CardTitle>
              <CardDescription>
                {creds
                  ? `Phone ID configurado: ${creds.phone_number_id}. Cole um novo token abaixo se quiser substituir.`
                  : "Nenhuma credencial configurada ainda."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Access Token (System User permanente)</Label>
                  <Input
                    type="password"
                    autoComplete="off"
                    placeholder="EAAG..."
                    value={form.access_token}
                    onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone Number ID</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="1234567890"
                    value={form.phone_number_id}
                    onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Business Account ID (opcional)</Label>
                  <Input
                    value={form.business_account_id}
                    onChange={(e) => setForm({ ...form, business_account_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Verify Token do webhook (opcional)</Label>
                  <Input
                    value={form.verify_token}
                    onChange={(e) => setForm({ ...form, verify_token: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Template padrão</Label>
                  <Input
                    placeholder="hello_world"
                    value={form.default_template_name}
                    onChange={(e) => setForm({ ...form, default_template_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Idioma padrão</Label>
                  <Input
                    value={form.default_template_language}
                    onChange={(e) => setForm({ ...form, default_template_language: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending || !form.access_token || !form.phone_number_id}>
                  {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar credenciais
                </Button>
                {creds && (
                  <Button variant="ghost" onClick={() => delMut.mutate()} disabled={delMut.isPending}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remover
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar template de teste</CardTitle>
              <CardDescription>Só templates aprovados pela Meta podem iniciar conversa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Telefone destino (E.164)</Label>
                  <Input placeholder="+5511999999999" value={test.to} onChange={(e) => setTest({ ...test, to: e.target.value })} />
                </div>
                <div>
                  <Label>Nome do template</Label>
                  <Input placeholder="hello_world" value={test.template_name} onChange={(e) => setTest({ ...test, template_name: e.target.value })} />
                </div>
                <div>
                  <Label>Idioma</Label>
                  <Input value={test.template_language} onChange={(e) => setTest({ ...test, template_language: e.target.value })} />
                </div>
                <div>
                  <Label>Variáveis do body (separadas por |)</Label>
                  <Input placeholder="João|São Paulo" value={test.variables} onChange={(e) => setTest({ ...test, variables: e.target.value })} />
                </div>
              </div>
              <Button
                onClick={() =>
                  sendMut.mutate({
                    to: test.to,
                    template_name: test.template_name,
                    template_language: test.template_language,
                    variables: test.variables ? test.variables.split("|").map((s) => s.trim()).filter(Boolean) : undefined,
                  })
                }
                disabled={sendMut.isPending || !test.to || !test.template_name}
              >
                {sendMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardHeader><CardTitle>Últimas 50 mensagens</CardTitle></CardHeader>
            <CardContent>
              {msgsQ.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !msgsQ.data || msgsQ.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {msgsQ.data.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium">{m.to_phone} · {m.template_name}</div>
                        <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</div>
                        {m.error && <div className="text-xs text-destructive">{m.error}</div>}
                      </div>
                      <Badge variant={m.status === "sent" ? "secondary" : "destructive"}>{m.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="howto">
          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none py-4">
              <ol>
                <li>Crie uma conta no <a href="https://business.facebook.com/" target="_blank" rel="noreferrer">Meta Business</a>.</li>
                <li>Em <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer">Meta for Developers</a>, crie um app do tipo <b>Business</b> e adicione o produto <b>WhatsApp</b>.</li>
                <li>No painel do WhatsApp copie o <b>Phone Number ID</b> e o <b>WhatsApp Business Account ID</b>.</li>
                <li>Em <i>Business Settings → Users → System Users</i>, crie um System User <b>Admin</b>, gere um token permanente com as permissões <code>whatsapp_business_messaging</code> e <code>whatsapp_business_management</code>.</li>
                <li>Aprove pelo menos um <b>template de mensagem</b> em <i>WhatsApp Manager → Templates</i>. Só templates aprovados podem iniciar conversa.</li>
                <li>Cole tudo na aba <b>Credenciais</b> e teste o envio.</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
