const express = require('express');
const router = express.Router();
const { Donation } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find({ status: { $in: ['pending', 'verified'] } })
      .populate('requestedBy', 'name avatar area').sort({ urgency: -1, createdAt: -1 });
    res.json({ success: true, donations });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const donation = await Donation.create({ ...req.body, requestedBy: req.user._id });
    req.app.get('io')?.to('admins').emit('new_donation_request', { id: donation._id, area: donation.area });
    res.status(201).json({ success: true, donation });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const d = await Donation.findByIdAndUpdate(req.params.id, { status: 'verified', verifiedBy: req.user._id }, { new: true });
    res.json({ success: true, donation: d });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/respond', protect, async (req, res) => {
  try {
    const d = await Donation.findById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: 'Request not found.' });
    d.responses.push({ ngo: req.user._id, message: req.body.message || 'We can help.', date: new Date() });
    await d.save();
    res.json({ success: true, message: 'Response recorded.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
