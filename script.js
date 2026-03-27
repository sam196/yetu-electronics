// ============================================
// YETU ELECTRONICS - COMPLETE JAVASCRIPT
// Eldoret Store with M-Pesa STK Push
// ============================================

// ============================================
// PRODUCT DATABASE (Will be loaded from server)
// ============================================

let products = [];
let cart = JSON.parse(localStorage.getItem('yetuCart')) || [];
let currentFilter = "all";
let currentSort = "default";
let currentSearch = "";
let displayedProducts = 12;

// Admin session
let adminToken = null;

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPrice(price) {
    return `KSh ${price.toLocaleString()}`;
}

function getStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (halfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
    return stars;
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-count-top, #cart-count-header').forEach(el => {
        if (el) el.textContent = count;
    });
}

function saveCart() {
    localStorage.setItem('yetuCart', JSON.stringify(cart));
    updateCartCount();
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#22c55e' : '#ef4444'};
        color: white;
        border-radius: 8px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Add CSS animation for notifications
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(notificationStyle);

// ============================================
// LOAD PRODUCTS FROM SERVER
// ============================================

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        console.log(`✅ Loaded ${products.length} products from server`);
        
        // Re-render all product sections
        renderFlashSales();
        renderProducts('featured-products', products, true);
        updateAllProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to default products if server fails
        products = [
            { id: 1, name: "iPhone 15 Pro Max", category: "phones", price: 165000, oldPrice: 185000, rating: 4.8, reviews: 234, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300", badge: "flash", flash: true },
            { id: 2, name: "Samsung Galaxy S24 Ultra", category: "phones", price: 155000, oldPrice: 175000, rating: 4.7, reviews: 189, image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300", badge: "new" },
            { id: 3, name: "MacBook Pro M3", category: "laptops", price: 210000, oldPrice: 240000, rating: 4.9, reviews: 345, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300", badge: "flash", flash: true }
        ];
        renderFlashSales();
        renderProducts('featured-products', products, true);
        updateAllProducts();
    }
}

// ============================================
// RENDER PRODUCTS
// ============================================

function renderProducts(containerId, productList, isFeatured = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let productsToShow = [...productList];
    
    if (isFeatured) {
        productsToShow = productsToShow.slice(0, 8);
    }
    
    if (productsToShow.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">No products available</div>';
        return;
    }
    
    container.innerHTML = productsToShow.map(product => `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}">
            ${product.badge ? `<div class="product-badge ${product.badge === 'flash' ? 'flash' : ''}">${product.badge === 'flash' ? '🔥 Flash Sale' : '✨ New'}</div>` : ''}
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
            </div>
            <div class="product-info">
                <h4 class="product-title">${product.name}</h4>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <div class="product-rating">
                    <div class="stars">${getStars(product.rating)}</div>
                    <span class="rating-count">(${product.reviews})</span>
                </div>
                <button class="add-to-cart-btn" data-id="${product.id}">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll(`#${containerId} .add-to-cart-btn`).forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            addToCart(id);
        });
    });
}

function renderFlashSales() {
    const flashProducts = products.filter(p => p.flash === true);
    const container = document.getElementById('flash-products');
    if (!container) return;
    
    if (flashProducts.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">No flash sales at the moment</div>';
        return;
    }
    
    container.innerHTML = flashProducts.map(product => `
        <div class="product-card">
            <div class="product-badge flash">🔥 Flash Sale</div>
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
            </div>
            <div class="product-info">
                <h4 class="product-title">${product.name}</h4>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <button class="add-to-cart-btn" data-id="${product.id}">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('#flash-products .add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id)));
    });
}

// ============================================
// SHOPPING CART FUNCTIONS
// ============================================

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    showNotification('Added to cart!', 'success');
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div style="text-align:center; padding:40px;">Your cart is empty</div>';
        document.getElementById('cart-subtotal').textContent = 'KSh 0';
        document.getElementById('delivery-fee').textContent = 'KSh 0';
        document.getElementById('cart-total').textContent = 'KSh 0';
        return;
    }
    
    let subtotal = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/70x70?text=No+Image'">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
                    </div>
                    <span class="remove-item" data-id="${item.id}">Remove</span>
                </div>
                <div class="cart-item-total">${formatPrice(itemTotal)}</div>
            </div>
        `;
    }).join('');
    
    const deliveryFee = subtotal > 5000 ? 0 : 200;
    const total = subtotal + deliveryFee;
    
    document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('delivery-fee').textContent = formatPrice(deliveryFee);
    document.getElementById('cart-total').textContent = formatPrice(total);
    
    // Attach quantity events
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const action = btn.dataset.action;
            updateQuantity(id, action);
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            removeFromCart(id);
        });
    });
}

