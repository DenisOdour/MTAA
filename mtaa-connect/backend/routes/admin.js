const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Post, Job, Business, Payment, Emergency, Report, Donation, Safety } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, approvedPosts, pendingPosts, activeJobs, activeBusinesses, revenueAgg, activeEmergencies, openReports, pendingDonations, safetyCases] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ status: { $in: ['approved','featured'] } }),
      Post.countDocuments({ status: 'pending' }),
      Job.countDocuments({ status: 'active' }),
      Business.countDocuments({ isActive: true }),
      Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Emergency.countDocuments({ status: 'active' }),
      Report.countDocuments({ status: 'open' }),
      Donation.countDocuments({ status: 'pending' }),
      Safety.countDocuments({ status: 'new' })
    ]);
    const [recentPayments, recentUsers] = await Promise.all([
      Payment.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(10).populate('user', 'name phone'),
      User.find().sort({ createdAt: -1 }).limit(10).select('name phone area role createdAt')
    ]);
    res.json({
      success: true,
      stats: { totalUsers, approvedPosts, pendingPosts, activeJobs, activeBusinesses, revenue: revenueAgg[0]?.total || 0, activeEmergencies, openReports, pendingDonations, safetyCases },
      recentPayments, recentUsers
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }, { username: new RegExp(search, 'i') }];
    if (role) query.role = role;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    res.json({ success: true, users, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id/ban', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: req.body.ban }, { new: true });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role, adminCategories: req.body.adminCategories || [] }, { new: true });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
