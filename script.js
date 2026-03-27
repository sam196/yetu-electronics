// ============================================
// YETU ELECTRONICS - COMPLETE JAVASCRIPT
// ============================================

let products = [];
let cart = JSON.parse(localStorage.getItem('yetuCart')) || [];
let currentFilter = "all";
let currentSort = "default";
let currentSearch = "";
let displayedProducts = 12;
let adminToken = null;

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
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

const notificationStyle = document.createElement('style');
notificationStyle.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
document.head.appendChild(notificationStyle);

// ============================================
// CLICK HANDLERS
// ============================================

window.openCartModal = function(event) {
    if (event) event.preventDefault();
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        updateCartDisplay();
        cartModal.style.display = 'flex';
    }
};

window.closeCartModal = function() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.style.display = 'none';
};

window.closeCheckoutModal = function() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) checkoutModal.style.display = 'none';
};

window.filterByCategory = function(event, category) {
    if (event) event.preventDefault();
    currentFilter = category;
    displayedProducts = 12;
    
    document.querySelectorAll('.category-menu a').forEach(link => {
        if (link.dataset.category === category) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    updateAllProducts();
    const productsSection = document.getElementById('products');
    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.filterByFilterBtn = function(event, category) {
    if (event) event.preventDefault();
    currentFilter = category;
    displayedProducts = 12;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.category-menu a').forEach(link => {
        if (link.dataset.category === category) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    updateAllProducts();
};

window.scrollToHome = function(event) {
    if (event) event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.scrollToProducts = function(event) {
    if (event) event.preventDefault();
    const productsSection = document.getElementById('products');
    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.showAccountMenu = function(event) {
    if (event) event.preventDefault();
    showNotification('Account features coming soon!', 'info');
};

window.showLocationInfo = function(event) {
    if (event) event.preventDefault();
    showNotification('Currently serving Eldoret area only. Free delivery for orders over KSh 5,000!', 'info');
};

window.showLocationOnMap = function(event) {
    if (event) event.stopPropagation();
    window.open('https://maps.google.com/?q=Eldoret,Kenya', '_blank');
};

window.makePhoneCall = function(event) {
    if (event) event.stopPropagation();
    window.location.href = 'tel:0741842196';
};

window.sendEmail = function(event) {
    if (event) event.stopPropagation();
    window.location.href = 'mailto:sales@yetu.com';
};

window.showContactPage = function(event) {
    if (event) event.preventDefault();
    showNotification('Contact us: 0741 842 196 or sales@yetu.com', 'info');
};

window.showFAQs = function(event) {
    if (event) event.preventDefault();
    showNotification('FAQs: How to order? Add items to cart and checkout. Delivery: 1-3 business days. Returns: 7-day hassle-free.', 'info');
};

window.showReturnsPolicy = function(event) {
    if (event) event.preventDefault();
    showNotification('7-day hassle-free returns policy. Items must be in original condition with packaging.', 'info');
};

window.showShippingInfo = function(event) {
    if (event) event.preventDefault();
    showNotification('Free delivery in Eldoret for orders over KSh 5,000. Delivery within 1-3 business days.', 'info');
};

window.showPaymentMethods = function(event) {
    if (event) event.preventDefault();
    showNotification('We accept M-Pesa (STK Push), Bank Transfer, and Cash on Delivery.', 'info');
};

window.handleNewsletterSubmit = function(event) {
    event.preventDefault();
    const email = event.target.querySelector('input').value;
    showNotification(`Subscribed! Check ${email} for updates`, 'success');
    event.target.reset();
};

window.proceedToCheckout = function() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    const cartModal = document.getElementById('cart-modal');
    const checkoutModal = document.getElementById('checkout-modal');
    if (cartModal) cartModal.style.display = 'none';
    if (checkoutModal) checkoutModal.style.display = 'flex';
    updateOrderSummary();
};

// ============================================
// M-PESA PAYMENT
// ============================================

window.initiateMpesaPayment = async function() {
    const phone = document.getElementById('checkout-phone').value.trim();
    const paymentStatus = document.getElementById('payment-status');
    const stkPushBtn = document.getElementById('stk-push-checkout');
    
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
};

function updatePaymentStatus(message, type) {
    const paymentStatus = document.getElementById('payment-status');
    if (paymentStatus) {
        paymentStatus.innerHTML = message;
        paymentStatus.className = `payment-status ${type}`;
    }
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
                const stkPushBtn = document.getElementById('stk-push-checkout');
                if (stkPushBtn) {
                    stkPushBtn.disabled = false;
                    stkPushBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Pay with M-Pesa';
                }
            } else if (data.ResultCode && data.ResultCode !== 1037) {
                clearInterval(interval);
                updatePaymentStatus('❌ Payment failed or was cancelled. Please try again.', 'error');
                const stkPushBtn = document.getElementById('stk-push-checkout');
                if (stkPushBtn) {
                    stkPushBtn.disabled = false;
                    stkPushBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Pay with M-Pesa';
                }
            } else if (attempts >= 24) {
                clearInterval(interval);
                updatePaymentStatus('Payment timeout. Please check your M-Pesa messages and contact support.', 'error');
                const stkPushBtn = document.getElementById('stk-push-checkout');
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

// ============================================
// LOAD PRODUCTS
// ============================================

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        console.log(`✅ Loaded ${products.length} products from server`);
        updateCategoryCounts();
        renderFlashSales();
        renderProducts('featured-products', products, true);
        updateAllProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products. Please refresh the page.', 'error');
    }
}

function updateCategoryCounts() {
    const categories = ['phones', 'laptops', 'tvs', 'audio', 'accessories', 'gaming'];
    categories.forEach(cat => {
        const count = products.filter(p => p.category === cat).length;
        const categoryCard = document.querySelector(`.category-card[data-cat="${cat}"] p`);
        if (categoryCard) {
            categoryCard.textContent = `${count}+ products`;
        }
    });
}

function renderProducts(containerId, productList, isFeatured = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let productsToShow = [...productList];
    if (isFeatured) productsToShow = productsToShow.slice(0, 8);
    
    if (productsToShow.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">No products available. Add products in admin panel.</div>';
        return;
    }
    
    container.innerHTML = productsToShow.map(product => `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}">
            ${product.badge ? `<div class="product-badge ${product.badge === 'flash' ? 'flash' : ''}">${product.badge === 'flash' ? '🔥 Flash Sale' : '✨ New'}</div>` : ''}
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
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
                <button class="add-to-cart-btn" data-id="${product.id}" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
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
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
            </div>
            <div class="product-info">
                <h4 class="product-title">${product.name}</h4>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <button class="add-to-cart-btn" data-id="${product.id}" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// SHOPPING CART
// ============================================

window.addToCart = function(productId) {
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
};

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
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/70x70?text=No+Image'">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 'decrease')">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 'increase')">+</button>
                    </div>
                    <span class="remove-item" onclick="removeFromCart(${item.id})">Remove</span>
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
}

window.updateQuantity = function(id, action) {
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
};

window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartDisplay();
};

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
                if (hours === 0) hours = 24;
                else { hours--; minutes = 59; }
            } else minutes--;
            seconds = 59;
        } else seconds--;
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
        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.hero-dot');
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        }
        currentSlide = index;
    }
    
    function nextSlide() { currentSlide = (currentSlide + 1) % slides.length; showSlide(currentSlide); }
    function prevSlide() { currentSlide = (currentSlide - 1 + slides.length) % slides.length; showSlide(currentSlide); }
    
    if (dotsContainer) {
        slides.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.classList.add('hero-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => { showSlide(i); resetInterval(); });
            dotsContainer.appendChild(dot);
        });
    }
    
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
    
    function resetInterval() { clearInterval(interval); interval = setInterval(nextSlide, 5000); }
    interval = setInterval(nextSlide, 5000);
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
        return `<div class="order-item"><span>${item.name} x ${item.quantity}</span><span>${formatPrice(itemTotal)}</span></div>`;
    }).join('');
    
    const deliveryFee = subtotal > 5000 ? 0 : 200;
    const total = subtotal + deliveryFee;
    
    orderItemsContainer.innerHTML += `<div class="order-item delivery" style="border-top: 1px solid var(--border); margin-top: 10px; padding-top: 10px;"><span>Delivery (Eldoret):</span><span>${formatPrice(deliveryFee)}</span></div>`;
    document.getElementById('order-total-amount').textContent = formatPrice(total);
}

// ============================================
// SEARCH, FILTERS & SORT
// ============================================

function updateAllProducts() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) currentSearch = searchInput.value;
    
    let filtered = [...products];
    if (currentFilter !== 'all') filtered = filtered.filter(p => p.category === currentFilter);
    if (currentSearch) filtered = filtered.filter(p => p.name.toLowerCase().includes(currentSearch.toLowerCase()));
    
    if (currentSort === 'price-low') filtered.sort((a, b) => a.price - b.price);
    else if (currentSort === 'price-high') filtered.sort((a, b) => b.price - a.price);
    else if (currentSort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (currentSort === 'name-desc') filtered.sort((a, b) => b.name.localeCompare(a.name));
    
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
                <div class="product-image"><img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'"></div>
                <div class="product-info">
                    <h4 class="product-title">${product.name}</h4>
                    <div class="product-price"><span class="current-price">${formatPrice(product.price)}</span>${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}</div>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
                </div>
            </div>
        `).join('');
    }
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) loadMoreBtn.style.display = filtered.length > displayedProducts ? 'block' : 'none';
}

function initSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortSelect = document.getElementById('sort-select');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (searchBtn) searchBtn.addEventListener('click', () => { currentSearch = searchInput.value; displayedProducts = 12; updateAllProducts(); });
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { currentSearch = searchInput.value; displayedProducts = 12; updateAllProducts(); } });
    if (sortSelect) sortSelect.addEventListener('change', () => { currentSort = sortSelect.value; displayedProducts = 12; updateAllProducts(); });
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => { displayedProducts += 12; updateAllProducts(); });
    updateAllProducts();
}

