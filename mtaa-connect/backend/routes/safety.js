const express = require('express');
const router = express.Router();
const { Safety } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const report = await Safety.create({ ...req.body, reportedBy: req.user._id });
    req.app.get('io')?.to('admins').emit('new_safety_report', { type: report.type, id: report._id });
    res.status(201).json({ success: true, report, message: 'Report received confidentially. A support officer will reach out within 24 hours.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const reports = await Safety.find().sort({ createdAt: -1 }).populate('reportedBy', 'name phone area');
    res.json({ success: true, reports });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const r = await Safety.findByIdAndUpdate(req.params.id, { status: req.body.status, assignedTo: req.user._id, notes: req.body.notes }, { new: true });
    res.json({ success: true, report: r });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
