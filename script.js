// =====================
//  DADOS DO CARDÁPIO
// =====================
const cardapio = {
  vulcao: [
    { nome: 'Mini Vulcão Cenoura', preco: 13 },
    { nome: 'Mini Vulcão Chocolate', preco: 13 },
    { nome: 'Mini Vulcão Casadinho', preco: 13 },
    { nome: 'Mini Vulcão Ninho c/ Nutella', preco: 17 },
  ],
  bolo: [
    { nome: 'Bolo no Pote Chocolate', preco: 12 },
    { nome: 'Bolo no Pote Prestígio', preco: 13 },
    { nome: 'Bolo no Pote Ninho c/ Geleia de Morango', preco: 15 },
  ],
  brownie: [
    { nome: 'Brownie Clássico', preco: 7 },
    { nome: 'Brownie Especial', preco: 10 },
    { nome: 'Brownie Supremo', preco: 15 },
  ]
};

// =====================
//  ESTADO
// =====================
let pedido        = JSON.parse(localStorage.getItem('pedido_atual')) || [];
let formaPagamento = localStorage.getItem('forma_pagamento') || '';
let desconto       = parseFloat(localStorage.getItem('desconto')) || 0;      // valor em R$
let tipoDesconto   = localStorage.getItem('tipo_desconto') || 'reais';       // 'reais' | 'porcento'

// =====================
//  LOCALSTORAGE
// =====================
function salvarEstado() {
  localStorage.setItem('pedido_atual',   JSON.stringify(pedido));
  localStorage.setItem('forma_pagamento', formaPagamento);
  localStorage.setItem('desconto',        desconto);
  localStorage.setItem('tipo_desconto',   tipoDesconto);
}

function salvarVenda(venda) {
  const historico = JSON.parse(localStorage.getItem('historico_vendas')) || [];
  historico.push(venda);
  localStorage.setItem('historico_vendas', JSON.stringify(historico));
}

// =====================
//  CARDÁPIO
// =====================
function renderCardapio() {
  renderGrupo('grid-vulcao',  cardapio.vulcao);
  renderGrupo('grid-bolo',    cardapio.bolo);
  renderGrupo('grid-brownie', cardapio.brownie);
}

function renderGrupo(gridId, itens) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = itens.map(item => `
    <button class="item-btn" onclick='adicionarItem(${JSON.stringify(item)}, this)'>
      <div class="item-nome">${item.nome}</div>
      <div class="item-preco">R$ ${item.preco.toFixed(2).replace('.', ',')}</div>
    </button>
  `).join('');
}

// =====================
//  PEDIDO
// =====================
function adicionarItem(item, btn) {
  const existente = pedido.find(p => p.nome === item.nome);
  if (existente) existente.qtd++;
  else pedido.push({ ...item, qtd: 1 });
  salvarEstado();
  renderPedido();
  if (btn && window.innerWidth <= 768) feedbackAdicionado(btn);
}

function feedbackAdicionado(btn) {
  if (btn.dataset.feedback) return;
  btn.dataset.feedback = '1';
  const nomeEl  = btn.querySelector('.item-nome');
  const precoEl = btn.querySelector('.item-preco');
  const textoOriginal = nomeEl.textContent;
  btn.classList.add('item-adicionado');
  nomeEl.textContent = '✓ Adicionado!';
  precoEl.style.visibility = 'hidden';
  setTimeout(() => {
    btn.classList.remove('item-adicionado');
    nomeEl.textContent = textoOriginal;
    precoEl.style.visibility = 'visible';
    delete btn.dataset.feedback;
  }, 1000);
}

function alterarQtd(idx, delta) {
  pedido[idx].qtd += delta;
  if (pedido[idx].qtd <= 0) pedido.splice(idx, 1);
  salvarEstado();
  renderPedido();
}

