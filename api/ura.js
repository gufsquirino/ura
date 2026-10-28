// ============================================================
//  MOTOR DA URA  —  /api/ura   (REST, sem supabase-js)
//  BUILD: 20261027-2158 | Atualizado: 2026-10-27 21:58 -03
//
//  ARQUITETURA:
//  - O TEMPLATE do WhatsApp mostra o menu principal (no canvas).
//  - O motor NUNCA mostra o menu. Ele recebe a escolha (1-6) que o
//    mapeamento do DataCrazy manda como "mensagem".
//  - Primeira mensagem (sem estado) = a escolha do menu -> vai direto
//    pro ramo. Da 2ª em diante = resposta dentro do ramo (sub-menus).
//
//  Recebe do DataCrazy:
//    { "telefone": "...", "mensagem": "2", "tipo": "text",
//      "transcricao": "", "event_id": "...", "evento": "resposta" }
//    (tipo, transcricao, event_id e evento sao opcionais)
//
//  Devolve:
//    { texto, acao, tag?, move_etapa? }
//    acao: "enviar" | "escalar" | "encerrar"
// ============================================================

import { FLUXO, render, NO_ENTRADA, URA_BUILD } from "./fluxo.js";
import { randomUUID } from "node:crypto";

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const TIMEOUT_MINUTES = Number(process.env.URA_TIMEOUT_MINUTES || 20);
const DEDUPE_SECONDS = Number(process.env.URA_DEDUPE_SECONDS || 3);

const SB_KEY_TYPE = SB_KEY?.startsWith("sb_secret_")
  ? "secret"
  : SB_KEY?.startsWith("sb_publishable_")
    ? "publishable"
    : SB_KEY?.startsWith("eyJ")
      ? "legacy-jwt"
      : SB_KEY
        ? "unknown"
        : "missing";

const sbHeaders = {
  apikey: SB_KEY,
  "Content-Type": "application/json",
};

// Chaves legadas service_role são JWTs e aceitam Authorization Bearer.
// As novas chaves sb_secret_* devem ser enviadas somente como apikey.
if (SB_KEY?.startsWith("eyJ")) {
  sbHeaders.Authorization = `Bearer ${SB_KEY}`;
}

async function lerEstado(telefone) {
  const url = `${SB_URL}/rest/v1/ura_estado?telefone=eq.${telefone}&select=*`;
  const r = await fetch(url, { headers: sbHeaders });
  if (!r.ok) throw new Error(`ler estado: ${r.status} ${await r.text()}`);
  const rows = await r.json();
  return rows[0] || null;
}

async function salvarEstado(telefone, no_atual, session_id) {
  const url = `${SB_URL}/rest/v1/ura_estado`;
  let r = await fetch(url, {
    method: "POST",
    headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      telefone,
      no_atual,
      session_id,
      atualizado_em: new Date().toISOString(),
    }),
  });
  if (!r.ok) {
    const detalhe = await r.text();
    // Compatibilidade durante a janela entre deploy e execução da migration.
    if (detalhe.includes("session_id")) {
      r = await fetch(url, {
        method: "POST",
        headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ telefone, no_atual, atualizado_em: new Date().toISOString() }),
      });
      if (r.ok) return;
      throw new Error(`salvar estado legado: ${r.status} ${await r.text()}`);
    }
    throw new Error(`salvar estado: ${r.status} ${detalhe}`);
  }
}

async function apagarEstado(telefone) {
  const url = `${SB_URL}/rest/v1/ura_estado?telefone=eq.${telefone}`;
  const r = await fetch(url, { method: "DELETE", headers: sbHeaders });
  if (!r.ok) throw new Error(`apagar estado: ${r.status} ${await r.text()}`);
}

async function logar(telefone, no_de, resposta, no_para, meta = {}) {
  try {
    const legado = { telefone, no_de, resposta, no_para };
    const completo = {
      ...legado,
      session_id: meta.session_id || null,
      event_id: meta.event_id || null,
      ura_build: URA_BUILD,
      evento: meta.evento || "resposta",
      acao: meta.resposta_api?.acao || null,
      arquivo: meta.resposta_api?.arquivo || null,
      tag: meta.resposta_api?.tag || null,
      move_etapa: meta.resposta_api?.move_etapa || null,
      resposta_api: meta.resposta_api || null,
      duracao_ms: Math.round(meta.duracao_ms || 0),
      origem: meta.origem || "datacrazy",
    };
    let r = await fetch(`${SB_URL}/rest/v1/ura_log`, {
      method: "POST",
      headers: sbHeaders,
      body: JSON.stringify(completo),
    });
    if (!r.ok) {
      const detalhe = await r.text();
      const schemaAntigo = detalhe.includes("session_id") || detalhe.includes("ura_build");
      if (schemaAntigo) {
        r = await fetch(`${SB_URL}/rest/v1/ura_log`, {
          method: "POST",
          headers: sbHeaders,
          body: JSON.stringify(legado),
        });
        if (r.ok) return;
      }
      // event_id duplicado é esperado em retry idempotente.
      if (r.status !== 409) console.error(`logar: ${r.status} ${detalhe}`);
    }
  } catch (err) {
    console.error("logar:", err);
  }
}

