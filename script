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
let pedido = JSON.parse(localStorage.getItem('pedido_atual')) || [];
let formaPagamento = localStorage.getItem('forma_pagamento') || '';

// =====================
//  LOCALSTORAGE
// =====================
function salvarEstado() {
  localStorage.setItem('pedido_atual', JSON.stringify(pedido));
  localStorage.setItem('forma_pagamento', formaPagamento);
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
  renderGrupo('grid-vulcao', cardapio.vulcao);
  renderGrupo('grid-bolo', cardapio.bolo);
  renderGrupo('grid-brownie', cardapio.brownie);
}

function renderGrupo(gridId, itens) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = itens.map(item => `
    <button class="item-btn" onclick='adicionarItem(${JSON.stringify(item)})'>
      <div class="item-nome">${item.nome}</div>
      <div class="item-preco">R$ ${item.preco.toFixed(2).replace('.', ',')}</div>
    </button>
  `).join('');
}

// =====================
//  PEDIDO
// =====================
function adicionarItem(item) {
  const existente = pedido.find(p => p.nome === item.nome);
  if (existente) {
    existente.qtd++;
  } else {
    pedido.push({ ...item, qtd: 1 });
  }
  salvarEstado();
  renderPedido();
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
        <button class="qtd-btn mais" onclick="alterarQtd(${i}, 1)">+</button>
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

function atualizarResumo() {
  const totalItens = pedido.reduce((s, i) => s + i.qtd, 0);
  const totalVal = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);
  document.getElementById('res-itens').textContent = totalItens;
  document.getElementById('res-total').textContent = `R$ ${totalVal.toFixed(2).replace('.', ',')}`;
}

function atualizarBotao() {
  const btn = document.getElementById('btn-finalizar');
  btn.disabled = pedido.length === 0 || !formaPagamento;
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
  const total = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);
  const recebido = parseFloat(document.getElementById('valor-recebido').value) || 0;
  const trocoEl = document.getElementById('troco-valor');
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
  const total = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);
  const recebido = parseFloat(document.getElementById('valor-recebido').value) || 0;

  if (formaPagamento === 'Dinheiro' && recebido < total) {
    alert('Valor recebido é menor que o total!');
    return;
  }

  const agora = new Date();
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const data = agora.toLocaleDateString('pt-BR');

  const venda = {
    id: Date.now(),
    data,
    hora,
    itens: pedido.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })),
    total,
    formaPagamento,
    recebido: formaPagamento === 'Dinheiro' ? recebido : null,
    troco: formaPagamento === 'Dinheiro' ? recebido - total : null,
  };

  salvarVenda(venda);

  const linhas = pedido.map(i =>
    `<strong>${i.qtd}x ${i.nome}</strong> — R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')}`
  ).join('<br>');

  let extra = '';
  if (formaPagamento === 'Dinheiro') {
    extra = `<br>Recebido: R$ ${recebido.toFixed(2).replace('.', ',')}<br>Troco: R$ ${(recebido - total).toFixed(2).replace('.', ',')}`;
  }

  document.getElementById('cupom-conteudo').innerHTML = `
    📅 ${data} às ${hora}<br><br>
    ${linhas}<br><br>
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
  localStorage.removeItem('pedido_atual');
  localStorage.removeItem('forma_pagamento');
  document.querySelectorAll('.forma-btn').forEach(b => b.classList.remove('ativo'));
  document.getElementById('troco-section').style.display = 'none';
  document.getElementById('valor-recebido').value = '';
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
