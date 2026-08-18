/* =====================================================================
   MOTOR DE CÁLCULO — Assinar × Comprar × Financiar
   Data-base das premissas: 18/08/2026
   Todas as funções são puras. Dinheiro em REAIS (float) — arredondado
   apenas na apresentação. Sem dependências externas.
   ===================================================================== */

/* ---------- Tabelas de referência ---------- */

// IPVA: alíquota % sobre valor venal · Licenciamento: R$/ano (2026)
// Fontes: SEFAZ-ES (oficial), Detran-SP, Zul+ (abr/2026), Gringo (jul/2026)
// Onde havia conflito entre fontes, adotou-se a mais recente. Todos editáveis na UI.
var UFS = {
  AC:{n:"Acre",ipva:2.00,lic:194.14},        AL:{n:"Alagoas",ipva:2.75,lic:155.41},
  AP:{n:"Amapá",ipva:3.00,lic:128.54},       AM:{n:"Amazonas",ipva:1.50,lic:110.00},
  BA:{n:"Bahia",ipva:2.50,lic:181.13},       CE:{n:"Ceará",ipva:3.00,lic:204.71},
  DF:{n:"Distrito Federal",ipva:3.50,lic:106.26}, ES:{n:"Espírito Santo",ipva:2.00,lic:237.04},
  GO:{n:"Goiás",ipva:3.75,lic:273.16},       MA:{n:"Maranhão",ipva:3.00,lic:95.87},
  MT:{n:"Mato Grosso",ipva:3.00,lic:197.79}, MS:{n:"Mato Grosso do Sul",ipva:3.00,lic:240.50},
  MG:{n:"Minas Gerais",ipva:4.00,lic:39.36}, PA:{n:"Pará",ipva:2.50,lic:214.51},
  PB:{n:"Paraíba",ipva:2.50,lic:206.55},     PR:{n:"Paraná",ipva:1.90,lic:94.65},
  PE:{n:"Pernambuco",ipva:2.40,lic:158.00},  PI:{n:"Piauí",ipva:2.75,lic:108.03},
  RJ:{n:"Rio de Janeiro",ipva:4.00,lic:293.71}, RN:{n:"Rio Grande do Norte",ipva:3.00,lic:90.00},
  RS:{n:"Rio Grande do Sul",ipva:3.00,lic:114.09}, RO:{n:"Rondônia",ipva:3.00,lic:220.41},
  RR:{n:"Roraima",ipva:3.00,lic:98.47},      SC:{n:"Santa Catarina",ipva:2.00,lic:142.69},
  SP:{n:"São Paulo",ipva:4.00,lic:174.08},   SE:{n:"Sergipe",ipva:2.50,lic:250.14},
  TO:{n:"Tocantins",ipva:2.00,lic:79.63}
};

// Categorias: manutenção R$/ano (ano 1, cresce com idade), pneus (jogo de 4),
// km até troca de pneus, consumo, seguro % do valor FIPE
var CATEGORIAS = {
  popular:  {n:"Popular 1.0 (Mobi, Kwid, Gol)",            manut:1300, pneus:1140, kmPneu:45000, kml:13.5, seguro:5.5, tipo:"comb"},
  hatch:    {n:"Hatch/Sedã compacto (Onix, HB20, Polo, Argo)", manut:1800, pneus:1300, kmPneu:45000, kml:13.0, seguro:5.0, tipo:"comb"},
  suvc:     {n:"SUV compacto (Pulse, T-Cross, Creta, Renegade)", manut:2200, pneus:2400, kmPneu:50000, kml:11.5, seguro:4.5, tipo:"comb"},
  suvm:     {n:"SUV/Sedã médio (Compass, Corolla Cross, Corolla)", manut:3000, pneus:2900, kmPneu:50000, kml:11.0, seguro:4.0, tipo:"comb"},
  picape:   {n:"Picape (Toro, Hilux, S10, Ranger)",         manut:3600, pneus:3400, kmPneu:50000, kml:9.0,  seguro:4.0, tipo:"comb"},
  hibrido:  {n:"Híbrido (BYD King, Song, Corolla Cross)",   manut:1900, pneus:2400, kmPneu:50000, kml:18.0, seguro:3.30, tipo:"comb"},
  eletrico: {n:"Elétrico (BYD Dolphin, Denza)",             manut:1200, pneus:2400, kmPneu:45000, kwh100:15, seguro:3.30, tipo:"ev"}
};

