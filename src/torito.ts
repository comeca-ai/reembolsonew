export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export function passos(uf: string): string[] {
  return [
    `Lê o XML. NCM, ${uf}, município, ISS e valor.`,
    `Cruza só com a base de ${uf}. Outra UF não entra.`,
    "Um artigo: cita a data e diz que não é decisão.",
    "Zero artigos, ou dois: não responde. Não escolhe.",
    `Se a nota volta, SEFAZ-${uf} e a prefeitura não dividem a mesma tela.`,
  ];
}

export function recuperavel(artigo: string | null): { credito: "sim" | "nao"; linha: string } {
  if (!artigo?.trim()) return { credito: "nao", linha: "sem crédito" };
  return { credito: "sim", linha: `${artigo.trim()} · recuperável` };
}
