// Server-only helper for calling Lovable AI Gateway.
// Do not import from client-reachable modules at module scope.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatJSON<T>(opts: {
  model?: string;
  messages: GatewayMessage[];
}): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY não configurado");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages: opts.messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace Lovable.");
    throw new Error(`Falha na IA [${res.status}]: ${text}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resposta da IA vazia");
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("Resposta da IA não é JSON válido");
  }
}
