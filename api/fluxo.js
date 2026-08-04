// ============================================================
//  FLUXO DA URA — toda a lógica vive aqui, como dado.
//  Editar a URA = editar este arquivo. Nada de canvas.
//
//  Cada nó tem:
//   - mensagem: o texto enviado ao aluno
//   - opcoes:   respostas aceitas -> para onde vão + tag opcional
//   - fallback: para onde ir se a resposta não casar com nenhuma opção
//   - terminal: se true, encerra (com ação de tag/etapa)
//
//  "aceita" lista tudo que conta como aquela opção (número, palavra,
//  variações que o aluno leigo digita). Comparação é sempre minúscula.
// ============================================================

export const LINKS = {
  aguia: "https://wa.me/5582991269814",
  membros: "https://SEU-LINK-AREA-MEMBROS", // 🔴 preencher
};

export const HORARIO = "Seg-Sex 9h-12h e 14h-18h · Sáb 9h-12h";

export const FLUXO = {
  // ---------------- MENU PRINCIPAL ----------------
  menu: {
    mensagem:
      "Oi! 👋 Aqui é o Suporte do Sistema Nova Renda.\n\n" +
      "Pra te levar direto pro lugar certo, responda com o número:\n\n" +
      "1️⃣ Minha loja\n" +
      "2️⃣ Acesso (login, senha, área de membros)\n" +
      "3️⃣ Dúvida sobre aula / conteúdo\n" +
      "4️⃣ Pagamento, cobrança ou nota fiscal\n" +
      "5️⃣ Cancelamento ou reembolso\n" +
      "6️⃣ Outro assunto",
    opcoes: [
      { aceita: ["1", "um", "loja", "minha loja"],            vai_para: "loja",       tag: "ura:loja" },
      { aceita: ["2", "dois", "acesso", "senha", "login", "entrar", "membros"], vai_para: "acesso", tag: "ura:acesso" },
      { aceita: ["3", "tres", "três", "aula", "aulas", "conteudo", "conteúdo"], vai_para: "conteudo", tag: "ura:conteudo" },
      { aceita: ["4", "quatro", "pagamento", "cobranca", "cobrança", "nota", "nota fiscal"], vai_para: "pagamento", tag: "ura:pagamento" },
      { aceita: ["5", "cinco", "cancelar", "cancelamento", "reembolso", "estorno"], vai_para: "cancelamento", tag: "ura:cancelamento" },
      { aceita: ["6", "seis", "outro", "outro assunto"],      vai_para: "escalar",    tag: "ura:outro" },
    ],
    // texto livre no menu = confusão -> reformula uma vez
    fallback: "menu_retry",
  },

  menu_retry: {
    mensagem:
      "Opa, não peguei 🙈 Responde só com o *número*:\n\n" +
      "1 Loja · 2 Acesso · 3 Aulas · 4 Pagamento · 5 Cancelamento · 6 Outro",
    opcoes: [
      { aceita: ["1", "loja"],                    vai_para: "loja",        tag: "ura:loja" },
      { aceita: ["2", "acesso", "senha"],         vai_para: "acesso",      tag: "ura:acesso" },
      { aceita: ["3", "aula", "aulas", "conteudo"], vai_para: "conteudo",  tag: "ura:conteudo" },
      { aceita: ["4", "pagamento"],               vai_para: "pagamento",   tag: "ura:pagamento" },
      { aceita: ["5", "cancelar", "reembolso"],   vai_para: "cancelamento", tag: "ura:cancelamento" },
      { aceita: ["6", "outro"],                   vai_para: "escalar",     tag: "ura:outro" },
    ],
    // errou de novo -> escala, não deixa preso em loop
    fallback: "escalar",
  },

  // ---------------- RAMO ACESSO (completo) ----------------
  acesso: {
    mensagem:
      "🔑 Vamos resolver isso agora 👇\n\n" +
      "*Senha padrão:* novarenda2026\n" +
      "Não funcionou? Clica em *Esqueci minha senha* e recupera pelo e-mail da compra.\n\n" +
      "📩 Não chegou o e-mail? Olha em *spam / promoções*.\n\n" +
      "👉 " + "{membros}" + "\n\n" +
      "⚠️ *Atenção — são dois acessos diferentes:*\n" +
      "🎓 Área de membros (as aulas) → senha novarenda2026\n" +
      "🏪 Hoobfy (sua loja) → entra por link no e-mail, sem senha\n\n" +
      "Conseguiu entrar?\n" +
      "1️⃣ Sim ✅\n" +
      "2️⃣ Não ❌",
    opcoes: [
      { aceita: ["1", "sim", "consegui", "entrei", "resolveu", "deu certo"], vai_para: "resolvido" },
      { aceita: ["2", "nao", "não", "nao consigo", "não consigo"],           vai_para: "escalar" },
    ],
    // texto livre DEPOIS do conteúdo = é a pergunta dele -> escala
    fallback: "escalar",
  },

  // Placeholders dos outros ramos (ainda não portados — escalam por ora)
  loja:         { redireciona: "escalar" },
  conteudo:     { redireciona: "escalar" },
  pagamento:    { redireciona: "escalar" },
  cancelamento: { redireciona: "escalar" },

  // ---------------- TERMINAIS ----------------
  resolvido: {
    terminal: true,
    tag: "ura:resolvido",
    mensagem:
      "Boa! 🎉 Fico feliz que resolveu.\n\n" +
      "💡 Guarda esse atalho: a *AGUIA* responde 24h, inclusive de madrugada:\n" +
      "👉 {aguia}\n\n" +
      "📚 E a Central tem 103 artigos: ajuda.sistemanovarenda.com\n\n" +
      "Bora vender! 🚀",
  },

  escalar: {
    terminal: true,
    tag: "ura:escalado",
    move_etapa: "encaminhado",
    mensagem:
      "Beleza, vou te conectar com o time agora 🙂\n\n" +
      "👉 {aguia}\n\n" +
      "⚠️ *Toca no link acima* — é por lá que o time responde. " +
      "Mandar mensagem aqui não chega neles, este número é automático.\n\n" +
      "⏰ Humano: {horario}\n" +
      "🤖 A AGUIA responde na hora, 24h",
  },

  timeout: {
    terminal: true,
    move_etapa: "abandonado",
    mensagem:
      "Vou encerrar por aqui pra não te encher 🙂\n\n" +
      "Não ficou pendente — quando quiser, manda qualquer mensagem que a gente recomeça.\n\n" +
      "🤖 Se for urgente: {aguia}",
  },
};

// Substitui {aguia}, {membros}, {horario} no texto
export function render(texto) {
  return (texto || "")
    .replaceAll("{aguia}", LINKS.aguia)
    .replaceAll("{membros}", LINKS.membros)
    .replaceAll("{horario}", HORARIO);
}