// Curvas de depreciação anual (% sobre o valor do ano anterior)
var DEPREC = {
  fipe:    {n:"Suave — FIPE nominal",        c:[13,10,8,7,6]},
  mercado: {n:"Acelerada — regra clássica",  c:[20,15,12,10,7]},
  eletrico:{n:"Elétrico — medido IBV/BV",    c:[13,21,21,15,10]}
};

/* ---------- Premissas macro (data-base 18/08/2026) ---------- */
var MACRO = {
  cdi: 13.90,        // % a.a. — CDI 17/08/2026
  selic: 14.00,      // % a.a. — Copom 05/08/2026
  ipca: 4.44,        // % 12m  — IBGE jul/2026
  jurosFin: 1.97,    // % a.m. — BCB série 25471, jun/2026
  iofFixo: 0.38,     // %
  iofDia: 0.0082,    // % a.d.
  iofTeto: 3.38,     // %
  emplacamento: 1800,
  aliqRef: 27.91,    // % IBS+CBS — Resolução CGIBS 14/2026
  aliqCBS: 9.21,     // %
  aliqIBS: 18.70,    // %
  pisCofins: 9.25,   // % regime não cumulativo
  irpjCsll: 34.0     // %
};

/* ---------- Utilitários financeiros ---------- */

// IR regressivo sobre renda fixa — Lei 11.033/2004
function aliquotaIR(meses){
  var dias = meses * 30;
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.20;
  if (dias <= 720) return 0.175;
  return 0.15;
}

// Taxa mensal líquida de IR a partir de taxa anual bruta
function taxaMensalLiquida(anualPct, meses){
  var mBruta = Math.pow(1 + anualPct/100, 1/12) - 1;
  return mBruta * (1 - aliquotaIR(meses));
}

function taxaMensal(anualPct){ return Math.pow(1 + anualPct/100, 1/12) - 1; }

// Parcela Tabela Price
function parcelaPrice(pv, iMes, n){
  if (n <= 0) return 0;
  if (iMes === 0) return pv / n;
  return pv * iMes / (1 - Math.pow(1 + iMes, -n));
}

// Saldo devedor após k parcelas pagas (Price)
function saldoDevedor(pv, iMes, n, k){
  if (k >= n) return 0;
  var p = parcelaPrice(pv, iMes, n);
  if (iMes === 0) return pv - p*k;
  return pv * Math.pow(1+iMes, k) - p * (Math.pow(1+iMes, k) - 1) / iMes;
}

// IOF de financiamento: 0,38% fixo + 0,0082% a.d. sobre o saldo, teto 3,38%
function iofFinanciamento(valorFinanciado, prazoMeses){
  var dias = Math.min(prazoMeses * 30, 365);
  var pct = MACRO.iofFixo + Math.min(MACRO.iofDia * dias, 3.00);
  pct = Math.min(pct, MACRO.iofTeto);
  return valorFinanciado * pct/100;
}

// Valor do veículo no mês m, aplicando a curva anual de forma composta mensal
function valorNoMes(precoInicial, curva, m){
  var v = precoInicial, restante = m;
  for (var ano = 0; restante > 0; ano++){
    var taxa = curva[Math.min(ano, curva.length-1)] / 100;
    var mesesNoAno = Math.min(12, restante);
    v = v * Math.pow(1 - taxa, mesesNoAno/12);
    restante -= mesesNoAno;
  }
  return v;
}

