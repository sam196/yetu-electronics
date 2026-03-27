// ============================================
// ADMIN PANEL - IMAGE UPLOAD
// ============================================

const ADMIN_PASSWORD = 'admin123'; // Change this to your desired password

let adminPanel = document.getElementById('admin-panel');
let adminLoginBtn = document.getElementById('admin-login-btn');

// Admin Login
function showAdminLogin() {
    const modal = document.createElement('div');
    modal.className = 'admin-login-modal';
    modal.innerHTML = `
        <div class="admin-login-content">
            <h3>Admin Login</h3>
            <input type="password" id="admin-password" placeholder="Enter password">
            <button id="admin-login-submit" class="submit-btn">Login</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    document.getElementById('admin-login-submit').onclick = () => {
        const password = document.getElementById('admin-password').value;
        if (password === ADMIN_PASSWORD) {
            modal.remove();
            adminPanel.classList.add('open');
        } else {
            alert('Wrong password!');
        }
    };
}

if (adminLoginBtn) {
    adminLoginBtn.onclick = showAdminLogin;
}

// Close admin panel
const closeAdmin = document.getElementById('close-admin');
if (closeAdmin) {
    closeAdmin.onclick = () => {
        adminPanel.classList.remove('open');
    };
}

// Admin Tabs
const adminTabs = document.querySelectorAll('.admin-tab');
adminTabs.forEach(tab => {
    tab.onclick = () => {
        adminTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabId = tab.dataset.tab;
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
    };
});

// Image Preview for Add Product
const productImageInput = document.getElementById('product-image');
const imagePreview = document.getElementById('image-preview');

if (productImageInput) {
    productImageInput.onchange = (e) => {
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
    };
}

// Add Product Form
const addProductForm = document.getElementById('add-product-form');
if (addProductForm) {
    addProductForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('product-name').value;
        const category = document.getElementById('product-category').value;
        const price = document.getElementById('product-price').value;
        const oldPrice = document.getElementById('product-old-price').value;
        const description = document.getElementById('product-description').value;
        const flash = document.getElementById('product-flash').checked;
        const imageFile = document.getElementById('product-image').files[0];
        
        let imageUrl = '/uploads/default-product.jpg';
        
        // Upload image if selected
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
        
        // Add product
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, category, price, oldPrice, description, imageUrl, flash
            })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Product added successfully!');
            addProductForm.reset();
            imagePreview.innerHTML = '';
            loadProductsList();
        } else {
            alert('Failed to add product');
        }
    };
}

// Load Products List for Management
async function loadProductsList() {
    const response = await fetch('/api/products');
    const products = await response.json();
    
    const container = document.getElementById('products-list');
    if (container) {
        container.innerHTML = products.map(product => `
            <div class="product-admin-item">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='/uploads/default-product.jpg'">
                <div class="product-admin-info">
                    <h5>${product.name}</h5>
                    <p>KSh ${product.price.toLocaleString()} | ${product.category}</p>
                </div>
                <button class="delete-product" data-id="${product.id}">Delete</button>
            </div>
        `).join('');
        
        // Delete product handlers
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Are you sure you want to delete this product?')) {
                    const id = btn.dataset.id;
                    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                        loadProductsList();
                        alert('Product deleted');
                    }
                }
            };
        });
    }
}

// Bulk Image Upload
const bulkImagesInput = document.getElementById('bulk-images');
const bulkPreview = document.getElementById('bulk-preview');
const bulkUploadForm = document.getElementById('bulk-upload-form');

if (bulkImagesInput) {
    bulkImagesInput.onchange = (e) => {
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
    };
}

if (bulkUploadForm) {
    bulkUploadForm.onsubmit = async (e) => {
        e.preventDefault();
        const files = bulkImagesInput.files;
        const uploadedUrls = [];
        
        for (const file of files) {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                uploadedUrls.push(data.imageUrl);
            }
        }
        
        alert(`Uploaded ${uploadedUrls.length} images`);
        loadUploadedImages();
        bulkUploadForm.reset();
        bulkPreview.innerHTML = '';
    };
}

// Load Uploaded Images
async function loadUploadedImages() {
    // This would require a directory listing endpoint
    // For now, we'll just show a message
    const container = document.getElementById('uploaded-images');
    if (container) {
        container.innerHTML = '<p>Images uploaded. You can copy the URL from the Add Product form after uploading.</p>';
    }
}

// Load products list when admin panel opens
if (adminPanel) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList && mutation.target.classList.contains('open')) {
                loadProductsList();
                loadUploadedImages();
            }
        });
    });
    observer.observe(adminPanel, { attributes: true });
}
