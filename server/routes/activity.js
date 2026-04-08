const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/activity/likes
// @desc    Get posts liked by current user
// @access  Private
router.get('/likes', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ likes: req.user.id })
      .sort({ createdAt: -1 })
      .populate('author', 'user_id avatarColor bio profileImage createdAt');

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/activity/comments
// @desc    Get posts commented on by current user
// @access  Private
router.get('/comments', authMiddleware, async (req, res) => {
  try {
    // Correct way to find posts where user has commented:
    // Searching for posts where the 'comments' array contains an object with user_id: req.user.user_id
    // But since the model uses req.user.user_id (the string username) for comments, we use that.
    
    const posts = await Post.find({ 'comments.user_id': req.user.user_id })
      .sort({ createdAt: -1 })
      .populate('author', 'user_id avatarColor bio profileImage createdAt');

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
