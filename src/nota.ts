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
    ["/torito", "Torito"],
    ["/cnae", "CNAE"],
  ];
  return `<nav>${itens
    .map(([href, nome]) => `<a href="${href}"${href === atual ? ' aria-current="page"' : ""}>${nome}</a>`)
    .join("")}</nav>`;
}

const estilo = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light; --ink:#1c1915; --paper:#f3efe6; --card:#faf7f1; --line:#e4dac8; --pine:#1b6b43; --clay:#8d3b28; --muted:#5c564c; }
  * { box-sizing: border-box; }
  body { margin:0; font:16px/1.5 Outfit, ui-sans-serif, system-ui, sans-serif; color:var(--ink); background:var(--paper); }
  header, main { max-width: 28rem; margin: 0 auto; padding: 20px 20px 0; }
  main { padding-top: 28px; padding-bottom: 96px; }
  header h1 { display: none; }
  main h1, .estado { margin: 0; font: 500 2.75rem/1 Fraunces, Georgia, serif; }
  .muted { color: var(--muted); max-width: 36rem; }
  nav { display:flex; gap: 4px; }
  nav a { color: var(--muted); text-decoration: none; font: 500 14px/1 Outfit, sans-serif; height: 48px; display:inline-flex; align-items:center; padding: 0 10px; border-bottom: 2px solid transparent; }
  nav a[aria-current="page"] { color: var(--ink); border-bottom-color: var(--ink); }
  header nav { display:none; }
  .dock { position: fixed; left:0; right:0; bottom:0; display:flex; justify-content:space-around; background: var(--paper); border-top: 1px solid var(--line); padding-bottom: env(safe-area-inset-bottom); }
  .dock a { flex:1; justify-content:center; border-bottom:0; border-top: 2px solid transparent; font-size: 13px; }
  .dock a[aria-current="page"] { border-top-color: var(--ink); }
  @media (min-width: 760px) {
    header nav { display:flex; margin-top: 8px; }
    .dock { display:none; }
    main { padding-bottom: 64px; }
    main h1, .estado { font-size: 2.75rem; }
  }
  label { display:grid; gap:6px; margin:0 0 14px; font-size:14px; color:var(--muted); }
  input, select { height:48px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--ink); padding:0 12px; font:inherit; }
  button, a.ir { display:inline-flex; align-items:center; height:48px; margin-top:20px; padding:0 18px; border:0; border-radius:4px; background:var(--ink); color:var(--paper); font: 500 14px/1 Outfit, sans-serif; text-decoration:none; }
  .pine { color:var(--pine); }
  .clay { color:var(--clay); }
  .estado { margin: 0; font: 500 2.75rem/1 Fraunces, Georgia, serif; }
  .numero { margin: 0.75rem 0 0; font: 500 1.75rem/1 Fraunces, Georgia, serif; }
  .contexto { margin: 0.5rem 0 0; color: var(--muted); }
  .efeito { margin: 1.25rem 0 0; font-size: 1.15rem; }
  footer { margin-top: 3rem; color: #8a8378; font-size: 0.8rem; }
  details { margin-top: 1.5rem; color: var(--muted); font-size: 0.85rem; }
  .cartao { min-height: 28rem; display:flex; flex-direction:column; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:32px 28px; }
  .cartao .olho { margin-bottom: auto; }
  .foto { display:flex; min-height:16rem; flex-direction:column; align-items:center; justify-content:center; border:1px dashed var(--line); border-radius:16px; background:var(--card); text-align:center; font: 500 2.2rem/1 Fraunces, Georgia, serif; color:var(--ink); }
  .foto span { display:block; margin-top:12px; color:var(--muted); font: 14px/1.4 Outfit, sans-serif; }
  ol.passos { margin: 64px 0 0; padding:0; list-style:none; border-top:1px solid var(--line); }
  ol.passos li { border-bottom:1px solid var(--line); }
  ol.passos a { display:grid; grid-template-columns: 3rem 1fr; gap: 16px; padding: 22px 0; color: inherit; text-decoration:none; font: 500 1.8rem/1.15 Fraunces, Georgia, serif; }
  ol.passos .n { font: 12px/1 "IBM Plex Mono", ui-monospace, monospace; color: var(--muted); padding-top: .55rem; }
  main ol:not(.passos) { padding-left: 1.2rem; }
  main ol:not(.passos) li { margin: 0.55rem 0; }
  .risco { list-style: none; padding: 0; }
  .risco li { display:grid; grid-template-columns: 8.5rem 1fr; gap:12px; border-bottom:1px solid var(--line); padding:16px 0; }
</style>`;

export function casca(titulo: string, corpo: string, atual = "/"): string {
  const nav = menu(atual);
  return `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
${estilo}
<header>
  ${nav}
</header>
<main>
${corpo}
</main>
<div class="dock">${nav}</div>`;
}

function pagina(titulo: string, corpo: string, atual = "/enviar"): string {
  return casca(titulo, corpo, atual);
}

function opcoes(valores: readonly string[], rotulos: Record<string, string>): string {
  return valores.map((v) => `<option value="${v}">${rotulos[v] ?? v}</option>`).join("");
}

export function formulario(bloqueado: boolean): string {
  if (bloqueado) {
    return pagina(
      "Enviar nota",
      `<p class="estado">Ainda não</p>
<p class="contexto">A política não foi aprovada.</p>
<p class="efeito">Sem Pix.</p>
<a class="ir" href="/politica">Aprovar</a>`,
      "/enviar",
    );
  }
  return pagina(
    "Enviar nota",
    `<p class="estado">Enviar a nota</p>
<form method="post" action="/enviar" enctype="multipart/form-data">
  <label class="foto">Foto
    <span>A leitura sai da imagem.</span>
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
  trilha: { leitura: string; torita: string | null; fiscal: string | null; hash?: string } | null = null,
): string {
  const estado = palavra(j.status);
  const numero = j.valorReembolsavelCentavos == null ? "" : `<p class="numero">${esc(brl(j.valorReembolsavelCentavos))}</p>`;
  const contexto = trilha?.leitura || extra || j.motivos[0]?.texto || "";
  const efeito = j.status === "aprovada" ? "Reembolso aprovado. Pix marcado." : "Sem Pix";
  const detalhe = [trilha?.torita, trilha?.fiscal, trilha?.hash ? `Hash ${trilha.hash.slice(0, 12)}` : ""]
    .filter(Boolean)
    .map((linha) => `<p>${esc(linha as string)}</p>`)
    .join("");
  return pagina(
    estado,
    `<p class="estado ${j.status === "aprovada" ? "pine" : "clay"}">${estado}</p>
${numero}
${contexto ? `<p class="contexto">${esc(contexto)}</p>` : ""}
<p class="efeito">${efeito}</p>
${detalhe ? `<details><summary>Detalhe</summary>${detalhe}</details>` : ""}
<footer>política ${esc(j.politica.emissao)}</footer>`,
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

export function painelTorito(uf: string, passosUf: string[], ufs: readonly string[]): string {
  const lista = passosUf.map((passo) => `<li>${esc(passo)}</li>`).join("");
  return pagina(
    "Torito",
    `<p class="estado">Sem crédito</p>
<p class="numero">${esc(uf)}</p>
<p class="contexto">Sem artigo na base.</p>
<p class="efeito">O Pix não muda.</p>
<ol>${lista}</ol>
<details><summary>UFs</summary><p>${ufs.map((item) => esc(item)).join(" · ")}</p></details>
<footer>LC 214/2025 · não é decisão</footer>`,
    "/torito",
  );
}

export function painelCnae(estado: string, numero: string, contexto: string, artigo: string): string {
  return pagina(
    "CNAE",
    `<p class="estado">${esc(estado)}</p>
<p class="numero">${esc(numero)}</p>
<p class="contexto">${esc(contexto)}</p>
<p class="efeito">Sem crédito. O Pix não muda.</p>
<form method="get" action="/cnae">
  <label>CNAE
    <input name="c" inputmode="numeric" placeholder="5620-1/01" required>
  </label>
  <button type="submit">Ver</button>
</form>
<details><summary>O que a lei escreve</summary>
<p>CNAE 5620-1/01. Art. 273, § 2º, I. Fora do regime de bar.</p>
<p>Educação, art. 129, NBS. Saúde, art. 130, NBS. Cesta, art. 125, NCM.</p>
<p>Medicamento, art. 146, LC 227/2026, registro na Anvisa. Não é CNAE.</p>
</details>
<footer>LC 214/2025, com a LC 227/2026</footer>`,
    "/cnae",
  );
}

export function fraude(): string {
  return pagina(
    "Fraude",
    `<p class="estado">Lista vazia</p>
<p class="contexto">Sem par apontado, nada entra.</p>
<p class="efeito">Não paga.</p>
<footer>sem score</footer>`,
    "/fraude",
  );
}

export function resultadoVazio(): string {
  return pagina(
    "Resultado",
    `<p class="estado">Nenhuma nota</p>
<p class="efeito">Sem Pix.</p>
<a class="ir" href="/enviar">Enviar a nota</a>`,
    "/eu",
  );
}
