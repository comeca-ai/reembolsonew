import { brl, type Comprovante, type Julgamento, type MeioTaxi, type Ocasiao, type Pagamento, type Tipo } from "./politica.ts";

const TIPOS: Tipo[] = ["taxi", "refeicao", "estacionamento", "pedagio", "transporte", "outro"];
const PAGAMENTOS: Pagamento[] = ["dinheiro", "debito", "credito", "pix", "app", "outro"];
const MEIOS: MeioTaxi[] = ["uber", "99", "cabify", "easy", "convencional"];
const OCASIOES: Ocasiao[] = ["cafe", "almoco", "jantar"];

function menu(): string {
  return `<nav>
    <a href="/">Início</a>
    <a href="/politica">Política</a>
    <a href="/resumo">Resumo</a>
    <a href="/nota">Nota</a>
  </nav>`;
}

const estilo = `<style>
  :root { color-scheme: light; --ink:#1c1915; --paper:#f3efe6; --card:#faf7f1; --line:#e4dac8; --pine:#1b6b43; --clay:#8d3b28; --muted:#5c564c; }
  * { box-sizing: border-box; }
  body { margin:0; font:16px/1.5 ui-sans-serif, system-ui, sans-serif; color:var(--ink); background:var(--paper); }
  main { max-width: 36rem; margin:0 auto; padding:40px 20px 80px; }
  nav { display:flex; gap:18px; margin:0 0 28px; }
  nav a { color:var(--ink); }
  h1 { margin:8px 0 0; font:500 3rem/1 Georgia, "Times New Roman", serif; }
  label { display:grid; gap:6px; margin:0 0 14px; font-size:14px; color:var(--muted); }
  input, select { height:48px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--ink); padding:0 12px; font:inherit; }
  .check { display:flex; align-items:center; gap:10px; min-height:44px; color:var(--ink); }
  .check input { width:18px; height:18px; }
  button, a.ir { display:inline-flex; align-items:center; height:48px; margin-top:12px; padding:0 18px; border:0; border-radius:8px; background:var(--ink); color:var(--paper); font:inherit; text-decoration:none; }
  .pine { color:var(--pine); }
  .clay { color:var(--clay); }
  .valor { font:500 2.4rem/1 Georgia, serif; }
  li { margin:0.4rem 0; }
</style>`;

