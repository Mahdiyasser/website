const CART_STORAGE_KEY = 'almolook_cart';
const THEME_STORAGE_KEY = 'almolook_theme';
const WHATSAPP_NUMBER = '201116541993'; // WhatsApp receiver

const orderItemsEl = document.getElementById('order-items');
const summarySubtotalEl = document.getElementById('summary-subtotal');
const summaryTotalEl = document.getElementById('summary-total');
const themeToggleBtn = document.getElementById('checkout-theme-toggle');
const confirmOrderBtn = document.getElementById('confirm-order-btn');
const directOrderBtn = document.getElementById('direct-order-btn');
const checkoutForm = document.getElementById('checkout-form');
const body = document.body;

let cart = {};
const DELIVERY_FEE = 10.0;

// === Theme Logic ===
function saveThemePreference(theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}
function loadThemePreference() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark') {
        body.classList.add('dark-theme');
        themeToggleBtn.querySelector('i').className = 'fas fa-sun';
    } else {
        body.classList.remove('dark-theme');
        themeToggleBtn.querySelector('i').className = 'fas fa-moon';
    }
}
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDark = body.classList.toggle('dark-theme');
        themeToggleBtn.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        saveThemePreference(isDark ? 'dark' : 'light');
    });
}

// === Cart Handling ===
function loadCart() {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        cart = stored ? JSON.parse(stored) : {};
    } catch {
        cart = {};
    }
}
function renderOrderSummary() {
    orderItemsEl.innerHTML = '';
    let subtotal = 0;
    const keys = Object.keys(cart);
    if (keys.length === 0) {
        orderItemsEl.innerHTML = `<p class="empty-cart-message">السلة فارغة. يرجى العودة إلى القائمة.</p>`;
        confirmOrderBtn.disabled = true;
        summarySubtotalEl.textContent = '0.00';
        summaryTotalEl.textContent = '0.00';
        return;
    }
    confirmOrderBtn.disabled = false;
    for (const k of keys) {
        const item = cart[k];
        const total = item.price * item.quantity;
        subtotal += total;
        const size = item.productSize ? `(${item.productSize})` : '';
        orderItemsEl.innerHTML += `
            <div class="order-item">
                <div class="item-details">
                    <span class="item-name">${item.name} ${size}</span>
                    <span class="item-quantity">× ${item.quantity}</span>
                </div>
                <span class="item-price">${total.toFixed(2)} <span class="currency">ج.م</span></span>
            </div>`;
    }
    const final = subtotal + DELIVERY_FEE;
    summarySubtotalEl.textContent = subtotal.toFixed(2);
    summaryTotalEl.textContent = final.toFixed(2);
}

// === Serial Number Generator ===
function generateSerialNumber() {
    const prefix = "MLOOK";
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = "";
    for (let i = 0; i < 10; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    const time = (Date.now() ^ Math.floor(Math.random() * 0xFFFFFF)).toString(36).toUpperCase().slice(-4);
    return `${prefix}-${rand}-${time}`;
}

// === WhatsApp Message Generator ===
function generateWhatsAppMessage(orderData, serialNumber) {
    let summary = '', subtotal = 0, i = 1;
    for (const key in cart) {
        const item = cart[key];
        const total = item.price * item.quantity;
        subtotal += total;
        const size = item.productSize ? `(${item.productSize})` : '';
        summary += `*${i}-* ${item.name} ${size} ×${item.quantity} = ${total.toFixed(2)} ج.م\n`;
        i++;
    }
    const final = subtotal + DELIVERY_FEE;
    const payment = {
        cash: 'الدفع عند الاستلام 🤝',
        'e-wallet': 'ادفع من علي محفظة الكترونية 📱',
        instapay: 'الدفع عبر انستاباي 💳'
    }[orderData.paymentMethod] || 'الدفع عند الاستلام 🤝';
    return encodeURIComponent(`
*🔔 طلب جديد - قنبلة الملوك*
*رقم الطلب:* ${serialNumber}
---------------------------
*👤 الاسم:* ${orderData.name}
*📞 الهاتف:* ${orderData.phone}
*📍 العنوان:* ${orderData.address}
*📝 ملاحظات:* ${orderData.notes || 'لا يوجد ملاحظات.'}
---------------------------
${summary.trim()}
*💵 الإجمالي:* ${(subtotal).toFixed(2)} + ${DELIVERY_FEE.toFixed(2)} = ${final.toFixed(2)} ج.م
*طريقة الدفع:* ${payment}
    `);
}

// === Handle WhatsApp Checkout ===
async function handleCheckout(event) {
    event.preventDefault();
    if (Object.keys(cart).length === 0) return alert('السلة فارغة!');
    const form = new FormData(checkoutForm);
    const orderData = {
        name: form.get('name'),
        phone: form.get('phone'),
        address: form.get('address'),
        notes: form.get('notes'),
        paymentMethod: form.get('payment-method')
    };
    if (!orderData.name || !orderData.phone || !orderData.address) return alert('أكمل الحقول الإلزامية!');
    const serial = generateSerialNumber();
    const message = generateWhatsAppMessage(orderData, serial);
    localStorage.removeItem(CART_STORAGE_KEY);
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${message}`, '_blank');
    setTimeout(() => window.location.href = '../index.html', 1500);
}


// === Init ===
function initCheckout() {
    loadThemePreference();
    loadCart();
    renderOrderSummary();
    checkoutForm.addEventListener('submit', handleCheckout);
    directOrderBtn.addEventListener('click', handleDirectOrder);
}
initCheckout();

