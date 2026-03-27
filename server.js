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
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for images only
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// PRODUCT MANAGEMENT (with images)
// ============================================

// File to store products data
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// Load products from file or use default
let products = [];
try {
  if (fs.existsSync(PRODUCTS_FILE)) {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    products = JSON.parse(data);
    console.log(`✅ Loaded ${products.length} products from file`);
  } else {
    // Default products
    products = [
      { id: 1, name: "iPhone 15 Pro Max", category: "phones", price: 165000, oldPrice: 185000, rating: 4.8, reviews: 234, image: "/uploads/sample-iphone.jpg", badge: "flash", flash: true },
      { id: 2, name: "Samsung Galaxy S24 Ultra", category: "phones", price: 155000, oldPrice: 175000, rating: 4.7, reviews: 189, image: "/uploads/sample-samsung.jpg", badge: "new" },
      { id: 3, name: "MacBook Pro M3", category: "laptops", price: 210000, oldPrice: 240000, rating: 4.9, reviews: 345, image: "/uploads/sample-macbook.jpg", badge: "flash", flash: true }
    ];
    saveProducts();
    console.log(`📦 Created default products file with ${products.length} products`);
  }
} catch (error) {
  console.error('Error loading products:', error);
}

// Save products to file
function saveProducts() {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  console.log('💾 Products saved to file');
}

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

// Upload product image
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl: imageUrl,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Add new product
app.post('/api/products', (req, res) => {
  const { name, category, price, oldPrice, description, imageUrl, badge, flash } = req.body;
  
  const newProduct = {
    id: Date.now(),
    name,
    category,
    price: parseInt(price),
    oldPrice: oldPrice ? parseInt(oldPrice) : null,
    rating: 4.5,
    reviews: 0,
    image: imageUrl || '/uploads/default-product.jpg',
    badge: badge || null,
    flash: flash === 'true' || false,
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
  
  // Optionally delete image file
  const product = products[index];
  if (product.image && product.image.startsWith('/uploads/')) {
    const imagePath = path.join(__dirname, product.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
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

// Store active transactions
const activeTransactions = new Map();

// Get Access Token
async function getAccessToken() {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
  
  try {
    const baseUrl = MPESA_CONFIG.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
      
    const response = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    console.log('✅ Access token obtained successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to get access token');
  }
}

// STK Push Endpoint
app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phone, amount, accountReference, transactionDesc } = req.body;
  
  console.log('📱 STK Push request received from Eldoret store:', { phone, amount });
  
  let formattedPhone = phone.toString().replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('254')) {
    formattedPhone = '254' + formattedPhone;
  }
  
  try {
    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`
    ).toString('base64');
    
    const baseUrl = MPESA_CONFIG.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    
    const callbackUrl = process.env.RENDER_EXTERNAL_HOSTNAME 
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/api/mpesa-callback`
      : 'https://yetu-electronics.onrender.com/api/mpesa-callback';
    
    const requestData = {
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
    };
    
    const response = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    activeTransactions.set(response.data.CheckoutRequestID, {
      phone: formattedPhone,
      amount: amount,
      status: 'pending',
      timestamp: new Date(),
      checkoutRequestID: response.data.CheckoutRequestID,
      store: 'Yetu Electronics - Eldoret'
    });
    
    res.json({
      success: true,
      checkoutRequestID: response.data.CheckoutRequestID,
      message: 'Payment request sent. Please check your phone to enter PIN and complete payment.'
    });
  } catch (error) {
    console.error('❌ STK Push Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.errorMessage || 'Payment request failed. Please try again.'
    });
  }
});

// M-Pesa Callback Endpoint
app.post('/api/mpesa-callback', (req, res) => {
  console.log('🔔 M-Pesa Callback received at:', new Date().toISOString());
  
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
      
      console.log('✅ PAYMENT SUCCESSFUL - Yetu Electronics Eldoret!', {
        checkoutRequestID: CheckoutRequestID,
        amount: metadata.Amount,
        receiptNumber: metadata.MpesaReceiptNumber,
        phoneNumber: metadata.PhoneNumber
      });
      
      if (transaction) {
        transaction.status = 'completed';
        transaction.receiptNumber = metadata.MpesaReceiptNumber;
      }
    } else {
      console.log('❌ PAYMENT FAILED:', ResultDesc);
      if (transaction) {
        transaction.status = 'failed';
        transaction.error = ResultDesc;
      }
    }
  }
  
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

