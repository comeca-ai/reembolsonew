export const POLITICA = {
  nome: "Política de Reembolso de Despesas e Adiantamento de Viagem",
  empresa: "Stefanini",
  emissao: "2018-07",
  prazoDias: 60,
  jantarTetoCentavos: 2_000,
  estacionamentoTetoCentavos: 1_800,
  appsTaxi: ["uber", "99", "cabify", "easy"] as const,
};

export type MeioTaxi = (typeof POLITICA.appsTaxi)[number] | "convencional";
export type Pagamento = "dinheiro" | "debito" | "credito" | "pix" | "app" | "outro";
export type Ocasiao = "cafe" | "almoco" | "jantar";
export type Tipo = "taxi" | "refeicao" | "estacionamento" | "pedagio" | "transporte" | "outro";
export type Status = "aprovada" | "barrada" | "excedente_vp" | "nao_lida";

export type Comprovante = {
  id?: string;
  descricao?: string;
  tipo: Tipo;
  valorCentavos: number | null;
  dataEmissao: string | null;
  hora?: string | null;
  documentoFiscal: boolean;
  temCnpj: boolean;
  nomeNoComprovante?: string | null;
  colaborador?: string | null;
  gestor?: string | null;
  pagamento?: Pagamento | null;
  meioTaxi?: MeioTaxi | null;
  justificativaExtraordinaria?: boolean;
  horasAposJornada?: number | null;
  aprovacaoGestorPrevia?: boolean;
  autorizacaoVp?: boolean;
  viagem?: boolean;
  destinoAeroporto?: boolean;
  ocasiao?: Ocasiao | null;
  feriado?: boolean;
  beneficioJaPago?: boolean;
  alcool?: boolean;
  itemVedado?: boolean;
  convenioCentavos?: number | null;
  hoje?: string;
};

export type Motivo = { codigo: string; texto: string };

export type Julgamento = {
  status: Status;
  mensagem: string;
  motivos: Motivo[];
  conforme: string[];
  valorReembolsavelCentavos: number | null;
  politica: { nome: string; empresa: string; emissao: string };
};

const VP_PODE = new Set(["acima_teto"]);

