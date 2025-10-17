document.addEventListener('DOMContentLoaded', () => {
    
    // --- Configuration ---
    // !!! IMPORTANT: Replace 'YOUR_PHONE_NUMBER' with the actual number (e.g., 201001234567)
    const WHATSAPP_PHONE_NUMBER = '201013297922'; // Use full international format without + or spaces
    
    // --- DOM Elements ---
    const form = document.getElementById('shipping-form');
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const addressInput = document.getElementById('customerAddress');
    
    const cartList = document.getElementById('checkout-items-list');
    const subtotalDisplay = document.getElementById('checkout-subtotal');
    const grandTotalDisplay = document.getElementById('checkout-grand-total');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const placeOrderButton = document.getElementById('place-order-whatsapp');

    let cart = JSON.parse(localStorage.getItem('artisanCart')) || {};
    let isCartEmpty = Object.keys(cart).length === 0;

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
     * Renders the cart contents and totals on the checkout page.
     */
    function renderCheckoutSummary() {
        cartList.innerHTML = '';
        const { subtotal, grandTotal } = calculateTotal();

        subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
        grandTotalDisplay.textContent = `$${grandTotal.toFixed(2)}`;
        
        if (isCartEmpty) {
            emptyCartMessage.style.display = 'block';
            placeOrderButton.disabled = true;
            placeOrderButton.textContent = 'Cart is Empty';
            return;
        }
        
        emptyCartMessage.style.display = 'none';

        for (const id in cart) {
            const item = cart[id];
            const total = (item.price * item.quantity).toFixed(2);
            const li = document.createElement('li');
            li.className = 'checkout-item';
            li.innerHTML = `
                <span class="item-name-qty">${item.quantity}x ${item.name}</span>
                <span class="item-total">$${total}</span>
            `;
            cartList.appendChild(li);
        }
        
        // Initial check for button state after rendering summary
        checkFormValidity();
    }

    /**
     * Checks if all required form fields are filled and updates the button state.
     */
    function checkFormValidity() {
        const isFormValid = nameInput.value.trim() !== '' && 
                            phoneInput.value.trim() !== '' && 
                            addressInput.value.trim() !== '';

        if (!isCartEmpty && isFormValid) {
            placeOrderButton.disabled = false;
            placeOrderButton.textContent = `Place Order via WhatsApp ($${calculateTotal().grandTotal.toFixed(2)})`;
        } else {
            placeOrderButton.disabled = true;
            placeOrderButton.textContent = 'Fill Details to Place Order';
        }
    }
    
    /**
     * Constructs and opens the WhatsApp API link with order details.
     */
    function generateWhatsAppLink() {
        if (isCartEmpty) return;

        const customerName = nameInput.value.trim();
        const customerPhone = phoneInput.value.trim();
        const customerAddress = addressInput.value.trim();
        const { grandTotal } = calculateTotal();
        
        // 1. Build the list of products for the message
        let productList = '';
        for (const id in cart) {
            const item = cart[id];
            // Uses a box emoji for list items
            productList += `\n📦 ${item.quantity}x ${item.name} ($${item.price.toFixed(2)} ea.)`;
        }

        // 2. Construct the full message body with emojis
        const orderMessage = encodeURIComponent(
            `*ORDER DETAILS*\n` +
            `\n--- 👤 Customer ---\n` +
            `Name: ${customerName}\n` +
            `📞 Phone: ${customerPhone}\n` +
            `🏠 Address: ${customerAddress}\n` +
            `\n--- 🛒 Order Items ---\n` +
            `${productList}\n` +
            `\n*💵 GRAND TOTAL: $${grandTotal.toFixed(2)}*\n` +
            `\n_Please confirm stock and finalize the order._`
        );
        
        // 3. Construct the final API URL
        const whatsappURL = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}&text=${orderMessage}`;

        // 4. Open the link 
        window.open(whatsappURL, '_blank');
    }

    // --- Event Listeners ---
    form.addEventListener('input', checkFormValidity);
    
    placeOrderButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (!placeOrderButton.disabled) {
            generateWhatsAppLink();
        }
    });

    // --- Initialization ---
    renderCheckoutSummary();
});
