import { exemplos } from "./exemplos.ts";
import { deLeitura, lerImagem } from "./leitura.ts";
import { decisao, formulario, fraude, FRASE, lerNota, resultadoVazio } from "./nota.ts";
import { julgar, brl, POLITICA, type Comprovante } from "./politica.ts";

const inicio = `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Anota sem volta</title>
<style>
  :root { color-scheme: light; --ink:#1c1915; --paper:#f3efe6; --muted:#5c564c; --line:#e4dac8; }
  * { box-sizing: border-box; }
  body { margin:0; font:16px/1.5 ui-sans-serif, system-ui, sans-serif; color:var(--ink); background:var(--paper); }
  main { max-width: 40rem; margin: 0 auto; padding: 72px 20px 80px; }
  .marca { margin:0; font: 12px/1 ui-monospace, monospace; letter-spacing: .14em; color: var(--muted); }
  h1 { margin: 28px 0 0; font: 500 4.2rem/0.95 Georgia, "Times New Roman", serif; }
  p { max-width: 28rem; color: var(--muted); }
  a.ir { display:inline-flex; align-items:center; height:48px; margin-top:28px; padding:0 18px; border-radius:8px; background:var(--ink); color:var(--paper); text-decoration:none; }
  ol { margin: 64px 0 0; padding:0; list-style:none; border-top:1px solid var(--line); }
  li { border-bottom:1px solid var(--line); }
  li a { display:grid; grid-template-columns: 3rem 1fr; gap: 12px; padding: 22px 0; color: inherit; text-decoration: none; font: 500 1.7rem/1.15 Georgia, serif; }
  .n { font: 12px/1 ui-monospace, monospace; color: var(--muted); padding-top: .45rem; }
  nav { display:flex; gap:18px; margin:0 0 8px; }
  nav a { color: var(--ink); }
</style>
<main>
  <nav>
    <a href="/">Início</a>
    <a href="/politica">Política</a>
    <a href="/enviar">Enviar</a>
    <a href="/eu">Resultado</a>
    <a href="/fraude">Fraude</a>
  </nav>
  <p class="marca">ANOTA SEM VOLTA</p>
  <h1>A nota não volta sem a regra.</h1>
  <p>Primeiro a política. A empresa lê o resumo e aprova. Depois a nota. O que não está escrito não entra.</p>
  <a class="ir" href="/politica">Começar</a>
  <ol>
    <li><a href="/politica"><span class="n">01</span><span>A empresa sobe a política.</span></a></li>
    <li><a href="/resumo"><span class="n">02</span><span>Aprova só o que está escrito.</span></a></li>
    <li><a href="/enviar"><span class="n">03</span><span>A nota entra. A regra decide.</span></a></li>
  </ol>
</main>`;

const subir = `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Subir política</title>
<style>
  :root { color-scheme: light; --ink:#1c1915; --paper:#f3efe6; --card:#faf7f1; --line:#e4dac8; --muted:#5c564c; }
  * { box-sizing: border-box; }
  body { margin:0; font:16px/1.45 ui-sans-serif, system-ui, sans-serif; color:var(--ink); background:var(--paper); }
  main { max-width: 36rem; margin: 0 auto; padding: 40px 20px 64px; }
  h1 { margin: 8px 0 0; font-size: 2.6rem; font-weight: 500; line-height: 1.05; }
  p { color: var(--muted); }
  form { margin-top: 28px; display: grid; gap: 16px; }
  input[type=file] { font: inherit; }
  button { height: 48px; border: 0; border-radius: 10px; background: var(--ink); color: var(--paper); font: inherit; }
  a { color: var(--ink); }
</style>
<main>
<nav style="display:flex;gap:18px;margin:0 0 28px">
  <a href="/">Início</a>
  <a href="/politica">Política</a>
  <a href="/resumo">Resumo</a>
  <a href="/nota">Nota</a>
</nav>
  <p>Política</p>
  <h1>Subir a política</h1>
  <p>Primeiro a empresa sobe o arquivo. Depois revisa o que chegou. O que não está escrito não entra.</p>
  <form method="post" action="/politica" enctype="multipart/form-data">
    <input type="file" name="arquivo" accept=".pdf,.txt,application/pdf,text/plain" required>
    <button type="submit">Subir</button>
  </form>
</main>`;
const cabecalhos = {
  html: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" },
  json: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: cabecalhos.json });
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === "&" ? "\u0026amp;" : c === "<" ? "\u0026lt;" : "\u0026gt;"));
}

