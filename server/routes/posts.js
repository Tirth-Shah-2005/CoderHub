const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/posts
// @desc    Get all posts (newest first)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'user_id email avatarColor bio');
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by a specific user_id
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'user_id email avatarColor bio')
      .sort({ createdAt: -1 });

    const userPosts = posts.filter(
      (post) => post.author && post.author.user_id === req.params.userId
    );

    res.json(userPosts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post(
  '/',
  authMiddleware,
  [
    body('language').notEmpty().withMessage('Language is required'),
    body('code').notEmpty().withMessage('Code is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { language, code, caption } = req.body;

    try {
      const post = new Post({
        author: req.user.id,
        language,
        code,
        caption: caption || '',
      });

      await post.save();
      await post.populate('author', 'user_id email');

      res.status(201).json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/posts/:id/like
// @desc    Toggle like on a post
// @access  Private
router.put('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ likes: post.likes, likesCount: post.likes.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Add a comment to a post
// @access  Private
router.post(
  '/:id/comment',
  authMiddleware,
  [body('text').notEmpty().withMessage('Comment text is required').trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const newComment = {
        user: req.user.id,
        user_id: req.user.user_id,
        text: req.body.text,
      };

      post.comments.unshift(newComment);
      await post.save();

      res.status(201).json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/posts/:id
// @desc    Delete a post (only by author)
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
