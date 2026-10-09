import { exemplos } from "./exemplos.ts";
import { julgar, POLITICA, type Comprovante } from "./politica.ts";

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
  <p>Política</p>
  <h1>Subir a política</h1>
  <p>Primeiro a empresa sobe o arquivo. Depois revisa o que chegou. O que não está escrito não entra.</p>
  <form method="post" action="/politica" enctype="multipart/form-data">
    <input type="file" name="arquivo" accept=".pdf,.txt,application/pdf,text/plain" required>
    <button type="submit">Subir</button>
  </form>
</main>`;
const html = `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reembolsa</title>
<style>
  :root { color-scheme: light; --ink:#1c1915; --paper:#f3efe6; --card:#faf7f1; --line:#e4dac8; --pine:#1b6b43; --clay:#8d3b28; --muted:#5c564c; }
  * { box-sizing: border-box; }
  body { margin:0; font:16px/1.45 ui-sans-serif, system-ui, sans-serif; color:var(--ink); background:var(--paper); }
  main { max-width: 760px; margin: 0 auto; padding: 28px 18px 64px; display:grid; gap:16px; }
  @media (min-width: 760px) { main { grid-template-columns: 1fr 1fr; } }
  article { min-height: 34rem; display:flex; flex-direction:column; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:32px 28px; }
  .marca { margin:0; font-size:.875rem; color:var(--muted); }
  h1 { margin:3.5rem 0 0; font-size:3rem; line-height:1; font-weight:500; }
  .pine { color:var(--pine); }
  .clay { color:var(--clay); }
  .valor { margin:1.5rem 0 0; font-size:2.4rem; line-height:1; font-variant-numeric:tabular-nums; }
  .linhas { margin-top:2.5rem; font-size:1.125rem; }
  .linhas p { margin:.25rem 0; }
  .muted { color:var(--muted); }
  footer { margin-top:auto; padding-top:4rem; font-size:.75rem; color:var(--muted); }
</style>
<main>
  <article>
    <p class="marca">Reembolsa</p>
    <h1 class="pine">Aprovada</h1>
    <p class="valor">R$ 63,93</p>
    <div class="linhas">
      <p>alimentação · 09/10/2026</p>
      <p>Pix 10/10</p>
      <p class="muted">política ${POLITICA.emissao}</p>
    </div>
    <footer>sem operador</footer>
  </article>
  <article>
    <p class="marca">Reembolsa</p>
    <h1 class="clay">Negada</h1>
    <p class="valor">R$ 203,95</p>
    <div class="linhas">
      <p>alimentação · 09/10/2026</p>
      <p>acima do teto de R$ 80</p>
      <p class="muted">política ${POLITICA.emissao}</p>
    </div>
    <footer>sem operador</footer>
  </article>
</main>
`;

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

function revisao(nome: string, bytes: number, texto: string | null): string {
  const corpo = texto
    ? `<pre style="white-space:pre-wrap;font:15px/1.45 ui-sans-serif,system-ui,sans-serif">${esc(texto)}</pre>`
    : `<p>O PDF chegou. O texto não foi lido e nenhuma regra foi criada.</p>`;
  return `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revisar política</title>
<style>
  body { margin:0; font:16px/1.45 ui-sans-serif,system-ui,sans-serif; color:#1c1915; background:#f3efe6; }
  main { max-width: 40rem; margin:0 auto; padding:40px 20px 64px; }
  h1 { font-size:2.4rem; font-weight:500; line-height:1.05; }
  a { color:#1c1915; }
</style>
<main>
  <p>Revisão</p>
  <h1>${esc(nome)}</h1>
  <p>${bytes} bytes. Vale o arquivo. Nada foi interpretado.</p>
  ${corpo}
  <p><a href="/">Subir outra</a></p>
</main>`;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(subir, { headers: cabecalhos.html });
    }
    if (request.method === "GET" && url.pathname === "/nota") {
      return new Response(html, { headers: cabecalhos.html });
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
      const texto = arquivo.type.startsWith("text/") || arquivo.name.toLowerCase().endsWith(".txt")
        ? (await arquivo.text()).slice(0, 20_000)
        : null;
      return new Response(revisao(arquivo.name || "politica", arquivo.size, texto), { headers: cabecalhos.html });
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
  },
};