function dataSaoPaulo(agora: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

function empresaAprovou(request: Request): boolean {
  return cookieDe(request, "politica") === POLITICA.emissao;
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cookieDe(request: Request, nome: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  for (const parte of cookie.split(";")) {
    const [chave, ...resto] = parte.trim().split("=");
    if (chave === nome) return decodeURIComponent(resto.join("="));
  }
  return null;
}

function ir(para: string, cookies: string[]): Response {
  const headers = new Headers({ location: para, "cache-control": "no-store" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 303, headers });
}

function resumo(arquivo: string | null, aprovada: boolean): string {
  const itens = [
    `Prazo de ${POLITICA.prazoDias} dias.`,
    "Sem data ou sem valor: não lida.",
    "Comprovante em nome de terceiro: barrada.",
    "Bebida alcoólica não é reembolsada.",
    "Item da lista de despesas não autorizadas: barrada.",
    "Táxi convencional não é reembolsável. Só Uber, 99, Cabify ou Easy Táxi.",
    "Táxi exige documento fiscal, CNPJ, nome do colaborador ou do gestor, pagamento em dinheiro ou cartão, e justificativa extraordinária.",
    "Fora de viagem, táxi só a partir de 3 horas após a jornada.",
    "Café da manhã não é reembolsado.",
    "Almoço só em fim de semana ou feriado, no valor da convenção coletiva.",
    `Jantar a partir de 3 horas após a jornada, com justificativa e aprovação prévia do gestor. Teto ${brl(POLITICA.jantarTetoCentavos)}.`,
    `Estacionamento até ${brl(POLITICA.estacionamentoTetoCentavos)}, com cupom ou nota e CNPJ.`,
    "Acima do teto fica excedente. Só sai com autorização do VP.",
  ];
  const lista = itens.map((item) => `<li>${esc(item)}</li>`).join("");
  const arquivoLinha = arquivo ? `<p>Arquivo recebido: ${esc(arquivo)}. O PDF não foi lido.</p>` : "";
  const acao = aprovada
    ? `<p><strong>A empresa aprovou esta versão.</strong></p><p><a href="/enviar">Continuar para a nota</a></p>`
    : `<form method="post" action="/politica/aprovar"><button type="submit">Aprovar e ver a nota</button></form>`;
  return `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Resumo da política</title>
<style>
  body { margin:0; font:16px/1.45 ui-sans-serif,system-ui,sans-serif; color:#1c1915; background:#f3efe6; }
  main { max-width: 40rem; margin:0 auto; padding:40px 20px 64px; }
  h1 { margin:8px 0 0; font-size:2.4rem; font-weight:500; line-height:1.05; }
  ol { padding-left: 1.2rem; }
  li { margin: 0.55rem 0; }
  button { height:48px; margin-top:24px; padding:0 18px; border:0; border-radius:10px; background:#1c1915; color:#f3efe6; font:inherit; }
  a { color:#1c1915; }
</style>
<main>
<nav style="display:flex;gap:18px;margin:0 0 28px">
  <a href="/">Início</a>
  <a href="/politica">Política</a>
  <a href="/resumo">Resumo</a>
  <a href="/nota">Nota</a>
</nav>
  <p>${esc(POLITICA.empresa)} · ${esc(POLITICA.emissao)}</p>
  <h1>Resumo para aprovar</h1>
  <p>${esc(POLITICA.nome)}</p>
  ${arquivoLinha}
  <ol>${lista}</ol>
  ${acao}
  <p><a href="/politica">Subir outra</a> · <a href="/enviar">Enviar a nota</a></p>
</main>`;
}

type Env = { AI?: { run: (modelo: string, entrada: unknown) => Promise<unknown> } };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "HEAD") {
      const get = await responder(new Request(request.url, { method: "GET", headers: request.headers }), env);
      return new Response(null, { status: get.status, headers: get.headers });
    }
    return responder(request, env);
  },
};