function renderPedido() {
  const lista = document.getElementById('pedido-lista');
  const badge = document.getElementById('badge-qtd');

  if (pedido.length === 0) {
    lista.innerHTML = '<div class="pedido-vazio">Nenhum item adicionado ainda...</div>';
    badge.style.display = 'none';
    atualizarResumo();
    atualizarBotao();
    return;
  }

  lista.innerHTML = pedido.map((item, i) => `
    <div class="pedido-item">
      <div class="pedido-item-info">
        <div class="pedido-item-nome">${item.nome}</div>
        <div class="pedido-item-sub">R$ ${item.preco.toFixed(2).replace('.', ',')} un.</div>
      </div>
      <div class="qtd-controls">
        <button class="qtd-btn menos" onclick="alterarQtd(${i}, -1)">−</button>
        <span class="qtd-num">${item.qtd}</span>
        <button class="qtd-btn mais"  onclick="alterarQtd(${i},  1)">+</button>
      </div>
      <div class="item-total">R$ ${(item.preco * item.qtd).toFixed(2).replace('.', ',')}</div>
    </div>
  `).join('');

  const totalItens = pedido.reduce((s, i) => s + i.qtd, 0);
  badge.textContent = totalItens;
  badge.style.display = 'inline';

  atualizarResumo();
  atualizarBotao();
  calcularTroco();
}

// =====================
//  DESCONTO
// =====================
function calcularValorDesconto() {
  const subtotal = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);
  if (tipoDesconto === 'porcento') {
    return Math.min((desconto / 100) * subtotal, subtotal);
  }
  return Math.min(desconto, subtotal);
}

function totalComDesconto() {
  const subtotal = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);
  return Math.max(0, subtotal - calcularValorDesconto());
}

function alterarTipoDesconto(tipo) {
  tipoDesconto = tipo;
  desconto = 0;
  document.getElementById('input-desconto').value = '';
  document.getElementById('btn-tipo-reais').classList.toggle('ativo',   tipo === 'reais');
  document.getElementById('btn-tipo-porcento').classList.toggle('ativo', tipo === 'porcento');
  document.getElementById('label-desconto').textContent = tipo === 'reais' ? 'R$' : '%';
  salvarEstado();
  atualizarResumo();
  calcularTroco();
}

function aplicarDesconto() {
  const val = parseFloat(document.getElementById('input-desconto').value) || 0;
  const subtotal = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);

  if (tipoDesconto === 'porcento' && val > 100) {
    alert('Desconto não pode ser maior que 100%!');
    return;
  }
  if (tipoDesconto === 'reais' && val > subtotal) {
    alert('Desconto não pode ser maior que o total!');
    return;
  }

  desconto = val;
  salvarEstado();
  atualizarResumo();
  calcularTroco();
}

function removerDesconto() {
  desconto = 0;
  document.getElementById('input-desconto').value = '';
  salvarEstado();
  atualizarResumo();
  calcularTroco();
}

