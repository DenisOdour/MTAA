const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'mtaa_connect_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });

// ─── POST /api/auth/register ──────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('area').notEmpty().withMessage('Area/estate is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, phone, email, password, area, bio, username } = req.body;

    // Check for duplicate phone
    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered. Please login.' });
    }

    // Check for duplicate email if provided
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'This email is already registered.' });
      }
    }

    // Check for duplicate username if provided
    if (username) {
      const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'This username is already taken.' });
      }
    }

    const userData = { name, phone: phone.trim(), password, area };
    if (email) userData.email = email.toLowerCase().trim();
    if (bio) userData.bio = bio;
    if (username) userData.username = username.toLowerCase().trim();

    const user = await User.create(userData);
    const token = signToken(user._id);

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ success: false, message: `That ${field} is already in use.` });
    }
    res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────
// Accepts: phone OR username OR email + password
router.post('/login', async (req, res) => {
  try {
    const { identifier, phone, username, email, password } = req.body;

    // Support multiple field names from frontend
    const loginIdentifier = (identifier || phone || username || email || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your phone/username and password.' });
    }

    // Find user by phone, username, or email
    const user = await User.findOne({
      $or: [
        { phone: loginIdentifier },
        { username: loginIdentifier.toLowerCase() },
        { email: loginIdentifier.toLowerCase() }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with that phone number or username.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'email', 'bio', 'area', 'skills', 'avatar', 'shareLocation', 'username'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Username already taken.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/auth/password ───────────────────────────────────────
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Provide current and new password.' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/follow/:id ────────────────────────────────────
router.post('/follow/:id', protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You can't follow yourself." });
    }
    const isFollowing = req.user.following && req.user.following.includes(targetUser._id);
    if (isFollowing) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: targetUser._id }, $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: req.user._id }, $inc: { followersCount: -1 } });
      res.json({ success: true, message: 'Unfollowed.', following: false });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetUser._id }, $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: req.user._id }, $inc: { followersCount: 1 } });
      res.json({ success: true, message: 'Followed!', following: true });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/location ──────────────────────────────────────
router.post('/location', protect, async (req, res) => {
  try {
    const { lat, lng, shareLocation } = req.body;
    const updates = { locationUpdatedAt: new Date() };
    if (lat && lng) {
      updates.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    }
    if (shareLocation !== undefined) updates.shareLocation = shareLocation;
    await User.findByIdAndUpdate(req.user._id, updates);
    if (req.user.shareLocation && lat && lng) {
      req.app.get('io')?.emit('user_location_update', {
        userId: req.user._id, name: req.user.name, area: req.user.area, role: req.user.role, lat, lng
      });
    }
    res.json({ success: true, message: 'Location updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