/* ---------- Custos de posse mês a mês (quem é dono paga) ---------- */
/* Retorna array de N objetos {ipva, licenciamento, seguro, manutencao, pneus, total} */
function custosPosse(p){
  var out = [], valorAno = p.preco;
  for (var m = 1; m <= p.meses; m++){
    var idadeAnos = Math.floor((m-1)/12);
    // valor venal usado para IPVA e seguro: valor no início de cada ano de posse
    if ((m-1) % 12 === 0) valorAno = valorNoMes(p.preco, p.curva, m-1);
    var infl = Math.pow(1 + p.ipca/100, (m-1)/12);

    var ipva = 0, lic = 0;
    if (p.ipvaIsento && idadeAnos >= 20) { ipva = 0; }
    else { ipva = valorAno * (p.ipvaAliq/100) / 12; }
    lic = (p.licenc * infl) / 12;

    var seguro = valorAno * (p.seguroPct/100) / 12;
    // manutenção cresce ~12% a.a. com a idade do veículo, além da inflação
    var manut = (p.manutAno/12) * Math.pow(1.12, idadeAnos) * infl;
    // pneus: provisão linear por km rodado
    var pneus = p.kmPneu > 0 ? (p.pneusJogo * infl) * (p.kmMes / p.kmPneu) : 0;

    var tot = ipva + lic + seguro + manut + pneus;
    out.push({ipva:ipva, lic:lic, seguro:seguro, manut:manut, pneus:pneus, total:tot});
  }
  return out;
}

/* Combustível/energia — neutro entre cenários, informativo */
function custoEnergiaMes(p, m){
  var infl = Math.pow(1 + p.ipca/100, (m-1)/12);
  if (p.tipoEnergia === "ev") return (p.kmMes/100) * p.kwh100 * p.precoKwh * infl;
  return (p.kmMes / p.kml) * p.precoComb * infl;
}

