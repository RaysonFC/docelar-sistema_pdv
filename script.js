// =====================
//  DADOS DO CARDÁPIO
// =====================
const cardapio = {
  vulcao: [
    { nome: 'Mini Vulcão Cenoura',         preco: 13 },
    { nome: 'Mini Vulcão Chocolate',        preco: 13 },
    { nome: 'Mini Vulcão Casadinho',        preco: 13 },
    { nome: 'Mini Vulcão Ninho c/ Nutella', preco: 17 },
  ],
  bolo: [
    { nome: 'Bolo no Pote Chocolate',                  preco: 12 },
    { nome: 'Bolo no Pote Prestígio',                  preco: 13 },
    { nome: 'Bolo no Pote Ninho c/ Geleia de Morango', preco: 15 },
  ],
  brownie: [
    { nome: 'Brownie Clássico', preco:  7 },
    { nome: 'Brownie Especial', preco: 10 },
    { nome: 'Brownie Supremo',  preco: 15 },
  ]
};

// =====================
//  ESTADO
// =====================
let pedido         = JSON.parse(localStorage.getItem('pedido_atual')) || [];
let formaPagamento = localStorage.getItem('forma_pagamento') || '';
let desconto       = parseFloat(localStorage.getItem('desconto'))    || 0;
let tipoDesconto   = localStorage.getItem('tipo_desconto')           || 'reais';

// =====================
//  LOCALSTORAGE
// =====================
function salvarEstado() {
  localStorage.setItem('pedido_atual',    JSON.stringify(pedido));
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

function atualizarBadgesCardapio() {
  document.querySelectorAll('.item-btn[data-nome]').forEach(btn => {
    const nome       = btn.dataset.nome;
    const noCarrinho = pedido.find(p => p.nome === nome);
    const qtd        = noCarrinho ? noCarrinho.qtd : 0;

    btn.classList.toggle('item-no-carrinho', qtd > 0);

    let badge = btn.querySelector('.item-qtd-badge');
    if (qtd > 0) {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'item-qtd-badge';
        btn.insertBefore(badge, btn.firstChild);
      }
      badge.textContent = qtd;
    } else {
      if (badge) badge.remove();
    }
  });
}

function renderGrupo(gridId, itens) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = itens.map(item => {
    const noCarrinho    = pedido.find(p => p.nome === item.nome);
    const qtd           = noCarrinho ? noCarrinho.qtd : 0;
    const temNoCarrinho = qtd > 0;
    return `
      <button class="item-btn ${temNoCarrinho ? 'item-no-carrinho' : ''}"
              onclick='adicionarItem(${JSON.stringify(item)}, this)'
              data-nome="${item.nome}">
        ${temNoCarrinho ? `<div class="item-qtd-badge">${qtd}</div>` : ''}
        <div class="item-nome">${item.nome}</div>
        <div class="item-preco">R$ ${item.preco.toFixed(2).replace('.', ',')}</div>
      </button>
    `;
  }).join('');
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
  atualizarBadgesCardapio();
  if (btn && window.innerWidth <= 768) feedbackAdicionado(btn);
}

function feedbackAdicionado(btn) {
  if (btn.dataset.feedback) return;
  btn.dataset.feedback = '1';
  const nomeEl        = btn.querySelector('.item-nome');
  const precoEl       = btn.querySelector('.item-preco');
  const textoOriginal = nomeEl.textContent;
  btn.classList.add('item-adicionado');
  nomeEl.textContent        = '✓ Adicionado!';
  precoEl.style.visibility  = 'hidden';
  setTimeout(() => {
    btn.classList.remove('item-adicionado');
    nomeEl.textContent       = textoOriginal;
    precoEl.style.visibility = 'visible';
    delete btn.dataset.feedback;
  }, 1000);
}

function alterarQtd(idx, delta) {
  pedido[idx].qtd += delta;
  if (pedido[idx].qtd <= 0) pedido.splice(idx, 1);
  salvarEstado();
  renderPedido();
  atualizarBadgesCardapio();
}

