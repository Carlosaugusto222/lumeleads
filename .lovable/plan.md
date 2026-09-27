# Escolha de endereço na criação do site

## O que será alterado

- Adicionar no passo **Revisar e gerar** duas opções de endereço:
  - **Endereço padrão LumeLeads** — `lumeleads.lovable.app/s/seu-site`, disponível para todos e selecionado inicialmente.
  - **Domínio próprio** — disponível apenas para planos pagos.
- Mostrar a opção de domínio próprio bloqueada no plano Gratuito, com indicação para ver os planos.
- Nos planos pagos, permitir informar o domínio antes de gerar o site.
- Ao concluir a geração com domínio próprio, cadastrar o domínio automaticamente e abrir o editor, onde o cliente continuará a configuração e verificação do DNS.
- Manter a validação no servidor, impedindo que contas gratuitas contornem o bloqueio visual.

## Validação e documentação

- Exibir mensagens claras caso o domínio seja inválido ou o cadastro falhe, sem perder o site já criado.
- Atualizar o roadmap e o changelog do painel Super Admin.
- Verificar o fluxo em telas pequenas e grandes e confirmar que o projeto continua compilando sem erros.

## Detalhes técnicos

- Reutilizar `getMyPlan` para identificar o plano e `addSiteDomain` para cadastrar o domínio após a criação.
- Nenhuma alteração de banco será necessária; o endereço padrão continuará usando o slug existente.
