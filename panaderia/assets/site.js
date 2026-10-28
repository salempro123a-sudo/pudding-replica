(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const products = JSON.parse($('#product-data').textContent);
  const items = Object.fromEntries(products.map((product) => [product.id, product]));
  const cartKey = 'punto-de-masa-pedido-v1';
  const storeKey = 'punto-de-masa-tienda-v1';
  const stores = ['Centro Histórico', 'Wanchaq'];
  const catalogURL = $('#navigation a[href$="del-horno/"]').href;
  const money = (amount) => 'S/ ' + amount.toFixed(2);
  let cart = {};
  let selectedStore = stores[0];
  let toastTimer;
  let lastFocus;

  function readSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || '{}');
      const restored = {};
      for (const id of Object.keys(items)) {
        if (Number.isInteger(saved?.[id]) && saved[id] > 0) {
          restored[id] = Math.min(saved[id], 99);
        }
      }
      cart = restored;
      const store = localStorage.getItem(storeKey);
      if (stores.includes(store)) selectedStore = store;
    } catch {
      // Shopping remains usable when persistent storage is unavailable.
    }
  }

  function save() {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      localStorage.setItem(storeKey, selectedStore);
    } catch {
      // Retain the current page's selection in memory.
    }
  }

  function notify(message) {
    if ($('#cart').open) {
      $('#cart-message').textContent = message;
      return;
    }
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000);
  }

  function updateStore() {
    $('#shop-select').value = selectedStore;
    $$('[data-choose-store]').forEach((button) => {
      const selected = button.dataset.chooseStore === selectedStore;
      button.setAttribute('aria-pressed', String(selected));
      button.firstChild.textContent = selected ? 'Tu tienda elegida ' : 'Elegir esta tienda ';
    });
    $$('[data-store-status]').forEach((status) => {
      status.textContent = status.dataset.storeStatus === selectedStore
        ? 'Esta tienda acompañará tu lista de compra.' : '';
    });
  }

  function renderCart() {
    const entries = Object.entries(cart);
    const count = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
    $('#cart-count').textContent = count;
    $('#open-cart').setAttribute('aria-label', `Abrir mi pedido, ${count} ${count === 1 ? 'producto' : 'productos'}`);
    $('#cart-total').textContent = money(entries.reduce((sum, [id, quantity]) => sum + items[id].price * quantity, 0));
    $('#download-order').disabled = entries.length === 0;
    const container = $('#cart-items');
    container.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      const title = document.createElement('span');
      title.textContent = 'Un buen comienzo.';
      const text = document.createElement('p');
      text.textContent = 'Tu pedido está esperando un poco de pan.';
      const link = document.createElement('a');
      link.className = 'text-link';
      link.href = catalogURL;
      link.textContent = 'Explorar el horno →';
      empty.append(title, text, link);
      container.append(empty);
    }
    for (const [id, quantity] of entries) {
      const product = items[id];
      const row = document.createElement('div');
      row.className = 'cart-row';
      const body = document.createElement('div');
      const heading = document.createElement('h3');
      heading.textContent = product.name;
      const unit = document.createElement('small');
      unit.textContent = `${money(product.price)} por unidad`;
      const controls = document.createElement('div');
      controls.className = 'quantity';
      for (const delta of [-1, 1]) {
        if (delta === 1) {
          const value = document.createElement('span');
          value.textContent = quantity;
          value.setAttribute('aria-label', `${quantity} unidades`);
          controls.append(value);
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.change = id;
        button.dataset.delta = delta;
        button.textContent = delta === 1 ? '+' : '−';
        button.disabled = delta === 1 && quantity >= 99;
        button.setAttribute('aria-label', `${delta === 1 ? 'Añadir' : 'Quitar'} una unidad de ${product.name}`);
        controls.append(button);
      }
      body.append(heading, unit, controls);
      const amount = document.createElement('span');
      amount.className = 'cart-price';
      amount.textContent = money(product.price * quantity);
      row.append(body, amount);
      container.append(row);
    }
    updateStore();
  }

  function addProduct(id, quantity = 1) {
    if (!items[id]) return;
    const available = 99 - (cart[id] || 0);
    if (available === 0) {
      notify('Puedes añadir hasta 99 unidades de cada producto.');
      return;
    }
    const added = Math.min(quantity, available);
    cart[id] = (cart[id] || 0) + added;
    save();
    renderCart();
    notify(`${added === 1 ? items[id].name : `${added} unidades de ${items[id].name}`} en tu pedido.${added < quantity ? ' El máximo es de 99 unidades.' : ''}`);
  }

  function closeMenu() {
    $('#navigation').classList.remove('open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
    $('#menu-toggle').setAttribute('aria-label', 'Abrir menú');
  }

  $('#open-cart').addEventListener('click', () => {
    closeMenu();
    lastFocus = document.activeElement;
    readSaved();
    renderCart();
    $('#cart-message').textContent = '';
    $('#cart').showModal();
    document.body.classList.add('locked');
  });
  $('#close-cart').addEventListener('click', () => $('#cart').close());
  $('#cart').addEventListener('close', () => {
    document.body.classList.remove('locked');
    lastFocus?.focus();
  });
  $('#cart').addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...$('#cart').querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled)')]
      .filter((element) => element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  $('#cart').addEventListener('click', (event) => {
    const box = $('#cart').getBoundingClientRect();
    if (event.target === $('#cart') && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) {
      $('#cart').close();
    }
  });
  $$('[data-add]').forEach((button) => button.addEventListener('click', () => addProduct(button.dataset.add)));
  $('#cart-items').addEventListener('click', (event) => {
    const button = event.target.closest('[data-change]');
    if (!button) return;
    const {change: id, delta} = button.dataset;
    const quantity = Math.max(0, Math.min(99, (cart[id] || 0) + Number(delta)));
    if (quantity) cart[id] = quantity;
    else delete cart[id];
    save();
    renderCart();
    const replacement = $(`#cart-items [data-change="${id}"][data-delta="${delta}"]:not(:disabled)`)
      || $(`#cart-items [data-change="${id}"]:not(:disabled)`) || $('#close-cart');
    replacement.focus();
  });
  $('#shop-select').addEventListener('change', () => {
    selectedStore = $('#shop-select').value;
    save();
    updateStore();
  });
  $$('[data-choose-store]').forEach((button) => button.addEventListener('click', () => {
    selectedStore = button.dataset.chooseStore;
    save();
    updateStore();
    notify(`${selectedStore} es ahora tu tienda elegida.`);
  }));

  $('#download-order').addEventListener('click', () => {
    const entries = Object.entries(cart);
    if (!entries.length) return;
    const total = entries.reduce((sum, [id, quantity]) => sum + items[id].price * quantity, 0);
    const text = [
      'PUNTO DE MASA', 'Panadería en Cusco', 'Mi selección',
      `Tienda: ${selectedStore}`, '',
      ...entries.map(([id, quantity]) => `${quantity} × ${items[id].name} — ${money(items[id].price * quantity)}`),
      '', `TOTAL: ${money(total)}`, '', 'Presenta esta selección en tienda.',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mi-pedido-punto-de-masa.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Tu lista se descargó. Nos vemos en tienda.');
  });

  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#menu-toggle').getAttribute('aria-expanded') !== 'true';
    $('#navigation').classList.toggle('open', open);
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
    $('#menu-toggle').setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $('#navigation').classList.contains('open')) {
      closeMenu();
      $('#menu-toggle').focus();
    }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);

  const search = $('#product-search');
  if (search) {
    const params = new URLSearchParams(location.search);
    let category = ['panes', 'dulces'].includes(params.get('categoria')) ? params.get('categoria') : 'all';
    search.value = (params.get('buscar') || '').slice(0, 80);
    const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
    function filterProducts(updateURL = true) {
      const query = normalize(search.value.trim());
      let count = 0;
      $$('.catalog-page .product').forEach((product) => {
        product.hidden = !((category === 'all' || product.dataset.category === category) && normalize(product.dataset.search).includes(query));
        if (!product.hidden) count++;
      });
      $$('[data-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
      $('#result-count').textContent = `${count} ${count === 1 ? 'producto' : 'productos'} en el horno`;
      $('#no-results').hidden = count > 0;
      $('#clear-search').hidden = search.value.length === 0;
      if (updateURL) {
        const url = new URL(location.href);
        if (category === 'all') url.searchParams.delete('categoria');
        else url.searchParams.set('categoria', category);
        if (!search.value.trim()) url.searchParams.delete('buscar');
        else url.searchParams.set('buscar', search.value.trim());
        history.replaceState(null, '', url);
      }
    }
    $$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      category = button.dataset.filter;
      filterProducts();
    }));
    search.addEventListener('input', () => filterProducts());
    $('#clear-search').addEventListener('click', () => {
      search.value = '';
      filterProducts();
      search.focus();
    });
    $('#reset-filters').addEventListener('click', () => {
      search.value = '';
      category = 'all';
      filterProducts();
      $('[data-filter="all"]').focus();
    });
    filterProducts(false);
  }

  const orderForm = $('.product-order');
  if (orderForm) {
    const input = $('#detail-quantity');
    const validateQuantity = () => Math.max(1, Math.min(99, Math.floor(Number(input.value) || 1)));
    $$('[data-detail-delta]').forEach((button) => button.addEventListener('click', () => {
      input.value = Math.max(1, Math.min(99, validateQuantity() + Number(button.dataset.detailDelta)));
    }));
    input.addEventListener('change', () => { input.value = validateQuantity(); });
    orderForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!orderForm.reportValidity()) return;
      addProduct(orderForm.dataset.product, validateQuantity());
    });
  }

  window.addEventListener('storage', (event) => {
    if ([cartKey, storeKey, null].includes(event.key)) { readSaved(); renderCart(); }
  });
  window.addEventListener('pageshow', () => { readSaved(); renderCart(); });
  $('#year').textContent = new Date().getFullYear();
  readSaved();
  renderCart();
})();