function renderPedido() {
  const lista = document.getElementById('pedido-lista');
  const badge = document.getElementById('badge-qtd');

  if (pedido.length === 0) {
    lista.innerHTML    = '<div class="pedido-vazio">Nenhum item adicionado ainda...</div>';
    badge.style.display = 'none';
    atualizarResumo();
    atualizarBotao();
    atualizarBadgeTab();
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

  const totalItens        = pedido.reduce((s, i) => s + i.qtd, 0);
  badge.textContent       = totalItens;
  badge.style.display     = 'inline';

  atualizarResumo();
  atualizarBotao();
  atualizarBadgeTab();
  calcularTroco();
}

// =====================
//  BADGE DA TAB MOBILE
// =====================
function atualizarBadgeTab() {
  const total = pedido.reduce((s, i) => s + i.qtd, 0);
  const badge = document.getElementById('badge-tab');
  if (!badge) return;
  badge.textContent   = total;
  badge.style.display = total > 0 ? 'inline' : 'none';
}

// =====================
//  DESCONTO
// =====================
function calcularValorDesconto() {
  const subtotal = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);
  if (tipoDesconto === 'porcento') return Math.min((desconto / 100) * subtotal, subtotal);
  return Math.min(desconto, subtotal);
}

function totalComDesconto() {
  const subtotal = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);
  return Math.max(0, subtotal - calcularValorDesconto());
}

function alterarTipoDesconto(tipo) {
  tipoDesconto = tipo;
  desconto     = 0;
  document.getElementById('input-desconto').value = '';
  document.getElementById('btn-tipo-reais').classList.toggle('ativo',    tipo === 'reais');
  document.getElementById('btn-tipo-porcento').classList.toggle('ativo', tipo === 'porcento');
  document.getElementById('label-desconto').textContent = tipo === 'reais' ? 'R$' : '%';
  salvarEstado();
  atualizarResumo();
  calcularTroco();
}

function aplicarDesconto() {
  const val      = parseFloat(document.getElementById('input-desconto').value) || 0;
  const subtotal = pedido.reduce((s, i) => s + i.preco * i.qtd, 0);

  if (tipoDesconto === 'porcento' && val > 100) { alert('Desconto não pode ser maior que 100%!'); return; }
  if (tipoDesconto === 'reais'    && val > subtotal) { alert('Desconto não pode ser maior que o total!'); return; }

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
  if (formaPagamento === 'Pix') gerarQRCode();
}

// =====================
//  PAGAMENTO
// =====================
let pixTimer    = null;
let pixSegundos = 0;

function selecionarPagamento(el, forma) {
  document.querySelectorAll('.forma-btn').forEach(b => b.classList.remove('ativo'));
  el.classList.add('ativo');
  formaPagamento = forma;

  document.getElementById('troco-section').style.display = forma === 'Dinheiro' ? 'block' : 'none';
  document.getElementById('pix-section').style.display   = forma === 'Pix'      ? 'block' : 'none';

  if (forma === 'Pix') { gerarQRCode(); iniciarTimerPix(); }
  else                 { pararTimerPix(); }

  salvarEstado();
  atualizarBotao();
  calcularTroco();
}

function iniciarTimerPix() {
  pararTimerPix();
  pixSegundos = 0;
  resetarEstadoPix();
  atualizarTimerDisplay();
  pixTimer = setInterval(() => { pixSegundos++; atualizarTimerDisplay(); }, 1000);
}

function pararTimerPix() {
  if (pixTimer) { clearInterval(pixTimer); pixTimer = null; }
}

function atualizarTimerDisplay() {
  const el = document.getElementById('pix-timer');
  if (!el) return;
  const m = String(Math.floor(pixSegundos / 60)).padStart(2, '0');
  const s = String(pixSegundos % 60).padStart(2, '0');
  el.textContent = `${m}:${s}`;
}

function resetarEstadoPix() {
  const box      = document.getElementById('pix-box-inner');
  const confirma = document.getElementById('pix-confirmado');
  if (box)      box.style.display      = 'block';
  if (confirma) confirma.style.display = 'none';
}

function confirmarPagamentoPix() {
  pararTimerPix();
  document.getElementById('pix-box-inner').style.display  = 'none';
  document.getElementById('pix-confirmado').style.display = 'flex';
  setTimeout(finalizarVenda, 1500);
}

// =====================
//  PIX — PAYLOAD EMV / QR CODE
// =====================
const PIX_CHAVE  = 'd4ddbe3f-a297-4cef-8589-33a3c5f077e9';
const PIX_NOME   = 'Rayson Ferreira Cruz';
const PIX_CIDADE = 'SAO PAULO';

function pixField(id, value) {
  return id + String(value.length).padStart(2, '0') + value;
}

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function gerarPayloadPix(valor) {
  const nome    = PIX_NOME.substring(0, 25).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cidade  = PIX_CIDADE.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let payload =
    pixField('00', '01') +
    pixField('26', pixField('00', 'BR.GOV.BCB.PIX') + pixField('01', PIX_CHAVE)) +
    pixField('52', '0000') +
    pixField('53', '986') +
    pixField('54', valor.toFixed(2)) +
    pixField('58', 'BR') +
    pixField('59', nome) +
    pixField('60', cidade) +
    pixField('62', pixField('05', '***')) +
    '6304';

  return payload + crc16(payload);
}

