// ============================================================
//  FLUXO DA URA — SNR (portado do canvas A&G - URA)
//  BUILD: 20260805-1044 | Atualizado: 2026-08-05 10:44 -03
//
//  Menu principal: mostrado pelo TEMPLATE (canvas). O motor recebe
//  a escolha 1-7 e roteia. Sub-menus são texto digitado pelo aluno.
//
//  Editar a URA = editar este arquivo. Cada nó:
//   mensagem | opcoes[{aceita,vai_para,tag}] | invalido | fallback
//   terminal | move_etapa | redireciona
// ============================================================

export const LINKS = {
  aguia:    "https://wa.me/5582991269814",
  lara:     "https://wa.me/5516982205201",
  hub:      "https://snr.alynnegustavo.com.br/",
  central:  "https://ajuda.sistemanovarenda.com/",
};
export const URA_BUILD = "20260805-1044";
export const HORARIO = "Seg-Sex 9h-12h e 14h-18h · Sáb 9h-12h";
export const NO_ENTRADA = "entrada";

const RODAPE_ESCALA =
  "A Central não resolveu? Então o próximo passo é chamar a *AGUIA* 🙂\n\n" +
  "⚠️ O atendimento é iniciado por você: nosso time não vai chamar por este número.\n\n" +
  "1️⃣ Clique no link abaixo e abra o canal da AGUIA\n" +
  "2️⃣ Envie uma nova mensagem\n" +
  "3️⃣ Descreva sua solicitação em detalhes: o que tentou, onde travou e, se possível, envie prints\n\n" +
  "🤖 A AGUIA recebe mensagens 24h\n" +
  "👤 Atendimento humano: {horario}\n\n" +
  "👉 Chamar a AGUIA agora: {aguia}";
const RODAPE_LARA =
  "Vou te passar pra *Lara*, que cuida disso pessoalmente.\n\n" +
  "⏰ {horario}\nSua solicitação já está registrada ✅\n\n👉 {lara}";

