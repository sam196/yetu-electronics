const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// M-Pesa Configuration with your new credentials
const MPESA_CONFIG = {
  consumerKey: '75ZYqCx3xbXvAt3ymvRZ4EsewrJDhnUCEUwkAWyAJwGWE78E',
  consumerSecret: 'Z2nJOAZb1XqBrdjaWejH0rhxl9ff1DLSy6Sj7GWlUpXMlOTFDaKvV2zIad3vjBRl',
  businessShortCode: '174379', // Lipa Na M-Pesa Online shortcode
  passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', // Default sandbox passkey
  environment: 'sandbox' // 'sandbox' for testing, 'production' for live
};

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
  
  console.log('📱 STK Push request:', { phone, amount });
  
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
    
    // Get callback URL (use Render URL in production)
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
      AccountReference: accountReference || 'Yetu Electronics',
      TransactionDesc: transactionDesc || 'Electronics Purchase'
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
      checkoutRequestID: response.data.CheckoutRequestID
    });
    
    res.json({
      success: true,
      checkoutRequestID: response.data.CheckoutRequestID,
      message: 'Payment request sent. Please check your phone to complete payment.'
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
  console.log('📦 Callback Data:', JSON.stringify(req.body, null, 2));
  
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
        receiptNumber: metadata.MpesaReceiptNumber
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
    environment: MPESA_CONFIG.environment,
    store: 'Yetu Electronics',
    transactions: activeTransactions.size
  });
});

// Serve frontend for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Yetu Electronics running on port ${PORT}`);
  console.log(`📱 M-Pesa Environment: ${MPESA_CONFIG.environment}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    console.log(`🌍 Production URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
  }
});