// ============================================
// MOBILE MENU
// ============================================

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const categoryNav = document.querySelector('.category-menu');
    if (toggle && categoryNav) {
        toggle.addEventListener('click', () => categoryNav.classList.toggle('show'));
        document.querySelectorAll('.category-menu a').forEach(link => link.addEventListener('click', () => categoryNav.classList.remove('show')));
    }
}

// ============================================
// IMAGE GALLERY FUNCTIONS
// ============================================

async function loadUploadedImages() {
    try {
        const response = await fetch('/api/images');
        const data = await response.json();
        const gallery = document.getElementById('image-gallery');
        if (gallery) {
            if (data.success && data.images && data.images.length > 0) {
                const productImages = data.images.filter(img => img.productNumber);
                const otherImages = data.images.filter(img => !img.productNumber);
                let html = '';
                if (productImages.length > 0) {
                    html += `<h5 style="grid-column: 1/-1; margin-top: 10px;">Product Images (product1 - product100):</h5>`;
                    html += productImages.map(image => `
                        <div class="gallery-item" style="position: relative; border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">
                            <img src="${image.url}" alt="${image.name}" style="width: 100%; height: 100px; object-fit: cover;">
                            <div style="position: absolute; top: 5px; left: 5px; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Product ${image.productNumber}</div>
                            <button class="copy-image-url" onclick="copyImageUrl('${image.url}')" style="position: absolute; bottom: 5px; right: 5px; background: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">Copy URL</button>
                        </div>
                    `).join('');
                }
                if (otherImages.length > 0) {
                    html += `<h5 style="grid-column: 1/-1; margin-top: 10px;">Other Images:</h5>`;
                    html += otherImages.map(image => `
                        <div class="gallery-item" style="position: relative; border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">
                            <img src="${image.url}" alt="${image.name}" style="width: 100%; height: 100px; object-fit: cover;">
                            <button class="copy-image-url" onclick="copyImageUrl('${image.url}')" style="position: absolute; bottom: 5px; right: 5px; background: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">Copy URL</button>
                        </div>
                    `).join('');
                }
                gallery.innerHTML = html;
            } else {
                gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No images uploaded yet. Upload images above.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading images:', error);
    }
}

window.copyImageUrl = function(url) {
    navigator.clipboard.writeText(url).then(() => showNotification('Image URL copied to clipboard!', 'success'))
        .catch(() => showNotification('Failed to copy URL', 'error'));
};

window.previewBulkImages = function(input) {
    const bulkPreview = document.getElementById('bulk-preview');
    bulkPreview.innerHTML = '';
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 8px;';
            bulkPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
};

window.uploadBulkProductImages = async function(event) {
    event.preventDefault();
    const files = document.getElementById('bulk-images').files;
    const startNumber = parseInt(document.getElementById('start-number').value) || 1;
    
    if (files.length === 0) { showNotification('Please select images to upload', 'error'); return; }
    if (startNumber + files.length - 1 > 100) { showNotification('Maximum product number is 100. Please adjust start number.', 'error'); return; }
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('images', files[i]);
    formData.append('startNumber', startNumber);
    
    const uploadBtn = event.target.querySelector('button[type="submit"]');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    try {
        const response = await fetch('/api/upload-bulk-products', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            showNotification(data.message, 'success');
            document.getElementById('bulk-upload-form').reset();
            document.getElementById('bulk-preview').innerHTML = '';
            loadUploadedImages();
        } else showNotification('Upload failed: ' + (data.error || 'Unknown error'), 'error');
    } catch (error) { showNotification('Failed to upload images.', 'error'); }
    finally { uploadBtn.disabled = false; uploadBtn.innerHTML = 'Upload Product Images'; }
};

window.bulkCreateProducts = async function() {
    const category = prompt('Enter category for all products (phones, laptops, tvs, audio, accessories, gaming):', 'accessories');
    if (!category) return;
    const price = prompt('Enter default price for all products (in KSh):', '1000');
    if (!price) return;
    const flash = confirm('Add as flash sale items?');
    
    try {
        const response = await fetch('/api/bulk-create-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, price: parseInt(price), flash })
        });
        const data = await response.json();
        if (data.success) {
            showNotification(data.message, 'success');
            loadProducts();
            loadProductsList();
        } else showNotification('Failed to create products.', 'error');
    } catch (error) { showNotification('Failed to create products.', 'error'); }
};

window.previewProductImage = function(input) {
    const imagePreview = document.getElementById('image-preview');
    imagePreview.innerHTML = '';
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 8px;';
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
    window.selectedImageUrl = '';
};

window.openImageSelector = async function() {
    const modal = document.createElement('div');
    modal.className = 'image-selector-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 3000; display: flex; justify-content: center; align-items: center;';
    modal.innerHTML = `
        <div style="background: white; width: 90%; max-width: 800px; max-height: 80vh; border-radius: 16px; overflow: hidden;">
            <div style="padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;">
                <h3>Select Image from Gallery</h3>
                <button onclick="this.closest('.image-selector-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div id="image-selector-grid" style="padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; max-height: 60vh; overflow-y: auto;">Loading images...</div>
        </div>
    `;
    document.body.appendChild(modal);
    
    try {
        const response = await fetch('/api/images');
        const data = await response.json();
        const grid = document.getElementById('image-selector-grid');
        if (data.success && data.images && data.images.length > 0) {
            grid.innerHTML = data.images.map(image => `
                <div style="cursor: pointer; border: 2px solid transparent; border-radius: 8px; overflow: hidden;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='transparent'" onclick="selectImageForProduct('${image.url}')">
                    <img src="${image.url}" style="width: 100%; height: 120px; object-fit: cover;">
                    <p style="font-size: 10px; padding: 5px; text-align: center;">${image.name.substring(0, 20)}</p>
                </div>
            `).join('');
        } else grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No images uploaded yet.</p>';
    } catch (error) { document.getElementById('image-selector-grid').innerHTML = '<p style="color: red;">Failed to load images</p>'; }
};

window.selectImageForProduct = function(imageUrl) {
    const imagePreview = document.getElementById('image-preview');
    imagePreview.innerHTML = `<img src="${imageUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">`;
    window.selectedImageUrl = imageUrl;
    document.querySelector('.image-selector-modal')?.remove();
    showNotification('Image selected!', 'success');
};

// ============================================
// ADMIN PANEL
// ============================================

window.openAdminPanel = function() {
    const adminOverlay = document.getElementById('admin-panel-overlay');
    if (adminOverlay) adminOverlay.style.display = 'flex';
};

window.closeAdminPanel = function() {
    const adminOverlay = document.getElementById('admin-panel-overlay');
    if (adminOverlay) adminOverlay.style.display = 'none';
};

window.adminLogin = async function() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    const adminLoginError = document.getElementById('admin-login-error');
    if (!username || !password) { adminLoginError.textContent = 'Please enter username and password'; return; }
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
            adminToken = data.token;
            document.getElementById('admin-login-form').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            loadProductsList();
            loadUploadedImages();
        } else adminLoginError.textContent = data.message;
    } catch (error) { adminLoginError.textContent = 'Login failed. Please try again.'; }
};

