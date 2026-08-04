// ============================================================
//  MOTOR DA URA  —  /api/ura
//
//  O DataCrazy chama isto a cada mensagem do aluno, mandando:
//    { "telefone": "5511...", "mensagem": "2" }
//
//  O motor:
//    1. lê em que nó o telefone está (Supabase)
//    2. valida a resposta contra as opções desse nó
//    3. decide o próximo nó
//    4. salva o novo estado
//    5. devolve { texto, acao, tag, move_etapa }
//
//  O DataCrazy envia `texto` ao aluno e, se vier `acao: "escalar"|"encerrar",
//  faz a transferência/tag do lado dele.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { FLUXO, render } from "./fluxo.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service key: precisa escrever na tabela
);

// normaliza a resposta do aluno pra comparar
function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // tira acento
}

// segue redirecionamentos (ramos ainda não portados apontam pra escalar)
function resolveNo(nome) {
  let no = FLUXO[nome];
  let guard = 0;
  while (no && no.redireciona && guard++ < 5) {
    no = FLUXO[no.redireciona];
  }
  return no;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "use POST" });
  }

  try {
    const telefone = String(req.body?.telefone || "").replace(/\D/g, "");

    // Escolhe a fonte da mensagem conforme o tipo:
    //  text  -> mensagem (Message-1.messageData.text)
    //  audio -> transcricao (AI-1.text)
    //  outro (imagem/figurinha/doc) -> sinaliza mídia
    const tipo = String(req.body?.tipo || "text").toLowerCase();
    let mensagem;
    if (tipo === "audio") {
      mensagem = req.body?.transcricao ?? "";
    } else if (tipo === "text" || tipo === "chat" || tipo === "") {
      mensagem = req.body?.mensagem ?? "";
    } else {
      mensagem = "__MIDIA__"; // imagem, sticker, documento, etc.
    }

    if (!telefone) {
      return res.status(200).json({
        texto: "Não consegui identificar seu número. Tenta de novo? 🙂",
        acao: "enviar",
      });
    }

    // Mídia que não é texto nem áudio: pede pra reenviar, não escala à toa
    if (mensagem === "__MIDIA__") {
      return res.status(200).json({
        texto:
          "Recebi seu arquivo, mas aqui eu consigo te ajudar melhor por " +
          "*texto* ou *áudio* 🙂\n\nMe conta sua dúvida em palavras?",
        acao: "enviar",
      });
    }

    // 1. lê estado atual
    const { data: estado } = await supabase
      .from("ura_estado")
      .select("no_atual")
      .eq("telefone", telefone)
      .maybeSingle();

    // primeira mensagem do aluno -> começa no menu e JÁ mostra o menu
    if (!estado) {
      await supabase.from("ura_estado").upsert({
        telefone,
        no_atual: "menu",
        atualizado_em: new Date().toISOString(),
      });
      const menu = FLUXO.menu;
      return res.status(200).json({
        texto: render(menu.mensagem),
        acao: "enviar",
      });
    }

    const noAtualNome = estado.no_atual;
    const noAtual = resolveNo(noAtualNome);

    // 2. valida a resposta contra as opções
    const resp = norm(mensagem);
    let destinoNome = null;
    let tagAplicar = null;

    if (noAtual?.opcoes) {
      // 1ª passada: match exato (mais confiável)
      for (const op of noAtual.opcoes) {
        if (op.aceita.some((a) => norm(a) === resp)) {
          destinoNome = op.vai_para;
          tagAplicar = op.tag || null;
          break;
        }
      }
      // 2ª passada: "contém" — pega áudio transcrito ("é o dois mesmo")
      // e variações ("quero acesso"). Ignora palavras curtas p/ evitar
      // falso positivo (ex: "1" dentro de "10").
      if (!destinoNome) {
        for (const op of noAtual.opcoes) {
          const hit = op.aceita.some((a) => {
            const an = norm(a);
            return an.length >= 3 && resp.includes(an);
          });
          if (hit) {
            destinoNome = op.vai_para;
            tagAplicar = op.tag || null;
            break;
          }
        }
      }
    }

    // 3. não casou -> fallback do nó (ou escalar por segurança)
    if (!destinoNome) {
      destinoNome = noAtual?.fallback || "escalar";
    }

    const destino = resolveNo(destinoNome);

    // log opcional (auditoria)
    supabase.from("ura_log").insert({
      telefone,
      no_de: noAtualNome,
      resposta: mensagem,
      no_para: destinoNome,
    }).then(() => {}, () => {}); // fire-and-forget

    // 4. terminal? encerra a sessão (apaga estado) e devolve ação
    if (destino?.terminal) {
      await supabase.from("ura_estado").delete().eq("telefone", telefone);
      return res.status(200).json({
        texto: render(destino.mensagem),
        acao: destinoNome === "escalar" ? "escalar"
             : destinoNome === "timeout" ? "encerrar"
             : "encerrar",
        tag: destino.tag || tagAplicar || null,
        move_etapa: destino.move_etapa || null,
      });
    }

    // 5. nó normal -> salva novo estado e manda a mensagem dele
    await supabase.from("ura_estado").upsert({
      telefone,
      no_atual: destinoNome,
      atualizado_em: new Date().toISOString(),
    });

    return res.status(200).json({
      texto: render(destino.mensagem),
      acao: "enviar",
      tag: tagAplicar || null,
    });

  } catch (err) {
    console.error("erro no motor:", err);
    // nunca deixa o aluno no vácuo: em erro, escala
    return res.status(200).json({
      texto:
        "Tive um probleminha aqui 😅 Vou te passar pro time:\n" +
        "👉 https://wa.me/5582991269814",
      acao: "escalar",
    });
  }
}