/* ---------- Simulação dos três cenários ---------- */
/*
 p = {
   preco, meses, kmMes, ipca, cdiPct (% do CDI), cdi, curva, ipvaAliq, licenc,
   seguroPct, manutAno, pneusJogo, kmPneu, emplacamento,
   mensalidade, reajusteAssinatura (%a.a.), kmFranquia, kmExcedente (R$/km),
   entradaPct, jurosFinMes, prazoFin,
   tipoEnergia, kml, kwh100, precoComb, precoKwh, incluirEnergia, ipvaIsento
 }
*/
function simular(p){
  var N = p.meses;
  var iLiq = taxaMensalLiquida(p.cdi * (p.cdiPct/100), N);
  var posse = custosPosse(p);

  var precoTotalCompra = p.preco + p.emplacamento;
  var C0 = precoTotalCompra;   // capital de referência

  // --- A: COMPRAR À VISTA ---
  var sA = C0 - precoTotalCompra;            // = 0
  var A = {fluxo:[], saldo:[], desembolso:0, custos:0};
  // --- C: FINANCIAR ---
  var entrada = p.preco * (p.entradaPct/100);
  var financiado = p.preco - entrada;
  var iof = iofFinanciamento(financiado, p.prazoFin);
  var pvFin = financiado + iof;               // IOF financiado junto
  var parcela = parcelaPrice(pvFin, p.jurosFinMes/100, p.prazoFin);
  var sC = C0 - entrada - p.emplacamento;
  var C = {fluxo:[], saldo:[], desembolso:entrada + p.emplacamento, custos:0, parcela:parcela, iof:iof, totalJuros:0};
  // --- B: ASSINAR ---
  var sB = C0;
  var B = {fluxo:[], saldo:[], desembolso:0, custos:0, excedente:0};

  var energiaTotal = 0;

  for (var m = 1; m <= N; m++){
    var cp = posse[m-1].total;
    var energia = custoEnergiaMes(p, m);
    energiaTotal += energia;
    var eN = p.incluirEnergia ? energia : 0;

    // A
    var fA = cp + eN;
    sA = sA * (1 + iLiq) - fA;
    A.custos += cp; A.fluxo.push(fA); A.saldo.push(sA);

    // C
    var fC = (m <= p.prazoFin ? parcela : 0) + cp + eN;
    sC = sC * (1 + iLiq) - fC;
    C.custos += cp; C.fluxo.push(fC); C.saldo.push(sC);

    // B — mensalidade reajustada por IPCA a cada 12 meses (contrato GoDrive: reajuste IPCA)
    var reaj = Math.pow(1 + p.reajusteAssinatura/100, Math.floor((m-1)/12));
    var mensal = p.mensalidade * reaj;
    var exc = 0;
    if (p.kmFranquia > 0 && p.kmMes > p.kmFranquia) exc = (p.kmMes - p.kmFranquia) * p.kmExcedente;
    B.excedente += exc;
    var fB = mensal + exc + eN;
    sB = sB * (1 + iLiq) - fB;
    B.custos += mensal + exc; B.fluxo.push(fB); B.saldo.push(sB);
  }

  var residual = valorNoMes(p.preco, p.curva, N);
  var devedor = saldoDevedor(pvFin, p.jurosFinMes/100, p.prazoFin, Math.min(N, p.prazoFin));
  C.totalJuros = parcela * Math.min(N, p.prazoFin) - (pvFin - devedor);

  var patA = sA + residual;
  var patC = sC + residual - devedor;
  var patB = sB;

  // Custo líquido do período = C0 capitalizado − patrimônio final
  var C0f = C0 * Math.pow(1 + iLiq, N);
  var custoA = C0f - patA, custoB = C0f - patB, custoC = C0f - patC;

  return {
    iLiq: iLiq, iLiqAA: (Math.pow(1+iLiq,12)-1)*100, aliqIR: aliquotaIR(N),
    residual: residual, energiaTotal: energiaTotal, C0: C0, C0f: C0f,
    posse: posse,
    aVista:   {pat:patA, custo:custoA, saldo:A.saldo, custos:A.custos, desembolso:precoTotalCompra, fluxo:A.fluxo},
    assinar:  {pat:patB, custo:custoB, saldo:B.saldo, custos:B.custos, desembolso:0, excedente:B.excedente, fluxo:B.fluxo},
    financiar:{pat:patC, custo:custoC, saldo:C.saldo, custos:C.custos, desembolso:C.desembolso,
               parcela:parcela, iof:iof, juros:C.totalJuros, devedor:devedor, financiado:financiado, fluxo:C.fluxo}
  };
}

/* =====================================================================
   CAMADA PJ — crédito de tributos indiretos e dedução IRPJ/CSLL
   ===================================================================== */

/* Alíquota creditável sobre a MENSALIDADE de locação, por ano-calendário.
   2026: 0 — RFB veda crédito de PIS/COFINS sobre locação de veículo
         (SC COSIT 7/2015, 218/2019, 59/2021; SC DISIT 6.014/2022).
   2027-2028: CBS cheia (referência − 0,1 p.p., LC 214 art. 347) + IBS 0,1%.
   2029-2032: CBS cheia + IBS a 1/10, 2/10, 3/10, 4/10 da referência (ADCT art. 128).
   2033+: alíquota de referência integral. */
function aliqCreditavelLocacao(ano, ref){
  var cbs = ref.cbs, ibs = ref.ibs;
  if (ano <= 2025) return 0;
  if (ano === 2026) return 0;                       // 0,9%+0,1% são compensados/dispensados
  if (ano <= 2028)  return (cbs - 0.1) + 0.10;
  if (ano === 2029) return cbs + ibs*0.10;
  if (ano === 2030) return cbs + ibs*0.20;
  if (ano === 2031) return cbs + ibs*0.30;
  if (ano === 2032) return cbs + ibs*0.40;
  return cbs + ibs;
}

/* Alíquota creditável na COMPRA do veículo (bem de capital).
   2026: PIS/COFINS só via depreciação (tratado à parte) → 0 imediato.
   2027+: crédito integral e imediato de CBS (LC 214 art. 108); IBS entra na mesma curva. */
