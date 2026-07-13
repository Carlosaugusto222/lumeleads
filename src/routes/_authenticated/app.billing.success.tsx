import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/billing/success")({
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
      <CheckCircle2 className="mb-6 h-16 w-16 text-emerald-400" />
      <h1 className="font-display text-3xl font-bold">Pagamento recebido!</h1>
      <p className="mt-3 text-muted-foreground">
        Estamos confirmando com o Mercado Pago. Seu plano é ativado automaticamente assim que o
        pagamento for aprovado (poucos segundos para cartão, alguns minutos para PIX/boleto).
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline"><Link to="/app/billing">Voltar aos planos</Link></Button>
        <Button asChild><Link to="/app">Ir para o painel</Link></Button>
      </div>
    </div>
  );
}
