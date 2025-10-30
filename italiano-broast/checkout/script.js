const CART_STORAGE_KEY = 'italiano_cart';
const THEME_STORAGE_KEY = 'italiano_theme';
// Target WhatsApp number for receiving orders
const WHATSAPP_NUMBER = '201010702323'; 

const orderItemsEl = document.getElementById('order-items');
const summarySubtotalEl = document.getElementById('summary-subtotal');
const summaryTotalEl = document.getElementById('summary-total');
const themeToggleBtn = document.getElementById('checkout-theme-toggle');
const confirmOrderBtn = document.getElementById('confirm-order-btn');
const body = document.body;
const checkoutForm = document.getElementById('checkout-form');

let cart = {};
const DELIVERY_FEE = 10.00; // Fixed delivery fee (10 EGP)

// --- Theme Synchronization Logic ---
function saveThemePreference(theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        if (themeToggleBtn) {
            themeToggleBtn.querySelector('i').className = 'fas fa-sun';
        }
    } else {
        body.classList.remove('dark-theme');
        if (themeToggleBtn) {
            themeToggleBtn.querySelector('i').className = 'fas fa-moon';
        }
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDark = body.classList.toggle('dark-theme');

        if (isDark) {
            themeToggleBtn.querySelector('i').className = 'fas fa-sun';
            saveThemePreference('dark');
        } else {
            themeToggleBtn.querySelector('i').className = 'fas fa-moon';
            saveThemePreference('light');
        }
    });
}

// --- Cart/Order Logic ---

function loadCart() {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        cart = storedCart ? JSON.parse(storedCart) : {};
    } catch (error) {
        cart = {};
    }
}

function renderOrderSummary() {
    let subtotal = 0;
    orderItemsEl.innerHTML = '';
    
    const cartKeys = Object.keys(cart);
    
    if (cartKeys.length === 0) {
        orderItemsEl.innerHTML = `<p class="empty-cart-message">السلة فارغة. يرجى العودة إلى القائمة.</p>`;
        confirmOrderBtn.disabled = true;
        summarySubtotalEl.textContent = '0.00';
        summaryTotalEl.textContent = '0.00';
        return;
    }
    
    confirmOrderBtn.disabled = false;

    for (const key of cartKeys) {
        const item = cart[key];
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        // FIX: Display size conditionally. Only show parentheses if item.productSize is not empty.
        const productSizeDisplay = item.productSize ? `(${item.productSize})` : '';

        const itemEl = document.createElement('div');
        itemEl.className = 'order-item';
        itemEl.innerHTML = `
            <div class="item-details">
                <span class="item-name">${item.name} ${productSizeDisplay}</span>
                <span class="item-quantity">× ${item.quantity}</span>
            </div>
            <span class="item-price">${itemTotal.toFixed(2)} <span class="currency">ج.م</span></span>
        `;
        orderItemsEl.appendChild(itemEl);
    }
    
    const finalTotal = subtotal + DELIVERY_FEE;
    
    summarySubtotalEl.textContent = subtotal.toFixed(2);
    summaryTotalEl.textContent = finalTotal.toFixed(2);
}

function generateWhatsAppMessage(orderData) {
    let orderSummary = '';
    let subtotal = 0;
    let itemIndex = 1;

    for (const key in cart) {
        const item = cart[key];
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        // Show size only if available
        const sizeText = item.productSize ? `(${item.productSize})` : '';

        // Format: 1- بيتزا (صغير) ×1 = 50.00 ج.م
        orderSummary += `*${itemIndex}-* ${item.name} ${sizeText} ×${item.quantity} = ${itemTotal.toFixed(2)} ج.م\n`;
        itemIndex++;
    }

    const finalTotal = subtotal + DELIVERY_FEE;

    const message = `
*🔔 طلب توصيل جديد - ايطاليانو 🍕*
*---------------------------*

*📝 بيانات العميل:*
*الاسم:* ${orderData.name}
*الهاتف:* ${orderData.phone}
*العنوان:* ${orderData.address}
*ملاحظات:* ${orderData.notes && orderData.notes.trim() !== '' ? orderData.notes : 'لا يوجد ملاحظات إضافية.'}

*🛒 ملخص الطلب:*
${orderSummary.trim()}

*💵 الإجمالي المطلوب:*
إجمالي المنتجات: ${subtotal.toFixed(2)} ج.م
رسوم التوصيل: ${DELIVERY_FEE.toFixed(2)} ج.م 🛵
*المبلغ النهائي: ${finalTotal.toFixed(2)} ج.م*

*طريقة الدفع:* الدفع عند الاستلام 🤝
*---------------------------*
*يرجى تأكيد الطلب للعميل، شكراً.*
    `.trim();

    return encodeURIComponent(message);
}





function handleCheckout(event) {
    event.preventDefault();
    
    if (Object.keys(cart).length === 0) {
        alert('عربة التسوق فارغة. لا يمكن إرسال طلب خالٍ.'); 
        return;
    }

    const formData = new FormData(checkoutForm);
    const orderData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        notes: formData.get('notes')
    };
    
    // Arabic validation check
    if (!orderData.name || !orderData.phone || !orderData.address) {
        alert('الرجاء إكمال جميع الحقول الإلزامية (الاسم، رقم الهاتف، العنوان) قبل إرسال الطلب.'); 
        return;
    }
    
    const whatsappMessage = generateWhatsAppMessage(orderData);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${whatsappMessage}`;
    
    // Clear cart upon submission/redirect
    localStorage.removeItem(CART_STORAGE_KEY);
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Redirect user back to the home page after a short delay
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1500);
}

function initCheckout() {
    loadThemePreference(); 
    loadCart();
    renderOrderSummary();
    
    // Attach event listener to the form submission
    checkoutForm.addEventListener('submit', handleCheckout);
}

initCheckout();
