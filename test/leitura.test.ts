import assert from "node:assert/strict";
import test from "node:test";
import { deLeitura } from "../src/leitura.ts";
import { julgar } from "../src/politica.ts";

test("a leitura só usa o que está escrito", () => {
  const nota = deLeitura('{"valor":"20,00","ocasiao":null} jantar', "2026-10-09");
  assert.equal(nota.tipo, "refeicao");
  assert.equal(nota.ocasiao, "jantar");
  assert.equal(nota.valorCentavos, 2000);
  const j = julgar(nota);
  assert.notEqual(j.status, "aprovada");
});

test("sem palavra escrita não vira refeição", () => {
  const nota = deLeitura('{"valor":"8,80","estabelecimento":"The Lucca"}', "2026-10-09");
  assert.equal(nota.tipo, "outro");
  assert.equal(nota.ocasiao, null);
});
