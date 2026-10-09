import assert from "node:assert/strict";
import test from "node:test";
import { deLeitura } from "../src/leitura.ts";

test("a leitura só usa o que está escrito", () => {
  const nota = deLeitura('{"valor":"20,00","ocasiao":null} jantar', "2026-10-09");
  assert.equal(nota.tipo, "refeicao");
  assert.equal(nota.ocasiao, "jantar");
  assert.equal(nota.valorCentavos, 2000);
});

test("sem palavra escrita não vira refeição", () => {
  const nota = deLeitura('{"valor":"8,80","estabelecimento":"The Lucca"}', "2026-10-09");
  assert.equal(nota.tipo, "outro");
  assert.equal(nota.ocasiao, null);
});

test("valor 18,00 do modelo entra como centavos", () => {
  const nota = deLeitura('{"valor": 18,00, "data": "2026-10-08"} jantar', "2026-10-09");
  assert.equal(nota.valorCentavos, 1800);
  assert.equal(nota.dataEmissao, "2026-10-08");
  assert.equal(nota.ocasiao, "jantar");
});

test("texto do modelo com Valor e Data entra no julgamento", () => {
  const nota = deLeitura("* **Valor:** 18,00\n* **Data:** 2026-10-08\n* **Pagamento:** dinheiro\njantar\nNFC-e", "2026-10-09");
  assert.equal(nota.valorCentavos, 1800);
  assert.equal(nota.dataEmissao, "2026-10-08");
  assert.equal(nota.documentoFiscal, true);
  assert.equal(nota.pagamento, "dinheiro");
});
