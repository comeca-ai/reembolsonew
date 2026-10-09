import { exemplos } from "./exemplos.ts";
import { julgar, POLITICA, type Comprovante } from "./politica.ts";

const html = `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>reembolsonew</title>
<style>
  :root { color-scheme: light; --ink:#1c1915; --paper:#f6f1e7; --line:#e4d9c8; --pine:#1f6b4a; --clay:#9a3b2f; --muted:#6d645b; }
  * { box-sizing: border-box; }
  body { margin:0; font:16px/1.45 ui-sans-serif, system-ui, sans-serif; color:var(--ink); background:var(--paper); }
  main { max-width: 760px; margin: 0 auto; padding: 28px 18px 64px; }
  h1 { font-size: 2rem; margin: 0 0 4px; letter-spacing: -0.03em; }
  p.lead { color: var(--muted); margin-top: 0; }
  button, textarea { font: inherit; }
  .row { display:flex; flex-wrap:wrap; gap:8px; margin: 16px 0; }
  button { background:#fff; border:1px solid var(--line); border-radius:999px; padding:10px 14px; cursor:pointer; }
  button.primary { background:var(--ink); color:#fff; border-color:var(--ink); }
  textarea { width:100%; min-height: 220px; border:1px solid var(--line); border-radius:14px; padding:12px; background:#fff; }
  article { margin-top:18px; background:#fff; border:1px solid var(--line); border-radius:16px; padding:16px; }
  .status { font-weight:700; }
  .barrada, .nao_lida { color: var(--clay); }
  .aprovada { color: var(--pine); }
  .excedente_vp { color: #8a5a12; }
  li { margin: 4px 0; }
  code { font-size: 0.92em; }
</style>
<main>
  <h1>reembolsonew</h1>
  <p class="lead">${POLITICA.nome}. Emissão ${POLITICA.emissao}. A regra decide. Não fica em análise.</p>
  <div class="row" id="atalhos"></div>
  <textarea id="json" spellcheck="false"></textarea>
  <div class="row"><button class="primary" id="julgar" type="button">Julgar</button></div>
  <article id="saida" hidden></article>
</main>
<script>
const exemplos = ${JSON.stringify(exemplos)};
const atalhos = document.querySelector("#atalhos");
const box = document.querySelector("#json");
const saida = document.querySelector("#saida");
function mostrar(j) {
  const itens = (j.motivos || []).map((m) => "<li><code>" + m.codigo + "</code> " + m.texto + "</li>").join("");
  const ok = (j.conforme || []).map((t) => "<li>" + t + "</li>").join("");
  saida.hidden = false;
  saida.innerHTML = "<p class='status " + j.status + "'>" + j.mensagem + "</p>"
    + (itens ? "<p>Motivos</p><ul>" + itens + "</ul>" : "")
    + (ok ? "<p>Conforme</p><ul>" + ok + "</ul>" : "");
}
exemplos.forEach((ex) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = ex.descricao;
  b.onclick = () => { box.value = JSON.stringify(ex, null, 2); julgar(); };
  atalhos.append(b);
});
box.value = JSON.stringify(exemplos[0], null, 2);
async function julgar() {
  const r = await fetch("/api/julgar", { method:"POST", headers:{ "content-type":"application/json" }, body: box.value });
  mostrar(await r.json());
}
document.querySelector("#julgar").onclick = julgar;
julgar();
</script>
`;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
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