function pagina(titulo: string, corpo: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
${estilo}
<main>
${menu()}
${corpo}
</main>`;
}

function opcoes(valores: readonly string[], rotulos: Record<string, string>): string {
  return valores.map((v) => `<option value="${v}">${rotulos[v] ?? v}</option>`).join("");
}

export function formulario(): string {
  return pagina(
    "Enviar nota",
    `<p>Nota</p>
<h1>Enviar a nota</h1>
<p>O que você escreve entra no algoritmo. O que ficar em branco, a regra trata como ausente.</p>
<form method="post" action="/nota">
  <label>Tipo
    <select name="tipo" required>
      <option value="">Escolha</option>
      ${opcoes(TIPOS, { taxi: "Táxi", refeicao: "Refeição", estacionamento: "Estacionamento", pedagio: "Pedágio", transporte: "Transporte", outro: "Outro" })}
    </select>
  </label>
  <label>Valor
    <input name="valor" inputmode="decimal" placeholder="20,00" required>
  </label>
  <label>Data de emissão
    <input name="dataEmissao" type="date">
  </label>
  <label>Nome no comprovante
    <input name="nomeNoComprovante" autocomplete="name">
  </label>
  <label>Colaborador
    <input name="colaborador" autocomplete="name">
  </label>
  <label>Pagamento
    <select name="pagamento">
      <option value="">Não informado</option>
      ${opcoes(PAGAMENTOS, { dinheiro: "Dinheiro", debito: "Débito", credito: "Crédito", pix: "Pix", app: "Aplicativo", outro: "Outro" })}
    </select>
  </label>
  <label>Meio, se for táxi
    <select name="meioTaxi">
      <option value="">Não é táxi</option>
      ${opcoes(MEIOS, { uber: "Uber", "99": "99", cabify: "Cabify", easy: "Easy Táxi", convencional: "Convencional" })}
    </select>
  </label>
  <label>Ocasião, se for refeição
    <select name="ocasiao">
      <option value="">Não está escrita</option>
      ${opcoes(OCASIOES, { cafe: "Café", almoco: "Almoço", jantar: "Jantar" })}
    </select>
  </label>
  <label>Horas após a jornada
    <input name="horasAposJornada" inputmode="numeric" placeholder="3">
  </label>
  <label>Convenção do almoço, se houver
    <input name="convenio" inputmode="decimal" placeholder="40,00">
  </label>
  <label class="check"><input type="checkbox" name="documentoFiscal"> Cupom ou nota fiscal</label>
  <label class="check"><input type="checkbox" name="temCnpj"> Tem CNPJ</label>
  <label class="check"><input type="checkbox" name="justificativaExtraordinaria"> Justificativa extraordinária</label>
  <label class="check"><input type="checkbox" name="aprovacaoGestorPrevia"> Aprovação prévia do gestor</label>
  <label class="check"><input type="checkbox" name="viagem"> Viagem</label>
  <label class="check"><input type="checkbox" name="destinoAeroporto"> Destino aeroporto</label>
  <label class="check"><input type="checkbox" name="feriado"> Feriado</label>
  <label class="check"><input type="checkbox" name="beneficioJaPago"> Benefício já pago</label>
  <label class="check"><input type="checkbox" name="alcool"> Bebida alcoólica</label>
  <label class="check"><input type="checkbox" name="itemVedado"> Item não autorizado</label>
  <button type="submit">Julgar</button>
</form>`,
  );
}

function texto(form: FormData, nome: string): string | null {
  const v = form.get(nome);
  if (typeof v !== "string") return null;
  const limpo = v.trim();
  return limpo || null;
}

function marcado(form: FormData, nome: string): boolean {
  return form.get(nome) != null;
}

function centavosDe(bruto: string | null): number | null {
  if (!bruto) return null;
  const limpo = bruto.replace(/\s/g, "").replace(/^R\$/i, "");
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return null;
  return Math.round(Number(normal) * 100);
}

function umDe<T extends string>(valor: string | null, lista: readonly T[]): T | null {
  if (!valor) return null;
  return (lista as readonly string[]).includes(valor) ? (valor as T) : null;
}

function horasDe(bruto: string | null): number | null {
  if (!bruto) return null;
  if (!/^\d{1,2}$/.test(bruto)) return null;
  return Number(bruto);
}

export function lerNota(form: FormData, hoje: string): { ok: true; nota: Comprovante } | { ok: false; erro: string } {
  const tipo = umDe(texto(form, "tipo"), TIPOS);
  if (!tipo) return { ok: false, erro: "Escolha o tipo da nota." };
  const valor = texto(form, "valor");
  const valorCentavos = centavosDe(valor);
  if (valor && valorCentavos == null) return { ok: false, erro: "Não entendi o valor. Exemplo: 20,00." };
  const convenioBruto = texto(form, "convenio");
  const convenioCentavos = centavosDe(convenioBruto);
  if (convenioBruto && convenioCentavos == null) return { ok: false, erro: "Não entendi o valor da convenção." };
  const data = texto(form, "dataEmissao");
  return {
    ok: true,
    nota: {
      tipo,
      valorCentavos,
      dataEmissao: data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null,
      documentoFiscal: marcado(form, "documentoFiscal"),
      temCnpj: marcado(form, "temCnpj"),
      nomeNoComprovante: texto(form, "nomeNoComprovante"),
      colaborador: texto(form, "colaborador"),
      pagamento: umDe(texto(form, "pagamento"), PAGAMENTOS),
      meioTaxi: umDe(texto(form, "meioTaxi"), MEIOS),
      ocasiao: umDe(texto(form, "ocasiao"), OCASIOES),
      horasAposJornada: horasDe(texto(form, "horasAposJornada")),
      justificativaExtraordinaria: marcado(form, "justificativaExtraordinaria"),
      aprovacaoGestorPrevia: marcado(form, "aprovacaoGestorPrevia"),
      viagem: marcado(form, "viagem"),
      destinoAeroporto: marcado(form, "destinoAeroporto"),
      feriado: marcado(form, "feriado"),
      beneficioJaPago: marcado(form, "beneficioJaPago"),
      alcool: marcado(form, "alcool"),
      itemVedado: marcado(form, "itemVedado"),
      convenioCentavos,
      hoje,
    },
  };
}

function palavra(status: Julgamento["status"]): string {
  if (status === "aprovada") return "Aprovada";
  if (status === "nao_lida") return "Não lida";
  if (status === "excedente_vp") return "Excedente";
  return "Negada";
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === "&" ? "\u0026amp;" : c === "<" ? "\u0026lt;" : "\u0026gt;"));
}

export function decisao(j: Julgamento): string {
  const tom = j.status === "aprovada" ? "pine" : "clay";
  const motivos = j.motivos.map((m) => `<li>${esc(m.texto)}</li>`).join("");
  const valor = j.valorReembolsavelCentavos == null ? "" : `<p class="valor">${esc(brl(j.valorReembolsavelCentavos))}</p>`;
  return pagina(
    palavra(j.status),
    `<p>Resultado</p>
<h1 class="${tom}">${palavra(j.status)}</h1>
<p>${esc(j.mensagem)}</p>
${valor}
${motivos ? `<ul>${motivos}</ul>` : ""}
<a class="ir" href="/nota">Enviar outra</a>`,
  );
}
