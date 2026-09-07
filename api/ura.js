// ============================================================
//  MOTOR DA URA  —  /api/ura   (REST, sem supabase-js)
//  BUILD: 20260907-1937 | Atualizado: 2026-09-07 19:37 -03
//
//  ARQUITETURA:
//  - O TEMPLATE do WhatsApp mostra o menu principal (no canvas).
//  - O motor NUNCA mostra o menu. Ele recebe a escolha (1-6) que o
//    mapeamento do DataCrazy manda como "mensagem".
//  - Primeira mensagem (sem estado) = a escolha do menu -> vai direto
//    pro ramo. Da 2ª em diante = resposta dentro do ramo (sub-menus).
//
//  Recebe do DataCrazy:
//    { "telefone": "...", "mensagem": "2", "tipo": "text", "transcricao": "" }
//    (tipo e transcricao sao opcionais)
//
//  Devolve:
//    { texto, acao, tag?, move_etapa? }
//    acao: "enviar" | "escalar" | "encerrar"
// ============================================================

import { FLUXO, render, NO_ENTRADA, URA_BUILD } from "./fluxo.js";

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

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

// Processa uma resposta contra um nó e devolve o próximo destino.
// Retorna { destinoNome, tagAplicar, invalido }
function processar(noAtual, resp) {
  const op = casar(noAtual, resp);
  if (op) {
    return { destinoNome: op.vai_para, tagAplicar: op.tag || null, invalido: false };
  }
  // Qualquer resposta fora das opções mantém a pessoa no mesmo nó.
  // A URA do DataCrazy trabalha com respostas numéricas, então não
  // escalamos um atendimento apenas porque houve erro de digitação.
  return { destinoNome: null, tagAplicar: null, invalido: true };
}

export default async function handler(req, res) {
  // Permite conferir no navegador/curl qual versão está publicada, sem
  // exibir informação adicional nas mensagens enviadas ao aluno.
  res.setHeader("X-URA-Version", URA_BUILD);

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "use POST" });
  }

  try {
    const telefone = String(req.body?.telefone || "").replace(/\D/g, "");
    const reiniciar = req.body?.reiniciar === true;

    // fonte da mensagem: texto, audio (transcricao) ou midia
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

    const resp = norm(mensagem);

    // O fluxo no CRM apresenta opções numeradas. Texto livre, mídia vazia
    // ou números fora das opções do nó são tratados como nova tentativa.
    const somenteNumero = /^\d+$/.test(resp);

    // O clique no menu principal inicia uma sessão nova. Isso evita que a
    // opção escolhida seja interpretada contra um submenu antigo que ficou
    // salvo após timeout, teste interrompido ou automação abandonada.
    if (reiniciar) await apagarEstado(telefone);

    // lê estado
    const estado = await lerEstado(telefone);

    // ---------- PRIMEIRA MENSAGEM (sem estado) ----------
    // É a escolha do menu que o TEMPLATE mostrou. O motor NÃO mostra
    // menu -> processa a escolha (1-6) no nó de entrada e vai pro ramo.
    let noAtualNome;
    if (!estado) {
      noAtualNome = NO_ENTRADA; // "entrada"
    } else {
      noAtualNome = estado.no_atual;
    }

    const noAtual = resolveNo(noAtualNome);
    const resultado = somenteNumero
      ? processar(noAtual, resp)
      : { destinoNome: null, tagAplicar: null, invalido: true };
    const { destinoNome, tagAplicar, invalido } = resultado;

    // resposta inválida com mensagem própria -> reexplica, mantém o nó
    if (invalido) {
      // garante que o estado do nó atual está salvo (pra próxima tentativa)
      await salvarEstado(telefone, noAtualNome);
      logar(telefone, noAtualNome, mensagem, noAtualNome + " (invalido)");
      return res.status(200).json({
        texto: "Responda somente com o número da opção, por favor. 🙂",
        acao: "enviar",
      });
    }

    const destino = resolveNo(destinoNome);
    logar(telefone, noAtualNome, mensagem, destinoNome);

    // terminal -> encerra sessão
    if (destino?.terminal) {
      await apagarEstado(telefone);
      return res.status(200).json({
        texto: render(destino.mensagem),
        acao: destino.acao || (destinoNome === "escalar" ? "escalar" : "encerrar"),
        tag: destino.tag || tagAplicar || null,
        move_etapa: destino.move_etapa || null,
        arquivo: destino.arquivo || "",
      });
    }

    // nó normal -> salva e envia a mensagem do ramo
    await salvarEstado(telefone, destinoNome);
    return res.status(200).json({
      texto: render(destino.mensagem),
      acao: "enviar",
      tag: tagAplicar || null,
      // "arquivo" indica ao canvas qual PDF anexar após o texto
      // ("mapa" | "rotina" | "custo"); vazio = sem anexo.
      arquivo: destino.arquivo || "",
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
