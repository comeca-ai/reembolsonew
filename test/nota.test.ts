import assert from "node:assert/strict";
import test from "node:test";
import { lerNota } from "../src/nota.ts";
import { julgar } from "../src/politica.ts";

test("o formulário da nota entra no mesmo julgar", () => {
  const form = new FormData();
  form.set("tipo", "refeicao");
  form.set("valor", "20,00");
  form.set("dataEmissao", "2026-10-08");
  form.set("ocasiao", "jantar");
  form.set("horasAposJornada", "4");
  form.set("nomeNoComprovante", "Ana Lima");
  form.set("colaborador", "Ana Lima");
  form.set("documentoFiscal", "on");
  form.set("temCnpj", "on");
  form.set("justificativaExtraordinaria", "on");
  form.set("aprovacaoGestorPrevia", "on");
  const lida = lerNota(form, "2026-10-09");
  assert.equal(lida.ok, true);
  if (!lida.ok) return;
  const j = julgar(lida.nota);
  assert.equal(j.status, "aprovada");
  assert.equal(j.valorReembolsavelCentavos, 2_000);
});