function aliqCreditavelCompra(ano, ref){
  return aliqCreditavelLocacao(ano, ref);
}

/*
 pj = {
   regime: "real" | "presumido" | "simples",
   anoInicio: 2026, contribuinteICMS: false,
   ref: {cbs:9.21, ibs:18.70},
   irpjCsll: 34
 }
 base = resultado de simular(), p = parâmetros PF
*/
function simularPJ(p, base, pj){
  var N = p.meses, ref = pj.ref;
  var aproveita = (pj.regime === "real");            // presumido e simples não creditam nem deduzem
  var credAss = [], credCompra = 0, dedAss = 0, dedCompra = 0;
  var linhaAno = {};                                  // agregado por ano-calendário

  // --- crédito indireto: ASSINATURA (mês a mês) ---
  var totCredAss = 0;
  for (var m = 1; m <= N; m++){
    var ano = pj.anoInicio + Math.floor((m-1)/12);
    var reaj = Math.pow(1 + p.reajusteAssinatura/100, Math.floor((m-1)/12));
    var mensal = p.mensalidade * reaj;
    var a = aproveita ? aliqCreditavelLocacao(ano, ref) : 0;
    // o tributo é "por dentro": crédito = base × alíquota (base já inclui o tributo)
    var cred = mensal * a/100;
    totCredAss += cred;
    if (!linhaAno[ano]) linhaAno[ano] = {ano:ano, aliq:a, aliqLei:aliqCreditavelLocacao(ano,ref), credAss:0, credCompra:0, dedAss:0, dedCompra:0};
    linhaAno[ano].credAss += cred;
  }

  // --- crédito indireto: COMPRA (no ato, ano de aquisição) ---
  var anoC = pj.anoInicio;
  if (aproveita){
    if (anoC >= 2027){
      credCompra = p.preco * aliqCreditavelCompra(anoC, ref)/100;   // art. 108 — integral e imediato
    } else {
      // 2026: PIS/COFINS 9,25% sobre os encargos de depreciação do período simulado
      var depAcum = p.preco - valorNoMes(p.preco, p.curva, N);
      // limitado à depreciação fiscal de 20% a.a. (IN RFB 1.700/2017 Anexo III)
      var depFiscal = Math.min(depAcum, p.preco * 0.20 * (N/12));
      credCompra = depFiscal * MACRO.pisCofins/100;
    }
  }
  if (!linhaAno[anoC]) linhaAno[anoC] = {ano:anoC, aliq:(aproveita?aliqCreditavelLocacao(anoC,ref):0), aliqLei:aliqCreditavelLocacao(anoC,ref), credAss:0, credCompra:0, dedAss:0, dedCompra:0};
  linhaAno[anoC].credCompra += credCompra;

  // --- dedução IRPJ/CSLL (só Lucro Real) ---
  var aliqDir = aproveita ? pj.irpjCsll/100 : 0;
  // assinatura: despesa dedutível integral (líquida do crédito já tomado)
  var despAss = 0;
  for (var m2 = 1; m2 <= N; m2++){
    var reaj2 = Math.pow(1 + p.reajusteAssinatura/100, Math.floor((m2-1)/12));
    despAss += p.mensalidade * reaj2;
  }
  despAss += base.assinar.excedente;
  dedAss = (despAss - totCredAss) * aliqDir;

  // compra: depreciação fiscal 20% a.a. + custos de posse dedutíveis
  var depFiscalPeriodo = Math.min(p.preco * 0.20 * (N/12), p.preco);
  dedCompra = (depFiscalPeriodo - credCompra + base.aVista.custos) * aliqDir;

  // distribui deduções por ano para o gráfico
  var anos = Object.keys(linhaAno).map(Number).sort(function(a,b){return a-b;});
  var nAnos = Math.max(1, N/12);
  anos.forEach(function(a){
    var peso = Math.min(12, N - (a - pj.anoInicio)*12) / 12;
    linhaAno[a].dedAss   = dedAss   * (peso / nAnos);
    linhaAno[a].dedCompra= dedCompra* (peso / nAnos);
  });

  // juros e IOF do financiamento sao despesa financeira dedutivel no Lucro Real
  var dedJuros = (base.financiar.juros + base.financiar.iof) * aliqDir;

  var beneficioAss    = totCredAss + dedAss;
  var beneficioCompra = credCompra + dedCompra;

  return {
    regime: pj.regime, anoInicio: pj.anoInicio, aproveita: aproveita,
    credAssinatura: totCredAss, credCompra: credCompra,
    dedAssinatura: dedAss, dedCompra: dedCompra,
    beneficioAssinatura: beneficioAss, beneficioCompra: beneficioCompra,
    custoLiqAssinatura: base.assinar.custo - beneficioAss,
    custoLiqCompra:     base.aVista.custo  - beneficioCompra,
    dedJuros: dedJuros,
    custoLiqFinanciar:  base.financiar.custo - beneficioCompra - dedJuros,
    linhas: anos.map(function(a){ return linhaAno[a]; })
  };
}


