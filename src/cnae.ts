export type LinhaCnae = {
  cnae: string;
  escrito: boolean;
  estado: string;
  linha: string;
  artigo: string;
  credito: "nao";
  pix: "nao";
};

const ESCRITO = "5620101";

export function normalizarCnae(bruto: string): string {
  return bruto.replace(/\D/g, "");
}

export function lerCnae(bruto: string): LinhaCnae {
  const cnae = normalizarCnae(bruto);
  if (cnae === ESCRITO) {
    return {
      cnae: "5620-1/01",
      escrito: true,
      estado: "Fora do regime de bar",
      linha: "Alimentação preparada para empresa. Não entra no regime dos arts. 273 a 276.",
      artigo: "LC 214/2025, art. 273, § 2º, I. Redação vigente com a LC 227/2026.",
      credito: "nao",
      pix: "nao",
    };
  }
  return {
    cnae: cnae || "—",
    escrito: false,
    estado: "A lei não escreve este CNAE",
    linha: "A chave da LC 214/2025 é NBS ou NCM, não o CNAE.",
    artigo: "Sem artigo de CNAE.",
    credito: "nao",
    pix: "nao",
  };
}
