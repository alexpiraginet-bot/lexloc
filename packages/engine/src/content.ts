/**
 * Conteúdo editorial e de mercado — verificado em agosto/2026.
 * Gerado do original; a redação é parte do produto.
 */

/** [segmento, exemplos, mensalidade mínima, máxima] */
export const FAIXAS: readonly (readonly [string, string, number, number])[] = [
 [
  "Popular / compacto",
  "Mobi, Kwid",
  1200,
  1600
 ],
 [
  "Hatch / sedã médio",
  "Polo, Onix, Cronos",
  1800,
  2500
 ],
 [
  "SUV compacto",
  "T-Cross, Creta, Tracker",
  2200,
  3500
 ],
 [
  "SUV médio",
  "Compass, Corolla Cross, HR-V",
  3000,
  4500
 ],
 [
  "Picape",
  "Toro, S10, Hilux",
  3500,
  5500
 ],
 [
  "Premium / elétrico",
  "BYD Song, XC40, Série 3",
  4500,
  8000
 ]
] as const;

/** [empresa, veículo, mensalidade, prazo meses, franquia km] */
export const OFERTAS: readonly (readonly [string, string, number, number, number])[] = [
 [
  "Renault On Demand",
  "Kwid Zen 1.0",
  1499,
  48,
  1000
 ],
 [
  "Movida",
  "Fiat Mobi Like",
  1749,
  48,
  1000
 ],
 [
  "Unidas Livre",
  "Kwid Intense",
  1799,
  24,
  1000
 ],
 [
  "Unidas Livre",
  "VW Polo Robust",
  1898,
  36,
  1000
 ],
 [
  "Localiza Meoo",
  "Chevrolet Onix Flex 1.0",
  2000,
  48,
  1000
 ],
 [
  "Unidas Livre",
  "VW Tera MPI 2026",
  2292,
  36,
  1000
 ],
 [
  "BYD (direto)",
  "Dolphin Mini GL EV",
  2831,
  48,
  1000
 ],
 [
  "Nissan Move",
  "Kicks Sense",
  3239,
  48,
  1000
 ],
 [
  "Localiza Meoo",
  "Hyundai Creta Comfort 1.0",
  3351,
  24,
  1000
 ],
 [
  "BYD (direto)",
  "Dolphin GS5 EV",
  3551,
  48,
  1000
 ],
 [
  "BYD (direto)",
  "King GL DM-i",
  3683,
  48,
  1000
 ],
 [
  "Unidas Livre",
  "BYD King GL DM-i",
  4479,
  36,
  1000
 ],
 [
  "BYD (direto)",
  "Song Plus Premium DM-i",
  5275,
  48,
  1000
 ]
] as const;

/** Catálogo publicado godrive: [modelo, detalhe, mensalidade | null (sob proposta)] */
export const GODRIVE: readonly (readonly [string, string, number | null])[] = [
 [
  "Toyota Yaris Cross XR",
  "SUV compacto flex, CVT, 5 lugares · 12,4 km/L cidade e 13,6 na estrada",
  2990
 ],
 [
  "BYD Dolphin GS",
  "Elétrico",
  null
 ],
 [
  "BYD Dolphin Mini GL",
  "Elétrico",
  null
 ],
 [
  "BYD King GL",
  "Híbrido plug-in DM-i, 209 cv",
  null
 ],
 [
  "BYD Song Pro GL",
  "Híbrido plug-in",
  null
 ],
 [
  "BYD Song Plus",
  "Híbrido plug-in",
  null
 ],
 [
  "BYD Song Plus Premium",
  "Híbrido plug-in",
  null
 ],
 [
  "Denza B5",
  "SUV off-road híbrido",
  null
 ]
] as const;

