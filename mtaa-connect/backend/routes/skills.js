const express = require('express');
const router = express.Router();
const { SkillCourse } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const courses = await SkillCourse.find({ isActive: true }).populate('instructor', 'name avatar bio').sort({ enrollCount: -1 });
    res.json({ success: true, courses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const course = await SkillCourse.create({ ...req.body, instructor: req.user._id });
    res.status(201).json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const course = await SkillCourse.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    if (course.enrolled.some(e => e.toString() === req.user._id.toString())) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
    }
    course.enrolled.push(req.user._id);
    course.enrollCount += 1;
    await course.save();
    res.json({ success: true, message: 'Enrolled successfully! Check your SMS for details.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
