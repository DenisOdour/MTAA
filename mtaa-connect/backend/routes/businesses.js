const express = require('express');
const router = express.Router();
const { Business } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };
    if (category && category !== 'all') query.category = category;
    const [businesses, total] = await Promise.all([
      Business.find(query).populate('owner', 'name avatar').sort({ plan: -1, averageRating: -1 })
        .skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit)),
      Business.countDocuments(query)
    ]);
    res.json({ success: true, businesses, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const business = await Business.create({ ...req.body, owner: req.user._id, isActive: false });
    res.status(201).json({ success: true, business, message: 'Business submitted! Pay to activate listing.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be 1–5.' });
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });
    business.reviews.push({ user: req.user._id, rating: parseInt(rating), comment });
    business.reviewCount = business.reviews.length;
    business.averageRating = +(business.reviews.reduce((a, r) => a + r.rating, 0) / business.reviews.length).toFixed(1);
    await business.save();
    res.json({ success: true, averageRating: business.averageRating, reviewCount: business.reviewCount });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const biz = await Business.findByIdAndUpdate(req.params.id, { isVerified: true, isActive: true }, { new: true });
    res.json({ success: true, business: biz });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
