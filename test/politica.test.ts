import assert from "node:assert/strict";
import test from "node:test";
import { exemplos } from "../src/exemplos.ts";
import { julgar } from "../src/politica.ts";

const base = {
  documentoFiscal: true,
  temCnpj: true,
  hoje: "2026-10-09",
};

test("recibo 19 de táxi convencional é barrado", () => {
  const j = julgar(exemplos[0]);
  assert.equal(j.status, "barrada");
  const codigos = j.motivos.map((m) => m.codigo);
  for (const codigo of ["taxi_convencional", "sem_documento_fiscal", "sem_cnpj", "pagamento_pix", "sem_justificativa", "onibus_aeroporto"]) {
    assert.ok(codigos.includes(codigo), codigo);
  }
  assert.equal(j.valorReembolsavelCentavos, null);
});

test("NFC-e do Lucca às 06:34 não vira café", () => {
  const j = julgar(exemplos[1]);
  assert.equal(j.status, "barrada");
  assert.ok(j.motivos.some((m) => m.codigo === "ocasiao"));
  assert.ok(!j.motivos.some((m) => m.codigo === "cafe_manha"));
  assert.ok(!j.motivos.some((m) => m.codigo === "sem_documento_fiscal"));
  assert.ok(j.conforme.includes("dentro do prazo de 60 dias"));
  assert.ok(j.conforme.includes("documento fiscal"));
});

test("café escrito na nota não reembolsa", () => {
  const j = julgar({ ...exemplos[1], ocasiao: "cafe" });
  assert.equal(j.status, "barrada");
  assert.ok(j.motivos.some((m) => m.codigo === "cafe_manha"));
});

test("sem data não entra como analisada", () => {
  const j = julgar({ ...base, tipo: "refeicao", valorCentavos: 2_000, dataEmissao: null });
  assert.equal(j.status, "nao_lida");
});

test("jantar dentro do teto, após a jornada, aprova", () => {
  const j = julgar({
    ...base,
    tipo: "refeicao",
    valorCentavos: 2_000,
    dataEmissao: "2026-10-08",
    hora: "22:10",
    ocasiao: "jantar",
    horasAposJornada: 4,
    justificativaExtraordinaria: true,
    aprovacaoGestorPrevia: true,
    nomeNoComprovante: "Ana Lima",
    colaborador: "Ana Lima",
  });
  assert.equal(j.status, "aprovada");
  assert.equal(j.valorReembolsavelCentavos, 2_000);
});

test("jantar acima de R$ 20 fica excedente até o VP", () => {
  const j = julgar({
    ...base,
    tipo: "refeicao",
    valorCentavos: 8_800,
    dataEmissao: "2026-10-08",
    ocasiao: "jantar",
    horasAposJornada: 4,
    justificativaExtraordinaria: true,
    aprovacaoGestorPrevia: true,
    colaborador: "Ana Lima",
    nomeNoComprovante: "Ana Lima",
  });
  assert.equal(j.status, "excedente_vp");
  assert.equal(j.valorReembolsavelCentavos, 2_000);
});

test("almoço de quarta é barrado", () => {
  const j = julgar({
    ...base,
    tipo: "refeicao",
    valorCentavos: 4_000,
    dataEmissao: "2026-10-07",
    hora: "12:30",
    ocasiao: "almoco",
    convenioCentavos: 8_000,
    colaborador: "Ana Lima",
    nomeNoComprovante: "Ana Lima",
  });
  assert.equal(j.status, "barrada");
  assert.ok(j.motivos.some((m) => m.codigo === "almoco_dia_util"));
});

test("estacionamento de R$ 18 aprova e R$ 18,01 excede", () => {
  const ok = julgar({ ...base, tipo: "estacionamento", valorCentavos: 1_800, dataEmissao: "2026-10-08" });
  const acima = julgar({ ...base, tipo: "estacionamento", valorCentavos: 1_801, dataEmissao: "2026-10-08" });
  assert.equal(ok.status, "aprovada");
  assert.equal(acima.status, "excedente_vp");
  assert.equal(acima.valorReembolsavelCentavos, 1_800);
});
