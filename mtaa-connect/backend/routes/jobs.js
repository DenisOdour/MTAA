const express = require('express');
const router = express.Router();
const { Job } = require('../models/index');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const query = { status: 'active' };
    if (category && category !== 'all') query.category = category;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tierOrder = { sponsored: 3, featured: 2, free: 1 };
    const [jobs, total] = await Promise.all([
      Job.find(query).populate('postedBy', 'name avatar area').skip(skip).limit(parseInt(limit))
        .sort({ tier: -1, createdAt: -1 }).lean(),
      Job.countDocuments(query)
    ]);
    res.json({ success: true, jobs, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    req.app.get('io')?.emit('new_job', { jobId: job._id, title: job.title, location: job.location, pay: job.pay });
    res.status(201).json({ success: true, job });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/apply', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.applicants.some(a => a.toString() === req.user._id.toString())) {
      return res.status(400).json({ success: false, message: 'You already applied for this job.' });
    }
    job.applicants.push(req.user._id);
    await job.save();
    req.app.get('io')?.to(job.postedBy.toString()).emit('job_application', { jobId: job._id, applicantName: req.user.name, applicantPhone: req.user.phone });
    res.json({ success: true, message: 'Application sent! The employer will contact you via phone.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
