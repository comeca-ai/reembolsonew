import type { Comprovante } from "./politica.ts";

export const HOJE = "2026-10-09";

export const exemplos: Comprovante[] = [
  {
    id: "recibo-19",
    descricao: "Recibo 19 · táxi Régua Itaim → Guarulhos",
    tipo: "taxi",
    valorCentavos: 20_395,
    dataEmissao: "2026-10-08",
    documentoFiscal: false,
    temCnpj: false,
    nomeNoComprovante: "Jhonata Emerick Ramos",
    colaborador: "Jhonata Emerick Ramos",
    pagamento: "pix",
    meioTaxi: "convencional",
    justificativaExtraordinaria: false,
    viagem: true,
    destinoAeroporto: true,
    hoje: HOJE,
  },
  {
    id: "lucca-4868",
    descricao: "NFC-e 4868 · The Lucca Jardins",
    tipo: "refeicao",
    valorCentavos: 8_800,
    dataEmissao: "2026-10-07",
    hora: "06:34",
    documentoFiscal: true,
    temCnpj: true,
    nomeNoComprovante: null,
    pagamento: "dinheiro",
    ocasiao: "cafe",
    alcool: false,
    hoje: HOJE,
  },
];