function gerarQRCode() {
  const container = document.getElementById('qrcode-container');
  container.innerHTML = '';
  const total = totalComDesconto();

  new QRCode(container, {
    text: gerarPayloadPix(total),
    width: 200, height: 200,
    colorDark: '#3d1f1f', colorLight: '#fff5f0',
    correctLevel: QRCode.CorrectLevel.M
  });

  const valorEl = document.getElementById('pix-valor');
  if (valorEl) valorEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function calcularTroco() {
  const total    = totalComDesconto();
  const recebido = parseFloat(document.getElementById('valor-recebido').value) || 0;
  const trocoEl  = document.getElementById('troco-valor');

  if (formaPagamento === 'Dinheiro' && recebido > 0) {
    const troco         = recebido - total;
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
    id: Date.now(), data, hora,
    itens: pedido.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })),
    subtotal, desconto: valorDesc, total, formaPagamento,
    recebido: formaPagamento === 'Dinheiro' ? recebido : null,
    troco:    formaPagamento === 'Dinheiro' ? recebido - total : null,
  };

  salvarVenda(venda);

  const linhas        = pedido.map(i => `<strong>${i.qtd}x ${i.nome}</strong> — R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')}`).join('<br>');
  const descontoTexto = valorDesc > 0 ? `<br>Desconto: − R$ ${valorDesc.toFixed(2).replace('.', ',')}` : '';
  const extra         = formaPagamento === 'Dinheiro'
    ? `<br>Recebido: R$ ${recebido.toFixed(2).replace('.', ',')}<br>Troco: R$ ${(recebido - total).toFixed(2).replace('.', ',')}`
    : '';

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
  pedido = []; formaPagamento = ''; desconto = 0; tipoDesconto = 'reais';
  localStorage.removeItem('pedido_atual');
  localStorage.removeItem('forma_pagamento');
  localStorage.removeItem('desconto');
  localStorage.removeItem('tipo_desconto');
  document.querySelectorAll('.forma-btn').forEach(b => b.classList.remove('ativo'));
  document.getElementById('troco-section').style.display = 'none';
  document.getElementById('pix-section').style.display   = 'none';
  document.getElementById('valor-recebido').value         = '';
  document.getElementById('input-desconto').value         = '';
  pararTimerPix();
  alterarTipoDesconto('reais');
  renderPedido();
}

// =====================
//  TABS MOBILE
// =====================
function mostrarTab(tab) {
  const cardapio = document.getElementById('secao-cardapio');
  const caixa    = document.getElementById('secao-caixa');
  const btnC     = document.getElementById('tab-cardapio');
  const btnP     = document.getElementById('tab-caixa');
  if (tab === 'cardapio') {
    cardapio.classList.remove('oculto'); caixa.classList.add('oculto');
    btnC.classList.add('ativo');         btnP.classList.remove('ativo');
  } else {
    caixa.classList.remove('oculto');    cardapio.classList.add('oculto');
    btnP.classList.add('ativo');         btnC.classList.remove('ativo');
  }
}

function ajustarLayout() {
  const cardapio = document.getElementById('secao-cardapio');
  const caixa    = document.getElementById('secao-caixa');
  if (window.innerWidth > 768) {
    cardapio.classList.remove('oculto');
    caixa.classList.remove('oculto');
  } else {
    const tabAtiva = document.querySelector('.tab-btn.ativo')?.id;
    tabAtiva === 'tab-caixa' ? mostrarTab('caixa') : mostrarTab('cardapio');
  }
}

window.addEventListener('resize', ajustarLayout);

// =====================
//  INIT
// =====================
renderCardapio();
renderPedido();
ajustarLayout();
atualizarBadgeTab();

// Restaurar forma de pagamento
if (formaPagamento) {
  document.querySelectorAll('.forma-btn').forEach(b => {
    if (b.getAttribute('onclick')?.includes(formaPagamento)) b.classList.add('ativo');
  });
  if (formaPagamento === 'Dinheiro') document.getElementById('troco-section').style.display = 'block';
  if (formaPagamento === 'Pix')      document.getElementById('pix-section').style.display   = 'block';
  atualizarBotao();
}

// Restaurar desconto salvo
if (desconto > 0) {
  document.getElementById('input-desconto').value = desconto;
  alterarTipoDesconto(tipoDesconto);
  atualizarResumo();
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/docelar-sistema_pdv/sw.js')
      .then(() => console.log('✅ Service Worker registrado'))
      .catch(err => console.log('❌ SW erro:', err));
  });
}
