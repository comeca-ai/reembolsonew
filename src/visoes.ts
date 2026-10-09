import { brl, julgar, type Comprovante } from "./politica.ts";

export type Aba = "stefanini" | "abder";

type NotaAbder = {
  dias: number;
  valorCentavos: number | null;
  clientes: boolean;
  viagemRefeicao: boolean;
  relacionamento: boolean;
  nfCustos: boolean;
  autorizado: boolean;
  alcool: boolean;
  multa: boolean;
  taxiApp: boolean;
  hora: number | null;
  parceira: boolean;
  comunicou: boolean;
  km: number | null;
  mapa: boolean;
  preAprovado: boolean;
  comprovante: boolean;
  ocasiaoEscrita: boolean;
};

export type Linha = { caso: string; estado: string; linha: string };

const base = (extra: Partial<Comprovante>): Comprovante => ({
  tipo: "refeicao",
  valorCentavos: 2_000,
  dataEmissao: "2026-10-08",
  documentoFiscal: true,
  temCnpj: true,
  nomeNoComprovante: "Ana",
  colaborador: "Ana",
  pagamento: "credito",
  ...extra,
});

function abder(n: NotaAbder): Linha["estado"] extends never ? never : { estado: string; linha: string } {
  if (n.multa) return { estado: "Não reembolsa", linha: "Multa de trânsito está na lista." };
  if (n.alcool) return { estado: "Não reembolsa", linha: "Bebida alcoólica está na lista." };
  if (n.dias > 10) return { estado: "Não reembolsa", linha: "Passou de 10 dias. Item 5.2." };
  if (n.km != null) {
    if (!n.mapa || !n.preAprovado) return { estado: "Não entra", linha: "Km exige mapa impresso e pré-aprovação." };
    return { estado: "Reembolsa", linha: `${brl(n.km * 100)}. R$ 1,00 por km.` };
  }
  if (n.clientes || n.viagemRefeicao || n.relacionamento) {
    if (!n.nfCustos) return { estado: "Não entra", linha: "Refeição exige NF com a descrição dos custos." };
    if ((n.valorCentavos ?? 0) > 200_000 && !n.autorizado) return { estado: "Não reembolsa", linha: "Acima de R$ 2.000,00 sem autorização." };
    return { estado: "Reembolsa", linha: brl(n.valorCentavos ?? 0) + ". Refeição escrita na política." };
  }
  if (n.taxiApp || n.hora != null) {
    if (n.hora != null && n.hora >= 22 && (!n.parceira || !n.comunicou)) {
      return { estado: "Não entra", linha: "Depois das 22h exige parceira e comunicação." };
    }
    if (n.taxiApp && (n.hora == null || n.hora < 22)) return { estado: "Reembolsa", linha: "Aplicativo está escrito." };
    return { estado: "Não entra", linha: "Táxi sem o que a política pede." };
  }
  if (n.comprovante && !n.ocasiaoEscrita) return { estado: "Reembolsa", linha: "Pedágio ou estacionamento com comprovante." };
  if (n.ocasiaoEscrita) return { estado: "Não entra", linha: "Não diz viagem, relacionamento ou clientes." };
  return { estado: "Não decide", linha: "Caso omisso. Presidente ou Superintendente." };
}

const vazio: NotaAbder = {
  dias: 1,
  valorCentavos: null,
  clientes: false,
  viagemRefeicao: false,
  relacionamento: false,
  nfCustos: false,
  autorizado: false,
  alcool: false,
  multa: false,
  taxiApp: false,
  hora: null,
  parceira: false,
  comunicou: false,
  km: null,
  mapa: false,
  preAprovado: false,
  comprovante: false,
  ocasiaoEscrita: false,
};

