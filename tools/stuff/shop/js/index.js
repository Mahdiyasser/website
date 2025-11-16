document.addEventListener('DOMContentLoaded', () => {
    
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle-button');
    const THEME_KEY = 'artisanTheme';
    
    function setTheme(theme) {
        if (theme === 'light-theme') {
            body.classList.add('light-theme');
            toggleButton.textContent = '🌙'; 
            localStorage.setItem(THEME_KEY, 'light');
        } else {
            body.classList.remove('light-theme');
            toggleButton.textContent = '☀️'; 
            localStorage.setItem(THEME_KEY, 'dark');
        }
    }

    function initializeTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        
        if (savedTheme === 'dark') {
            setTheme('dark');
        } else {
            setTheme('light-theme'); 
        }
    }
    
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const currentTheme = body.classList.contains('light-theme') ? 'light-theme' : 'dark';
            const newTheme = currentTheme === 'dark' ? 'light-theme' : 'dark';
            setTheme(newTheme);
        });
    }

    initializeTheme();
    

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
        let productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        
        if (!productCard) return;

        const name = productCard.dataset.name;
        const price = parseFloat(productCard.dataset.price);

        if (!cart[productId]) {
            cart[productId] = { name, price, quantity: 0 };
        }

        if (action === 'increment') {
            cart[productId].quantity += 1;
        } else if (action === 'decrement' && cart[productId].quantity > 0) {
            cart[productId].quantity -= 1;
        }

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
        for (const id in cart) {
            subtotal += cart[id].price * cart[id].quantity;
        }
        return { subtotal, grandTotal: subtotal };
    }

    function renderCart() {
        const { subtotal, grandTotal } = calculateTotal();
        const itemCount = Object.keys(cart).length;

        subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
        grandTotalDisplay.textContent = `$${grandTotal.toFixed(2)}`;
        
        if (itemCount > 0) {
            checkoutButton.classList.remove('disabled');
            checkoutButton.textContent = `إتمام الطلب والدفع ($${grandTotal.toFixed(2)})`;
        } else {
            checkoutButton.classList.add('disabled');
            checkoutButton.textContent = 'إتمام الطلب والدفع';
        }

        cartList.innerHTML = '';
        if (itemCount === 0) {
            cartList.innerHTML = '<li style="color: var(--text-secondary); padding: 10px 0;">مفيش أي منتجات في السلة.</li>';
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
        
        updateAllProductCardDisplays();
        
        document.querySelectorAll('.item-actions button[data-action="decrement"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                updateCart(productId, 'decrement');
            });
        });

        document.querySelectorAll('.item-actions button.remove-all').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                if(cart[productId]) {
                    delete cart[productId];
                    saveCart();
                    renderCart();
                }
            });
        });
    }

    function resetProductCardDisplay(card) {
        card.querySelector('.add-to-cart-initial').style.display = 'block';
        card.querySelector('.product-quantity-control').style.display = 'none';
        card.querySelector('.product-quantity').textContent = '';
        card.querySelector('.product-quantity').dataset.quantity = '0';
    }

    function updateProductCardDisplay(card, quantity) {
        card.querySelector('.add-to-cart-initial').style.display = 'none';
        card.querySelector('.product-quantity-control').style.display = 'flex';
        card.querySelector('.product-quantity').textContent = quantity;
        card.querySelector('.product-quantity').dataset.quantity = quantity;
    }

    function updateAllProductCardDisplays() {
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.dataset.productId;
            if (cart[productId] && cart[productId].quantity > 0) {
                updateProductCardDisplay(card, cart[productId].quantity);
            } else {
                resetProductCardDisplay(card);
            }
        });
    }

    
    if (productContainer) {
        productContainer.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            
            if (button) {
                const action = button.dataset.action;
                const productCard = e.target.closest('.product-card');
                const productId = productCard ? productCard.dataset.productId : null;

                if (productId && (action === 'increment' || action === 'decrement')) {
                    updateCart(productId, action);
                }
            }
        });
    }
    
    updateAllProductCardDisplays();
    renderCart();
});
