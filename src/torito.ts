export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export type Saida = {
  uf: string;
  credito: "sim" | "nao";
  linha: string;
  passos: string[];
  decisao: false;
};

function fase(data: string): string {
  if (data < "2026-01-01") return "Antes de 2026. IBS e CBS não correm.";
  if (data < "2027-01-01") return "2026, ano de teste. CBS 0,9% e IBS 0,1%. LC 214/2025, arts. 343 e 346.";
  if (data < "2029-01-01") return "2027–2028. PIS e Cofins extintos. IBS 0,05% estadual e 0,05% municipal. Art. 344.";
  return "A partir de 2029. IBS sobe com a queda de ICMS e ISS. Alíquota do ano só quando o Senado fixa.";
}

export function rodar(entrada: { uf: string; data: string; aprovada: boolean; artigo: string | null }): Saida {
  const uf = (UFS as readonly string[]).includes(entrada.uf) ? entrada.uf : "—";
  const passos = [
    fase(entrada.data),
    `Base só de ${uf}. Outra UF não entra.`,
    "IBS só abate IBS. CBS só abate CBS. Art. 47, § 1º.",
    "Crédito exige regime regular, documento fiscal e débito extinto. Art. 47.",
    "Uso ou consumo pessoal não vira crédito. Art. 57.",
    "Alimentação de funcionário não vira crédito sem o artigo dizer isso.",
    entrada.artigo?.trim() ? `Artigo apontado: ${entrada.artigo.trim()}.` : "Nenhum artigo apontado.",
  ];
  if (!entrada.aprovada) {
    return { uf, credito: "nao", linha: "sem crédito", passos: ["Antes da aprovação. O fiscal não corre.", ...passos], decisao: false };
  }
  if (uf === "—") return { uf, credito: "nao", linha: "sem crédito", passos, decisao: false };
  if (!entrada.artigo?.trim()) return { uf, credito: "nao", linha: "sem crédito", passos, decisao: false };
  return { uf, credito: "sim", linha: `${entrada.artigo.trim()} · recuperável`, passos, decisao: false };
}