function updateQuantity(id, action) {
    const item = cart.find(i => i.id === id);
    if (item) {
        if (action === 'increase') {
            item.quantity++;
        } else if (action === 'decrease' && item.quantity > 1) {
            item.quantity--;
        } else if (action === 'decrease' && item.quantity === 1) {
            removeFromCart(id);
            return;
        }
        saveCart();
        updateCartDisplay();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartDisplay();
}

// ============================================
// COUNTDOWN TIMER
// ============================================

function startCountdown() {
    let hours = 23, minutes = 59, seconds = 59;
    
    const updateTimer = () => {
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        
        if (seconds === 0) {
            if (minutes === 0) {
                if (hours === 0) {
                    hours = 24;
                } else {
                    hours--;
                    minutes = 59;
                }
            } else {
                minutes--;
            }
            seconds = 59;
        } else {
            seconds--;
        }
    };
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// ============================================
// HERO SLIDER
// ============================================

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const prevBtn = document.querySelector('.hero-prev');
    const nextBtn = document.querySelector('.hero-next');
    const dotsContainer = document.querySelector('.hero-dots');
    let currentSlide = 0;
    let interval;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.hero-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
        currentSlide = index;
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }
    
    if (dotsContainer) {
        slides.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.classList.add('hero-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                showSlide(i);
                resetInterval();
            });
            dotsContainer.appendChild(dot);
        });
    }
    
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
    
    function resetInterval() {
        clearInterval(interval);
        interval = setInterval(nextSlide, 5000);
    }
    
    interval = setInterval(nextSlide, 5000);
}

// ============================================
// CART MODAL
// ============================================

function initCartModal() {
    const cartIcon = document.getElementById('cart-icon');
    const cartModal = document.getElementById('cart-modal');
    const cartClose = document.querySelector('.cart-close');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            updateCartDisplay();
            cartModal.style.display = 'flex';
        });
    }
    
    if (cartClose) {
        cartClose.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showNotification('Your cart is empty!', 'error');
                return;
            }
            cartModal.style.display = 'none';
            document.getElementById('checkout-modal').style.display = 'flex';
            updateOrderSummary();
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.style.display = 'none';
        if (e.target === document.getElementById('checkout-modal')) {
            document.getElementById('checkout-modal').style.display = 'none';
        }
    });
}

// ============================================
// ORDER SUMMARY
// ============================================

