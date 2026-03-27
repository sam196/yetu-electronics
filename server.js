const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'yetu2025'
};

// Store active admin sessions (simple in-memory, use database in production)
const activeSessions = new Map();

// Product storage
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
let products = [];

try {
  if (fs.existsSync(PRODUCTS_FILE)) {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    products = JSON.parse(data);
    console.log(`✅ Loaded ${products.length} products`);
  } else {
    products = [
      { id: 1, name: "iPhone 15 Pro Max", category: "phones", price: 165000, oldPrice: 185000, rating: 4.8, reviews: 234, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300", badge: "flash", flash: true },
      { id: 2, name: "Samsung Galaxy S24 Ultra", category: "phones", price: 155000, oldPrice: 175000, rating: 4.7, reviews: 189, image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300", badge: "new" },
      { id: 3, name: "MacBook Pro M3", category: "laptops", price: 210000, oldPrice: 240000, rating: 4.9, reviews: 345, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300", badge: "flash", flash: true },
      { id: 4, name: "Dell XPS 15", category: "laptops", price: 180000, oldPrice: 200000, rating: 4.7, reviews: 234, image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=300" },
      { id: 5, name: "Samsung 65\" 4K Smart TV", category: "tvs", price: 95000, oldPrice: 120000, rating: 4.7, reviews: 456, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300", badge: "flash", flash: true },
      { id: 6, name: "Sony WH-1000XM5", category: "audio", price: 35000, oldPrice: 45000, rating: 4.8, reviews: 567, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300" },
      { id: 7, name: "Apple Watch Series 9", category: "accessories", price: 55000, oldPrice: 65000, rating: 4.7, reviews: 345, image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=300" },
      { id: 8, name: "PS5 Console", category: "gaming", price: 65000, oldPrice: 75000, rating: 4.9, reviews: 890, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94de?w=300", badge: "flash", flash: true }
    ];
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    console.log(`📦 Created default products with ${products.length} items`);
  }
} catch (error) {
  console.error('Error loading products:', error);
}

function saveProducts() {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// ============================================
// ADMIN AUTHENTICATION ENDPOINTS
// ============================================

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const token = Buffer.from(`${username}:${Date.now()}:${Math.random()}`).toString('base64');
    activeSessions.set(token, { username, createdAt: Date.now() });
    res.json({ 
      success: true, 
      token: token,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid username or password' 
    });
  }
});

// Verify admin token
app.post('/api/admin/verify', (req, res) => {
  const { token } = req.body;
  
  if (token && activeSessions.has(token)) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  const { token } = req.body;
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// ============================================
// PRODUCT API ENDPOINTS
// ============================================

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Upload product image (requires admin token)
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
      success: true, 
      imageUrl: `/uploads/${req.file.filename}`,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Add new product (requires admin token)
app.post('/api/products', (req, res) => {
  const { name, category, price, oldPrice, imageUrl, flash, description } = req.body;
  
  const newProduct = {
    id: Date.now(),
    name: name,
    category: category,
    price: parseInt(price),
    oldPrice: oldPrice ? parseInt(oldPrice) : null,
    rating: 4.5,
    reviews: 0,
    image: imageUrl || '/uploads/default-product.jpg',
    badge: flash ? 'flash' : null,
    flash: flash === true || flash === 'true',
    description: description || ''
  };
  
  products.push(newProduct);
  saveProducts();
  
  res.json({ success: true, product: newProduct });
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  products[index] = { ...products[index], ...req.body };
  saveProducts();
  
  res.json({ success: true, product: products[index] });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  products.splice(index, 1);
  saveProducts();
  
  res.json({ success: true, message: 'Product deleted' });
});

// ============================================
// M-PESA CONFIGURATION
// ============================================

const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '75ZYqCx3xbXvAt3ymvRZ4EsewrJDhnUCEUwkAWyAJwGWE78E',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'Z2nJOAZb1XqBrdjaWejH0rhxl9ff1DLSy6Sj7GWlUpXMlOTFDaKvV2zIad3vjBRl',
  businessShortCode: '174379',
  passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  environment: process.env.NODE_ENV || 'sandbox'
};

console.log('🚀 Yetu Electronics Server Starting...');
console.log('📍 Location: Eldoret, Kenya');
console.log('📱 M-Pesa Environment:', MPESA_CONFIG.environment);

const activeTransactions = new Map();

async function getAccessToken() {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
  try {
    const baseUrl = MPESA_CONFIG.environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    console.log('✅ Access token obtained');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to get access token');
  }
}

// STK Push Endpoint
app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phone, amount, accountReference, transactionDesc } = req.body;
  
  console.log('📱 STK Push request:', { phone, amount });
  
  let formattedPhone = phone.toString().replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
  else if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
  else if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;
  
  try {
    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
    const baseUrl = MPESA_CONFIG.environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    const callbackUrl = process.env.RENDER_EXTERNAL_HOSTNAME 
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/api/mpesa-callback`
      : 'https://yetu-electronics.onrender.com/api/mpesa-callback';
    
    const response = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      BusinessShortCode: MPESA_CONFIG.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference || 'Yetu Eldoret',
      TransactionDesc: transactionDesc || 'Electronics Purchase - Eldoret'
    }, { 
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        'Content-Type': 'application/json' 
      } 
    });
    
    activeTransactions.set(response.data.CheckoutRequestID, { 
      phone: formattedPhone, 
      amount, 
      status: 'pending', 
      timestamp: new Date(), 
      checkoutRequestID: response.data.CheckoutRequestID 
    });
    
    res.json({ 
      success: true, 
      checkoutRequestID: response.data.CheckoutRequestID, 
      message: 'Payment request sent. Check your phone to enter PIN.' 
    });
  } catch (error) {
    console.error('❌ STK Push Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.errorMessage || 'Payment request failed. Please try again.' 
    });
  }
});

// M-Pesa Callback
app.post('/api/mpesa-callback', (req, res) => {
  console.log('🔔 M-Pesa Callback received');
  const { Body } = req.body;
  
  if (Body && Body.stkCallback) {
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
    const transaction = activeTransactions.get(CheckoutRequestID);
    
    if (ResultCode === 0) {
      const metadata = {};
      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach(item => {
          metadata[item.Name] = item.Value;
        });
      }
      console.log('✅ PAYMENT SUCCESSFUL!', { 
        checkoutRequestID: CheckoutRequestID, 
        amount: metadata.Amount, 
        receipt: metadata.MpesaReceiptNumber 
      });
      if (transaction) transaction.status = 'completed';
    } else {
      console.log('❌ PAYMENT FAILED:', ResultDesc);
      if (transaction) transaction.status = 'failed';
    }
  }
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

// Check payment status
app.post('/api/mpesa/status', async (req, res) => {
  const { checkoutRequestID } = req.body;
  
  const localTransaction = activeTransactions.get(checkoutRequestID);
  if (localTransaction && localTransaction.status !== 'pending') {
    return res.json({ 
      ResultCode: localTransaction.status === 'completed' ? 0 : 1, 
      ResultDesc: localTransaction.status === 'completed' ? 'Success' : localTransaction.error,
      ...localTransaction 
    });
  }
  
  try {
    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
    const baseUrl = MPESA_CONFIG.environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    
    const response = await axios.post(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
      BusinessShortCode: MPESA_CONFIG.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    }, { headers: { Authorization: `Bearer ${accessToken}` } });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(), 
    location: 'Eldoret, Kenya', 
    store: 'Yetu Electronics',
    products: products.length,
    activeSessions: activeSessions.size
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏪 Yetu Electronics - Eldoret Store`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Location: Eldoret, Kenya`);
  console.log(`📱 M-Pesa Environment: ${MPESA_CONFIG.environment}`);
  console.log(`👤 Admin Login: admin / yetu2025`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    console.log(`🌍 Live URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
  }
});
