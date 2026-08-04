// ============================================================
//  MOTOR DA URA  —  /api/ura   (versão REST, sem supabase-js)
//
//  Fala com o Supabase via API REST (PostgREST) usando fetch.
//  Não carrega @supabase/supabase-js -> imune ao erro de WebSocket
//  do Realtime no Node 20. Zero dependencias externas.
//
//  Recebe do DataCrazy:
//    {
//      "telefone":    "5511...",
//      "tipo":        "text" | "audio" | "image" | ...,
//      "mensagem":    "<texto digitado>",     (quando tipo=text)
//      "transcricao": "<audio transcrito>"    (quando tipo=audio)
//    }
//
//  Devolve:
//    { texto, acao, tag?, move_etapa? }
//    acao: "enviar" | "escalar" | "encerrar"
// ============================================================

import { FLUXO, render } from "./fluxo.js";

const SB_URL = process.env.SUPABASE_URL;          // https://xxx.supabase.co
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;  // sb_secret_...

// ---------- helpers de banco (REST) ----------
const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
};

async function lerEstado(telefone) {
  const url = `${SB_URL}/rest/v1/ura_estado?telefone=eq.${telefone}&select=no_atual`;
  const r = await fetch(url, { headers: sbHeaders });
  if (!r.ok) throw new Error(`ler estado: ${r.status}`);
  const rows = await r.json();
  return rows[0] || null;
}

async function salvarEstado(telefone, no_atual) {
  const url = `${SB_URL}/rest/v1/ura_estado`;
  const r = await fetch(url, {
    method: "POST",
    headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      telefone,
      no_atual,
      atualizado_em: new Date().toISOString(),
    }),
  });
  if (!r.ok) throw new Error(`salvar estado: ${r.status}`);
}

async function apagarEstado(telefone) {
  const url = `${SB_URL}/rest/v1/ura_estado?telefone=eq.${telefone}`;
  await fetch(url, { method: "DELETE", headers: sbHeaders });
}

async function logar(telefone, no_de, resposta, no_para) {
  try {
    await fetch(`${SB_URL}/rest/v1/ura_log`, {
      method: "POST",
      headers: sbHeaders,
      body: JSON.stringify({ telefone, no_de, resposta, no_para }),
    });
  } catch (_) {}
}

// ---------- helpers de logica ----------
function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveNo(nome) {
  let no = FLUXO[nome];
  let guard = 0;
  while (no && no.redireciona && guard++ < 5) no = FLUXO[no.redireciona];
  return no;
}

function casar(noAtual, resp) {
  if (!noAtual?.opcoes) return null;
  for (const op of noAtual.opcoes) {
    if (op.aceita.some((a) => norm(a) === resp)) return op;
  }
  for (const op of noAtual.opcoes) {
    const hit = op.aceita.some((a) => {
      const an = norm(a);
      return an.length >= 3 && resp.includes(an);
    });
    if (hit) return op;
  }
  return null;
}

// ---------- handler ----------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "use POST" });
  }

  try {
    const telefone = String(req.body?.telefone || "").replace(/\D/g, "");

    const tipo = String(req.body?.tipo || "text").toLowerCase();
    let mensagem;
    if (tipo === "audio") {
      mensagem = req.body?.transcricao ?? "";
    } else if (tipo === "text" || tipo === "chat" || tipo === "") {
      mensagem = req.body?.mensagem ?? "";
    } else {
      mensagem = "__MIDIA__";
    }

    if (!telefone) {
      return res.status(200).json({
        texto: "Não consegui identificar seu número. Tenta de novo? 🙂",
        acao: "enviar",
      });
    }

    if (mensagem === "__MIDIA__") {
      return res.status(200).json({
        texto:
          "Recebi seu arquivo, mas aqui eu te ajudo melhor por *texto* ou " +
          "*áudio* 🙂\n\nMe conta sua dúvida em palavras?",
        acao: "enviar",
      });
    }

    const estado = await lerEstado(telefone);

    if (!estado) {
      await salvarEstado(telefone, "menu");
      return res.status(200).json({
        texto: render(FLUXO.menu.mensagem),
        acao: "enviar",
      });
    }

    const noAtualNome = estado.no_atual;
    const noAtual = resolveNo(noAtualNome);

    const resp = norm(mensagem);
    const op = casar(noAtual, resp);

    let destinoNome = op ? op.vai_para : (noAtual?.fallback || "escalar");
    const tagAplicar = op ? op.tag || null : null;

    const destino = resolveNo(destinoNome);

    logar(telefone, noAtualNome, mensagem, destinoNome);

    if (destino?.terminal) {
      await apagarEstado(telefone);
      return res.status(200).json({
        texto: render(destino.mensagem),
        acao: destinoNome === "escalar" ? "escalar" : "encerrar",
        tag: destino.tag || tagAplicar || null,
        move_etapa: destino.move_etapa || null,
      });
    }

    await salvarEstado(telefone, destinoNome);
    return res.status(200).json({
      texto: render(destino.mensagem),
      acao: "enviar",
      tag: tagAplicar || null,
    });

  } catch (err) {
    console.error("erro no motor:", err);
    return res.status(200).json({
      texto:
        "Tive um probleminha aqui 😅 Vou te passar pro time:\n" +
        "👉 https://wa.me/5582991269814",
      acao: "escalar",
    });
  }
}
