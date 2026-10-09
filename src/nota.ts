import { brl, type Comprovante, type Julgamento, type MeioTaxi, type Ocasiao, type Pagamento, type Tipo } from "./politica.ts";

const TIPOS: Tipo[] = ["taxi", "refeicao", "estacionamento", "pedagio", "transporte", "outro"];
const PAGAMENTOS: Pagamento[] = ["dinheiro", "debito", "credito", "pix", "app", "outro"];
const MEIOS: MeioTaxi[] = ["uber", "99", "cabify", "easy", "convencional"];
const OCASIOES: Ocasiao[] = ["cafe", "almoco", "jantar"];

function menu(atual: string): string {
  const itens = [
    ["/", "Início"],
    ["/politica", "Política"],
    ["/enviar", "Enviar"],
    ["/eu", "Resultado"],
    ["/fraude", "Fraude"],
  ];
  return `<nav>${itens
    .map(([href, nome]) => `<a href="${href}"${href === atual ? ' aria-current="page"' : ""}>${nome}</a>`)
    .join("")}</nav>`;
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
  .valor { margin-top:1.2rem; font:500 2.4rem/1 Georgia, serif; }
  .motivo { margin:1.2rem 0 0; font:500 1.6rem/1.2 Georgia, serif; color:var(--ink); }
  .cartao { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:28px; }
  .foto { display:flex; min-height:14rem; flex-direction:column; align-items:center; justify-content:center; border:1px dashed var(--line); border-radius:16px; background:var(--card); text-align:center; }
  .foto span { display:block; margin-top:8px; color:var(--muted); font-size:14px; }
  .risco { list-style:none; padding:0; }
  .risco li { display:grid; grid-template-columns:9rem 1fr; gap:12px; border-bottom:1px solid var(--line); padding:14px 0; }
  nav a[aria-current="page"] { border-bottom:2px solid var(--ink); }
  li { margin:0.4rem 0; }
</style>`;

function pagina(titulo: string, corpo: string, atual = "/enviar"): string {
  return `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
${estilo}
<main>
${menu(atual)}
${corpo}
</main>`;
}

function opcoes(valores: readonly string[], rotulos: Record<string, string>): string {
  return valores.map((v) => `<option value="${v}">${rotulos[v] ?? v}</option>`).join("");
}

export function formulario(bloqueado: boolean): string {
  if (bloqueado) {
    return pagina(
      "Enviar nota",
      `<p class="marca">NOTA</p>
<h1>Ainda não</h1>
<p>A empresa precisa aprovar a política antes da nota.</p>
<a class="ir" href="/politica">Voltar para a política</a>`,
      "/enviar",
    );
  }
  return pagina(
    "Enviar nota",
    `<p class="marca">NOTA</p>
<h1>Enviar</h1>
<p>Sobe a foto. A leitura sai da imagem. Não peça finalidade. A data e a hora ficam no servidor. A foto não fica guardada.</p>
<form method="post" action="/enviar" enctype="multipart/form-data">
  <label class="foto">Foto da nota
    <span>JPG ou PNG</span>
    <input name="foto" type="file" accept="image/*" required>
  </label>
  <button type="submit">Enviar</button>
</form>`,
    "/enviar",
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
      dataEmissao: data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : hoje,
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

export function decisao(
  j: Julgamento,
  extra: string | null = null,
  trilha: { leitura: string; torita: string; fiscal: string | null } | null = null,
): string {
  const tom = j.status === "aprovada" ? "pine" : j.status === "excedente_vp" ? "" : "clay";
  const motivo = extra ?? j.motivos[0]?.texto ?? j.mensagem;
  const valor = j.valorReembolsavelCentavos == null ? "" : `<p class="valor">${esc(brl(j.valorReembolsavelCentavos))}</p>`;
  const lista = j.motivos.map((m) => `<li>${esc(m.texto)}</li>`).join("");
  const passos = trilha
    ? `<ol class="risco">
  <li><span>Leitura</span><p>${esc(trilha.leitura)}</p></li>
  <li><span>Torita</span><p>${esc(trilha.torita)}</p></li>
  <li><span>Política</span><p>${esc(j.mensagem)}</p></li>
  ${trilha.fiscal ? `<li><span>Torito</span><p>${esc(trilha.fiscal)}</p></li>` : ""}
</ol>`
    : "";
  return pagina(
    palavra(j.status),
    `<article class="cartao">
  <p class="marca">Anota sem volta</p>
  <h1 class="${tom}">${palavra(j.status)}</h1>
  <p class="motivo">${esc(motivo)}</p>
  ${valor}
  <p class="linha">${esc(j.politica.nome)}</p>
  ${lista ? `<ul>${lista}</ul>` : ""}
  ${passos}
</article>
<a class="ir" href="/enviar">Enviar outra</a>`,
    "/eu",
  );
}

export const FRASE = {
  sem_base: "Faltou hash, telefone ou histórico.",
  duplicada: "Mesmo hash, ou mesmo CNPJ, valor e data nesta empresa.",
  editada: "O arquivo não bate com o hash original.",
  repetida: "Mesmo telefone e estabelecimento, fora do intervalo da política.",
  fora_do_padrao: "Valor acima do histórico mínimo deste telefone.",
  limpa: "Nenhum teste positivo.",
} as const;

export function fraude(): string {
  const itens = Object.entries(FRASE)
    .map(([codigo, frase]) => `<li><span>${esc(codigo)}</span><p>${esc(frase)}</p></li>`)
    .join("");
  return pagina(
    "Fraude",
    `<p class="marca">FRAUDE</p>
<h1>Marca, não paga.</h1>
<p>A Torita roda antes da política. Não aprova e não mexe no Pix.</p>
<ol class="risco">${itens}</ol>`,
    "/fraude",
  );
}

export function resultadoVazio(): string {
  return pagina(
    "Resultado",
    `<p class="marca">RESULTADO</p>
<h1>Nenhuma nota ainda.</h1>
<a class="ir" href="/enviar">Enviar uma nota</a>`,
    "/eu",
  );
}
