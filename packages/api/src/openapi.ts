/** Descrição OpenAPI 3.1 — escrita à mão, curta e fiel. */
export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Calculadora godrive',
    version: '1.0.0',
    description:
      'Assinar, comprar à vista ou financiar? Simulação financeira completa de veículos no Brasil, com custo de oportunidade (CDI líquido de IR), custos de posse por UF, depreciação, financiamento Price com IOF e camada tributária PJ (reforma 2026-2033). Data-base das premissas: 18/08/2026.',
  },
  paths: {
    '/api/v1/health': {
      get: { summary: 'Sonda de vida', responses: { '200': { description: 'ok' } } },
    },
    '/api/v1/reference': {
      get: {
        summary: 'Dados de referência (UFs, categorias, curvas, macro, fontes, reforma)',
        responses: { '200': { description: 'Tabelas de referência com fontes' } },
      },
    },
    '/api/v1/catalog': {
      get: {
        summary: 'Catálogo de veículos, faixas de mercado e ofertas comparáveis',
        responses: { '200': { description: 'Catálogo' } },
      },
    },
    '/api/v1/simulate': {
      post: {
        summary: 'Simula os três cenários (PF)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Simulacao' } } },
        },
        responses: {
          '200': { description: 'Resultado + mensalidade de equilíbrio' },
          '400': { description: 'Parâmetros inválidos (campo a campo)' },
        },
      },
    },
    '/api/v1/simulate-pj': {
      post: {
        summary: 'Simulação PF + camada tributária PJ',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['simulacao', 'pj'],
                properties: {
                  simulacao: { $ref: '#/components/schemas/Simulacao' },
                  pj: { $ref: '#/components/schemas/PJ' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Resultado PF + créditos/deduções PJ' },
          '400': { description: 'Parâmetros inválidos' },
        },
      },
    },
  },
  components: {
    schemas: {
      Simulacao: {
        type: 'object',
        description: 'Parâmetros da simulação. Percentuais como "4.44" = 4,44%.',
        required: [
          'preco', 'meses', 'kmMes', 'ipca', 'cdi', 'cdiPct', 'curva', 'ipvaAliq',
          'licenc', 'seguroPct', 'manutAno', 'pneusJogo', 'kmPneu', 'emplacamento',
          'mensalidade', 'reajusteAssinatura', 'kmFranquia', 'kmExcedente',
          'entradaPct', 'jurosFinMes', 'prazoFin', 'tipoEnergia', 'kml', 'kwh100',
          'precoComb', 'precoKwh', 'incluirEnergia', 'ipvaIsento',
        ],
        properties: {
          preco: { type: 'number', description: 'Preço 0 km (R$)' },
          meses: { type: 'integer', maximum: 120 },
          kmMes: { type: 'number' },
          ipca: { type: 'number' },
          cdi: { type: 'number' },
          cdiPct: { type: 'number', description: '% do CDI que o dinheiro rende' },
          curva: { type: 'array', items: { type: 'number' }, description: 'Depreciação anual %' },
          ipvaAliq: { type: 'number' },
          licenc: { type: 'number' },
          seguroPct: { type: 'number' },
          manutAno: { type: 'number' },
          pneusJogo: { type: 'number' },
          kmPneu: { type: 'number' },
          emplacamento: { type: 'number' },
          mensalidade: { type: 'number' },
          reajusteAssinatura: { type: 'number' },
          kmFranquia: { type: 'number', description: '0 = ilimitada' },
          kmExcedente: { type: 'number', description: 'R$/km' },
          entradaPct: { type: 'number' },
          jurosFinMes: { type: 'number' },
          prazoFin: { type: 'integer' },
          tipoEnergia: { type: 'string', enum: ['comb', 'ev'] },
          kml: { type: 'number' },
          kwh100: { type: 'number' },
          precoComb: { type: 'number' },
          precoKwh: { type: 'number' },
          incluirEnergia: { type: 'boolean' },
          ipvaIsento: { type: 'boolean' },
        },
      },
      PJ: {
        type: 'object',
        required: [
          'regime',
          'anoInicio',
          'ref',
          'irpjCsll',
          'faturamentoAnual',
          'margemPct',
          'simplesHibrido',
        ],
        properties: {
          regime: { type: 'string', enum: ['real', 'presumido', 'simples'] },
          anoInicio: { type: 'integer' },
          ref: {
            type: 'object',
            properties: { cbs: { type: 'number' }, ibs: { type: 'number' } },
          },
          irpjCsll: { type: 'number' },
          faturamentoAnual: {
            type: 'number',
            description: 'Faturamento anual da empresa (R$). Define a alíquota marginal de IRPJ.',
          },
          margemPct: {
            type: 'number',
            description: 'Margem de lucro sobre o faturamento (%). Base do lucro tributável.',
          },
          simplesHibrido: {
            type: 'boolean',
            description:
              'Simples que optou pelo regime regular de IBS/CBS (LC 214/2025). Só ele credita.',
          },
        },
      },
    },
  },
} as const;