/** [indicador, valor, data, fonte] */
export const FONTES: readonly (readonly [string, string, string, string])[] = [
 [
  "CDI",
  "13,90% a.a.",
  "17/08/2026",
  "Taxa DI"
 ],
 [
  "Selic meta",
  "14,00% a.a.",
  "05/08/2026",
  "Copom"
 ],
 [
  "IPCA 12 meses",
  "4,44%",
  "jul/2026",
  "IBGE"
 ],
 [
  "Juros financiamento PF",
  "1,97% a.m.",
  "jun/2026",
  "BCB, série 25471"
 ],
 [
  "IOF financiamento",
  "0,38% + 0,0082%/dia, teto 3,38%",
  "2026",
  "Decreto 6.306/2007"
 ],
 [
  "IR renda fixa",
  "22,5% · 20% · 17,5% · 15%",
  "vigente",
  "Lei 11.033/2004"
 ],
 [
  "Depreciação 1º ano",
  "13% conservadora · 20% mercado",
  "2026",
  "FIPE medida / regra de mercado"
 ],
 [
  "Seguro auto",
  "3% a 8% do valor (média 5%)",
  "fev/2026",
  "Pesquisa de mercado"
 ],
 [
  "Prêmio médio nacional",
  "R$ 2.390 homens · R$ 2.908 mulheres",
  "jan/2026",
  "Creditas Seguros"
 ],
 [
  "Revisão anual",
  "R$ 920 a R$ 5.100 por categoria",
  "jun/2026",
  "Concessionárias"
 ],
 [
  "Jogo de 4 pneus",
  "R$ 760 a R$ 3.800 por categoria",
  "nov/2025",
  "Varejo"
 ],
 [
  "Vida útil dos pneus",
  "40.000 a 60.000 km",
  "2026",
  "Fabricantes"
 ],
 [
  "Gasolina comum",
  "R$ 6,554 /L",
  "02–08/08/2026",
  "ANP"
 ],
 [
  "Etanol hidratado",
  "R$ 3,94 /L",
  "02–08/08/2026",
  "ANP · paridade 60,15%"
 ],
 [
  "Emplacamento 0 km",
  "R$ 800 a R$ 2.500",
  "mai/2026",
  "Detrans estaduais"
 ],
 [
  "DPVAT / SPVAT",
  "R$ 0,00 — extinto",
  "2026",
  "LC 211/2024"
 ],
 [
  "Isenção IPVA",
  "20 anos, nacional",
  "dez/2025",
  "EC 137/2025"
 ],
 [
  "Alíquota IBS+CBS",
  "27,91% (18,70 + 9,21)",
  "29/07/2026",
  "Resolução CGIBS nº 14"
 ],
 [
  "Depreciação fiscal PJ",
  "20% a.a. — automóveis",
  "2017",
  "IN RFB 1.700, Anexo III"
 ],
 [
  "Crédito na locação hoje",
  "0% — vedado",
  "2015–2022",
  "SC COSIT 7, 218, 59"
 ]
] as const;

/** Cronograma da reforma tributária: [período, o que muda, alíquota creditável, crédito, base legal] */
export const REFORMA: readonly (readonly [string, string, string, string, string])[] = [
 [
  "2026",
  "Ano-teste: CBS 0,9% e IBS 0,1%, compensados",
  "0%",
  "PIS/COFINS só sobre a depreciação",
  "ADCT 125 · LC 214 arts. 343-348"
 ],
 [
  "2027–28",
  "CBS cheia. PIS e COFINS extintos. IPI zerado",
  "≈ 9,21%",
  "Crédito integral e imediato",
  "ADCT 126 · LC 214 arts. 108 e 347"
 ],
 [
  "2029",
  "IBS a 1/10. ICMS e ISS caem para 90%",
  "≈ 11,08%",
  "Integral no ato",
  "ADCT 127-128"
 ],
 [
  "2030",
  "IBS a 2/10. ICMS e ISS a 80%",
  "≈ 12,95%",
  "Integral no ato",
  "ADCT 128"
 ],
 [
  "2031",
  "IBS a 3/10. ICMS e ISS a 70%",
  "≈ 14,82%",
  "Integral no ato",
  "ADCT 128"
 ],
 [
  "2032",
  "IBS a 4/10. ICMS e ISS a 60%",
  "≈ 16,69%",
  "Integral no ato",
  "ADCT 128"
 ],
 [
  "2033",
  "Regime pleno. ICMS e ISS extintos",
  "27,91%",
  "27,91% integral",
  "ADCT 129"
 ]
] as const;

/** O que está incluído na assinatura godrive. */
export const INCLUSO: readonly string[] = [
 "Veículo 0 km, emplacado e documentado no seu nome de uso",
 "IPVA, licenciamento, emplacamento e demais taxas",
 "Seguro com proteção contra roubo e furto",
 "Cobertura a terceiros de R$ 100.000 e danos corporais de R$ 300.000",
 "Manutenção completa em rede credenciada, com todas as revisões",
 "Desgaste natural de freios, discos, suspensão e embreagem",
 "Pneus trocados pelo indicador de desgaste",
 "Alinhamento e balanceamento",
 "Carro reserva em caso de sinistro ou reparo",
 "Assistência 24 horas: guincho de até 200 km, pane seca, chaveiro e troca de pneu",
 "Higienização mensal do veículo",
 "Gestão de multas pelo aplicativo",
 "Até 4 condutores adicionais habilitados",
 "Quilometragem não usada acumula para os meses seguintes"
] as const;

