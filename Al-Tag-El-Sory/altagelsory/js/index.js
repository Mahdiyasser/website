document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

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

    let allProductSections = []; 
    const productsMap = new Map(); 

    let cart = JSON.parse(localStorage.getItem('artisanCart')) || {};
    const productContainer = document.getElementById('products-container');
    const cartList = document.getElementById('cart-items-list');
    const subtotalDisplay = document.getElementById('cart-subtotal');
    const grandTotalDisplay = document.getElementById('cart-grand-total');
    const checkoutButton = document.getElementById('proceed-to-checkout');
    const navList = document.getElementById('main-nav-ul');
    const mainNav = document.getElementById('main-nav');


    function saveCart() {
        localStorage.setItem('artisanCart', JSON.stringify(cart));
    }

    function updateCart(productId, action) {
        const productData = productsMap.get(productId);
        if (!productData) return;

        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);

        if (!cart[productId]) {
            cart[productId] = { name: productData.name, price: productData.price, quantity: 0 };
        }

        if (action === 'increment') cart[productId].quantity += 1;
        else if (action === 'decrement' && cart[productId].quantity > 0) cart[productId].quantity -= 1;

        if (cart[productId].quantity <= 0) {
            delete cart[productId];
            if (productCard) resetProductCardDisplay(productCard);
        } else {
            if (productCard) updateProductCardDisplay(productCard, cart[productId].quantity);
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
        }
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

    if (cartList) {
        cartList.addEventListener('click', (e) => {
            const removeOneButton = e.target.closest('.remove-one');
            const removeAllButton = e.target.closest('.remove-all');

            if (removeOneButton) {
                const productId = removeOneButton.dataset.id;
                updateCart(productId, removeOneButton.dataset.action);
            } else if (removeAllButton) {
                const productId = removeAllButton.dataset.id;
                if (cart[productId]) {
                    delete cart[productId];
                    const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
                    if (productCard) resetProductCardDisplay(productCard);

                    saveCart();
                    renderCart();
                }
            }
        });
    }


    function slugify(title) {
        if (!title) return '';
        return title.replace(/\s+/g, '-').replace(/[^-أ-يa-zA-Z0-9]/g, '');
    }

    function createProductCard(product) {
        const { id, name, price, description, image } = product;
        const quantity = cart[id] ? cart[id].quantity : 0;
        const initialDisplay = quantity > 0 ? 'none' : 'block';
        const controlDisplay = quantity > 0 ? 'flex' : 'none';

        productsMap.set(id, { name, price: parseFloat(price) });

        return `
            <div class="product-card" data-product-id="${id}">
                <div class="product-image-container">
                    <img src="${image}" alt="${name}">
                </div>
                <div class="product-details">
                    <h2 class="product-name">${name}</h2>
                    <p class="product-description">${description}</p>
                    <p class="product-price">$${parseFloat(price).toFixed(2)}</p>

                    <button class="add-to-cart-initial" data-action="increment" style="display: ${initialDisplay};"></button>

                    <div class="product-quantity-control" style="display: ${controlDisplay};">
                        <button class="remove-from-card" data-action="decrement"></button>
                        <span class="product-quantity" data-quantity="${quantity}">${quantity || ''}</span>
                        <button class="add-to-card" data-action="increment"></button>
                    </div>
                </div>
            </div>
        `;
    }

    function createSectionHTML(sectionData) {
        const sectionTitle = sectionData.section;
        const sectionId = slugify(sectionTitle);
        const sectionTagClass = sectionData.tag ? `section-${sectionData.tag.replace(/\s+/g, '-')}` : 'section-default';
        
        const productsHTML = (sectionData.products && sectionData.products.length > 0)
            ? sectionData.products.map(createProductCard).join('')
            : '';

        return `
            <div class="product-section-wrapper ${sectionTagClass}">
                <div class="section-title">
                    <h2 id="${sectionId}">${sectionTitle}</h2>
                </div>
                ${productsHTML}
            </div>
        `;
    }

    function renderProducts() {
        if (!productContainer || allProductSections.length === 0) return;

        const allSectionsHTML = allProductSections.map(createSectionHTML).join('');
        productContainer.innerHTML = allSectionsHTML;
    }

    function updateNavBar() {
        if (!navList || allProductSections.length === 0) return;

        let insertBeforeNode = navList.querySelector('a[href="#about-us"]') ? navList.querySelector('a[href="#about-us"]').parentNode : null;

        if (!insertBeforeNode) return; 

        let currentNode = navList.children[1];
        while (currentNode && currentNode !== insertBeforeNode) {
            const next = currentNode.nextElementSibling;
            navList.removeChild(currentNode);
            currentNode = next;
        }

        const navFragments = document.createDocumentFragment();

        allProductSections.forEach(sectionData => {
            if (sectionData.products && sectionData.products.length > 0) {
                const title = sectionData.section;
                const id = slugify(title);
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `#${id}`;
                a.textContent = title;
                li.appendChild(a);
                navFragments.appendChild(li);
            }
        });

        navList.insertBefore(navFragments, insertBeforeNode);

        navList.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && window.innerWidth <= 768 && navList.classList.contains('open')) {
                closeNav();
            }
        });
    }

    async function loadProductData() {
        try {
            const response = await fetch('./data/data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allProductSections = await response.json();

            renderProducts();

            updateNavBar();

            updateAllProductCardDisplays(); 
            renderCart(); 

        } catch (error) {
            console.error('Error loading product data:', error);
            if (productContainer) {
                productContainer.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">' +
                                             'تعذر تحميل قائمة المنتجات' +
                                             '</p>';
            }
        }
    }


    loadProductData();


    const navToggleButton = document.getElementById('nav-toggle-button');

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


        navList.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && window.innerWidth <= 768 && navList.classList.contains('open')) {
                closeNav();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navList.classList.contains('open')) closeNav();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navList.classList.contains('open')) closeNav();
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && navList.classList.contains('open')) {
                if (!mainNav.contains(e.target) && e.target !== navToggleButton) closeNav();
            }
        });
    }


    if (navToggleButton) {
        const DESKTOP_SCROLL_LIMIT = 80;    
        const DESKTOP_LIMIT_TOP = '85px'; 
        const DESKTOP_NORMAL_TOP = '20px'; 
        
        const MOBILE_SCROLL_LIMIT = 50;     
        const MOBILE_LIMIT_TOP = '60px';  
        const MOBILE_NORMAL_TOP = '10px';   
        
        const MOBILE_BREAKPOINT = 769;      

        function updateToggleButtonPosition() {
            const isDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
            
            let scrollLimit, limitTop, normalTop;
            
            if (isDesktop) {
                scrollLimit = DESKTOP_SCROLL_LIMIT;
                limitTop = DESKTOP_LIMIT_TOP;
                normalTop = DESKTOP_NORMAL_TOP;
            } else {
                scrollLimit = MOBILE_SCROLL_LIMIT;
                limitTop = MOBILE_LIMIT_TOP;
                normalTop = MOBILE_NORMAL_TOP;
            }

            if (window.scrollY < scrollLimit) {
                navToggleButton.style.top = limitTop;
            } else {
                navToggleButton.style.top = normalTop;
            }
        }

        updateToggleButtonPosition();
        window.addEventListener('scroll', updateToggleButtonPosition);
        window.addEventListener('resize', updateToggleButtonPosition);
    }
});
