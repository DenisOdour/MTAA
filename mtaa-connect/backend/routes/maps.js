const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Business, Job, Emergency, Report } = require('../models/index');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

router.get('/overview', optionalAuth, async (req, res) => {
  try {
    const { lat = -1.2921, lng = 36.8219 } = req.query;
    const [businesses, jobs, emergencies, reports] = await Promise.all([
      Business.find({ isActive: true }).select('name category location coordinates averageRating plan isVerified').limit(50),
      Job.find({ status: 'active' }).select('title category location coordinates pay tier').limit(30),
      Emergency.find({ status: { $ne: 'resolved' }, createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) } }).select('type area coordinates severity status createdAt').limit(20),
      Report.find({ status: { $in: ['open','in_progress'] } }).select('type location coordinates status upvotes createdAt').limit(30)
    ]);
    let userLocations = [];
    if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
      userLocations = await User.find({ locationUpdatedAt: { $gte: new Date(Date.now() - 60*60*1000) } })
        .select('name avatar area role location locationUpdatedAt').limit(100);
    } else if (req.user) {
      userLocations = await User.find({ shareLocation: true, _id: { $ne: req.user._id }, locationUpdatedAt: { $gte: new Date(Date.now() - 30*60*1000) } })
        .select('name avatar area location locationUpdatedAt').limit(30);
    }
    res.json({
      success: true,
      layers: {
        businesses: businesses.map(b => ({ id: b._id, type: 'business', name: b.name, category: b.category, location: b.location, coordinates: b.coordinates?.coordinates || [], rating: b.averageRating, plan: b.plan, verified: b.isVerified })),
        jobs: jobs.map(j => ({ id: j._id, type: 'job', title: j.title, category: j.category, location: j.location, coordinates: j.coordinates || [], pay: j.pay, tier: j.tier })),
        emergencies: emergencies.map(e => ({ id: e._id, type: 'emergency', emergencyType: e.type, area: e.area, coordinates: e.coordinates || [], severity: e.severity, status: e.status, createdAt: e.createdAt })),
        reports: reports.map(r => ({ id: r._id, type: 'report', reportType: r.type, location: r.location, coordinates: r.coordinates || [], status: r.status, upvotes: r.upvotes?.length || 0 })),
        users: userLocations.map(u => ({ id: u._id, type: 'user', name: u.name, area: u.area, role: u.role, coordinates: u.location?.coordinates || [], lastSeen: u.locationUpdatedAt }))
      },
      center: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/update-location', protect, async (req, res) => {
  try {
    const { lat, lng, shareLocation } = req.body;
    const updates = { locationUpdatedAt: new Date() };
    if (lat && lng) updates.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    if (shareLocation !== undefined) updates.shareLocation = shareLocation;
    await User.findByIdAndUpdate(req.user._id, updates);
    if (lat && lng) {
      req.app.get('io')?.emit('user_location_update', { userId: req.user._id, name: req.user.name, area: req.user.area, role: req.user.role, lat, lng });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/admin/all-users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ locationUpdatedAt: { $exists: true } })
      .select('name phone avatar area role location locationUpdatedAt isActive isBanned')
      .sort({ locationUpdatedAt: -1 }).limit(200);
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
