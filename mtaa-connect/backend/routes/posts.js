const express = require('express');
const router = express.Router();
const { Post, Notification } = require('../models/index');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// GET /api/posts
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sort = 'latest', area } = req.query;
    const query = { status: { $in: ['approved', 'featured'] } };
    if (category && category !== 'all') query.category = category;
    if (area) query['location.area'] = new RegExp(area, 'i');
    const sortBy = sort === 'trending' ? { views: -1, createdAt: -1 } : sort === 'featured' ? { featuredAt: -1 } : { isPinned: -1, createdAt: -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      Post.find(query).populate('author', 'name avatar area role').sort(sortBy).skip(skip).limit(parseInt(limit)).lean(),
      Post.countDocuments(query)
    ]);
    const userId = req.user?._id?.toString();
    const formatted = posts.map(p => ({
      ...p,
      likesCount: p.likes?.length || 0,
      commentsCount: p.comments?.length || 0,
      isLiked: userId ? p.likes?.some(l => l.toString() === userId) : false,
      isSaved: userId ? p.saves?.some(s => s.toString() === userId) : false,
      comments: undefined, likes: undefined, saves: undefined
    }));
    res.json({ success: true, posts: formatted, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/posts/trending
router.get('/trending', async (req, res) => {
  try {
    const posts = await Post.find({ status: { $in: ['approved', 'featured'] } })
      .select('title category likes comments views createdAt author')
      .populate('author', 'name area')
      .sort({ views: -1, createdAt: -1 })
      .limit(10).lean();
    res.json({ success: true, posts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/posts/admin/pending
router.get('/admin/pending', protect, adminOnly, async (req, res) => {
  try {
    const posts = await Post.find({ status: 'pending' })
      .populate('author', 'name phone area avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
      .populate('author', 'name avatar area bio role')
      .populate('comments.author', 'name avatar area');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/posts
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, category, tags, media, location, isAnonymous } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required.' });
    const isAdminUser = req.user.role === 'admin' || req.user.role === 'super_admin';
    const post = await Post.create({
      author: req.user._id,
      title, content, category: category || 'story', tags, media, isAnonymous,
      location: location || { area: req.user.area },
      status: isAdminUser ? 'approved' : 'pending'
    });
    req.app.get('io')?.to('admins').emit('new_post_pending', { postId: post._id, title, authorName: req.user.name });
    res.status(201).json({ success: true, post, message: isAdminUser ? 'Post published!' : 'Post submitted for review.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/posts/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    const liked = post.likes.some(l => l.toString() === req.user._id.toString());
    if (liked) post.likes.pull(req.user._id); else post.likes.push(req.user._id);
    await post.save();
    res.json({ success: true, liked: !liked, likesCount: post.likes.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Comment content required.' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    post.comments.push({ author: req.user._id, content });
    await post.save();
    await post.populate('comments.author', 'name avatar area');
    const newComment = post.comments[post.comments.length - 1];
    res.json({ success: true, comment: newComment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/posts/:id/save
router.post('/:id/save', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    const saved = post.saves.some(s => s.toString() === req.user._id.toString());
    if (saved) post.saves.pull(req.user._id); else post.saves.push(req.user._id);
    await post.save();
    res.json({ success: true, saved: !saved });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/posts/:id/share
router.post('/:id/share', async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/posts/:id/moderate (admin)
router.put('/:id/moderate', protect, adminOnly, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const updateMap = {
      approve: { status: 'approved' },
      reject:  { status: 'rejected', rejectionReason: reason },
      feature: { status: 'featured', featuredAt: new Date() },
      pin:     { isPinned: true },
      unpin:   { isPinned: false }
    };
    const update = updateMap[action];
    if (!update) return res.status(400).json({ success: false, message: 'Invalid action.' });
    const post = await Post.findByIdAndUpdate(req.params.id, update, { new: true }).populate('author', 'name');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (['approve','reject','feature'].includes(action)) {
      await Notification.create({
        recipient: post.author._id, type: 'post_approved',
        title: action === 'reject' ? 'Post not approved' : 'Post approved!',
        body: action === 'reject'
          ? `Your post "${post.title}" was not approved. ${reason ? 'Reason: ' + reason : ''}`
          : `Your post "${post.title}" is now live on Mtaa Connect!`
      });
      req.app.get('io')?.to(post.author._id.toString()).emit('post_moderated', { action, postId: post._id });
    }
    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/posts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