async function responder(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(inicio, { headers: cabecalhos.html });
    }
    if (request.method === "GET" && url.pathname === "/politica") {
      return new Response(subir, { headers: cabecalhos.html });
    }
    if (request.method === "GET" && (url.pathname === "/nota" || url.pathname === "/enviar")) {
      return new Response(formulario(!empresaAprovou(request)), { headers: { ...cabecalhos.html, "cache-control": "no-store" } });
    }
    if (request.method === "GET" && url.pathname === "/fraude") {
      return new Response(fraude(), { headers: cabecalhos.html });
    }
    if (request.method === "GET" && url.pathname === "/eu") {
      const ultima = cookieDe(request, "ultima");
      if (!ultima) return new Response(resultadoVazio(), { headers: { ...cabecalhos.html, "cache-control": "no-store" } });
      try {
        const salvo = JSON.parse(ultima) as { status: "aprovada" | "barrada" | "nao_lida" | "excedente_vp"; mensagem: string; motivo: string; valor: number | null };
        return new Response(
          decisao({
            status: salvo.status,
            mensagem: salvo.mensagem,
            motivos: salvo.motivo ? [{ codigo: "salvo", texto: salvo.motivo }] : [],
            conforme: [],
            valorReembolsavelCentavos: salvo.valor,
            politica: { nome: POLITICA.nome, empresa: POLITICA.empresa, emissao: POLITICA.emissao },
          }),
          { headers: { ...cabecalhos.html, "cache-control": "no-store" } },
        );
      } catch {
        return new Response(resultadoVazio(), { headers: { ...cabecalhos.html, "cache-control": "no-store" } });
      }
    }
    if (request.method === "POST" && (url.pathname === "/nota" || url.pathname === "/enviar")) {
      if (!empresaAprovou(request)) {
        return new Response(formulario(true), { status: 403, headers: cabecalhos.html });
      }
      const form = await request.formData();
      const foto = form.get("foto");
      if (!(foto instanceof File) || foto.size === 0) {
        return new Response("Falta a foto da nota.", { status: 400, headers: cabecalhos.html });
      }
      const bytes = await foto.arrayBuffer();
      const hash = await sha256(bytes);
      let texto = "";
      try {
        texto = await lerImagem(env.AI, bytes, foto.type);
      } catch {
        texto = "";
      }
      const nota = deLeitura(texto, dataSaoPaulo(new Date()));
      const anterior = cookieDe(request, "hash");
      const codigo = !hash ? "sem_base" : anterior === hash ? "duplicada" : "limpa";
      let j = julgar(nota);
      if (codigo === "duplicada") {
        j = { ...j, status: "barrada", mensagem: `Barrada. ${FRASE.duplicada}`, motivos: [{ codigo, texto: FRASE.duplicada }, ...j.motivos], valorReembolsavelCentavos: null };
      }
      const html = decisao(j, codigo === "limpa" ? null : FRASE[codigo]);
      const headers = new Headers({ ...cabecalhos.html, "cache-control": "no-store" });
      headers.append("set-cookie", `hash=${hash}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
      const curto = encodeURIComponent(JSON.stringify({
        status: j.status,
        mensagem: j.mensagem,
        motivo: j.motivos[0]?.texto ?? "",
        valor: j.valorReembolsavelCentavos,
      }));
      headers.append("set-cookie", `ultima=${curto}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
      return new Response(html, { headers });
    }
    if (request.method === "GET" && url.pathname === "/resumo") {
      return new Response(resumo(cookieDe(request, "arquivo"), empresaAprovou(request)), {
        headers: { ...cabecalhos.html, "cache-control": "no-store" },
      });
    }
    if (request.method === "POST" && url.pathname === "/politica/aprovar") {
      return ir("/enviar", [`politica=${POLITICA.emissao}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`]);
    }
    if (request.method === "POST" && url.pathname === "/politica") {
      const form = await request.formData();
      const arquivo = form.get("arquivo");
      if (!(arquivo instanceof File) || arquivo.size === 0) {
        return new Response("Falta o arquivo.", { status: 400, headers: cabecalhos.html });
      }
      if (arquivo.size > 8_000_000) {
        return new Response("O arquivo passa de 8 MB.", { status: 413, headers: cabecalhos.html });
      }
      const nome = encodeURIComponent(arquivo.name || "politica");
      return ir("/resumo", [`arquivo=${nome}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`]);
    }
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, politica: POLITICA.emissao });
    }
    if (request.method === "GET" && url.pathname === "/api/exemplos") return json(exemplos);
    if (request.method === "GET" && url.pathname === "/api/politica") return json(POLITICA);
    if (request.method === "POST" && url.pathname === "/api/julgar") {
      const bruto = await request.text();
      if (bruto.length > 20_000) return json({ erro: "payload grande" }, 413);
      try {
        const corpo = JSON.parse(bruto) as Comprovante;
        if (!corpo || typeof corpo !== "object" || !corpo.tipo) return json({ erro: "tipo obrigatório" }, 400);
        return json(julgar(corpo));
      } catch {
        return json({ erro: "json inválido" }, 400);
      }
    }
    return json({ erro: "não encontrado" }, 404);
}
