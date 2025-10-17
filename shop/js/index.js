document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. THEME TOGGLE LOGIC ---
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle-button');
    const THEME_KEY = 'artisanTheme';
    
    /**
     * Sets the theme based on the class name ('light-theme' or '').
     * Updates local storage and the button text/emoji.
     * @param {string} theme - The theme to apply ('light-theme' or 'dark').
     */
    function setTheme(theme) {
        if (theme === 'light-theme') {
            body.classList.add('light-theme');
            // Show Moon (🌙) to suggest switching to Dark Theme
            toggleButton.textContent = '🌙'; 
            localStorage.setItem(THEME_KEY, 'light');
        } else {
            body.classList.remove('light-theme');
            // Show Sun (☀️) to suggest switching to Light Theme
            toggleButton.textContent = '☀️'; 
            localStorage.setItem(THEME_KEY, 'dark');
        }
    }

    /**
     * Initializes the theme on page load. Light theme is the default.
     */
    function initializeTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        
        if (savedTheme === 'dark') {
            // User chose dark theme in a previous session
            setTheme('dark');
        } else {
            // User chose light theme, or no preference saved (default to light)
            setTheme('light-theme'); 
        }
    }
    
    // Add event listener to the button
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const currentTheme = body.classList.contains('light-theme') ? 'light-theme' : 'dark';
            // Toggle the theme
            const newTheme = currentTheme === 'dark' ? 'light-theme' : 'dark';
            setTheme(newTheme);
        });
    }

    // Initialize the theme immediately
    initializeTheme();
    

    // --- 2. SHOPPING CART LOGIC ---
    let cart = JSON.parse(localStorage.getItem('artisanCart')) || {};
    
    const productContainer = document.getElementById('products-container');
    const cartList = document.getElementById('cart-items-list');
    const subtotalDisplay = document.getElementById('cart-subtotal');
    const grandTotalDisplay = document.getElementById('cart-grand-total');
    const checkoutButton = document.getElementById('proceed-to-checkout');

    /**
     * Saves the current cart state to LocalStorage.
     */
    function saveCart() {
        localStorage.setItem('artisanCart', JSON.stringify(cart));
    }

    /**
     * Updates the quantity of a specific product in the cart.
     * @param {string} productId - The ID of the product.
     * @param {string} action - 'increment' or 'decrement'.
     */
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
    
    /**
     * Calculates the total cost of items in the cart.
     */
    function calculateTotal() {
        let subtotal = 0;
        for (const id in cart) {
            subtotal += cart[id].price * cart[id].quantity;
        }
        return { subtotal, grandTotal: subtotal };
    }

    /**
     * Renders the cart contents and totals to the review section.
     */
    function renderCart() {
        const { subtotal, grandTotal } = calculateTotal();
        const itemCount = Object.keys(cart).length;

        subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
        grandTotalDisplay.textContent = `$${grandTotal.toFixed(2)}`;
        
        if (itemCount > 0) {
            checkoutButton.classList.remove('disabled');
            checkoutButton.textContent = `Finalize Order & Checkout ($${grandTotal.toFixed(2)})`;
        } else {
            checkoutButton.classList.add('disabled');
            checkoutButton.textContent = 'Finalize Order & Checkout';
        }

        cartList.innerHTML = '';
        if (itemCount === 0) {
            cartList.innerHTML = '<li style="color: var(--text-secondary); padding: 10px 0;">Your cart is empty.</li>';
        } else {
            for (const id in cart) {
                const item = cart[id];
                const total = (item.price * item.quantity).toFixed(2);
                const li = document.createElement('li');
                li.className = 'cart-item';
                li.innerHTML = `
                    <span class="item-details">${item.quantity}x ${item.name} ($${item.price.toFixed(2)} ea.)</span>
                    <span class="item-actions">
                        <span class="item-total">$${total}</span>
                        <button class="remove-one" data-id="${id}" data-action="decrement">–</button>
                        <button class="remove-all" data-id="${id}">Remove All</button>
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

    /**
     * Resets a product card to show the initial 'Add to Cart' button.
     * @param {HTMLElement} card - The product card element.
     */
    function resetProductCardDisplay(card) {
        card.querySelector('.add-to-cart-initial').style.display = 'block';
        card.querySelector('.product-quantity-control').style.display = 'none';
        card.querySelector('.product-quantity').textContent = '';
        card.querySelector('.product-quantity').dataset.quantity = '0';
    }

    /**
     * Updates a product card to show the quantity control.
     * @param {HTMLElement} card - The product card element.
     * @param {number} quantity - The current quantity.
     */
    function updateProductCardDisplay(card, quantity) {
        card.querySelector('.add-to-cart-initial').style.display = 'none';
        card.querySelector('.product-quantity-control').style.display = 'flex';
        card.querySelector('.product-quantity').textContent = quantity;
        card.querySelector('.product-quantity').dataset.quantity = quantity;
    }

    /**
     * Iterates over all product cards to set their display based on the current cart state.
     */
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

    // --- 3. EVENT LISTENERS FOR PRODUCT CARDS ---
    
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
    
    // --- 4. INITIALIZATION ---
    updateAllProductCardDisplays();
    renderCart();
});