function updateOrderSummary() {
    const orderItemsContainer = document.getElementById('order-items');
    let subtotal = 0;
    
    orderItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="order-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>${formatPrice(itemTotal)}</span>
            </div>
        `;
    }).join('');
    
    const deliveryFee = subtotal > 5000 ? 0 : 200;
    const total = subtotal + deliveryFee;
    
    orderItemsContainer.innerHTML += `
        <div class="order-item delivery" style="border-top: 1px solid var(--border); margin-top: 10px; padding-top: 10px;">
            <span>Delivery (Eldoret):</span>
            <span>${formatPrice(deliveryFee)}</span>
        </div>
    `;
    
    document.getElementById('order-total-amount').textContent = formatPrice(total);
}

// ============================================
// M-PESA STK PUSH PAYMENT
// ============================================

function initMpesaPayment() {
    const stkPushBtn = document.getElementById('stk-push-checkout');
    const checkoutPhone = document.getElementById('checkout-phone');
    const paymentStatus = document.getElementById('payment-status');
    
    if (stkPushBtn) {
        stkPushBtn.addEventListener('click', async () => {
            const phone = checkoutPhone.value.trim();
            
            if (!phone) {
                updatePaymentStatus('Please enter your M-Pesa phone number', 'error');
                return;
            }
            
            if (cart.length === 0) {
                updatePaymentStatus('Your cart is empty!', 'error');
                return;
            }
            
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const deliveryFee = subtotal > 5000 ? 0 : 200;
            const total = subtotal + deliveryFee;
            
            updatePaymentStatus('Sending payment request to your phone...', 'info');
            stkPushBtn.disabled = true;
            stkPushBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            try {
                const response = await fetch('/api/mpesa/stkpush', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phone,
                        amount: total,
                        accountReference: `YETU-${Date.now()}`,
                        transactionDesc: 'Electronics Purchase - Eldoret'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    updatePaymentStatus('✅ Payment request sent! Check your phone and enter PIN to complete.', 'success');
                    pollPaymentStatus(data.checkoutRequestID, total);
                } else {
                    updatePaymentStatus(data.message || 'Payment request failed. Please try again.', 'error');
                    stkPushBtn.disabled = false;
                    stkPushBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Pay with M-Pesa';
                }
            } catch (error) {
                console.error('STK Push Error:', error);
                updatePaymentStatus('Network error. Please try again.', 'error');
                stkPushBtn.disabled = false;
                stkPushBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Pay with M-Pesa';
            }
        });
    }
    
    function pollPaymentStatus(checkoutRequestID, totalAmount) {
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            
            try {
                const response = await fetch('/api/mpesa/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ checkoutRequestID })
                });
                
                const data = await response.json();
                
                if (data.ResultCode === 0) {
                    clearInterval(interval);
                    updatePaymentStatus('✅ Payment successful! Thank you for shopping at Yetu Electronics Eldoret!', 'success');
                    
                    cart = [];
                    saveCart();
                    updateCartDisplay();
                    
                    setTimeout(() => {
                        document.getElementById('checkout-modal').style.display = 'none';
                        showNotification(`Order placed successfully! Total: ${formatPrice(totalAmount)}`, 'success');
                    }, 2000);
                    
                    if (stkPushBtn) {
                        stkPushBtn.disabled = false;
                        stkPushBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Pay with M-Pesa';
                    }
                } else if (data.ResultCode && data.ResultCode !== 1037) {
                    clearInterval(interval);
                    updatePaymentStatus('❌ Payment failed or was cancelled. Please try again.', 'error');
                    
                    if (stkPushBtn) {
                        stkPushBtn.disabled = false;
                        stkPushBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Pay with M-Pesa';
                    }
                } else if (attempts >= 24) {
                    clearInterval(interval);
                    updatePaymentStatus('Payment timeout. Please check your M-Pesa messages and contact support.', 'error');
                    
                    if (stkPushBtn) {
                        stkPushBtn.disabled = false;
                        stkPushBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Pay with M-Pesa';
                    }
                }
            } catch (error) {
                console.error('Status check error:', error);
            }
        }, 5000);
    }
    
    function updatePaymentStatus(message, type) {
        if (paymentStatus) {
            paymentStatus.innerHTML = message;
            paymentStatus.className = `payment-status ${type}`;
        }
    }
}

// ============================================
// SEARCH, FILTERS & SORT
// ============================================

function updateAllProducts() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) currentSearch = searchInput.value;
    
    let filtered = [...products];
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter);
    }
    
    if (currentSearch) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(currentSearch.toLowerCase()));
    }
    
    if (currentSort === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'name-asc') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === 'name-desc') {
        filtered.sort((a, b) => b.name.localeCompare(a.name));
    }
    
    const toShow = filtered.slice(0, displayedProducts);
    const container = document.getElementById('all-products-grid');
    const noResults = document.getElementById('no-results');
    
    if (container) {
        if (toShow.length === 0) {
            if (noResults) noResults.style.display = 'block';
            container.innerHTML = '';
            return;
        }
        
        if (noResults) noResults.style.display = 'none';
        
        container.innerHTML = toShow.map(product => `
            <div class="product-card">
                ${product.badge ? `<div class="product-badge ${product.badge === 'flash' ? 'flash' : ''}">${product.badge === 'flash' ? '🔥 Flash Sale' : '✨ New'}</div>` : ''}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
                </div>
                <div class="product-info">
                    <h4 class="product-title">${product.name}</h4>
                    <div class="product-price">
                        <span class="current-price">${formatPrice(product.price)}</span>
                        ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                    </div>
                    <button class="add-to-cart-btn" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('#all-products-grid .add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id)));
        });
    }
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = filtered.length > displayedProducts ? 'block' : 'none';
    }
}

function initSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryLinks = document.querySelectorAll('[data-category]');
    const sortSelect = document.getElementById('sort-select');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentSearch = searchInput.value;
            displayedProducts = 12;
            updateAllProducts();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentSearch = searchInput.value;
                displayedProducts = 12;
                updateAllProducts();
            }
        });
    }
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            displayedProducts = 12;
            updateAllProducts();
        });
    });
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.dataset.category;
            if (category) {
                currentFilter = category;
                displayedProducts = 12;
                updateAllProducts();
                document.querySelector('.featured-products').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            displayedProducts = 12;
            updateAllProducts();
        });
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            displayedProducts += 12;
            updateAllProducts();
        });
    }
    
    updateAllProducts();
}

// ============================================
// CATEGORY CARDS
// ============================================

function initCategoryCards() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.cat;
            currentFilter = category;
            displayedProducts = 12;
            document.querySelector('.featured-products').scrollIntoView({ behavior: 'smooth' });
            updateAllProducts();
            
            // Update active filter button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === category) {
                    btn.classList.add('active');
                }
            });
        });
    });
}

// ============================================
// MOBILE MENU
// ============================================

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const categoryNav = document.querySelector('.category-menu');
    
    if (toggle && categoryNav) {
        toggle.addEventListener('click', () => {
            categoryNav.classList.toggle('show');
        });
        
        document.querySelectorAll('.category-menu a').forEach(link => {
            link.addEventListener('click', () => {
                categoryNav.classList.remove('show');
            });
        });
    }
}

// ============================================
// NEWSLETTER
// ============================================

function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input').value;
            showNotification(`Subscribed! Check ${email} for updates`, 'success');
            form.reset();
        });
    }
}

// ============================================
// ADMIN PANEL
// ============================================

function initAdminPanel() {
    const adminTrigger = document.getElementById('admin-trigger-btn');
    const adminOverlay = document.getElementById('admin-panel-overlay');
    const closeAdmin = document.getElementById('close-admin');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminUsername = document.getElementById('admin-username');
    const adminPassword = document.getElementById('admin-password');
    const adminLoginError = document.getElementById('admin-login-error');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminContent = document.getElementById('admin-content');
    
    let adminToken = null;
    
    // Open admin panel
    if (adminTrigger) {
        adminTrigger.addEventListener('click', () => {
            adminOverlay.style.display = 'flex';
        });
    }
    
    // Close admin panel
    if (closeAdmin) {
        closeAdmin.addEventListener('click', () => {
            adminOverlay.style.display = 'none';
        });
    }
    
    // Close on overlay click
    adminOverlay.addEventListener('click', (e) => {
        if (e.target === adminOverlay) {
            adminOverlay.style.display = 'none';
        }
    });
    
    // Admin login
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', async () => {
            const username = adminUsername.value;
            const password = adminPassword.value;
            
            if (!username || !password) {
                adminLoginError.textContent = 'Please enter username and password';
                return;
            }
            
            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    adminToken = data.token;
                    adminLoginForm.style.display = 'none';
                    adminContent.style.display = 'block';
                    loadProductsList();
                    loadUploadedImages();
                    initAdminTabs();
                    initAddProductForm();
                    initBulkUploadForm();
                } else {
                    adminLoginError.textContent = data.message;
                }
            } catch (error) {
                adminLoginError.textContent = 'Login failed. Please try again.';
            }
        });
    }
}

function initAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Load products list for management
async function loadProductsList() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        const container = document.getElementById('products-list');
        if (container) {
            container.innerHTML = products.map(product => `
                <div class="product-admin-item">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/50x50?text=No+Image'">
                    <div class="product-admin-info">
                        <h5>${product.name}</h5>
                        <p>${formatPrice(product.price)} | ${product.category}</p>
                    </div>
                    <button class="delete-product" data-id="${product.id}">Delete</button>
                </div>
            `).join('');
            
            document.querySelectorAll('.delete-product').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete this product?')) {
                        const id = btn.dataset.id;
                        const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                        const data = await response.json();
                        if (data.success) {
                            showNotification('Product deleted successfully', 'success');
                            loadProductsList();
                            loadProducts(); // Reload main products
                        }
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Image preview for add product
function initAddProductForm() {
    const productImage = document.getElementById('product-image');
    const imagePreview = document.getElementById('image-preview');
    
    if (productImage) {
        productImage.addEventListener('change', (e) => {
            imagePreview.innerHTML = '';
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    imagePreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('product-name').value;
            const category = document.getElementById('product-category').value;
            const price = document.getElementById('product-price').value;
            const oldPrice = document.getElementById('product-old-price').value;
            const flash = document.getElementById('product-flash').checked;
            const imageFile = document.getElementById('product-image').files[0];
            
            let imageUrl = '';
            
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                
                const uploadRes = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData
                });
                
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    imageUrl = uploadData.imageUrl;
                }
            }
            
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name, category, price, oldPrice, imageUrl, flash
                })
            });
            
            const data = await response.json();
            if (data.success) {
                showNotification('Product added successfully!', 'success');
                addProductForm.reset();
                imagePreview.innerHTML = '';
                loadProductsList();
                loadProducts();
            } else {
                showNotification('Failed to add product', 'error');
            }
        });
    }
}

// Bulk image upload
function initBulkUploadForm() {
    const bulkImages = document.getElementById('bulk-images');
    const bulkPreview = document.getElementById('bulk-preview');
    const bulkUploadForm = document.getElementById('bulk-upload-form');
    
    if (bulkImages) {
        bulkImages.addEventListener('change', (e) => {
            bulkPreview.innerHTML = '';
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    bulkPreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }
    
    if (bulkUploadForm) {
        bulkUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const files = bulkImages.files;
            let uploaded = 0;
            
            for (const file of files) {
                const formData = new FormData();
                formData.append('image', file);
                
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.success) uploaded++;
            }
            
            showNotification(`Uploaded ${uploaded} images successfully!`, 'success');
            bulkUploadForm.reset();
            bulkPreview.innerHTML = '';
            loadUploadedImages();
        });
    }
}

async function loadUploadedImages() {
    // This would require a directory listing endpoint
    const container = document.getElementById('uploaded-images');
    if (container) {
        container.innerHTML = '<p>Images uploaded. You can select them when adding products.</p>';
    }
}

// ============================================
// INITIALIZE EVERYTHING
// ============================================

async function init() {
    await loadProducts();
    startCountdown();
    initHeroSlider();
    initCartModal();
    initMpesaPayment();
    initSearchAndFilters();
    initCategoryCards();
    initMobileMenu();
    initNewsletter();
    initAdminPanel();
    updateCartCount();
}

// Start everything when page loads
document.addEventListener('DOMContentLoaded', init);