export function brl(centavos: number): string {
  const sinal = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  const reais = Math.floor(abs / 100).toString();
  const cents = String(abs % 100).padStart(2, "0");
  return `${sinal}R$ ${reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cents}`;
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function mesmoNome(a: string, b: string): boolean {
  return norm(a) === norm(b);
}

function diasAte(de: string, ate: string): number {
  const a = Date.parse(`${de}T00:00:00Z`);
  const b = Date.parse(`${ate}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

function fimDeSemana(iso: string): boolean {
  const dia = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return dia === 0 || dia === 6;
}

function ocasiaoDe(c: Comprovante): Ocasiao | null {
  return c.ocasiao ?? null;
}

function nomeSituacao(c: Comprovante): "ok" | "ausente" | "terceiro" {
  const nome = c.nomeNoComprovante?.trim();
  if (!nome) return "ausente";
  const alvos = [c.colaborador, c.gestor].filter((v): v is string => Boolean(v?.trim()));
  if (alvos.length === 0) return "ausente";
  return alvos.some((alvo) => mesmoNome(nome, alvo)) ? "ok" : "terceiro";
}

function tetoJantar(c: Comprovante): number {
  const convenio = c.convenioCentavos ?? 0;
  return Math.max(POLITICA.jantarTetoCentavos, convenio);
}

export function julgar(entrada: Comprovante, hojePadrao = "2026-10-09"): Julgamento {
  const hoje = entrada.hoje ?? hojePadrao;
  const motivos: Motivo[] = [];
  const conforme: string[] = [];
  const politica = {
    nome: POLITICA.nome,
    empresa: POLITICA.empresa,
    emissao: POLITICA.emissao,
  };

  if (!entrada.dataEmissao || entrada.valorCentavos == null) {
    const falta = [
      !entrada.dataEmissao ? "data" : null,
      entrada.valorCentavos == null ? "valor" : null,
    ].filter(Boolean);
    return {
      status: "nao_lida",
      mensagem: `Não lida. Falta ${falta.join(" e ")}.`,
      motivos: [{ codigo: entrada.dataEmissao ? "sem_valor" : "sem_data", texto: `Falta ${falta.join(" e ")}.` }],
      conforme,
      valorReembolsavelCentavos: null,
      politica,
    };
  }

  const dias = diasAte(entrada.dataEmissao, hoje);
  if (dias < 0) motivos.push({ codigo: "data_futura", texto: "Data de emissão é posterior à solicitação." });
  else if (dias > POLITICA.prazoDias) {
    motivos.push({
      codigo: "prazo",
      texto: `Fora do prazo de ${POLITICA.prazoDias} dias (emitido há ${dias} dias).`,
    });
  } else conforme.push("dentro do prazo de 60 dias");

  const nome = nomeSituacao(entrada);
  if (nome === "terceiro") {
    motivos.push({ codigo: "terceiro", texto: "Comprovante em nome de terceiro." });
  }

  if (entrada.alcool) motivos.push({ codigo: "alcool", texto: "Bebida alcoólica não é reembolsada." });
  if (entrada.itemVedado) motivos.push({ codigo: "item_vedado", texto: "Item consta da lista de despesas não autorizadas." });

  let teto: number | null = null;

  if (entrada.tipo === "taxi") julgarTaxi(entrada, nome, motivos, conforme);
  else if (entrada.tipo === "refeicao") teto = julgarRefeicao(entrada, motivos, conforme);
  else if (entrada.tipo === "estacionamento") {
    teto = POLITICA.estacionamentoTetoCentavos;
    exigirFiscal(entrada, motivos, conforme);
    if (entrada.valorCentavos > teto) {
      motivos.push({ codigo: "acima_teto", texto: `Acima do teto de estacionamento (${brl(teto)}).` });
    } else conforme.push("dentro do teto de estacionamento");
  } else if (entrada.tipo === "pedagio" || entrada.tipo === "transporte") {
    julgarTransporte(entrada, nome, motivos, conforme);
  } else {
    motivos.push({ codigo: "categoria", texto: "Categoria sem regra de reembolso nesta política." });
  }

  const duros = motivos.filter((m) => !VP_PODE.has(m.codigo));
  const flexiveis = motivos.filter((m) => VP_PODE.has(m.codigo));
  const soTeto = motivos.length > 0 && motivos.every((m) => m.codigo === "acima_teto");

  if (entrada.autorizacaoVp && duros.length === 0 && flexiveis.length > 0) {
    return fechar(
      "aprovada",
      `Aprovada com autorização do VP. ${brl(entrada.valorCentavos)}.`,
      [],
      [...conforme, "autorização do VP"],
      entrada.valorCentavos,
      politica,
    );
  }

  if (motivos.length === 0) {
    return fechar(
      "aprovada",
      `Aprovada. ${brl(entrada.valorCentavos)}.`,
      [],
      conforme,
      entrada.valorCentavos,
      politica,
    );
  }

  if (soTeto && teto != null) {
    return fechar(
      "excedente_vp",
      `Excedente. Teto ${brl(teto)}. Os ${brl(entrada.valorCentavos - teto)} acima só saem com autorização do VP.`,
      motivos,
      conforme,
      teto,
      politica,
    );
  }

  return fechar("barrada", `Barrada. ${motivos[0].texto}`, motivos, conforme, null, politica);
}

function fechar(
  status: Status,
  mensagem: string,
  motivos: Motivo[],
  conforme: string[],
  valor: number | null,
  politica: Julgamento["politica"],
): Julgamento {
  return { status, mensagem, motivos, conforme, valorReembolsavelCentavos: valor, politica };
}

function exigirFiscal(c: Comprovante, motivos: Motivo[], conforme: string[]) {
  if (!c.documentoFiscal) {
    motivos.push({
      codigo: "sem_documento_fiscal",
      texto: "Não é cupom fiscal nem nota fiscal de consumidor.",
    });
  } else conforme.push("documento fiscal");
  if (!c.temCnpj) motivos.push({ codigo: "sem_cnpj", texto: "Comprovante sem CNPJ." });
  else conforme.push("CNPJ presente");
}

function julgarTaxi(c: Comprovante, nome: "ok" | "ausente" | "terceiro", motivos: Motivo[], conforme: string[]) {
  const app = c.meioTaxi && (POLITICA.appsTaxi as readonly string[]).includes(c.meioTaxi);
  if (c.meioTaxi === "convencional" || !app) {
    motivos.push({
      codigo: "taxi_convencional",
      texto: "Táxi convencional não é reembolsável. Só Uber, 99, Cabify ou Easy Táxi.",
    });
  } else conforme.push(`aplicativo ${c.meioTaxi}`);

  exigirFiscal(c, motivos, conforme);

  if (nome !== "ok") {
    motivos.push({
      codigo: "sem_nome",
      texto: "O comprovante de táxi tem de estar em nome do colaborador ou do gestor.",
    });
  } else conforme.push("em nome do colaborador ou do gestor");

  const pagamentoApp = c.pagamento === "dinheiro" || c.pagamento === "debito" || c.pagamento === "credito" || c.pagamento === "app";
  if (c.pagamento === "pix" || !pagamentoApp) {
    motivos.push({
      codigo: "pagamento_pix",
      texto: "Pagamento fora do previsto (dinheiro ou cartão, comprovante do aplicativo).",
    });
  } else conforme.push("forma de pagamento prevista");

  if (!c.justificativaExtraordinaria) {
    motivos.push({
      codigo: "sem_justificativa",
      texto: "Táxi só em caráter extraordinário, com justificativa.",
    });
  } else conforme.push("justificativa extraordinária");

  if (!c.viagem && (c.horasAposJornada == null || c.horasAposJornada < 3)) {
    motivos.push({
      codigo: "fora_expediente",
      texto: "Fora de viagem, só a partir de 3 horas após a jornada.",
    });
  }

  if (c.destinoAeroporto && !c.justificativaExtraordinaria) {
    motivos.push({
      codigo: "onibus_aeroporto",
      texto: "Em aeroporto, a política manda o ônibus (em SP, Airport Bus Service), salvo justificativa.",
    });
  }
}

function julgarRefeicao(c: Comprovante, motivos: Motivo[], conforme: string[]): number | null {
  exigirFiscal(c, motivos, conforme);
  if (nomeSituacao(c) !== "terceiro") conforme.push("sem nome de terceiro");

  const ocasiao = ocasiaoDe(c);
  if (!ocasiao) {
    motivos.push({ codigo: "ocasiao", texto: "A nota não escreve café, almoço ou jantar." });
    return null;
  }

  if (ocasiao === "cafe") {
    motivos.push({ codigo: "cafe_manha", texto: "Café da manhã não é reembolsado." });
    return null;
  }

  if (ocasiao === "almoco") {
    const fim = c.dataEmissao ? fimDeSemana(c.dataEmissao) || Boolean(c.feriado) : false;
    if (!fim) motivos.push({ codigo: "almoco_dia_util", texto: "Almoço só em fim de semana ou feriado." });
    else conforme.push("almoço em fim de semana ou feriado");
    if (c.beneficioJaPago) motivos.push({ codigo: "beneficio_ja_pago", texto: "Benefício de alimentação já disponibilizado na escala." });
    if (c.convenioCentavos == null) {
      motivos.push({ codigo: "sem_convenio", texto: "Almoço limitado ao valor da convenção coletiva, que não foi informada." });
      return null;
    }
    if (c.valorCentavos != null && c.valorCentavos > c.convenioCentavos) {
      motivos.push({ codigo: "acima_teto", texto: `Acima da convenção de almoço (${brl(c.convenioCentavos)}).` });
    } else conforme.push("dentro da convenção de almoço");
    return c.convenioCentavos;
  }

  const teto = tetoJantar(c);
  if (c.horasAposJornada == null || c.horasAposJornada < 3) {
    motivos.push({ codigo: "fora_expediente", texto: "Jantar só a partir de 3 horas após a jornada." });
  } else conforme.push("após 3 horas da jornada");
  if (!c.justificativaExtraordinaria || !c.aprovacaoGestorPrevia) {
    motivos.push({
      codigo: "sem_aprovacao_gestor",
      texto: "Jantar exige justificativa e aprovação prévia do gestor.",
    });
  } else conforme.push("justificativa e aprovação do gestor");
  if (c.valorCentavos != null && c.valorCentavos > teto) {
    motivos.push({ codigo: "acima_teto", texto: `Acima do teto de jantar (${brl(teto)}).` });
  } else conforme.push("dentro do teto de jantar");
  return teto;
}

function julgarTransporte(
  c: Comprovante,
  nome: "ok" | "ausente" | "terceiro",
  motivos: Motivo[],
  conforme: string[],
) {
  if (c.tipo === "transporte" && !c.documentoFiscal && c.aprovacaoGestorPrevia) {
    conforme.push("transporte público com autorização do gestor");
    return;
  }
  exigirFiscal(c, motivos, conforme);
  if (c.tipo === "pedagio" && nome === "terceiro") {
    /* já registrado em terceiro */
  } else if (c.tipo === "pedagio") conforme.push("pedágio em nome aceito");
}