/** Perguntas frequentes: [pergunta, resposta] */
export const FAQ: readonly (readonly [string, string])[] = [
 [
  "Preciso dar entrada?",
  "Não. A assinatura não tem entrada nem caução. Você paga a primeira mensalidade e retira o carro."
 ],
 [
  "O que acontece se eu rodar mais que a franquia?",
  "O quilômetro excedente é cobrado ao final do contrato, no valor definido em contrato. E o km que você não usa em um mês acumula para os meses seguintes."
 ],
 [
  "E se eu quiser sair antes do prazo?",
  "Há multa de rescisão equivalente a 3 mensalidades."
 ],
 [
  "Quem paga o IPVA e o licenciamento?",
  "A locadora. Está tudo na mensalidade — você não recebe boleto de IPVA em janeiro."
 ],
 [
  "E se o carro quebrar ou for roubado?",
  "Manutenção e revisões estão inclusas na rede credenciada. Em sinistro ou reparo você recebe carro reserva, e há proteção contra roubo e furto."
 ],
 [
  "Quantas pessoas podem dirigir?",
  "Até 4 condutores adicionais habilitados, além de você. O titular precisa ter 18 anos e CNH definitiva."
 ],
 [
  "Preciso de garagem?",
  "Sim, garagem fechada é exigida em contrato."
 ],
 [
  "Posso usar para aplicativo de transporte?",
  "O uso comercial normalmente não é permitido no plano de pessoa física. Confirme antes de contratar."
 ],
 [
  "Como funciona o reajuste?",
  "A mensalidade é reajustada anualmente pelo IPCA."
 ],
 [
  "Posso pagar no cartão?",
  "Sim. A locadora aceita cartão de crédito, e boleto nas mensalidades seguintes."
 ],
 [
  "Sirvo para pessoa jurídica?",
  "Sim. Há plano para PF e para PJ, com contratos de 12 a 36 meses e gestão de frota."
 ],
 [
  "O que acontece no fim do contrato?",
  "Você devolve o carro e escolhe outro plano, ou encerra. Não existe revenda, vistoria nem transferência para você resolver."
 ]
] as const;

export const LOJAS: readonly string[] = [
 "Vitória — ES · Av. Leitão da Silva e Reta da Penha",
 "Belo Horizonte — MG",
 "Brasília — DF · 3 unidades",
 "Goiânia — GO"
] as const;

/** Vantagens da assinatura: [título, explicação] */
export const VANTAGENS: readonly (readonly [string, string])[] = [
 [
  "Carro 0 km, sempre",
  "Você roda em veículo novo e troca no fim do contrato, sem herdar problema de ninguém."
 ],
 [
  "Zero entrada",
  "Nenhum capital imobilizado. O dinheiro que seria do carro continua rendendo, ou vai para o seu negócio."
 ],
 [
  "Nenhuma surpresa de oficina",
  "Manutenção, revisões e desgaste natural de freios, discos, suspensão e embreagem entram na mensalidade."
 ],
 [
  "Carro reserva",
  "Sinistro ou reparo não te deixa a pé."
 ],
 [
  "Assistência 24 horas",
  "Guincho de até 200 km, pane seca, chaveiro e troca de pneu."
 ],
 [
  "Proteção contra roubo e furto",
  "Sem cotação anual de seguro, sem bônus perdido, sem susto na renovação."
 ],
 [
  "Gestão de multas",
  "Você indica o condutor pelo aplicativo e acabou."
 ],
 [
  "Higienização mensal",
  "Limpeza inclusa, sem custo extra."
 ],
 [
  "Documentação resolvida",
  "IPVA, licenciamento, emplacamento e taxas: tudo por conta da locadora."
 ],
 [
  "Sem dor de cabeça na revenda",
  "Nada de anúncio, visita de curioso, vistoria cautelar ou transferência."
 ],
 [
  "Previsibilidade de caixa",
  "Uma parcela só, reajustada por IPCA. Dá para orçar o ano inteiro."
 ],
 [
  "Troca de carro quando o contrato acabar",
  "Trocar de modelo é escolher outro plano, não vender um carro."
 ]
] as const;
