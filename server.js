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
      { id: 3, name: "MacBook Pro M3", category: "laptops", price: 210000, oldPrice: 240000, rating: 4.9, reviews: 345, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300", badge: "flash", flash: true }
    ];
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  }
} catch (error) {
  console.error('Error loading products:', error);
}

function saveProducts() {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// API Routes
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ success: true, imageUrl: `/uploads/${req.file.filename}` });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/products', (req, res) => {
  const { name, category, price, oldPrice, imageUrl, flash } = req.body;
  const newProduct = {
    id: Date.now(),
    name,
    category,
    price: parseInt(price),
    oldPrice: oldPrice ? parseInt(oldPrice) : null,
    rating: 4.5,
    reviews: 0,
    image: imageUrl || '/uploads/default-product.jpg',
    badge: flash ? 'flash' : null,
    flash: flash === 'true' || false
  };
  products.push(newProduct);
  saveProducts();
  res.json({ success: true, product: newProduct });
});

app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  products.splice(index, 1);
  saveProducts();
  res.json({ success: true });
});

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

const activeTransactions = new Map();

async function getAccessToken() {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
  try {
    const baseUrl = MPESA_CONFIG.environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to get access token');
  }
}

app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phone, amount, accountReference, transactionDesc } = req.body;
  
  let formattedPhone = phone.toString().replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
  else if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
  else if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;
  
  try {
    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
    const baseUrl = MPESA_CONFIG.environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    const callbackUrl = process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/api/mpesa-callback` : 'https://yetu-electronics.onrender.com/api/mpesa-callback';
    
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
    }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
    
    activeTransactions.set(response.data.CheckoutRequestID, { phone: formattedPhone, amount, status: 'pending', timestamp: new Date(), checkoutRequestID: response.data.CheckoutRequestID });
    res.json({ success: true, checkoutRequestID: response.data.CheckoutRequestID, message: 'Payment request sent. Check your phone.' });
  } catch (error) {
    console.error('❌ STK Push Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.response?.data?.errorMessage || 'Payment request failed.' });
  }
});

app.post('/api/mpesa-callback', (req, res) => {
  console.log('🔔 Callback received');
  const { Body } = req.body;
  if (Body?.stkCallback) {
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
    const transaction = activeTransactions.get(CheckoutRequestID);
    if (ResultCode === 0) {
      const metadata = {};
      if (CallbackMetadata?.Item) CallbackMetadata.Item.forEach(item => { metadata[item.Name] = item.Value; });
      console.log('✅ PAYMENT SUCCESSFUL!', { checkoutRequestID: CheckoutRequestID, amount: metadata.Amount, receipt: metadata.MpesaReceiptNumber });
      if (transaction) transaction.status = 'completed';
    } else {
      console.log('❌ PAYMENT FAILED:', ResultDesc);
      if (transaction) transaction.status = 'failed';
    }
  }
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

app.post('/api/mpesa/status', async (req, res) => {
  const { checkoutRequestID } = req.body;
  const localTransaction = activeTransactions.get(checkoutRequestID);
  if (localTransaction && localTransaction.status !== 'pending') {
    return res.json({ ResultCode: localTransaction.status === 'completed' ? 0 : 1, ResultDesc: localTransaction.status === 'completed' ? 'Success' : localTransaction.error, ...localTransaction });
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
    res.status(500).json({ error: 'Failed to check status' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), location: 'Eldoret, Kenya', store: 'Yetu Electronics', products: products.length });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏪 Yetu Electronics - Eldoret Store`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Location: Eldoret, Kenya`);
  console.log(`📱 M-Pesa Environment: ${MPESA_CONFIG.environment}`);
  console.log(`🌍 URL: http://localhost:${PORT}`);
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    console.log(`🌐 Live: https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
  }
});
