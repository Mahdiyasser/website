document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // Theme
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const THEME_KEY = 'artisanTheme';

    function setTheme(theme) {
        if (theme === 'light-theme') {
            body.classList.add('light-theme');
            if (themeToggleButton) themeToggleButton.textContent = '⚫';
            localStorage.setItem(THEME_KEY, 'light');
        } else {
            body.classList.remove('light-theme');
            if (themeToggleButton) themeToggleButton.textContent = '⚪';
            localStorage.setItem(THEME_KEY, 'dark');
        }
    }

    function initializeTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark') setTheme('dark');
        else setTheme('light-theme');
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = body.classList.contains('light-theme') ? 'light-theme' : 'dark';
            const newTheme = currentTheme === 'dark' ? 'light-theme' : 'dark';
            setTheme(newTheme);
        });
    }

    initializeTheme();

    // Cart
    let cart = JSON.parse(localStorage.getItem('artisanCart')) || {};
    const productContainer = document.getElementById('products-container');
    const cartList = document.getElementById('cart-items-list');
    const subtotalDisplay = document.getElementById('cart-subtotal');
    const grandTotalDisplay = document.getElementById('cart-grand-total');
    const checkoutButton = document.getElementById('proceed-to-checkout');

    function saveCart() {
        localStorage.setItem('artisanCart', JSON.stringify(cart));
    }

    function updateCart(productId, action) {
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!productCard) return;
        const name = productCard.dataset.name;
        const price = parseFloat(productCard.dataset.price);
        if (!cart[productId]) cart[productId] = { name, price, quantity: 0 };
        if (action === 'increment') cart[productId].quantity += 1;
        else if (action === 'decrement' && cart[productId].quantity > 0) cart[productId].quantity -= 1;
        if (cart[productId].quantity <= 0) {
            delete cart[productId];
            resetProductCardDisplay(productCard);
        } else {
            updateProductCardDisplay(productCard, cart[productId].quantity);
        }
        saveCart();
        renderCart();
    }

    function calculateTotal() {
        let subtotal = 0;
        for (const id in cart) subtotal += cart[id].price * cart[id].quantity;
        return { subtotal, grandTotal: subtotal };
    }

    function renderCart() {
        if (subtotalDisplay) {
            const { subtotal, grandTotal } = calculateTotal();
            subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
            grandTotalDisplay && (grandTotalDisplay.textContent = `$${grandTotal.toFixed(2)}`);
            const itemCount = Object.keys(cart).length;
            if (checkoutButton) {
                if (itemCount > 0) {
                    checkoutButton.classList.remove('disabled');
                    checkoutButton.textContent = `إتمام الطلب والدفع ($${grandTotal.toFixed(2)})`;
                } else {
                    checkoutButton.classList.add('disabled');
                    checkoutButton.textContent = 'إتمام الطلب والدفع';
                }
            }
        }

        if (cartList) {
            cartList.innerHTML = '';
            const itemCount = Object.keys(cart).length;
            if (itemCount === 0) {
                cartList.innerHTML = '<li style="color: var(--text-secondary); padding: 10px 0;">مفيش أي اكل في السلة.</li>';
            } else {
                for (const id in cart) {
                    const item = cart[id];
                    const total = (item.price * item.quantity).toFixed(2);
                    const li = document.createElement('li');
                    li.className = 'cart-item';
                    li.innerHTML = `
                        <span class="item-details">${item.quantity}x ${item.name} (سعر القطعة $${item.price.toFixed(2)})</span>
                        <span class="item-actions">
                            <span class="item-total">$${total}</span>
                            <button class="remove-one" data-id="${id}" data-action="decrement">–</button>
                            <button class="remove-all" data-id="${id}">شيل الكل</button>
                        </span>
                    `;
                    cartList.appendChild(li);
                }
            }

            cartList.querySelectorAll('button[data-action="decrement"]').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = e.currentTarget.dataset.id;
                    updateCart(productId, 'decrement');
                });
            });

            cartList.querySelectorAll('button.remove-all').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = e.currentTarget.dataset.id;
                    if (cart[productId]) {
                        delete cart[productId];
                        saveCart();
                        renderCart();
                    }
                });
            });
        }

        updateAllProductCardDisplays();
    }

    function resetProductCardDisplay(card) {
        const a = card.querySelector('.add-to-cart-initial');
        const b = card.querySelector('.product-quantity-control');
        const q = card.querySelector('.product-quantity');
        if (a) a.style.display = 'block';
        if (b) b.style.display = 'none';
        if (q) { q.textContent = ''; q.dataset.quantity = '0'; }
    }

    function updateProductCardDisplay(card, quantity) {
        const a = card.querySelector('.add-to-cart-initial');
        const b = card.querySelector('.product-quantity-control');
        const q = card.querySelector('.product-quantity');
        if (a) a.style.display = 'none';
        if (b) b.style.display = 'flex';
        if (q) { q.textContent = quantity; q.dataset.quantity = quantity; }
    }

    function updateAllProductCardDisplays() {
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.dataset.productId;
            if (cart[productId] && cart[productId].quantity > 0) updateProductCardDisplay(card, cart[productId].quantity);
            else resetProductCardDisplay(card);
        });
    }

    if (productContainer) {
        productContainer.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            const productCard = button.closest('.product-card');
            const productId = productCard ? productCard.dataset.productId : null;
            if (productId && (action === 'increment' || action === 'decrement')) updateCart(productId, action);
        });
    }

    updateAllProductCardDisplays();
    renderCart();

    const navToggleButton = document.getElementById('nav-toggle-button');
    const navList = document.getElementById('main-nav-ul');

    if (navToggleButton && navList) {
        navToggleButton.setAttribute('aria-expanded', 'false');

        function openNav() {
            navList.classList.add('open');
            navToggleButton.setAttribute('aria-expanded', 'true');
            body.classList.add('nav-open');
        }

        function closeNav() {
            navList.classList.remove('open');
            navToggleButton.setAttribute('aria-expanded', 'false');
            body.classList.remove('nav-open');
        }

        navToggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (navList.classList.contains('open')) closeNav();
            else openNav();
        });

        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768 && navList.classList.contains('open')) closeNav();
            });
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navList.classList.contains('open')) closeNav();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navList.classList.contains('open')) closeNav();
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && navList.classList.contains('open')) {
                if (!navList.contains(e.target) && e.target !== navToggleButton) closeNav();
            }
        });
    }

});
