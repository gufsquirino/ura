export default function handler(req, res) {
  // Só pra testar a plumbing: devolve sempre a mesma coisa
  res.status(200).json({
    texto: "Oi! Aqui é o teste da URA. Recebi sua mensagem.",
    proximo_no: "menu",
    debug_recebido: req.body   // te mostra o que o DataCrazy mandou
  });
}