const casos: { nome: string; stefanini: Comprovante; abder: NotaAbder }[] = [
  {
    nome: "Jantar de R$ 20, após a jornada",
    stefanini: base({ ocasiao: "jantar", horasAposJornada: 3, justificativaExtraordinaria: true, aprovacaoGestorPrevia: true }),
    abder: { ...vazio, dias: 1, valorCentavos: 2_000, ocasiaoEscrita: true, nfCustos: true },
  },
  {
    nome: "Refeição com clientes, R$ 2.000,00",
    stefanini: base({ valorCentavos: 200_000, ocasiao: "jantar", horasAposJornada: 3, justificativaExtraordinaria: true, aprovacaoGestorPrevia: true }),
    abder: { ...vazio, dias: 3, valorCentavos: 200_000, clientes: true, nfCustos: true },
  },
  {
    nome: "Bebida alcoólica",
    stefanini: base({ alcool: true, ocasiao: "jantar", horasAposJornada: 3, justificativaExtraordinaria: true, aprovacaoGestorPrevia: true }),
    abder: { ...vazio, dias: 1, valorCentavos: 4_000, alcool: true, clientes: true, nfCustos: true },
  },
  {
    nome: "Uber antes das 22h",
    stefanini: base({
      tipo: "taxi",
      meioTaxi: "uber",
      justificativaExtraordinaria: true,
      horasAposJornada: 3,
      valorCentavos: 3_500,
    }),
    abder: { ...vazio, dias: 1, valorCentavos: 3_500, taxiApp: true, hora: 21 },
  },
  {
    nome: "Táxi às 22h, sem parceira",
    stefanini: base({ tipo: "taxi", meioTaxi: "convencional", hora: "22:10", valorCentavos: 4_000 }),
    abder: { ...vazio, dias: 1, valorCentavos: 4_000, hora: 22 },
  },
  {
    nome: "Pedágio com comprovante",
    stefanini: base({ tipo: "pedagio", valorCentavos: 1_250 }),
    abder: { ...vazio, dias: 1, valorCentavos: 1_250, comprovante: true },
  },
  {
    nome: "Estacionamento de R$ 18,00",
    stefanini: base({ tipo: "estacionamento", valorCentavos: 1_800 }),
    abder: { ...vazio, dias: 1, valorCentavos: 1_800, comprovante: true },
  },
  {
    nome: "40 km com mapa e pré-aprovação",
    stefanini: base({ tipo: "outro", valorCentavos: 4_000 }),
    abder: { ...vazio, dias: 1, km: 40, mapa: true, preAprovado: true },
  },
  {
    nome: "Nota no 11º dia",
    stefanini: base({ dataEmissao: "2026-09-28", ocasiao: "jantar", horasAposJornada: 3, justificativaExtraordinaria: true, aprovacaoGestorPrevia: true }),
    abder: { ...vazio, dias: 11, valorCentavos: 2_000, clientes: true, nfCustos: true },
  },
];

export function linhas(aba: Aba): Linha[] {
  return casos.map((caso) => {
    if (aba === "abder") {
      const saida = abder(caso.abder);
      return { caso: caso.nome, estado: saida.estado, linha: saida.linha };
    }
    const j = julgar(caso.stefanini);
    const estado = j.status === "aprovada" ? "Aprovada" : j.status === "excedente_vp" ? "Excedente" : j.status === "nao_lida" ? "Não lida" : "Barrada";
    return { caso: caso.nome, estado, linha: j.mensagem };
  });
}

function esc(valor: string): string {
  return valor.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}

export function corpoVisoes(aba: Aba, ufs: readonly string[]): string {
  const atual = aba === "abder" ? "abder" : "stefanini";
  const titulo = atual === "abder" ? "ABDER" : "Stefanini";
  const itens = linhas(atual)
    .map((linha) => `<li><span>${esc(linha.estado)}</span><span>${esc(linha.caso)}. ${esc(linha.linha)}</span></li>`)
    .join("");
  return `<nav class="abas">
  <a href="/torito?p=stefanini"${atual === "stefanini" ? ' aria-current="page"' : ""}>Stefanini</a>
  <a href="/torito?p=abder"${atual === "abder" ? ' aria-current="page"' : ""}>ABDER</a>
</nav>
<p class="estado">${titulo}</p>
<p class="contexto">${atual === "abder" ? "Assembleia de 08/04/2024, Palmas/TO." : "Emissão 2018-07."}</p>
<ul class="risco">${itens}</ul>
<p class="efeito">Sem crédito. Esta aba não marca o Pix do Torito.</p>
<p class="contexto">${ufs.map((uf) => esc(uf)).join(" · ")}</p>
<footer>LC 214/2025 · base vazia · não é decisão</footer>`;
}
