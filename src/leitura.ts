import type { Comprovante, MeioTaxi, Ocasiao, Pagamento, Tipo } from "./politica.ts";

const MODELO = "@cf/meta/llama-3.2-11b-vision-instruct";

const PROMPT = `Leia só o que está escrito na imagem. Não invente finalidade, categoria nem ocasião.
Responda um JSON com as chaves: estabelecimento, cnpj, valor, data, pagamento, meio, ocasiao, nome, documentoFiscal, temCnpj, alcool.
Valor no formato 20,00. Data AAAA-MM-DD se estiver escrita. Se um campo não estiver escrito, null.`;

type Ai = { run: (modelo: string, entrada: unknown) => Promise<unknown> };

function textoDaSaida(saida: unknown): string {
  if (typeof saida === "string") return saida;
  if (!saida || typeof saida !== "object") return "";
  const o = saida as Record<string, unknown>;
  if (typeof o.response === "string") return o.response;
  if (typeof o.description === "string") return o.description;
  const result = o.result;
  if (result && typeof result === "object" && typeof (result as Record<string, unknown>).response === "string") {
    return (result as Record<string, unknown>).response as string;
  }
  return JSON.stringify(saida);
}

export async function lerImagem(ai: Ai | undefined, bytes: ArrayBuffer, tipo: string): Promise<{ texto: string; erro: string | null }> {
  if (!ai) return { texto: "", erro: "O binding AI não está no Worker." };
  const bytesU8 = new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < bytesU8.length; i += 0x8000) {
    bin += String.fromCharCode(...bytesU8.subarray(i, i + 0x8000));
  }
  const imagem = `data:${tipo || "image/jpeg"};base64,${btoa(bin)}`;
  try {
    const saida = await ai.run(MODELO, {
      messages: [
        { role: "system", content: "Você lê nota fiscal. Só o que está escrito." },
        { role: "user", content: PROMPT },
      ],
      image: imagem,
      max_tokens: 400,
    });
    const texto = textoDaSaida(saida).trim();
    if (!texto) return { texto: "", erro: "O modelo respondeu vazio." };
    return { texto, erro: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "O modelo de visão não respondeu.";
    return { texto: "", erro: msg };
  }
}

function jsonDe(texto: string): Record<string, unknown> {
  const ini = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (ini < 0 || fim < ini) return {};
  try {
    const v = JSON.parse(texto.slice(ini, fim + 1)) as unknown;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t !== "null" ? t : null;
}

function centavos(bruto: string | null): number | null {
  if (!bruto) return null;
  const limpo = bruto.replace(/\s/g, "").replace(/^R\$/i, "");
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return null;
  return Math.round(Number(normal) * 100);
}

function tokens(texto: string): Set<string> {
  return new Set(
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
}

export function deLeitura(texto: string, hoje: string): Comprovante {
  const o = jsonDe(texto);
  const escrito = tokens(texto);
  const meio: MeioTaxi | null = escrito.has("uber")
    ? "uber"
    : escrito.has("99")
      ? "99"
      : escrito.has("cabify")
        ? "cabify"
        : escrito.has("easy")
          ? "easy"
          : escrito.has("convencional")
            ? "convencional"
            : null;
  const ocasiao: Ocasiao | null = escrito.has("jantar")
    ? "jantar"
    : escrito.has("almoco")
      ? "almoco"
      : escrito.has("cafe")
        ? "cafe"
        : null;
  const tipo: Tipo = meio || escrito.has("taxi")
    ? "taxi"
    : ocasiao
      ? "refeicao"
      : escrito.has("estacionamento")
        ? "estacionamento"
        : escrito.has("pedagio")
          ? "pedagio"
          : "outro";
  const pagamentoBruto = str(o.pagamento);
  const pagamento: Pagamento | null =
    pagamentoBruto === "pix" || pagamentoBruto === "dinheiro" || pagamentoBruto === "debito" || pagamentoBruto === "credito" || pagamentoBruto === "app"
      ? pagamentoBruto
      : null;
  const data = str(o.data);
  return {
    tipo,
    valorCentavos: centavos(str(o.valor)),
    dataEmissao: data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null,
    documentoFiscal: o.documentoFiscal === true,
    temCnpj: o.temCnpj === true || Boolean(str(o.cnpj)),
    nomeNoComprovante: str(o.nome),
    pagamento,
    meioTaxi: meio,
    ocasiao,
    hoje,
  };
}