window.switchAdminTab = function(tabId) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`.admin-tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
};

async function loadProductsList() {
    try {
        const response = await fetch('/api/products');
        const productsList = await response.json();
        const container = document.getElementById('products-list');
        if (container) {
            if (productsList.length === 0) { container.innerHTML = '<p style="text-align: center; padding: 20px;">No products yet. Add your first product above.</p>'; return; }
            container.innerHTML = productsList.map(product => `
                <div class="product-admin-item">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                    <div class="product-admin-info"><h5>${product.name}</h5><p>${formatPrice(product.price)} | ${product.category}</p></div>
                    <button class="delete-product" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            `).join('');
        }
    } catch (error) { console.error('Error loading products:', error); }
}

window.deleteProduct = async function(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) { showNotification('Product deleted successfully', 'success'); loadProductsList(); loadProducts(); }
    }
};

window.addNewProduct = async function(event) {
    event.preventDefault();
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const price = document.getElementById('product-price').value;
    const oldPrice = document.getElementById('product-old-price').value;
    const flash = document.getElementById('product-flash').checked;
    const description = document.getElementById('product-description').value;
    const productNumber = document.getElementById('product-number').value;
    const imageFile = document.getElementById('product-image').files[0];
    
    let imageUrl = window.selectedImageUrl || '';
    if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        if (productNumber) formData.append('productNumber', productNumber);
        const uploadRes = await fetch('/api/upload-product-image', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) imageUrl = uploadData.imageUrl;
    }
    if (!imageUrl) { showNotification('Please select an image for the product', 'error'); return; }
    
    const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, price, oldPrice, imageUrl, flash, description, productNumber: productNumber || null })
    });
    const data = await response.json();
    if (data.success) {
        showNotification('Product added successfully!', 'success');
        document.getElementById('add-product-form').reset();
        document.getElementById('image-preview').innerHTML = '';
        window.selectedImageUrl = '';
        loadProductsList();
        loadProducts();
    } else showNotification('Failed to add product', 'error');
};

// ============================================
// INITIALIZE
// ============================================

async function init() {
    await loadProducts();
    startCountdown();
    initHeroSlider();
    initSearchAndFilters();
    initMobileMenu();
    updateCartCount();
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('cart-modal')) document.getElementById('cart-modal').style.display = 'none';
        if (e.target === document.getElementById('checkout-modal')) document.getElementById('checkout-modal').style.display = 'none';
        if (e.target === document.getElementById('admin-panel-overlay')) document.getElementById('admin-panel-overlay').style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', init);