export const FLUXO = {
  // ============ ENTRADA (vinda do template, escolha 1-7) ============
  entrada: {
    entrada: true,
    opcoes: [
      { aceita: ["1","minha loja","loja"],                 vai_para: "loja_plat",   tag: "[URA] ticket:loja" },
      { aceita: ["2","acesso"],                            vai_para: "acesso_qual", tag: "[URA] ticket:acesso" },
      { aceita: ["3","duvidas","duvida","aula","conteudo"],vai_para: "conteudo",    tag: "[URA] ticket:conteudo" },
      { aceita: ["4","pagamento","cobranca","nota"],       vai_para: "pagamento",   tag: "[URA] ticket:pagamento" },
      { aceita: ["5","cancelamento","cancelar","reembolso"],vai_para: "cancel_obj", tag: "[URA] ticket:cancelamento" },
      { aceita: ["6","outro","outro assunto"],             vai_para: "outro",       tag: "[URA] ticket:outro" },
      { aceita: ["7","quero aprender","aprender"],         vai_para: "comercial",   tag: "[URA] comercial" },
    ],
    invalido:
      "Pra começar, escolha uma opção do menu 🙂\n\n" +
      "1 Loja · 2 Acesso · 3 Aulas · 4 Pagamento · 5 Cancelamento · 6 Outro · 7 Quero aprender",
    fallback: "entrada",
  },

  // ================= LOJA =================
  loja_plat: {
    mensagem:
      "Certo! Qual plataforma você está usando?\n\n" +
      "1️⃣ Hoobfy (a nova)\n2️⃣ Shopify\n3️⃣ Ainda não criei",
    opcoes: [
      { aceita: ["1","hoobfy"],       vai_para: "loja_hoobfy_dif" },
      { aceita: ["2","shopify"],      vai_para: "loja_shopify_dif" },
      { aceita: ["3","nao criei","ainda nao"], vai_para: "loja_criar" },
    ],
    invalido: "Escolhe a plataforma: 1 Hoobfy · 2 Shopify · 3 Ainda não criei",
    fallback: "escalar",
  },
  loja_hoobfy_dif: {
    mensagem:
      "Certo... e qual a dificuldade que você tem no momento?\n\n" +
      "1️⃣ Criar a loja\n2️⃣ Incluir produtos\n3️⃣ Domínio\n4️⃣ Outra coisa",
    opcoes: [
      { aceita: ["1","criar","criar a loja"],  vai_para: "loja_criar" },
      { aceita: ["2","produtos","incluir"],    vai_para: "loja_produtos" },
      { aceita: ["3","dominio"],               vai_para: "loja_dominio" },
      { aceita: ["4","outra","outra coisa"],   vai_para: "loja_outra" },
    ],
    invalido: "Escolhe: 1 Criar · 2 Produtos · 3 Domínio · 4 Outra coisa",
    fallback: "escalar",
  },
  loja_criar: {
    mensagem:
      "🎥 Sua vitrine fica pronta em minutos. Comece por aqui:\n\n" +
      "1️⃣ Criar conta → {central}#/a/como-criar-sua-conta-na-hoobfy\n" +
      "2️⃣ Criar a vitrine → {central}#/a/como-criar-sua-primeira-vitrine\n" +
      "3️⃣ Publicar → {central}#/a/como-publicar-e-visualizar-sua-vitrine\n\n" +
      "✅ Checklist → {central}#/a/checklist-loja-pronta-para-vender\n\n" +
      "⚠️ Vá executando junto, com a aba do artigo aberta ao lado.\n\n" +
      "Resolveu?\n1️⃣ Sim ✅  ·  2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim","resolveu","resolvido"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao","preciso"],      vai_para: "escalar" },
    ],
    invalido: "Resolveu? 1️⃣ Sim · 2️⃣ Preciso de ajuda",
    fallback: "escalar",
  },
  loja_produtos: {
    mensagem:
      "📦 Três caminhos, do mais rápido ao manual:\n\n" +
      "⚡ Nicho pronto (50+ produtos) → {central}#/a/como-importar-um-nicho-pronto-50-produtos\n" +
      "🛒 Importar da Shopee → {central}#/a/como-importar-um-produto-da-shopee-para-sua-loja\n" +
      "✍️ Cadastrar manualmente → {central}#/a/como-cadastrar-um-produto-manualmente\n\n" +
      "💰 Precificar → {central}#/a/como-precificar-seus-produtos-ancoragem-markup-e-parcelamento\n\n" +
      "Resolveu?\n1️⃣ Sim ✅  ·  2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim","resolveu"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"],    vai_para: "escalar" },
    ],
    invalido: "Resolveu? 1️⃣ Sim · 2️⃣ Preciso de ajuda",
    fallback: "escalar",
  },
  loja_dominio: {
    mensagem:
      "🌐 O domínio é opcional (~R$60/ano) — dá pra vender sem ele.\n\n" +
      "🛒 Comprar → {central}#/a/como-comprar-um-dominio-godaddy\n" +
      "🔗 Conectar (DNS) → {central}#/a/como-conectar-seu-dominio-a-hoobfy-dns\n" +
      "🔧 Não propagou → {central}#/a/problemas-comuns-de-dns-registro-a-duplicado-e-propagacao\n\n" +
      "⏳ DNS leva de minutos a 24h pra propagar.\n\n" +
      "Resolveu?\n1️⃣ Sim ✅  ·  2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim","resolveu"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"],    vai_para: "escalar" },
    ],
    invalido: "Resolveu? 1️⃣ Sim · 2️⃣ Preciso de ajuda",
    fallback: "escalar",
  },
  loja_outra: {
    mensagem: "📚 Certo, você pode fazer uma busca completa: {central}#/c/hoobfy-primeiros-passos\n\nResolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  loja_shopify_dif: {
    mensagem:
      "Certo... e qual a dificuldade que você tem no momento?\n\n" +
      "1️⃣ Criar a loja\n2️⃣ Incluir produtos\n3️⃣ Domínio\n4️⃣ Outra coisa",
    opcoes: [
      { aceita: ["1","criar"],    vai_para: "shopify_criar" },
      { aceita: ["2","produtos"], vai_para: "shopify_produtos" },
      { aceita: ["3","dominio"],  vai_para: "loja_dominio" },
      { aceita: ["4","outra"],    vai_para: "loja_outra" },
    ],
    fallback: "escalar",
  },
  shopify_criar: {
    mensagem:
      "👍 Siga o passo a passo:\n\n" +
      "🔧 Resgatar e finalizar → {central}#/a/resgatando-sua-loja-shopify-e-finalizando-configuracoes\n" +
      "✅ Checklist → {central}#/a/checklist-resgatando-sua-loja-de-alta-conversao\n\n" +
      "Resolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  shopify_produtos: {
    mensagem:
      "Produtos e fornecedores:\n\n" +
      "🔎 Escolher produto → {central}#/a/como-selecionar-produtos-para-sua-loja\n" +
      "🏭 Fornecedor → {central}#/a/como-encontrar-o-fornecedor-de-um-produto\n" +
      "💰 Precificar → {central}#/a/como-precificar-corretamente-seus-produtos\n\n" +
      "Resolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },

  // ================= ACESSO =================
  acesso_qual: {
    mensagem:
      "Só me fala aqui... o que você está precisando acessar agora?\n\n" +
      "1️⃣ Sistema Nova Renda (as aulas)\n2️⃣ Plataforma Genius\n3️⃣ Loja Hoobfy",
    opcoes: [
      { aceita: ["1","sistema","snr","aulas","nova renda"], vai_para: "acesso_snr" },
      { aceita: ["2","genius","plataforma"],                vai_para: "acesso_genius" },
      { aceita: ["3","hoobfy","loja"],                      vai_para: "acesso_hoobfy" },
    ],
    invalido: "O que quer acessar? 1️⃣ Sistema Nova Renda · 2️⃣ Genius · 3️⃣ Hoobfy",
    fallback: "escalar",
  },
  acesso_snr: {
    mensagem:
      "🔑 Vamos resolver isso agora 👇\n\n" +
      "1️⃣ Acesse: {hub}\n2️⃣ E-mail: o mesmo da compra\n3️⃣ Senha padrão: novarenda2026\n\n" +
      "❌ Não funcionou? Clique em *Esqueci minha senha* e recupere pelo e-mail.\n" +
      "📩 Não chegou? Olhe em spam / promoções.\n\n" +
      "Resolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim","entrei","consegui"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"],             vai_para: "escalar" },
    ],
    invalido: "Conseguiu entrar? 1️⃣ Sim · 2️⃣ Preciso de ajuda",
    fallback: "escalar",
  },
  acesso_genius: {
    mensagem:
      "🔑 Vamos resolver 👇\n\n1️⃣ Acesse: https://acesso.geniusdrop.app\n2️⃣ E-mail: o mesmo da compra\n3️⃣ Senha padrão: novarenda2026\n\n❌ Não funcionou? *Esqueci minha senha*.\n📩 Olhe spam / promoções.\n\nResolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  acesso_hoobfy: {
    mensagem:
      "🔑 Vamos resolver 👇\n\n1️⃣ Acesse: https://app.hoobfy.com/\n2️⃣ E-mail: o mesmo da compra\n3️⃣ Clique em entrar — um código de 6 dígitos vai pro seu e-mail.\n\n📩 Não chegou? Olhe spam / promoções.\n\nResolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },

  // ================= CONTEÚDO =================
  conteudo: {
    mensagem:
      "Selecione o que precisa:\n\n" +
      "1️⃣ Produtos / fornecedor\n2️⃣ Anúncios / tráfego\n3️⃣ Criativos\n4️⃣ Vender mais\n5️⃣ Outro",
    opcoes: [
      { aceita: ["1","produtos","fornecedor"], vai_para: "cont_produtos" },
      { aceita: ["2","anuncios","trafego"],    vai_para: "cont_trafego" },
      { aceita: ["3","criativos"],             vai_para: "cont_criativos" },
      { aceita: ["4","vender","vender mais"],  vai_para: "cont_vender" },
      { aceita: ["5","outro"],                 vai_para: "cont_outro" },
    ],
    invalido: "Escolhe: 1 Produtos · 2 Tráfego · 3 Criativos · 4 Vender mais · 5 Outro",
    fallback: "escalar",
  },
  cont_produtos: {
    mensagem:
      "🔎 Escolher produto → {central}#/a/como-selecionar-produtos-para-sua-loja\n" +
      "🏭 Fornecedor → {central}#/a/como-encontrar-o-fornecedor-de-um-produto\n" +
      "💰 Precificar → {central}#/a/como-precificar-corretamente-seus-produtos\n" +
      "📈 Esteira → {central}#/a/montando-sua-esteira-de-produtos\n\n" +
      "Resolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  cont_trafego: {
    mensagem:
      "🎯 Princípios → {central}#/a/principios-de-trafego-e-funil-de-vendas\n" +
      "📌 Pixel → {central}#/a/instalacao-do-pixel-do-facebook\n" +
      "🏢 Criar BM → {central}#/a/criacao-de-bm-business-manager-passo-a-passo\n" +
      "🚀 Subir campanha → {central}#/a/subindo-campanhas-no-facebook-ads\n" +
      "🧪 Testar produto → {central}#/a/teste-de-produtos-planejamento-campanha-publicos-e-orcamento\n" +
      "📚 Tudo → {central}#/c/meta-ads\n\n" +
      "Resolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  cont_criativos: {
    mensagem:
      "🏗️ Pilares → {central}#/a/pilares-de-um-bom-criativo\n" +
      "🧩 Estrutura → {central}#/a/estrutura-de-um-criativo-beneficio-objecoes-e-cta\n" +
      "🎬 Editar vídeo → {central}#/a/edicao-de-criativos-em-video-no-clipchamp\n" +
      "🖼️ Editar imagem → {central}#/a/edicao-de-imagens-para-criativos-no-canva\n" +
      "📚 Categoria → {central}#/c/criativos\n\n" +
      "Resolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  cont_vender: {
    mensagem:
      "💎 Oferta 11 estrelas → {central}#/a/oferta-11-estrelas-como-criar-ofertas-irresistiveis\n" +
      "🧠 Gatilhos → {central}#/a/como-vender-mais-usando-gatilhos-mentais\n" +
      "📄 Página de vendas → {central}#/a/pagina-de-vendas-estrutura-e-linguagem-persuasiva\n" +
      "🛒 Recuperar Pix → {central}#/a/recuperacao-de-vendas-carrinho-abandonado-pix-e-boleto\n\n" +
      "Resolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  cont_outro: {
    mensagem: "Recomendo uma busca na Central: {central}\n\nResolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },

  // ================= PAGAMENTO =================
  pagamento: {
    mensagem:
      "Selecione o que precisa:\n\n" +
      "1️⃣ Hoobfy (custos)\n2️⃣ Domínio\n3️⃣ Anúncios\n4️⃣ Sistema Nova Renda\n5️⃣ Outro",
    opcoes: [
      { aceita: ["1","hoobfy","custos"], vai_para: "pag_hoobfy" },
      { aceita: ["2","dominio"],         vai_para: "pag_dominio" },
      { aceita: ["3","anuncios"],        vai_para: "pag_anuncios" },
      { aceita: ["4","sistema","snr"],   vai_para: "cont_vender" },
      { aceita: ["5","outro"],           vai_para: "cont_outro" },
    ],
    invalido: "Escolhe: 1 Hoobfy · 2 Domínio · 3 Anúncios · 4 Sistema · 5 Outro",
    fallback: "escalar",
  },
  pag_hoobfy: {
    mensagem: "✅ Hoobfy: 30 dias grátis com o cupom HOOBFY100\nAcesse: https://hoobfy.com/\n\nNenhum é taxa nossa — são custos do seu negócio.\n\nResolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  pag_dominio: {
    mensagem: "✅ Domínio: opcional, ~R$60/ano → {central}#/a/como-comprar-um-dominio-godaddy\n\nNenhum é taxa nossa — são custos do seu negócio.\n\nResolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  pag_anuncios: {
    mensagem: "✅ Anúncios: você define. Dá pra começar com menos de R$100 → {central}#/a/teste-de-produtos-planejamento-campanha-publicos-e-orcamento\n\nNenhum é taxa nossa — são custos do seu negócio.\n\nResolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },

  // ================= CANCELAMENTO =================
  cancel_obj: {
    mensagem:
      "Entendi. Só pra eu te direcionar certo — o que você quer cancelar?\n\n" +
      "1️⃣ Sistema Nova Renda\n2️⃣ Hoobfy\n3️⃣ Mentoria Aceleração\n4️⃣ Outro",
    opcoes: [
      { aceita: ["1","sistema","snr","nova renda"], vai_para: "cancel_motivo" },
      { aceita: ["2","hoobfy"],                     vai_para: "cancel_hoobfy" },
      { aceita: ["3","mentoria","aceleracao"],      vai_para: "cancel_motivo" },
      { aceita: ["4","outro"],                      vai_para: "cancel_outro" },
    ],
    invalido: "O que quer cancelar? 1 Sistema · 2 Hoobfy · 3 Mentoria · 4 Outro",
    fallback: "lumia",
  },
  cancel_hoobfy: {
    mensagem:
      "A assinatura da Hoobfy você mesmo cancela, direto no painel — leva 30 segundos 🙂\n\n" +
      "1️⃣ Entre na Hoobfy e clique no seu avatar (canto superior direito)\n" +
      "2️⃣ Clique em *Minha conta*\n3️⃣ Role até *Gerenciar assinatura*\n4️⃣ Clique em *Cancelar assinatura*\n\n" +
      "✅ Sua loja continua no ar até a data de renovação. Você não perde nada agora.\n" +
      "⚠️ Cancelar a Hoobfy não cancela o Sistema Nova Renda.\n\n" +
      "Resolveu?\n1️⃣ Sim ✅ · 2️⃣ Preciso de ajuda",
    opcoes: [
      { aceita: ["1","sim","resolveu"], vai_para: "resolvido" },
      { aceita: ["2","ajuda","nao"],    vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  cancel_motivo: {
    mensagem:
      "Poxa, que pena 😔\n\nAntes de te encaminhar, qual o principal motivo?\n\n" +
      "1️⃣ Travei em uma etapa\n2️⃣ Custos inesperados\n3️⃣ Esperava outra coisa\n4️⃣ Não tenho tempo\n5️⃣ Outro motivo",
    opcoes: [
      { aceita: ["1","travei","travou","tecnico"], vai_para: "cancel_travou" },
      { aceita: ["2","custos","custo","caro"],     vai_para: "cancel_custos" },
      { aceita: ["3","esperava","expectativa"],    vai_para: "lumia" },
      { aceita: ["4","tempo","sem tempo"],         vai_para: "cancel_tempo" },
      { aceita: ["5","outro"],                     vai_para: "lumia" },
    ],
    invalido: "Qual o motivo? 1 Travei · 2 Custos · 3 Esperava outra coisa · 4 Sem tempo · 5 Outro",
    fallback: "lumia",
  },
  cancel_travou: {
    mensagem:
      "Peraí! Se o problema é técnico, isso a gente resolve 🛠️\n\n" +
      "Muita gente pede cancelamento achando que travou de vez — e era uma etapa só.\n\n" +
      "Deixa a gente tentar destravar primeiro?\n\n" +
      "1️⃣ Sim, quero tentar 🙏\n2️⃣ Não, quero cancelar",
    opcoes: [
      { aceita: ["1","sim","tentar"],   vai_para: "revertido" },
      { aceita: ["2","nao","cancelar"], vai_para: "lumia" },
    ],
    invalido: "Quer tentar destravar? 1️⃣ Sim · 2️⃣ Não, cancelar",
    fallback: "lumia",
  },
  cancel_custos: {
    mensagem:
      "Entendi — e a boa notícia é que esse custo não existe do jeito que você imaginou 👇\n\n" +
      "✅ Hoobfy: 30 dias grátis com o cupom HOOBFY100\n" +
      "✅ Domínio: opcional, ~R$60/ano. Dá pra vender sem\n" +
      "✅ Anúncios: você define. Menos de R$100 já testa\n\n" +
      "E dá pra começar vendendo no orgânico, sem gastar nada!\n\n" +
      "Sabendo disso:\n1️⃣ Quero continuar 🙏\n2️⃣ Ainda quero cancelar",
    opcoes: [
      { aceita: ["1","continuar","sim","tentar"], vai_para: "revertido" },
      { aceita: ["2","cancelar","nao"],           vai_para: "lumia" },
    ],
    invalido: "1️⃣ Quero continuar · 2️⃣ Ainda quero cancelar",
    fallback: "lumia",
  },
  cancel_tempo: {
    mensagem:
      "Entendo — esse é o motivo mais comum de todos, você não está sozinho(a) 🙂\n\n" +
      RODAPE_LARA,
    terminal: true,
    tag: "[URA] encaminhado_LUMIA",
    move_etapa: "Solicitou Cancelamento na URA",
  },
  cancel_outro: {
    mensagem:
      "Sem problema — me ajuda a te direcionar 🙂\n\n" +
      "1️⃣ Cobrança desconhecida\n2️⃣ Outro produto\n3️⃣ Não sei dizer",
    opcoes: [
      { aceita: ["1","cobranca","desconhecida"], vai_para: "cobranca" },
      { aceita: ["2","outro produto","produto"], vai_para: "escalar" },
      { aceita: ["3","nao sei","nao sei dizer"], vai_para: "escalar" },
    ],
    fallback: "escalar",
  },
  cobranca: {
    mensagem:
      "Vamos verificar isso 🔎\n\nDois casos comuns:\n" +
      "📅 Comprou parcelado? As parcelas aparecem nos meses seguintes — é normal.\n" +
      "🏪 Assinatura da Hoobfy? É cobrada separada do Sistema.\n\n" +
      "Se não for nenhum dos dois, te passo pro financeiro.\n\n" +
      "1️⃣ Era isso, resolvido ✅\n2️⃣ Quero verificar",
    opcoes: [
      { aceita: ["1","sim","resolvido","era isso"], vai_para: "resolvido" },
      { aceita: ["2","verificar","nao"],            vai_para: "escalar" },
    ],
    fallback: "escalar",
  },

  // ================= OUTRO / COMERCIAL =================
  outro: {
    mensagem:
      "Sem problema! Me diz do que se trata 🙂\n\n" +
      "1️⃣ Quero comprar algo (mentoria / outro produto)\n" +
      "2️⃣ Falar com o time\n3️⃣ Elogio ou sugestão\n4️⃣ Parar de receber mensagens",
    opcoes: [
      { aceita: ["1","comprar","comprar algo"], vai_para: "comercial" },
      { aceita: ["2","time","falar"],           vai_para: "conteudo" },
      { aceita: ["3","elogio","sugestao"],      vai_para: "feedback" },
      { aceita: ["4","parar","bloquear"],       vai_para: "optout" },
    ],
    fallback: "escalar",
  },
  comercial: {
    mensagem:
      "Que ótimo! 🎉 Vou te passar pra Lara — ela cuida disso pessoalmente.\n\n" +
      "⏰ {horario}\n\n👉 {lara}",
    terminal: true,
    tag: "[URA] comercial",
  },
  feedback: {
    mensagem: "Pode mandar! 💚 Escreve aqui embaixo que a gente lê tudo — a Alynne e o Gustavo acompanham de perto.",
    terminal: true,
  },
  optout: {
    mensagem: "Sem problemas, não vamos mais enviar. 🙂\n\nSe mudar de ideia, é só mandar qualquer mensagem.",
    terminal: true,
    tag: "[LEAD] Bloqueio",
  },

  // ================= TERMINAIS =================
  resolvido: {
    terminal: true,
    tag: "[URA] resolvido",
    move_etapa: "resolvido",
    mensagem:
      "Boa! 🎉 Fico feliz que resolveu.\n\n" +
      "💡 Guarda esse atalho: a AGUIA responde 24h, inclusive de madrugada:\n👉 {aguia}\n\n" +
      "📚 E a Central tem 103 artigos: {central}\n\nBora vender! 🚀",
  },
  escalar: {
    terminal: true,
    tag: "[URA] encaminhado_AGUIA",
    move_etapa: "Encaminhado pela URA",
    mensagem: RODAPE_ESCALA,
  },
  lumia: {
    terminal: true,
    tag: "[URA] encaminhado_LUMIA",
    move_etapa: "Solicitou Cancelamento na URA",
    mensagem: "Entendido 🙂 " + RODAPE_LARA,
  },
  revertido: {
    terminal: true,
    tag: "[URA] revertido",
    move_etapa: "resolvido",
    mensagem:
      "Que bom! 🙌 O fato de você ter chegado até aqui já mostra que quer que dê certo. Bora fazer acontecer 👊\n\n" +
      "Acesse o Hub e dê andamento: 🎥 {hub}\n\n" +
      "⚠️ Dica: assista pausando e executando junto. As aulas têm 10 min, mas quem só assiste não sai do lugar.\n\n" +
      "🤖 Travou? Chama a AGUIA, responde 24h: 👉 {aguia}",
  },
  timeout: {
    terminal: true,
    move_etapa: "abandonado",
    mensagem: "Vou encerrar por aqui pra não te encher 🙂\n\nQuando quiser, manda qualquer mensagem que a gente recomeça.\n\n🤖 Se for urgente: {aguia}",
  },
};

export function render(t) {
  return (t || "")
    .replaceAll("{aguia}", LINKS.aguia)
    .replaceAll("{lara}", LINKS.lara)
    .replaceAll("{hub}", LINKS.hub)
    .replaceAll("{central}", LINKS.central)
    .replaceAll("{horario}", HORARIO);
}
