export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export type Uf = (typeof UFS)[number];
export type Tributo = "IBS" | "CBS";

export type Regra = {
  empresa: string;
  uf: Uf;
  tributo: Tributo;
  artigo: string;
  vigenciaInicio: string;
  vigenciaFim: string | null;
  dataBase: string;
};

export type Saida = {
  empresa: string;
  uf: string;
  tributos: Tributo[];
  linha: string;
  credito: "sim" | "nao";
  decisao: false;
  pix: "nao";
};

export function ufValida(valor: string): valor is Uf {
  return (UFS as readonly string[]).includes(valor);
}

export function torito(
  entrada: { empresa: string | null; uf: string | null; data: string | null },
  base: Regra[],
): Saida {
  const empresa = entrada.empresa?.trim() ?? "";
  const uf = entrada.uf?.trim() ?? "";
  const vazio: Saida = { empresa, uf, tributos: [], linha: "sem crédito", credito: "nao", decisao: false, pix: "nao" };
  if (!empresa || !ufValida(uf) || !entrada.data) return vazio;

  const linhas = base.filter(
    (regra) =>
      regra.empresa === empresa &&
      regra.uf === uf &&
      entrada.data! >= regra.vigenciaInicio &&
      (!regra.vigenciaFim || entrada.data! <= regra.vigenciaFim),
  );
  const porTributo = new Map<Tributo, Regra[]>();
  for (const regra of linhas) {
    const grupo = porTributo.get(regra.tributo) ?? [];
    grupo.push(regra);
    porTributo.set(regra.tributo, grupo);
  }
  if (porTributo.size === 0) return vazio;
  if ([...porTributo.values()].some((grupo) => grupo.length !== 1)) return vazio;

  const tributos = (["IBS", "CBS"] as const).filter((tributo) => porTributo.has(tributo));
  const partes = tributos.map((tributo) => {
    const regra = porTributo.get(tributo)?.[0];
    return regra ? `${tributo} · ${regra.artigo} · ${regra.dataBase}` : tributo;
  });
  return {
    empresa,
    uf,
    tributos,
    linha: `${empresa} · ${uf} · ${partes.join(" · ")} · recuperável`,
    credito: "sim",
    decisao: false,
    pix: "nao",
  };
}
