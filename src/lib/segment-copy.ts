// Segment-aware copywriting hints used to enrich the AI prompt when
// generating landing page content. Matches the free-text sector against
// keyword groups covering the 56 categorias do LumeLeads.

export type SegmentHint = {
  segment: string;
  angle: string;
  benefits: string;
  proof: string;
  ctaStyle: string;
};

type Rule = { keys: string[]; hint: SegmentHint };

const RULES: Rule[] = [
  {
    keys: ["restaurante", "bar", "pizzaria", "hamburgueria", "sushi", "churrascaria", "cafeteria", "café", "cafe", "padaria", "confeitaria", "sorveteria", "doceria", "food truck", "lanchonete", "bistrô", "bistro"],
    hint: {
      segment: "Gastronomia",
      angle: "Desperte apetite com linguagem sensorial (sabor, aroma, textura) e destaque ambiente e experiência.",
      benefits: "Cardápio assinatura, ingredientes selecionados, ambiente/entrega, reservas fáceis.",
      proof: "Depoimentos citando pratos específicos, ocasião (aniversário, encontro) e recorrência.",
      ctaStyle: "Reservar mesa / Pedir agora / Ver cardápio",
    },
  },
  {
    keys: ["salão", "salao", "barbearia", "barber", "estética", "estetica", "spa", "manicure", "cabelo", "sobrancelha", "depilação", "depilacao", "massagem"],
    hint: {
      segment: "Beleza e bem-estar",
      angle: "Foque em autoestima, cuidado pessoal e transformação. Tom acolhedor e aspiracional.",
      benefits: "Profissionais especializados, produtos premium, ambiente relaxante, resultados visíveis.",
      proof: "Antes/depois, tempo de casa dos clientes, indicações.",
      ctaStyle: "Agendar horário / Reservar seu momento",
    },
  },
  {
    keys: ["academia", "personal", "crossfit", "pilates", "yoga", "muay thai", "jiu-jitsu", "jiu jitsu", "funcional", "nutricionista"],
    hint: {
      segment: "Fitness e saúde",
      angle: "Fale de resultado, energia e comunidade. Linguagem motivacional e direta.",
      benefits: "Método comprovado, acompanhamento individual, estrutura, horários flexíveis.",
      proof: "Transformações de alunos, retenção, resultados mensuráveis (kg, cm, performance).",
      ctaStyle: "Agendar aula experimental / Começar hoje",
    },
  },
  {
    keys: ["clínica", "clinica", "dentista", "odonto", "médico", "medico", "psicólogo", "psicologo", "psicologia", "fisioterapia", "veterinário", "veterinario", "pet shop", "petshop"],
    hint: {
      segment: "Saúde",
      angle: "Transmita confiança, credibilidade e cuidado humano. Evite promessas milagrosas; foque em evidência.",
      benefits: "Equipe qualificada, tecnologia, atendimento humanizado, convênios/facilidades.",
      proof: "Formação dos profissionais, tempo de atuação, depoimentos reais.",
      ctaStyle: "Agendar consulta / Falar com a equipe",
    },
  },
  {
    keys: ["advogado", "advocacia", "contador", "contabilidade", "consultoria", "coach", "arquiteto", "arquitetura", "engenheiro", "designer", "agência", "agencia", "marketing"],
    hint: {
      segment: "Serviços profissionais",
      angle: "Comunique autoridade, método e ROI. Tom consultivo e objetivo, sem jargão excessivo.",
      benefits: "Metodologia própria, cases, especialização, atendimento personalizado.",
      proof: "Cases com números, clientes atendidos, certificações.",
      ctaStyle: "Solicitar diagnóstico / Agendar reunião",
    },
  },
  {
    keys: ["imobiliária", "imobiliaria", "corretor", "imóveis", "imoveis", "construtora", "incorporadora"],
    hint: {
      segment: "Imobiliário",
      angle: "Venda o sonho e a segurança da decisão. Destaque localização, potencial e curadoria.",
      benefits: "Portfólio selecionado, atendimento consultivo, documentação, financiamento facilitado.",
      proof: "Imóveis vendidos, tempo de mercado, depoimentos de compradores.",
      ctaStyle: "Ver imóveis / Falar com corretor",
    },
  },
  {
    keys: ["loja", "moda", "roupa", "boutique", "acessórios", "acessorios", "calçados", "calcados", "joalheria", "ótica", "otica", "presente", "brechó", "brecho"],
    hint: {
      segment: "Varejo e moda",
      angle: "Aspiracional e visual. Linguagem de estilo, curadoria e identidade.",
      benefits: "Curadoria exclusiva, coleções, atendimento personalizado, troca fácil.",
      proof: "Clientes fiéis, releases de coleção, presença de imprensa/influência.",
      ctaStyle: "Ver coleção / Comprar agora",
    },
  },
  {
    keys: ["escola", "curso", "colégio", "colegio", "idiomas", "inglês", "ingles", "reforço", "reforco", "faculdade", "creche"],
    hint: {
      segment: "Educação",
      angle: "Foque em transformação de vida, futuro e método pedagógico.",
      benefits: "Metodologia, professores, estrutura, resultados de alunos.",
      proof: "Aprovações, depoimentos de pais e alunos, prêmios.",
      ctaStyle: "Agendar visita / Matricular-se",
    },
  },
  {
    keys: ["hotel", "pousada", "resort", "turismo", "viagem", "agência de viagem", "agencia de viagem", "passeio"],
    hint: {
      segment: "Turismo e hospedagem",
      angle: "Vender experiência, descanso e memórias. Linguagem sensorial e evocativa.",
      benefits: "Localização, conforto, gastronomia, experiências exclusivas.",
      proof: "Reviews (nota), fotos reais, prêmios de hospedagem.",
      ctaStyle: "Reservar estadia / Consultar disponibilidade",
    },
  },
  {
    keys: ["mecânica", "mecanica", "auto", "oficina", "funilaria", "lava jato", "lava-jato", "estética automotiva", "estetica automotiva"],
    hint: {
      segment: "Automotivo",
      angle: "Transmita confiança técnica e transparência. Tom direto e prático.",
      benefits: "Diagnóstico honesto, peças originais, garantia, prazo.",
      proof: "Anos de mercado, clientes recorrentes, garantia oferecida.",
      ctaStyle: "Agendar serviço / Solicitar orçamento",
    },
  },
  {
    keys: ["eventos", "buffet", "casamento", "fotógrafo", "fotografo", "cerimonial", "decoração", "decoracao"],
    hint: {
      segment: "Eventos",
      angle: "Emocional. Evocar momentos únicos e a segurança de tudo dar certo.",
      benefits: "Equipe experiente, personalização, portfólio, tranquilidade no dia.",
      proof: "Eventos realizados, depoimentos emocionados, fotos.",
      ctaStyle: "Solicitar proposta / Ver portfólio",
    },
  },
];

const FALLBACK: SegmentHint = {
  segment: "Negócio local",
  angle: "Tom claro e humano, focado em benefício concreto e diferencial do negócio.",
  benefits: "Qualidade, atendimento, experiência do cliente, diferencial competitivo.",
  proof: "Depoimentos reais, tempo de mercado, indicações.",
  ctaStyle: "Fale conosco / Solicitar orçamento",
};

export function getSegmentHint(sector: string): SegmentHint {
  const s = sector
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const rule of RULES) {
    for (const k of rule.keys) {
      const kn = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (s.includes(kn)) return rule.hint;
    }
  }
  return FALLBACK;
}

export function segmentPromptBlock(sector: string): string {
  const h = getSegmentHint(sector);
  return `Orientação de segmento (${h.segment}):
- Ângulo: ${h.angle}
- Benefícios a enfatizar: ${h.benefits}
- Provas sociais ideais: ${h.proof}
- Estilo de CTA: ${h.ctaStyle}`;
}