function atualizarResumo() {
  const subtotal   = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);
  const totalItens = pedido.reduce((s, i) => s + i.qtd, 0);
  const valorDesc  = calcularValorDesconto();
  const total      = Math.max(0, subtotal - valorDesc);

  document.getElementById('res-itens').textContent = totalItens;

  // Linhas de subtotal e desconto — ids únicos corrigidos
  const linhaSubtotal = document.getElementById('res-subtotal-linha');
  const linhaDesconto = document.getElementById('res-desconto-linha');

  if (valorDesc > 0) {
    linhaSubtotal.style.display = 'flex';
    linhaDesconto.style.display = 'flex';
    document.getElementById('res-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('res-desconto').textContent = `− R$ ${valorDesc.toFixed(2).replace('.', ',')}`;
  } else {
    linhaSubtotal.style.display = 'none';
    linhaDesconto.style.display = 'none';
  }

  document.getElementById('res-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function atualizarBotao() {
  document.getElementById('btn-finalizar').disabled = pedido.length === 0 || !formaPagamento;
}

// =====================
//  PAGAMENTO
// =====================
function selecionarPagamento(el, forma) {
  document.querySelectorAll('.forma-btn').forEach(b => b.classList.remove('ativo'));
  el.classList.add('ativo');
  formaPagamento = forma;
  document.getElementById('troco-section').style.display = forma === 'Dinheiro' ? 'block' : 'none';
  salvarEstado();
  atualizarBotao();
  calcularTroco();
}

function calcularTroco() {
  const total    = totalComDesconto();
  const recebido = parseFloat(document.getElementById('valor-recebido').value) || 0;
  const trocoEl  = document.getElementById('troco-valor');
  if (formaPagamento === 'Dinheiro' && recebido > 0) {
    const troco = recebido - total;
    trocoEl.textContent = troco >= 0
      ? `Troco: R$ ${troco.toFixed(2).replace('.', ',')}`
      : `⚠️ Valor insuficiente (faltam R$ ${Math.abs(troco).toFixed(2).replace('.', ',')})`;
    trocoEl.style.color = troco >= 0 ? '#3d1f1f' : '#c0392b';
  } else {
    trocoEl.textContent = '';
  }
}

// =====================
//  FINALIZAR VENDA
// =====================
function finalizarVenda() {
  const subtotal  = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);
  const valorDesc = calcularValorDesconto();
  const total     = totalComDesconto();
  const recebido  = parseFloat(document.getElementById('valor-recebido').value) || 0;

  if (formaPagamento === 'Dinheiro' && recebido < total) {
    alert('Valor recebido é menor que o total!');
    return;
  }

  const agora = new Date();
  const hora  = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const data  = agora.toLocaleDateString('pt-BR');

  const venda = {
    id: Date.now(),
    data, hora,
    itens: pedido.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })),
    subtotal,
    desconto: valorDesc,
    total,
    formaPagamento,
    recebido: formaPagamento === 'Dinheiro' ? recebido : null,
    troco:    formaPagamento === 'Dinheiro' ? recebido - total : null,
  };

  salvarVenda(venda);

  const linhas = pedido.map(i =>
    `<strong>${i.qtd}x ${i.nome}</strong> — R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')}`
  ).join('<br>');

  const descontoTexto = valorDesc > 0
    ? `<br>Desconto: − R$ ${valorDesc.toFixed(2).replace('.', ',')}`
    : '';

  let extra = '';
  if (formaPagamento === 'Dinheiro') {
    extra = `<br>Recebido: R$ ${recebido.toFixed(2).replace('.', ',')}<br>Troco: R$ ${(recebido - total).toFixed(2).replace('.', ',')}`;
  }

  document.getElementById('cupom-conteudo').innerHTML = `
    📅 ${data} às ${hora}<br><br>
    ${linhas}${descontoTexto}<br><br>
    <strong>Forma de pagamento: ${formaPagamento}</strong><br>
    <strong>Total: R$ ${total.toFixed(2).replace('.', ',')}</strong>${extra}
  `;

  document.getElementById('modal-overlay').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('show');
}

function novaVenda() {
  fecharModal();
  limparPedido();
}

function limparPedido() {
  pedido = [];
  formaPagamento = '';
  desconto = 0;
  tipoDesconto = 'reais';
  localStorage.removeItem('pedido_atual');
  localStorage.removeItem('forma_pagamento');
  localStorage.removeItem('desconto');
  localStorage.removeItem('tipo_desconto');
  document.querySelectorAll('.forma-btn').forEach(b => b.classList.remove('ativo'));
  document.getElementById('troco-section').style.display = 'none';
  document.getElementById('valor-recebido').value = '';
  document.getElementById('input-desconto').value = '';
  alterarTipoDesconto('reais');
  renderPedido();
}

// =====================
//  INIT
// =====================
renderCardapio();
renderPedido();

// Restaurar forma de pagamento ao recarregar
if (formaPagamento) {
  document.querySelectorAll('.forma-btn').forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(formaPagamento)) {
      b.classList.add('ativo');
    }
  });
  if (formaPagamento === 'Dinheiro') {
    document.getElementById('troco-section').style.display = 'block';
  }
  atualizarBotao();
}

// Restaurar desconto salvo
if (desconto > 0) {
  document.getElementById('input-desconto').value = desconto;
  alterarTipoDesconto(tipoDesconto);
  atualizarResumo();
}
