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
    // Use the existing images folder in your project
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
      console.log('📁 Created images folder');
    }
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const productNumber = req.body.productNumber;
    
    if (productNumber && productNumber >= 1 && productNumber <= 100) {
      cb(null, `product${productNumber}${ext}`);
    } else {
      const timestamp = Date.now();
      cb(null, `image-${timestamp}${ext}`);
    }
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

// Use your existing images folder
const imagesDir = path.join(__dirname, 'images');

// Ensure images folder exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('📁 Created images folder');
} else {
  // Count existing images
  const existingImages = fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  console.log(`📸 Found ${existingImages.length} images in your images folder`);
}

// Serve images statically from your images folder
app.use('/images', express.static(imagesDir));

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'yetu2025'
};

// Store active admin sessions
const activeSessions = new Map();

// Product storage
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
let products = [];

// Load products from file
try {
  if (fs.existsSync(PRODUCTS_FILE)) {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    products = JSON.parse(data);
    console.log(`✅ Loaded ${products.length} products from database`);
    
    // Verify which product images exist in your images folder
    if (fs.existsSync(imagesDir)) {
      const existingImages = fs.readdirSync(imagesDir);
      products.forEach(product => {
        if (product.productNumber) {
          const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          let imageExists = false;
          for (const ext of possibleExtensions) {
            if (existingImages.includes(`product${product.productNumber}${ext}`)) {
              imageExists = true;
              break;
            }
          }
          if (!imageExists) {
            console.log(`⚠️ Warning: Image product${product.productNumber} not found in images folder`);
          }
        }
      });
    }
  } else {
    products = [];
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    console.log(`📦 Created empty products database`);
  }
} catch (error) {
  console.error('Error loading products:', error);
  products = [];
}

function saveProducts() {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    console.log(`💾 Saved ${products.length} products to database`);
    return true;
  } catch (error) {
    console.error('Error saving products:', error);
    return false;
  }
}

// ============================================
// ADMIN AUTHENTICATION ENDPOINTS
// ============================================

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

