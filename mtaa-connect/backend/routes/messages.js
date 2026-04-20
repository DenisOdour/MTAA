const express = require('express');
const router = express.Router();
const { Message } = require('../models/index');
const { protect } = require('../middleware/auth');

router.get('/conversations', protect, async (req, res) => {
  try {
    const msgs = await Message.find({ $or: [{ sender: req.user._id }, { recipient: req.user._id }] })
      .sort({ createdAt: -1 }).populate('sender', 'name avatar').populate('recipient', 'name avatar');
    const seen = new Set();
    const convs = [];
    for (const m of msgs) {
      const otherId = m.sender._id.toString() === req.user._id.toString() ? m.recipient._id.toString() : m.sender._id.toString();
      if (!seen.has(otherId)) { seen.add(otherId); convs.push({ other: m.sender._id.toString() === req.user._id.toString() ? m.recipient : m.sender, lastMessage: m }); }
    }
    res.json({ success: true, conversations: convs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id, recipient: req.params.userId }, { sender: req.params.userId, recipient: req.user._id }]
    }).sort({ createdAt: 1 }).populate('sender', 'name avatar');
    await Message.updateMany({ sender: req.params.userId, recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, messages });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    if (!recipientId || !content) return res.status(400).json({ success: false, message: 'Recipient and content required.' });
    const message = await Message.create({ sender: req.user._id, recipient: recipientId, content });
    await message.populate('sender', 'name avatar');
    req.app.get('io')?.to(recipientId).emit('new_message', message);
    res.status(201).json({ success: true, message });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
