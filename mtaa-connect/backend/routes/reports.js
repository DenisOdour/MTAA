const express = require('express');
const router = express.Router();
const { Report } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const reports = await Report.find({ status: { $in: ['open', 'in_progress'] } })
      .populate('reportedBy', 'name area').sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const report = await Report.create({ ...req.body, reportedBy: req.user._id });
    req.app.get('io')?.to('admins').emit('new_report', { type: report.type, location: report.location });
    res.status(201).json({ success: true, report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    const hasVoted = report.upvotes.some(u => u.toString() === req.user._id.toString());
    if (hasVoted) report.upvotes.pull(req.user._id); else report.upvotes.push(req.user._id);
    await report.save();
    res.json({ success: true, upvotes: report.upvotes.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const updates = { status: req.body.status };
    if (req.body.resolution) updates.resolution = req.body.resolution;
    if (req.body.status === 'resolved') updates.resolvedAt = new Date();
    const r = await Report.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, report: r });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