async function lerEventoAnterior(event_id, telefone, fingerprint) {
  try {
    const filtro = event_id
      ? `event_id=eq.${encodeURIComponent(event_id)}`
      : `telefone=eq.${encodeURIComponent(telefone)}&order=criado_em.desc&limit=1`;
    const url = `${SB_URL}/rest/v1/ura_eventos?${filtro}&select=event_id,fingerprint,resposta_api,criado_em`;
    const r = await fetch(url, { headers: sbHeaders });
    if (!r.ok) return null; // migration ainda não aplicada
    const [evento] = await r.json();
    if (!evento?.resposta_api) return null;
    if (event_id) return evento.resposta_api;
    const idade = Date.now() - new Date(evento.criado_em).getTime();
    if (evento.fingerprint === fingerprint && idade >= 0 && idade <= DEDUPE_SECONDS * 1000) {
      return evento.resposta_api;
    }
    return null;
  } catch {
    return null;
  }
}

async function salvarEvento({ event_id, telefone, session_id, fingerprint, resposta_api }) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/ura_eventos`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify({
        event_id: event_id || null,
        telefone,
        session_id,
        fingerprint,
        resposta_api,
        ura_build: URA_BUILD,
      }),
    });
    if (!r.ok && r.status !== 409) console.error(`salvar evento: ${r.status} ${await r.text()}`);
  } catch (err) {
    console.error("salvar evento:", err);
  }
}

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\uFE0F\u20E3]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveNo(nome) {
  let no = FLUXO[nome];
  let guard = 0;
  while (no && no.redireciona && guard++ < 5) no = FLUXO[no.redireciona];
  return no;
}

function casar(noAtual, resp) {
  if (!noAtual?.opcoes) return null;
  // Primeiro tenta correspondência exata. Isso cobre números, palavras e
  // frases inequívocas sem transformar texto livre em escolha errada.
  for (const op of noAtual.opcoes) {
    if (op.aceita.some((a) => norm(a) === resp)) return op;
  }

  // Depois aceita termos longos dentro da frase, mas somente quando uma
  // única opção é identificada. "1 e 2" e textos ambíguos continuam inválidos.
  const encontradas = [];
  for (const op of noAtual.opcoes) {
    const hit = op.aceita.some((a) => {
      const an = norm(a);
      if (an.length < 4 || /^\d+$/.test(an)) return false;
      const termo = an.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|\\s)${termo}(?=\\s|$|[.,!?])`, "i").test(resp);
    });
    if (hit) encontradas.push(op);
  }
  return encontradas.length === 1 ? encontradas[0] : null;
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
  res.setHeader("X-URA-Supabase-Key-Type", SB_KEY_TYPE);

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "use POST" });
  }

  const inicio = performance.now();
  try {
    const telefone = String(req.body?.telefone || "").replace(/\D/g, "");
    const reiniciar = req.body?.reiniciar === true;
    const evento = String(req.body?.evento || "resposta").toLowerCase();
    const eventId = String(req.body?.event_id || req.body?.message_id || "").trim() || null;
    const origem = String(req.body?.origem || "datacrazy");

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

    // O bloco final de inatividade do CRM chama este evento antes de enviar
    // a mensagem de encerramento. Assim o abandono fica mensurável e o estado
    // é liberado imediatamente para uma nova URA.
    if (evento === "timeout") {
      const estado = await lerEstado(telefone);
      if (estado) {
        const sessionId = estado.session_id || randomUUID();
        const respostaApi = {
          texto: render(FLUXO.timeout.mensagem),
          acao: "encerrar",
          tag: FLUXO.timeout.tag || null,
          move_etapa: FLUXO.timeout.move_etapa || null,
          arquivo: "",
        };
        await logar(telefone, estado.no_atual, "[timeout]", "timeout", {
          session_id: sessionId,
          event_id: eventId,
          evento: "timeout",
          resposta_api: respostaApi,
          duracao_ms: performance.now() - inicio,
          origem,
        });
        await apagarEstado(telefone);
      }
      return res.status(200).json({ ok: true, evento: "timeout" });
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
    const fingerprint = `${tipo}|${resp}`;

    // Requisições repetidas recebem exatamente a mesma resposta e não avançam
    // o aluno duas vezes. event_id é a proteção principal; sem ele, há uma
    // janela curta para retries idênticos do CRM.
    const respostaAnterior = await lerEventoAnterior(eventId, telefone, fingerprint);
    if (respostaAnterior) {
      res.setHeader("X-URA-Idempotent-Replay", "true");
      return res.status(200).json(respostaAnterior);
    }

    // O clique no menu principal inicia uma sessão nova. Isso evita que a
    // opção escolhida seja interpretada contra um submenu antigo que ficou
    // salvo após timeout, teste interrompido ou automação abandonada.
    if (reiniciar) await apagarEstado(telefone);

    // lê estado
    let estado = await lerEstado(telefone);

    // Rede de segurança: se o CRM não tiver chamado o evento timeout, uma
    // sessão antiga é encerrada e registrada quando o aluno voltar.
    if (!reiniciar && estado?.atualizado_em) {
      const idadeMinutos = (Date.now() - new Date(estado.atualizado_em).getTime()) / 60000;
      if (idadeMinutos >= TIMEOUT_MINUTES) {
        await logar(telefone, estado.no_atual, "[timeout-retorno]", "timeout", {
          session_id: estado.session_id || randomUUID(),
          evento: "timeout",
          resposta_api: { acao: "encerrar", arquivo: "" },
          duracao_ms: performance.now() - inicio,
          origem,
        });
        await apagarEstado(telefone);
        estado = null;
      }
    }

    // ---------- PRIMEIRA MENSAGEM (sem estado) ----------
    // É a escolha do menu que o TEMPLATE mostrou. O motor NÃO mostra
    // menu -> processa a escolha (1-6) no nó de entrada e vai pro ramo.
    let noAtualNome;
    if (!estado) {
      noAtualNome = NO_ENTRADA; // "entrada"
    } else {
      noAtualNome = estado.no_atual;
    }
    const sessionId = estado?.session_id || randomUUID();

    const noAtual = resolveNo(noAtualNome);
    const resultado = processar(noAtual, resp);
    const { destinoNome, tagAplicar, invalido } = resultado;

    // resposta inválida com mensagem própria -> reexplica, mantém o nó
    if (invalido) {
      // garante que o estado do nó atual está salvo (pra próxima tentativa)
      await salvarEstado(telefone, noAtualNome, sessionId);
      const respostaApi = {
        texto: noAtual?.invalido || "Não consegui identificar a opção. Responda com o número ou nome da alternativa. 🙂",
        acao: "enviar",
        tag: null,
        move_etapa: null,
        arquivo: "",
      };
      await logar(telefone, noAtualNome, mensagem, noAtualNome + " (invalido)", {
        session_id: sessionId,
        event_id: eventId,
        evento: "resposta_invalida",
        resposta_api: respostaApi,
        duracao_ms: performance.now() - inicio,
        origem,
      });
      await salvarEvento({ event_id: eventId, telefone, session_id: sessionId, fingerprint, resposta_api: respostaApi });
      return res.status(200).json(respostaApi);
    }

    const destino = resolveNo(destinoNome);

    // terminal -> encerra sessão
    if (destino?.terminal) {
      await apagarEstado(telefone);
      const respostaApi = {
        texto: render(destino.mensagem),
        acao: destino.acao || (destinoNome === "escalar" ? "escalar" : "encerrar"),
        tag: destino.tag || tagAplicar || null,
        move_etapa: destino.move_etapa || null,
        arquivo: destino.arquivo || "",
      };
      await logar(telefone, noAtualNome, mensagem, destinoNome, {
        session_id: sessionId,
        event_id: eventId,
        evento: "terminal",
        resposta_api: respostaApi,
        duracao_ms: performance.now() - inicio,
        origem,
      });
      await salvarEvento({ event_id: eventId, telefone, session_id: sessionId, fingerprint, resposta_api: respostaApi });
      return res.status(200).json(respostaApi);
    }

    // nó normal -> salva e envia a mensagem do ramo
    await salvarEstado(telefone, destinoNome, sessionId);
    const respostaApi = {
      texto: render(destino.mensagem),
      acao: "enviar",
      tag: tagAplicar || null,
      // "arquivo" indica ao canvas qual PDF anexar após o texto
      // ("mapa" | "rotina" | "custo"); vazio = sem anexo.
      arquivo: destino.arquivo || "",
    };
    await logar(telefone, noAtualNome, mensagem, destinoNome, {
      session_id: sessionId,
      event_id: eventId,
      evento: "transicao",
      resposta_api: respostaApi,
      duracao_ms: performance.now() - inicio,
      origem,
    });
    await salvarEvento({ event_id: eventId, telefone, session_id: sessionId, fingerprint, resposta_api: respostaApi });
    return res.status(200).json(respostaApi);

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