// Check Payment Status
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
    const password = Buffer.from(
      `${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`
    ).toString('base64');
    
    const baseUrl = MPESA_CONFIG.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    
    const response = await axios.post(
      `${baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: MPESA_CONFIG.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    location: 'Eldoret, Kenya',
    store: 'Yetu Electronics',
    environment: MPESA_CONFIG.environment,
    paymentMethod: 'M-Pesa STK Push Only',
    products: products.length,
    transactions: activeTransactions.size
  });
});

// Serve frontend for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏪 Yetu Electronics - Eldoret Store`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Location: Eldoret, Kenya`);
  console.log(`📱 M-Pesa Environment: ${MPESA_CONFIG.environment}`);
  console.log(`💳 Payment Method: M-Pesa STK Push Only`);
  console.log(`📸 Image Upload: Enabled`);
  console.log(`📦 Products: ${products.length} products loaded`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    console.log(`🌍 Production URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
  }
});const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// M-Pesa Configuration
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

// Store active transactions
const activeTransactions = new Map();

// Get Access Token
async function getAccessToken() {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
  
  try {
    const baseUrl = MPESA_CONFIG.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
      
    const response = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    console.log('✅ Access token obtained successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to get access token');
  }
}

// STK Push Endpoint
app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phone, amount, accountReference, transactionDesc } = req.body;
  
  console.log('📱 STK Push request received from Eldoret store:', { phone, amount });
  
  // Format phone number to 2547XXXXXXXX
  let formattedPhone = phone.toString().replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('254')) {
    formattedPhone = '254' + formattedPhone;
  }
  
  try {
    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`
    ).toString('base64');
    
    const baseUrl = MPESA_CONFIG.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    
    // Get callback URL
    const callbackUrl = process.env.RENDER_EXTERNAL_HOSTNAME 
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/api/mpesa-callback`
      : 'https://yetu-electronics.onrender.com/api/mpesa-callback';
    
    const requestData = {
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
    };
    
    const response = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Store transaction
    activeTransactions.set(response.data.CheckoutRequestID, {
      phone: formattedPhone,
      amount: amount,
      status: 'pending',
      timestamp: new Date(),
      checkoutRequestID: response.data.CheckoutRequestID,
      store: 'Yetu Electronics - Eldoret'
    });
    
    res.json({
      success: true,
      checkoutRequestID: response.data.CheckoutRequestID,
      message: 'Payment request sent. Please check your phone to enter PIN and complete payment.'
    });
  } catch (error) {
    console.error('❌ STK Push Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.errorMessage || 'Payment request failed. Please try again.'
    });
  }
});

// M-Pesa Callback Endpoint
app.post('/api/mpesa-callback', (req, res) => {
  console.log('🔔 M-Pesa Callback received at:', new Date().toISOString());
  
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
      
      console.log('✅ PAYMENT SUCCESSFUL - Yetu Electronics Eldoret!', {
        checkoutRequestID: CheckoutRequestID,
        amount: metadata.Amount,
        receiptNumber: metadata.MpesaReceiptNumber,
        phoneNumber: metadata.PhoneNumber
      });
      
      if (transaction) {
        transaction.status = 'completed';
        transaction.receiptNumber = metadata.MpesaReceiptNumber;
      }
    } else {
      console.log('❌ PAYMENT FAILED:', ResultDesc);
      if (transaction) {
        transaction.status = 'failed';
        transaction.error = ResultDesc;
      }
    }
  }
  
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

// Check Payment Status
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
    const password = Buffer.from(
      `${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`
    ).toString('base64');
    
    const baseUrl = MPESA_CONFIG.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    
    const response = await axios.post(
      `${baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: MPESA_CONFIG.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    location: 'Eldoret, Kenya',
    store: 'Yetu Electronics',
    environment: MPESA_CONFIG.environment,
    paymentMethod: 'M-Pesa STK Push Only',
    transactions: activeTransactions.size
  });
});

// Serve frontend for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏪 Yetu Electronics - Eldoret Store`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Location: Eldoret, Kenya`);
  console.log(`📱 M-Pesa Environment: ${MPESA_CONFIG.environment}`);
  console.log(`💳 Payment Method: M-Pesa STK Push Only`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    console.log(`🌍 Production URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
  }
});
