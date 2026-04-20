const express = require('express');
const router = express.Router();
const { Emergency } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { type, description, location, coordinates, area, severity } = req.body;
    const emergency = await Emergency.create({
      triggeredBy: req.user._id, type, description, location,
      area: area || req.user.area, severity: severity || 'high', coordinates
    });
    req.app.get('io')?.emit('emergency_broadcast', {
      id: emergency._id, type, description, location,
      area: area || req.user.area, severity: severity || 'high',
      triggeredBy: { name: req.user.name, phone: req.user.phone },
      timestamp: new Date()
    });
    res.status(201).json({ success: true, emergency, message: 'Emergency alert sent to all community members!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/', protect, async (req, res) => {
  try {
    const emergencies = await Emergency.find({ status: { $ne: 'resolved' } })
      .populate('triggeredBy', 'name phone area').sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, emergencies });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/respond', protect, async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(req.params.id,
      { $addToSet: { respondedBy: req.user._id }, status: 'responding' }, { new: true });
    req.app.get('io')?.emit('emergency_response', { emergencyId: emergency._id, responder: req.user.name });
    res.json({ success: true, emergency });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/resolve', protect, adminOnly, async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(req.params.id, { status: 'resolved', resolvedAt: new Date() }, { new: true });
    req.app.get('io')?.emit('emergency_resolved', { emergencyId: emergency._id });
    res.json({ success: true, emergency });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
