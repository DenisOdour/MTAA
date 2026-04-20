const express = require('express');
const router = express.Router();
const { Payment, Job, Business } = require('../models/index');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// M-PESA Business Account
const MPESA_PHONE = '0706946312';
const MPESA_BUSINESS_NAME = 'Mtaa Connect';

router.post('/initiate', protect, async (req, res) => {
  try {
    const { phone, amount, purpose, metadata } = req.body;
    
    // Create payment record
    const payment = await Payment.create({ 
      user: req.user._id, 
      amount, 
      purpose, 
      phone: phone || req.user.phone, 
      metadata, 
      status: 'pending',
      mpesaPhone: MPESA_PHONE
    });

    // Generate unique reference code
    const paymentRef = `MTAA${payment._id.toString().slice(-8).toUpperCase()}`;

    // Return payment instructions for manual M-Pesa payment
    const paymentInstructions = {
      success: true,
      payment,
      paymentRef,
      instructions: {
        method: 'M-Pesa',
        businessPhone: MPESA_PHONE,
        businessName: MPESA_BUSINESS_NAME,
        amount: amount,
        reference: paymentRef,
        userInstructions: [
          `1. Open M-Pesa on your phone`,
          `2. Go to Send Money > Lipa na M-Pesa Online or use Paybill`,
          `3. Business Number: 174379 (if available)`,
          `4. Or send money directly to: ${MPESA_PHONE}`,
          `5. Use this reference: ${paymentRef}`,
          `6. Amount: KSh ${amount}`,
          `7. After payment, enter the M-Pesa confirmation code below`
        ],
        paymentUrl: `/api/payments/confirm/${payment._id.toString()}`
      },
      message: `Please send KSh ${amount} to ${MPESA_PHONE} with reference: ${paymentRef}`
    };

    res.json(paymentInstructions);
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
});

router.post('/confirm/:paymentId', protect, async (req, res) => {
  try {
    const { mpesaCode } = req.body;
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this payment.' });
    }

    // Process the payment with M-Pesa code
    await processPayment(
      payment._id, 
      payment.purpose, 
      payment.metadata, 
      req.user._id, 
      payment.amount, 
      mpesaCode
    );

    res.json({ 
      success: true, 
      message: 'Payment confirmed successfully!',
      payment: await Payment.findById(payment._id)
    });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
});

async function processPayment(paymentId, purpose, metadata, userId, amount, mpesaCode) {
  await Payment.findByIdAndUpdate(paymentId, { status: 'completed', mpesaCode });
  if (purpose === 'admin_subscription') {
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(userId, { 
      role: 'admin', 
      $addToSet: { adminCategories: metadata?.category }, 
      'subscription.plan': 'admin', 
      'subscription.expiresAt': expiry,
      'subscription.mpesaRef': mpesaCode
    });
  } else if (purpose === 'job_featured' && metadata?.jobId) {
    await Job.findByIdAndUpdate(metadata.jobId, { 
      tier: metadata.tier || 'featured', 
      featuredUntil: new Date(Date.now() + 7*24*60*60*1000), 
      mpesaRef: mpesaCode 
    });
  } else if (purpose === 'business_listing' && metadata?.businessId) {
    await Business.findByIdAndUpdate(metadata.businessId, { 
      plan: metadata.plan || 'basic', 
      isActive: true, 
      planExpiresAt: new Date(Date.now() + 30*24*60*60*1000), 
      mpesaRef: mpesaCode 
    });
  }
}

router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, payments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/pricing', (req, res) => {
  res.json({ success: true, pricing: {
    admin: { jobs: 2000, business_directory: 3500, skills: 1500, stories: 1000, donations: 800 },
    jobs:  { featured: 500, sponsored: 2000 },
    business: { basic: 500, standard: 1200, premium: 2000 }
  }});
});

module.exports = router;
