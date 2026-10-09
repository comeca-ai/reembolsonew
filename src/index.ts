import { exemplos } from "./exemplos.ts";
import { deLeitura, lerImagem, resumoLeitura } from "./leitura.ts";
import { decisao, formulario, fraude, FRASE, lerNota, resultadoVazio, casca } from "./nota.ts";
import { julgar, brl, POLITICA, type Comprovante } from "./politica.ts";

const inicio = casca(
  "Anota sem volta",
  `<h1>A nota não volta sem a regra.</h1>
<p class="muted">Primeiro a política. A empresa lê o resumo e aprova. Depois a nota. O que não está escrito não entra.</p>
<a class="ir" href="/politica">Começar</a>
<ol class="passos">
  <li><a href="/politica"><span class="n">01</span><span>A empresa sobe a política.</span></a></li>
  <li><a href="/resumo"><span class="n">02</span><span>Aprova só o que está escrito.</span></a></li>
  <li><a href="/enviar"><span class="n">03</span><span>A nota entra. A regra decide.</span></a></li>
</ol>`,
  "/",
);

const subir = casca(
  "Subir política",
  `<p class="olho">1 · POLÍTICA</p>
<h1>Subir a política</h1>
<p class="muted">O arquivo chega inteiro. O resumo é o que o motor já aplica, não uma leitura do PDF.</p>
<form method="post" action="/politica" enctype="multipart/form-data">
  <input type="file" name="arquivo" accept=".pdf,.txt,application/pdf,text/plain" required>
  <button type="submit">Subir</button>
</form>`,
  "/politica",
);
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
  return casca(
    "Resumo da política",
    `<p class="olho">${esc(POLITICA.empresa)} · ${esc(POLITICA.emissao)}</p>
<h1>Resumo para aprovar</h1>
<p class="muted">${esc(POLITICA.nome)}</p>
${arquivoLinha}
<ol>${lista}</ol>
${acao}
<p><a href="/politica">Subir outra</a></p>`,
    "/politica",
  );
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
      const lida = await lerImagem(env.AI, bytes, foto.type);
      const texto = lida.texto;
      const nota = deLeitura(texto, dataSaoPaulo(new Date()));
      const leitura = texto.trim() ? resumoLeitura(texto, dataSaoPaulo(new Date())) : lida.erro ?? "A leitura não trouxe valor.";
      const anterior = cookieDe(request, "hash");
      const duplicada = Boolean(hash) && anterior === hash;
      let j = duplicada
        ? { status: "barrada" as const, mensagem: "Negada. Hash repetido.", motivos: [{ codigo: "hash_repetido", texto: FRASE.duplicada }], conforme: [], valorReembolsavelCentavos: null, politica: { nome: POLITICA.nome, empresa: POLITICA.empresa, emissao: POLITICA.emissao } }
        : julgar(nota);
      if (!texto.trim() && !duplicada) {
        const motivo = lida.erro ?? "Não leu o documento.";
        j = { ...j, status: "nao_lida", mensagem: "Não lida.", motivos: [{ codigo: "nao_leu", texto: motivo }], valorReembolsavelCentavos: null };
      }
      const fiscal = j.status === "aprovada" ? "sem crédito" : null;
      const html = decisao(j, j.motivos[0]?.texto ?? null, {
        leitura,
        torita: duplicada ? `duplicada. ${FRASE.duplicada}` : null,
        fiscal,
        hash,
      });
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
    if (request.method === "GET" && url.pathname === "/ia") {
      if (!env.AI) return json({ ia: false, erro: "binding AI ausente" });
      try {
        const saida = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
          messages: [{ role: "user", content: "Responda só: ok" }],
          max_tokens: 8,
        });
        return json({ ia: true, saida });
      } catch (e) {
        return json({ ia: false, erro: e instanceof Error ? e.message : "modelo não respondeu" }, 502);
      }
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