app.post('/api/admin/verify', (req, res) => {
  const { token } = req.body;
  
  if (token && activeSessions.has(token)) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

app.post('/api/admin/logout', (req, res) => {
  const { token } = req.body;
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// ============================================
// IMAGE MANAGEMENT ENDPOINTS
// ============================================

// Get all images from your images folder
app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(imagesDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const match = file.match(/product(\d+)\./);
        const productNumber = match ? parseInt(match[1]) : null;
        const stats = fs.statSync(path.join(imagesDir, file));
        return {
          name: file,
          url: `/images/${file}`,
          productNumber: productNumber,
          size: stats.size,
          uploadedAt: stats.mtime
        };
      })
      .sort((a, b) => {
        if (a.productNumber && b.productNumber) {
          return a.productNumber - b.productNumber;
        }
        return a.name.localeCompare(b.name);
      });
    res.json({ success: true, images, folder: 'images' });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// Upload new image to your images folder
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/images/${req.file.filename}`;
    console.log(`✅ Image uploaded to images folder: ${imageUrl}`);
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      filename: req.file.filename,
      message: 'Image uploaded successfully to images folder'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload product image with specific product number
app.post('/api/upload-product-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const productNumber = req.body.productNumber;
    let imageUrl = `/images/${req.file.filename}`;
    
    if (productNumber && productNumber >= 1 && productNumber <= 100) {
      const ext = path.extname(req.file.filename);
      const newFilename = `product${productNumber}${ext}`;
      const oldPath = path.join(imagesDir, req.file.filename);
      const newPath = path.join(imagesDir, newFilename);
      
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      }
      
      fs.renameSync(oldPath, newPath);
      imageUrl = `/images/${newFilename}`;
      console.log(`✅ Product image saved to images folder: ${imageUrl}`);
    }
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      filename: req.file.filename,
      message: 'Product image saved to images folder'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload bulk product images
app.post('/api/upload-bulk-products', upload.array('images', 100), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadedFiles = [];
    const startNumber = parseInt(req.body.startNumber) || 1;
    
    for (let i = 0; i < req.files.length && i < 100; i++) {
      const file = req.files[i];
      const productNumber = startNumber + i;
      
      if (productNumber <= 100) {
        const ext = path.extname(file.filename);
        const newFilename = `product${productNumber}${ext}`;
        const oldPath = path.join(imagesDir, file.filename);
        const newPath = path.join(imagesDir, newFilename);
        
        if (fs.existsSync(newPath)) {
          fs.unlinkSync(newPath);
        }
        
        fs.renameSync(oldPath, newPath);
        uploadedFiles.push({
          productNumber: productNumber,
          url: `/images/${newFilename}`,
          filename: newFilename
        });
      }
    }
    
    console.log(`✅ Uploaded ${uploadedFiles.length} product images to images folder`);
    res.json({ 
      success: true, 
      uploadedFiles: uploadedFiles,
      message: `${uploadedFiles.length} product images uploaded to images folder`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Delete image from images folder
app.delete('/api/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(imagesDir, filename);
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`🗑️ Deleted image: ${filename} from images folder`);
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// ============================================
// PRODUCT API ENDPOINTS
// ============================================

app.get('/api/products', (req, res) => {
  // Verify images exist in your images folder
  const validProducts = products.map(product => {
    if (product.image && product.image.startsWith('/images/')) {
      const imagePath = path.join(__dirname, product.image);
      if (!fs.existsSync(imagePath)) {
        return { ...product, image: null, imageMissing: true };
      }
    }
    return product;
  });
  res.json(validProducts);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  if (product) {
    if (product.image && product.image.startsWith('/images/')) {
      const imagePath = path.join(__dirname, product.image);
      if (!fs.existsSync(imagePath)) {
        return res.json({ ...product, image: null, imageMissing: true });
      }
    }
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Add new product
app.post('/api/products', (req, res) => {
  const { name, category, price, oldPrice, imageUrl, flash, description, productNumber } = req.body;
  
  let finalImageUrl = imageUrl;
  if (productNumber && !imageUrl) {
    // Check if product image exists in your images folder
    const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    for (const ext of possibleExtensions) {
      const imagePath = path.join(imagesDir, `product${productNumber}${ext}`);
      if (fs.existsSync(imagePath)) {
        finalImageUrl = `/images/product${productNumber}${ext}`;
        break;
      }
    }
  }
  
  const newProduct = {
    id: Date.now(),
    productNumber: productNumber || null,
    name: name,
    category: category,
    price: parseInt(price),
    oldPrice: oldPrice ? parseInt(oldPrice) : null,
    rating: 4.5,
    reviews: 0,
    image: finalImageUrl || '',
    badge: flash ? 'flash' : null,
    flash: flash === true || flash === 'true',
    description: description || '',
    createdAt: new Date().toISOString()
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
  
  products[index] = { ...products[index], ...req.body, updatedAt: new Date().toISOString() };
  saveProducts();
  res.json({ success: true, product: products[index] });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const deletedProduct = products[index];
  products.splice(index, 1);
  saveProducts();
  res.json({ success: true, message: 'Product deleted' });
});

// Bulk create products from images in your images folder
app.post('/api/bulk-create-products', async (req, res) => {
  const { category, price, flash } = req.body;
  
  try {
    const files = fs.readdirSync(imagesDir);
    const productImages = files
      .filter(file => /^product(\d+)\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const match = file.match(/product(\d+)\./);
        return {
          number: parseInt(match[1]),
          url: `/images/${file}`
        };
      })
      .sort((a, b) => a.number - b.number);
    
    const createdProducts = [];
    
    for (const img of productImages) {
      const existingProduct = products.find(p => p.productNumber === img.number);
      if (!existingProduct) {
        const newProduct = {
          id: Date.now() + img.number,
          productNumber: img.number,
          name: `Product ${img.number}`,
          category: category || 'accessories',
          price: parseInt(price) || 1000,
          oldPrice: null,
          rating: 4.5,
          reviews: 0,
          image: img.url,
          badge: flash ? 'flash' : null,
          flash: flash === true || flash === 'true',
          description: `Product ${img.number} - High quality electronics product`,
          createdAt: new Date().toISOString()
        };
        products.push(newProduct);
        createdProducts.push(newProduct);
      }
    }
    
    if (createdProducts.length > 0) {
      saveProducts();
    }
    
    res.json({ 
      success: true, 
      created: createdProducts.length,
      products: createdProducts,
      message: `Created ${createdProducts.length} products from images in your images folder`
    });
  } catch (error) {
    console.error('Error bulk creating products:', error);
    res.status(500).json({ error: 'Failed to bulk create products' });
  }
});

// ============================================
// M-PESA CONFIGURATION (Keep your existing code)
// ============================================

const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '75ZYqCx3xbXvAt3ymvRZ4EsewrJDhnUCEUwkAWyAJwGWE78E',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'Z2nJOAZb1XqBrdjaWejH0rhxl9ff1DLSy6Sj7GWlUpXMlOTFDaKvV2zIad3vjBRl',
  businessShortCode: '174379',
  passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  environment: process.env.NODE_ENV || 'sandbox'
};

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
    console.error('Error getting access token:', error.response?.data || error.message);
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
    const callbackUrl = process.env.RENDER_EXTERNAL_HOSTNAME 
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/api/mpesa-callback`
      : `https://${req.get('host')}/api/mpesa-callback`;
    
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
    console.error('STK Push Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.errorMessage || 'Payment request failed. Please try again.' 
    });
  }
});

app.post('/api/mpesa-callback', (req, res) => {
  console.log('M-Pesa Callback received');
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
      console.log('PAYMENT SUCCESSFUL!', { 
        checkoutRequestID: CheckoutRequestID, 
        amount: metadata.Amount, 
        receipt: metadata.MpesaReceiptNumber 
      });
      if (transaction) transaction.status = 'completed';
    } else {
      console.log('PAYMENT FAILED:', ResultDesc);
      if (transaction) transaction.status = 'failed';
    }
  }
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

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
  const imageCount = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).length : 0;
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(), 
    location: 'Eldoret, Kenya', 
    store: 'Yetu Electronics',
    products: products.length,
    imagesCount: imageCount,
    imagesFolder: imagesDir,
    environment: process.env.RENDER ? 'render' : 'development'
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
  console.log(`🌍 Environment: ${process.env.RENDER ? 'Render (Production)' : 'Development'}`);
  console.log(`📁 Images folder: ${imagesDir}`);
  
  if (fs.existsSync(imagesDir)) {
    const images = fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    console.log(`📸 Images in folder: ${images.length}`);
    const productImages = images.filter(f => f.startsWith('product'));
    if (productImages.length > 0) {
      console.log(`   - Product images: ${productImages.length} (product1.jpg, product2.jpg, etc.)`);
      console.log(`   - Example: ${productImages.slice(0, 5).join(', ')}${productImages.length > 5 ? '...' : ''}`);
    }
  }
  
  console.log(`💾 Products in database: ${products.length}`);
  console.log(`👤 Admin Login: admin / yetu2025`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    console.log(`🌍 Live URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
  }
});
