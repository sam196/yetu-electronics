// Yetu Electronics - Complete Ecommerce JavaScript

// ============================================
// PRODUCT DATABASE
// ============================================

const products = [
    // Phones
    { id: 1, name: "iPhone 15 Pro Max", category: "phones", price: 165000, oldPrice: 185000, rating: 4.8, reviews: 234, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300", badge: "flash", flash: true },
    { id: 2, name: "Samsung Galaxy S24 Ultra", category: "phones", price: 155000, oldPrice: 175000, rating: 4.7, reviews: 189, image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300", badge: "new" },
    { id: 3, name: "Google Pixel 8 Pro", category: "phones", price: 120000, oldPrice: 135000, rating: 4.6, reviews: 98, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300" },
    { id: 4, name: "Xiaomi 13 Pro", category: "phones", price: 85000, oldPrice: 95000, rating: 4.5, reviews: 156, image: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=300" },
    { id: 5, name: "OnePlus 12", category: "phones", price: 95000, rating: 4.7, reviews: 112, image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=300" },
    
    // Laptops
    { id: 6, name: "MacBook Pro M3", category: "laptops", price: 210000, oldPrice: 240000, rating: 4.9, reviews: 345, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300", badge: "flash", flash: true },
    { id: 7, name: "Dell XPS 15", category: "laptops", price: 180000, oldPrice: 200000, rating: 4.7, reviews: 234, image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=300" },
    { id: 8, name: "HP Spectre x360", category: "laptops", price: 145000, rating: 4.6, reviews: 167, image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300" },
    { id: 9, name: "Lenovo ThinkPad X1", category: "laptops", price: 165000, oldPrice: 185000, rating: 4.8, reviews: 198, image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300" },
    
    // TVs
    { id: 10, name: "Samsung 65\" 4K Smart TV", category: "tvs", price: 95000, oldPrice: 120000, rating: 4.7, reviews: 456, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300", badge: "flash", flash: true },
    { id: 11, name: "LG OLED C3 55\"", category: "tvs", price: 140000, oldPrice: 160000, rating: 4.9, reviews: 289, image: "https://images.unsplash.com/photo-1577979749830-f1d742b96791?w=300" },
    { id: 12, name: "Sony Bravia XR 65\"", category: "tvs", price: 175000, rating: 4.8, reviews: 312, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300" },
    
    // Audio
    { id: 13, name: "Sony WH-1000XM5", category: "audio", price: 35000, oldPrice: 45000, rating: 4.8, reviews: 567, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300", badge: "flash", flash: true },
    { id: 14, name: "AirPods Pro 2", category: "audio", price: 32000, oldPrice: 38000, rating: 4.7, reviews: 789, image: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=300" },
    { id: 15, name: "JBL Flip 6", category: "audio", price: 12000, rating: 4.5, reviews: 234, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300" },
    
    // Accessories
    { id: 16, name: "Apple Watch Series 9", category: "accessories", price: 55000, oldPrice: 65000, rating: 4.7, reviews: 345, image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=300" },
    { id: 17, name: "Logitech MX Master 3S", category: "accessories", price: 12000, rating: 4.6, reviews: 456, image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300" },
    { id: 18, name: "Anker Power Bank", category: "accessories", price: 4500, rating: 4.4, reviews: 678, image: "https://images.unsplash.com/photo-1609592426241-4ec1f28d98f7?w=300" },
    
    // Gaming
    { id: 19, name: "PS5 Console", category: "gaming", price: 65000, oldPrice: 75000, rating: 4.9, reviews: 890, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94de?w=300", badge: "flash", flash: true },
    { id: 20, name: "Xbox Series X", category: "gaming", price: 62000, rating: 4.8, reviews: 567, image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=300" },
    { id: 21, name: "Nintendo Switch OLED", category: "gaming", price: 45000, rating: 4.7, reviews: 432, image: "https://images.unsplash.com/photo-1615663235857-ac93bb7c39e7?w=300" }
];

// ============================================
// SHOPPING CART
// ============================================
let cart = JSON.parse(localStorage.getItem('yetuCart')) || [];
let currentFilter = "all";
let currentSort = "default";
let currentSearch = "";
let displayedProducts = 12;

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

// ============================================
// RENDER PRODUCTS
// ============================================
function renderProducts(containerId, productList, isFeatured = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let productsToShow = productList;
    
    // Apply filter
    if (currentFilter !== 'all') {
        productsToShow = productsToShow.filter(p => p.category === currentFilter);
    }
    
    // Apply search
    if (currentSearch) {
        productsToShow = productsToShow.filter(p => 
            p.name.toLowerCase().includes(currentSearch.toLowerCase())
        );
    }
    
    // Apply sort
    if (currentSort === 'price-low') {
        productsToShow.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
        productsToShow.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'name-asc') {
        productsToShow.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === 'name-desc') {
        productsToShow.sort((a, b) => b.name.localeCompare(a.name));
    }
    
    // Limit for featured section
    if (isFeatured) {
        productsToShow = productsToShow.slice(0, 8);
    }
    
    if (productsToShow.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = productsToShow.map(product => `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}">
            ${product.badge ? `<div class="product-badge ${product.badge === 'flash' ? 'flash' : ''}">${product.badge === 'flash' ? '🔥 Flash Sale' : '✨ New'}</div>` : ''}
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
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
    
    // Attach add to cart events
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            addToCart(id);
        });
    });
}

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
                    <img src="${item.image}" alt="${item.name}">
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
    
    document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('cart-total').textContent = formatPrice(subtotal);
    
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
// FLASH SALES
// ============================================
function renderFlashSales() {
    const flashProducts = products.filter(p => p.flash);
    const container = document.getElementById('flash-products');
    if (!container) return;
    
    container.innerHTML = flashProducts.map(product => `
        <div class="product-card">
            <div class="product-badge flash">🔥 Flash Sale</div>
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
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
// NOTIFICATION
// ============================================
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
// CHECKOUT & M-PESA
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
    
    document.getElementById('order-total-amount').textContent = formatPrice(subtotal);
}

function initCheckout() {
    const checkoutClose = document.querySelector('.checkout-close');
    const paymentOptions = document.querySelectorAll('.payment-option');
    const stkPushBtn = document.getElementById('stk-push-checkout');
    const verifyBtn = document.getElementById('verify-transaction');
    const cashOrderBtn = document.getElementById('confirm-cash-order');
    const paymentStatus = document.getElementById('payment-status');
    
    if (checkoutClose) {
        checkoutClose.addEventListener('click', () => {
            document.getElementById('checkout-modal').style.display = 'none';
        });
    }
    
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            paymentOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const paymentMethod = option.dataset.payment;
            document.querySelectorAll('.payment-form').forEach(form => form.classList.remove('active'));
            document.getElementById(`${paymentMethod}-payment`).classList.add('active');
        });
    });
    
    if (stkPushBtn) {
        stkPushBtn.addEventListener('click', () => {
            const phone = document.getElementById('checkout-phone').value;
            if (!phone) {
                paymentStatus.innerHTML = 'Please enter your phone number';
                paymentStatus.className = 'payment-status error';
                return;
            }
            
            paymentStatus.innerHTML = 'Sending payment request to your phone...';
            paymentStatus.className = 'payment-status';
            
            setTimeout(() => {
                paymentStatus.innerHTML = '✅ Payment request sent! Check your phone and enter PIN to complete.';
                paymentStatus.className = 'payment-status success';
            }, 1500);
        });
    }
    
    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => {
            const transCode = document.getElementById('transaction-code').value;
            if (!transCode) {
                paymentStatus.innerHTML = 'Please enter your transaction code';
                paymentStatus.className = 'payment-status error';
                return;
            }
            
            paymentStatus.innerHTML = 'Verifying payment...';
            paymentStatus.className = 'payment-status';
            
            setTimeout(() => {
                paymentStatus.innerHTML = '✅ Payment verified! Thank you for your order.';
                paymentStatus.className = 'payment-status success';
                
                // Clear cart
                cart = [];
                saveCart();
                updateCartDisplay();
                
                setTimeout(() => {
                    document.getElementById('checkout-modal').style.display = 'none';
                    showNotification('Order placed successfully!', 'success');
                }, 2000);
            }, 1500);
        });
    }
    
    if (cashOrderBtn) {
        cashOrderBtn.addEventListener('click', () => {
            showNotification('Order placed! You will pay on delivery.', 'success');
            cart = [];
            saveCart();
            updateCartDisplay();
            document.getElementById('checkout-modal').style.display = 'none';
        });
    }
}

// ============================================
// SEARCH & FILTERS
// ============================================
function initSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryLinks = document.querySelectorAll('[data-category]');
    const sortSelect = document.getElementById('sort-select');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const noResults = document.getElementById('no-results');
    
    function updateAllProducts() {
        let filtered = products;
        
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
        
        if (toShow.length === 0) {
            noResults.style.display = 'block';
            container.innerHTML = '';
            return;
        }
        
        noResults.style.display = 'none';
        
        container.innerHTML = toShow.map(product => `
            <div class="product-card">
                ${product.badge ? `<div class="product-badge ${product.badge === 'flash' ? 'flash' : ''}">${product.badge === 'flash' ? '🔥 Flash Sale' : '✨ New'}</div>` : ''}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
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
        
        if (loadMoreBtn) {
            loadMoreBtn.style.display = filtered.length > displayedProducts ? 'block' : 'none';
        }
    }
    
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
// INITIALIZE EVERYTHING
// ============================================
function init() {
    renderFlashSales();
    renderProducts('featured-products', products, true);
    startCountdown();
    initHeroSlider();
    initCartModal();
    initCheckout();
    initSearchAndFilters();
    initCategoryCards();
    initMobileMenu();
    initNewsletter();
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', init);