/* ═══════════════ DADOS DE REFERÊNCIA (verificados ago/2026) ═══════════════ */
/* Cada item: n=nome · p=preço 0km · c=categoria · m=mensalidade de referência
   · f=origem da mensalidade (pub=publicada · mer=mercado comparável · est=estimada)
   · d=detalhe · e=consumo (km/L) ou kWh/100km · gd=está no catálogo godrive */
var TX_REF=2.129;  /* % do valor do carro por mês — mediana das mensalidades publicadas */
var CATALOGO=[
 // ───── catálogo godrive ─────
 {n:"Toyota Yaris Cross XR", p:149990,c:"suvc",   m:2990,f:"pub",gd:1,e:12.6,d:"SUV compacto flex, CVT, 5 lugares"},
 {n:"BYD Dolphin Mini GL",   p:118990,c:"eletrico",m:2831,f:"mer",gd:1,e:13.6,d:"Elétrico · 38 kWh · 280 km de autonomia"},
 {n:"BYD Dolphin GS",        p:149900,c:"eletrico",m:3551,f:"mer",gd:1,e:15.4,d:"Elétrico · 44,9 kWh · 291 km"},
 {n:"BYD King GL DM-i",      p:172990,c:"hibrido", m:3683,f:"mer",gd:1,e:43.5,d:"Híbrido plug-in · 32 km só no elétrico"},
 {n:"BYD Song Pro GL",       p:189990,c:"hibrido", m:0,   f:"est",gd:1,e:13.9,d:"SUV híbrido plug-in · 49 km elétricos"},
 {n:"BYD Song Plus",         p:249990,c:"hibrido", m:0,   f:"est",gd:1,e:39.5,d:"SUV médio híbrido · 63 km elétricos"},
 {n:"BYD Song Plus Premium", p:299800,c:"hibrido", m:5275,f:"mer",gd:1,e:12.2,d:"SUV médio AWD · 87 km elétricos"},
 {n:"Denza B5",              p:436000,c:"hibrido", m:0,   f:"est",gd:1,e:8.4, d:"SUV off-road híbrido · chassi sobre longarinas"},
 // ───── outros modelos do mercado ─────
 {n:"Renault Kwid Zen",      p:78000, c:"popular", m:1499,f:"mer",gd:0,e:14.6,d:"Hatch de entrada"},
 {n:"Chevrolet Onix 1.0",    p:78720, c:"hatch",   m:2000,f:"mer",gd:0,e:13.7,d:"O carro mais econômico do país (Inmetro)"},
 {n:"VW Polo Track",         p:84690, c:"hatch",   m:1898,f:"mer",gd:0,e:13.5,d:"Hatch compacto"},
 {n:"Hyundai HB20 Limited",  p:91090, c:"hatch",   m:0,   f:"est",gd:0,e:13.3,d:"Hatch compacto"},
 {n:"Fiat Argo Drive",       p:97990, c:"hatch",   m:0,   f:"est",gd:0,e:13.0,d:"Hatch compacto"},
 {n:"Fiat Pulse Drive",      p:102990,c:"suvc",    m:0,   f:"est",gd:0,e:11.5,d:"SUV compacto"},
 {n:"Jeep Renegade Sport",   p:115990,c:"suvc",    m:0,   f:"est",gd:0,e:11.0,d:"SUV compacto T270"},
 {n:"Nissan Kicks",          p:118685,c:"suvc",    m:3239,f:"mer",gd:0,e:11.5,d:"SUV compacto"},
 {n:"VW T-Cross Sense",      p:119272,c:"suvc",    m:3159,f:"mer",gd:0,e:11.9,d:"SUV compacto"},
 {n:"Hyundai Creta Comfort", p:142044,c:"suvc",    m:3351,f:"mer",gd:0,e:12.0,d:"SUV compacto"},
 {n:"Toyota Corolla XEi",    p:157328,c:"suvm",    m:0,   f:"est",gd:0,e:11.0,d:"Sedã médio"},
 {n:"Toyota Corolla Cross XR",p:167844,c:"suvm",   m:0,   f:"est",gd:0,e:11.0,d:"SUV médio"},
 {n:"Jeep Compass Sport",    p:171990,c:"suvm",    m:0,   f:"est",gd:0,e:10.5,d:"SUV médio"},
 {n:"Corolla Cross Hybrid",  p:211844,c:"hibrido", m:0,   f:"est",gd:0,e:18.0,d:"SUV médio híbrido"}
];
/* mensalidade estimada = % do valor, calculado a partir das publicadas — nunca inventado */
CATALOGO.forEach(function(v){ if(!v.m){ v.m=Math.round(v.p*TX_REF/100/10)*10; } });
var PRESETS=CATALOGO;
var FAIXAS=[
 ["Popular / compacto","Mobi, Kwid",1200,1600],["Hatch / sedã médio","Polo, Onix, Cronos",1800,2500],
 ["SUV compacto","T-Cross, Creta, Tracker",2200,3500],["SUV médio","Compass, Corolla Cross, HR-V",3000,4500],
 ["Picape","Toro, S10, Hilux",3500,5500],["Premium / elétrico","BYD Song, XC40, Série 3",4500,8000]
];
var OFERTAS=[
 ["Renault On Demand","Kwid Zen 1.0",1499,48,1000],["Movida","Fiat Mobi Like",1749,48,1000],
 ["Unidas Livre","Kwid Intense",1799,24,1000],["Unidas Livre","VW Polo Robust",1898,36,1000],
 ["Localiza Meoo","Chevrolet Onix Flex 1.0",2000,48,1000],["Unidas Livre","VW Tera MPI 2026",2292,36,1000],
 ["BYD (direto)","Dolphin Mini GL EV",2831,48,1000],["Nissan Move","Kicks Sense",3239,48,1000],
 ["Localiza Meoo","Hyundai Creta Comfort 1.0",3351,24,1000],["BYD (direto)","Dolphin GS5 EV",3551,48,1000],
 ["BYD (direto)","King GL DM-i",3683,48,1000],["Unidas Livre","BYD King GL DM-i",4479,36,1000],
 ["BYD (direto)","Song Plus Premium DM-i",5275,48,1000]
];
// preco: numero = mensalidade publicada pela godrive; null = sob proposta
var GODRIVE=[
 ["Toyota Yaris Cross XR","SUV compacto flex, CVT, 5 lugares · 12,4 km/L cidade e 13,6 na estrada",2990],
 ["BYD Dolphin GS","Elétrico",null],["BYD Dolphin Mini GL","Elétrico",null],
 ["BYD King GL","Híbrido plug-in DM-i, 209 cv",null],["BYD Song Pro GL","Híbrido plug-in",null],
 ["BYD Song Plus","Híbrido plug-in",null],["BYD Song Plus Premium","Híbrido plug-in",null],
 ["Denza B5","SUV off-road híbrido",null]
];
var FONTES=[
 ["CDI","13,90% a.a.","17/08/2026","Taxa DI"],["Selic meta","14,00% a.a.","05/08/2026","Copom"],
 ["IPCA 12 meses","4,44%","jul/2026","IBGE"],
 ["Juros financiamento PF","1,97% a.m.","jun/2026","BCB, série 25471"],
 ["IOF financiamento","0,38% + 0,0082%/dia, teto 3,38%","2026","Decreto 6.306/2007"],
 ["IR renda fixa","22,5% · 20% · 17,5% · 15%","vigente","Lei 11.033/2004"],
 ["Depreciação 1º ano","13% conservadora · 20% mercado","2026","FIPE medida / regra de mercado"],
 ["Seguro auto","3% a 8% do valor (média 5%)","fev/2026","Pesquisa de mercado"],
 ["Prêmio médio nacional","R$ 2.390 homens · R$ 2.908 mulheres","jan/2026","Creditas Seguros"],
 ["Revisão anual","R$ 920 a R$ 5.100 por categoria","jun/2026","Concessionárias"],
 ["Jogo de 4 pneus","R$ 760 a R$ 3.800 por categoria","nov/2025","Varejo"],
 ["Vida útil dos pneus","40.000 a 60.000 km","2026","Fabricantes"],
 ["Gasolina comum","R$ 6,554 /L","02–08/08/2026","ANP"],
 ["Etanol hidratado","R$ 3,94 /L","02–08/08/2026","ANP · paridade 60,15%"],
 ["Emplacamento 0 km","R$ 800 a R$ 2.500","mai/2026","Detrans estaduais"],
 ["DPVAT / SPVAT","R$ 0,00 — extinto","2026","LC 211/2024"],
 ["Isenção IPVA","20 anos, nacional","dez/2025","EC 137/2025"],
 ["Alíquota IBS+CBS","27,91% (18,70 + 9,21)","29/07/2026","Resolução CGIBS nº 14"],
 ["Depreciação fiscal PJ","20% a.a. — automóveis","2017","IN RFB 1.700, Anexo III"],
 ["Crédito na locação hoje","0% — vedado","2015–2022","SC COSIT 7, 218, 59"]
];
var REFORMA=[
 ["2026","Ano-teste: CBS 0,9% e IBS 0,1%, compensados","0%","PIS/COFINS só sobre a depreciação","ADCT 125 · LC 214 arts. 343-348"],
 ["2027–28","CBS cheia. PIS e COFINS extintos. IPI zerado","≈ 9,21%","Crédito integral e imediato","ADCT 126 · LC 214 arts. 108 e 347"],
 ["2029","IBS a 1/10. ICMS e ISS caem para 90%","≈ 11,08%","Integral no ato","ADCT 127-128"],
 ["2030","IBS a 2/10. ICMS e ISS a 80%","≈ 12,95%","Integral no ato","ADCT 128"],
 ["2031","IBS a 3/10. ICMS e ISS a 70%","≈ 14,82%","Integral no ato","ADCT 128"],
 ["2032","IBS a 4/10. ICMS e ISS a 60%","≈ 16,69%","Integral no ato","ADCT 128"],
 ["2033","Regime pleno. ICMS e ISS extintos","27,91%","27,91% integral","ADCT 129"]
];

/* exports para os golden tests de paridade */
module.exports = {
  UFS, CATEGORIAS, DEPREC, MACRO, CATALOGO, TX_REF,
  aliquotaIR, taxaMensalLiquida, taxaMensal, parcelaPrice, saldoDevedor,
  iofFinanciamento, valorNoMes, custosPosse, custoEnergiaMes,
  simular, aliqCreditavelLocacao, aliqCreditavelCompra, simularPJ
};
module.exports.FAIXAS=FAIXAS; module.exports.OFERTAS=OFERTAS; module.exports.GODRIVE=GODRIVE;
module.exports.FONTES=FONTES; module.exports.REFORMA=REFORMA;
