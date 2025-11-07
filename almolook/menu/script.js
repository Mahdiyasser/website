const CART_STORAGE_KEY = 'almolook_cart';
// NEW: Constant for theme storage
const THEME_STORAGE_KEY = 'almolook_theme'; 
let menuData = [];
let cart = {};

const menuSectionsEl = document.getElementById('menu-sections');
const menuNavEl = document.getElementById('menu-nav');
const cartCountEl = document.getElementById('cart-count');
const cartTotalPriceEl = document.getElementById('cart-total-price');
const cartDetailsEl = document.getElementById('cart-details');
const cartItemsEl = document.getElementById('cart-items');
const finalTotalPriceEl = document.getElementById('final-total-price');
const cartSummaryEl = document.querySelector('.cart-summary');
const closeCartBtn = document.getElementById('close-cart-btn');

// NEW: Theme Toggle Elements
const themeToggleBtn = document.getElementById('menu-theme-toggle'); 
const body = document.body;

// NEW: Theme Functions for Persistence
function saveThemePreference(theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    // Apply theme on load
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        // Change icon to sun when dark theme is active
        if (themeToggleBtn) {
            themeToggleBtn.querySelector('i').className = 'fas fa-sun';
        }
    } else {
        body.classList.remove('dark-theme');
        // Change icon to moon when light theme is active
        if (themeToggleBtn) {
            themeToggleBtn.querySelector('i').className = 'fas fa-moon';
        }
    }
}


function loadCart() {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        cart = storedCart ? JSON.parse(storedCart) : {};
    } catch (error) {
        cart = {};
    }
}
function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// FIX: Size fallback logic updated to use empty string instead of 'أساسي' for single-size items.
function getProductVariant(productId, baseProduct, size) {
    // Check if the requested size matches the defined base_size (e.g., size: 'صغير' matches base_size: 'صغير')
    if (size === baseProduct.base_size) {
        return {
            id: productId,
            name: baseProduct.name,
            // FIX: Use parseFloat to ensure price is a number
            price: parseFloat(baseProduct.price) || 0,
            description: baseProduct.description,
            image: baseProduct.image,
            // Use base_size if it exists, otherwise use ''
            size: baseProduct.base_size || '' 
        };
    }
    
    const variant = baseProduct.variants.find(v => v.size === size);
    if (variant) {
        return {
            id: productId,
            name: baseProduct.name,
            // FIX: Use parseFloat to ensure price is a number
            price: parseFloat(variant.price) || 0,
            description: variant.description,
            image: variant.image,
            size: variant.size
        };
    }
    // This should rarely happen now but remains as a safety net
    return null; 
}

function getCartKey(productId, size) {
    // Size can now be an empty string, which is fine for the key: "P004_"
    return `${productId}_${size}`;
}

function addToCart(productId, size) {
    const key = getCartKey(productId, size);
    
    let baseProduct = null;
    for (const section of menuData) {
        baseProduct = section.products.find(p => p.id === productId);
        if (baseProduct) break;
    }
    
    if (!baseProduct) return;

    const item = getProductVariant(productId, baseProduct, size);

    if (!item) {
        console.error("Could not find product variant for adding to cart:", productId, size);
        return;
    }

    if (cart[key]) {
        cart[key].quantity += 1;
    } else {
        cart[key] = {
            ...item,
            cartId: key,
            quantity: 1,
            productSize: size
        };
    }
    saveCart();
    updateCartDisplay();
    updateProductButtons(key, cart[key].quantity);
}

function updateQuantity(cartId, change) {
    if (cart[cartId]) {
        cart[cartId].quantity += change;
        if (cart[cartId].quantity <= 0) {
            delete cart[cartId];
        }
    }
    saveCart();
    updateCartDisplay();
    
    const productId = cartId.split('_')[0];
    const baseProductEl = document.getElementById(`product-${productId}`);
    if (baseProductEl) {
        const size = cartId.split('_')[1];
        if (size) {
            updateProductButtons(cartId, cart[cartId] ? cart[cartId].quantity : 0);
        }
    }
}

