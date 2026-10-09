export const CODIGOS = ["limpa", "duplicada", "editada", "repetida", "fora_do_padrao", "sem_base"] as const;
export type Codigo = (typeof CODIGOS)[number];

export type Nota = {
  hash: string | null;
  cnpj: string | null;
  valor: number | null;
  data: string | null;
  telefone: string | null;
  empresa: string | null;
};

export type Entrada = Nota & {
  hashOriginal: string | null;
  intervaloDias: number | null;
  tetoCentavos: number | null;
  anteriores: Nota[];
};

export type Saida = {
  codigo: Codigo;
  motivo: string;
  paga: false;
  pix: "nao";
};

const FRASE: Record<Codigo, string> = {
  sem_base: "Faltou hash, telefone ou histórico.",
  duplicada: "Mesmo hash, ou mesmo CNPJ, valor e data nesta empresa.",
  editada: "O arquivo não bate com o hash original.",
  repetida: "Mesmo telefone e estabelecimento, fora do intervalo da política.",
  fora_do_padrao: "Valor acima do histórico mínimo deste telefone.",
  limpa: "Nenhum teste positivo.",
};

function dias(a: string, b: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return null;
  const ms = Math.abs(Date.parse(a) - Date.parse(b));
  return Math.round(ms / 86_400_000);
}

export function torita(entrada: Entrada): Saida {
  const fecha = (codigo: Codigo): Saida => ({ codigo, motivo: FRASE[codigo], paga: false, pix: "nao" });
  const hash = entrada.hash?.trim() || null;
  if (!hash) return fecha("sem_base");
  if (entrada.hashOriginal?.trim() && entrada.hashOriginal.trim() !== hash) return fecha("editada");

  const empresa = entrada.empresa?.trim() || null;
  const cnpj = entrada.cnpj?.trim() || null;
  const anteriores = entrada.anteriores ?? [];
  const duplicada = anteriores.some(
    (nota) =>
      nota.hash === hash ||
      (empresa && cnpj && nota.empresa === empresa && nota.cnpj === cnpj && nota.valor === entrada.valor && nota.data === entrada.data),
  );
  if (duplicada) return fecha("duplicada");

  const intervalo = entrada.intervaloDias;
  if (intervalo != null && entrada.telefone && cnpj && entrada.data) {
    const repetida = anteriores.some((nota) => {
      if (nota.telefone !== entrada.telefone || nota.cnpj !== cnpj || !nota.data) return false;
      const distancia = dias(entrada.data as string, nota.data);
      return distancia != null && distancia < intervalo;
    });
    if (repetida) return fecha("repetida");
  }

  const doTelefone = entrada.telefone ? anteriores.filter((nota) => nota.telefone === entrada.telefone && nota.valor != null) : [];
  if (doTelefone.length === 0) return fecha("sem_base");
  if (entrada.tetoCentavos != null && entrada.valor != null && entrada.valor > entrada.tetoCentavos) return fecha("fora_do_padrao");
  return fecha("limpa");
}