function updateProductButtons(cartId, quantity) {
    const baseProductEl = document.querySelector(`.product-card[data-cart-key="${cartId}"]`);
    if (!baseProductEl) return;

    const actionContainer = baseProductEl.querySelector('.product-action-container');
    actionContainer.innerHTML = '';
    
    if (quantity > 0) {
        actionContainer.innerHTML = `
            <div class="quantity-control" data-cart-key="${cartId}">
                <button class="add-btn" data-action="plus">+</button>
                <span class="quantity-amount">${quantity}</span>
                <button class="remove-btn" data-action="minus">-</button>
            </div>
        `;
        actionContainer.querySelector('.add-btn').onclick = () => updateQuantity(cartId, 1);
        actionContainer.querySelector('.remove-btn').onclick = () => updateQuantity(cartId, -1);

    } else {
        const productEl = baseProductEl.closest('.product-card');
        // This logic is now safer as baseSize is guaranteed in product card dataset
        const activeSize = productEl.querySelector('.variant-selector.active')?.dataset.size || productEl.dataset.baseSize; 
        const productId = productEl.dataset.productId;
        
        actionContainer.innerHTML = `
            <button class="add-to-cart-btn">اضف الي السلة</button>
        `;
        actionContainer.querySelector('.add-to-cart-btn').onclick = () => addToCart(productId, activeSize);
    }
}

function updateCartDisplay() {
    let totalItems = 0;
    let totalPrice = 0;
    cartItemsEl.innerHTML = '';

    const cartKeys = Object.keys(cart);

    if (cartKeys.length === 0) {
        cartItemsEl.innerHTML = `<p class="empty-cart-message">السلة فارغة حالياً.</p>`;
    } else {
        for (const key of cartKeys) {
            const item = cart[key];
            const itemTotal = item.price * item.quantity; 
            totalItems += item.quantity;
            totalPrice += itemTotal;
            
            const sizeDisplay = item.productSize ? `(${item.productSize})` : ''; // Don't display if size is empty string
            
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.name} ${sizeDisplay}</span>
                </div>
                <span class="item-price">${itemTotal} <span class="currency">ج.م</span></span>
                <div class="quantity-control">
                    <button onclick="updateQuantity('${key}', 1)">+</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${key}', -1)">-</button>
                </div>
            `;
            cartItemsEl.appendChild(itemEl);
        }
    }

    cartCountEl.textContent = totalItems;
    cartTotalPriceEl.textContent = totalPrice;
    finalTotalPriceEl.textContent = totalPrice;

    document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.productId;
        const size = card.querySelector('.variant-selector.active')?.dataset.size || card.dataset.baseSize;
        const key = getCartKey(productId, size);
        updateProductButtons(key, cart[key] ? cart[key].quantity : 0);
    });
}

function handleVariantSelection(productCard, productId, newSize) {
    productCard.querySelectorAll('.variant-selector').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === newSize) {
            btn.classList.add('active');
        }
    });

    let baseProduct = null;
    for (const section of menuData) {
        baseProduct = section.products.find(p => p.id === productId);
        if (baseProduct) break;
    }

    if (!baseProduct) return;

    const selectedVariant = getProductVariant(productId, baseProduct, newSize);
    if (!selectedVariant) return;

    productCard.querySelector('.product-price').innerHTML = `${selectedVariant.price} <span class="currency">ج.م</span>`;
    productCard.querySelector('.product-info p').textContent = selectedVariant.description;
    productCard.querySelector('img').src = selectedVariant.image;
    
    const newCartKey = getCartKey(productId, newSize);
    productCard.dataset.cartKey = newCartKey;
    const quantityInCart = cart[newCartKey] ? cart[newCartKey].quantity : 0;
    updateProductButtons(newCartKey, quantityInCart);
}

function renderMenu() {
    menuNavEl.querySelector('ul')?.remove();
    menuSectionsEl.innerHTML = '';
    
    const navUl = document.createElement('ul');

    menuData.forEach(section => {
        const sectionId = section.section.replace(/\s/g, '_');
        const sectionClass = `tag-${section.tag.replace(/\s/g, '-')}`;
        
        const navLi = document.createElement('li');
        navLi.innerHTML = `<a href="#${sectionId}">${section.section}</a>`;
        navUl.appendChild(navLi);

        const sectionEl = document.createElement('section');
        sectionEl.id = sectionId;
        sectionEl.className = `menu-section ${sectionClass}`;
        sectionEl.innerHTML = `<h2 class="section-title">${section.section}</h2>`;

        const productGridEl = document.createElement('div');
        productGridEl.className = 'product-grid';

        section.products.forEach(product => {
            // Determine the base size. If base_size is missing/empty, default to ''.
            const baseSize = product.base_size || '';
            const defaultSize = baseSize;
            
            // Call the fixed getProductVariant. It will correctly get the price now.
            let defaultVariant = getProductVariant(product.id, product, defaultSize);

            // Safety check for null (shouldn't happen with the fix above)
            if (!defaultVariant) {
                 defaultVariant = {
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price) || 0, 
                    description: product.description,
                    image: product.image,
                    size: baseSize
                };
            }
            
            const cardEl = document.createElement('div');
            const defaultCartKey = getCartKey(product.id, defaultSize);
            
            cardEl.className = 'product-card';
            cardEl.dataset.productId = product.id;
            // Store the determined base size on the card for later use in size selection
            cardEl.dataset.baseSize = defaultSize; 
            cardEl.dataset.cartKey = defaultCartKey;
            
            cardEl.innerHTML = `
                <img src="${defaultVariant.image}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${defaultVariant.description}</p>
                    ${product.base_size || product.variants.length > 0 ? `
                    <div class="product-variants">
                        ${product.base_size ? `<span class="variant-selector active" data-size="${product.base_size}">${product.base_size}</span>` : ''}
                        ${product.variants.map(v => 
                            `<span class="variant-selector" data-size="${v.size}">${v.size}</span>`
                        ).join('')}
                    </div>` : ''}
                    <div class="product-price-action">
                        <span class="product-price">${defaultVariant.price} <span class="currency">ج.م</span></span>
                        <div class="product-action-container">
                            <button class="add-to-cart-btn">اضف الي السلة</button>
                        </div>
                    </div>
                </div>
            `;
            
            productGridEl.appendChild(cardEl);
        });
        
        sectionEl.appendChild(productGridEl);
        menuSectionsEl.appendChild(sectionEl);
    });

    menuNavEl.appendChild(navUl);

    document.querySelectorAll('.variant-selector').forEach(btn => {
        btn.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productId = productCard.dataset.productId;
            const newSize = this.dataset.size;
            handleVariantSelection(productCard, productId, newSize);
        });
    });

    document.querySelectorAll('.product-action-container .add-to-cart-btn').forEach(btn => {
        const productCard = btn.closest('.product-card');
        const productId = productCard.dataset.productId;
        const size = productCard.dataset.baseSize;
        btn.onclick = () => addToCart(productId, size);
    });
    
    updateCartDisplay();
}

cartSummaryEl.addEventListener('click', () => {
    cartDetailsEl.classList.add('open');
});

closeCartBtn.addEventListener('click', () => {
    cartDetailsEl.classList.remove('open');
});

// Theme Toggle Logic
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDark = body.classList.toggle('dark-theme');

        if (isDark) {
            // Switched to dark
            themeToggleBtn.querySelector('i').className = 'fas fa-sun';
            saveThemePreference('dark');
        } else {
            // Switched to light
            themeToggleBtn.querySelector('i').className = 'fas fa-moon';
            saveThemePreference('light');
        }
    });
}
// End Theme Toggle Logic


async function initMenu() {
    loadCart();
    // Load theme preference immediately to sync with main page
    loadThemePreference(); 
    try {
        // Fetching data relative to the menu page's directory
        const response = await fetch('./data/products.json'); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        menuData = await response.json();
        renderMenu();
    } catch (error) {
        console.error("Error loading or parsing menu data:", error);
        menuSectionsEl.innerHTML = '<p style="text-align: center; color: red; font-size: 1.2rem; line-height: 1.5;">Failed to load the menu. Please ensure the <span style="font-family: monospace;">products.json</span> file is accessible at the correct URL by checking the Network tab in your browser.</p>';
    }
}

initMenu();
