const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/posts
// @desc    Get all posts (newest first)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'user_id email avatarColor bio profileImage createdAt');
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/following
// @desc    Get posts from users you follow
// @access  Private
router.get('/following', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const posts = await Post.find({ author: { $in: user.following } })
      .sort({ createdAt: -1 })
      .populate('author', 'user_id avatarColor bio profileImage createdAt');
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
      .populate('author', 'user_id email avatarColor bio profileImage createdAt')
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

// @route   GET /api/posts/rate-limit-status
// @desc    Check if current user can post TIP or QUIZ
// @access  Private
router.get('/rate-limit-status', authMiddleware, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [lastTip, lastQuiz, codePosts] = await Promise.all([
      Post.findOne({ author: req.user.id, postType: 'TIP', createdAt: { $gte: since } })
        .sort({ createdAt: -1 }),
      Post.findOne({ author: req.user.id, postType: 'QUIZ', createdAt: { $gte: since } })
        .sort({ createdAt: -1 }),
      Post.find({ author: req.user.id, postType: 'CODE', createdAt: { $gte: since } })
        .sort({ createdAt: 1 }), // Oldest first
    ]);

    const now = Date.now();
    const tipNextAllowed = lastTip
      ? new Date(lastTip.createdAt).getTime() + 24 * 60 * 60 * 1000
      : null;
    const quizNextAllowed = lastQuiz
      ? new Date(lastQuiz.createdAt).getTime() + 24 * 60 * 60 * 1000
      : null;
    
    const codeCount = codePosts.length;
    const codeNextAllowed = codeCount >= 3
      ? new Date(codePosts[0].createdAt).getTime() + 24 * 60 * 60 * 1000
      : null;

    res.json({
      tip: {
        canPost: !lastTip,
        nextAllowedAt: tipNextAllowed,
        msRemaining: tipNextAllowed ? Math.max(0, tipNextAllowed - now) : 0,
      },
      quiz: {
        canPost: !lastQuiz,
        nextAllowedAt: quizNextAllowed,
        msRemaining: quizNextAllowed ? Math.max(0, quizNextAllowed - now) : 0,
      },
      code: {
        canPost: codeCount < 3,
        count: codeCount,
        limit: 3,
        nextAllowedAt: codeNextAllowed,
        msRemaining: codeNextAllowed ? Math.max(0, codeNextAllowed - now) : 0,
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post (CODE, TIP, or QUIZ)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { postType = 'CODE', language, code, caption, tipText, quizQuestion } = req.body;

  // --- Validation ---
  if (postType === 'CODE') {
    if (!language) return res.status(400).json({ message: 'Language is required' });
    if (!code || !code.trim()) return res.status(400).json({ message: 'Code is required' });
  }
  if (postType === 'QUIZ') {
    if (!quizQuestion || !quizQuestion.trim()) {
      return res.status(400).json({ message: 'Quiz question is required' });
    }
    if (quizQuestion.length > 200) {
      return res.status(400).json({ message: 'Quiz question must be under 200 characters' });
    }
  }
  if (postType === 'TIP') {
    if (!tipText || !tipText.trim()) return res.status(400).json({ message: 'Tip text is required' });
    if (tipText.length > 400) {
      return res.status(400).json({ message: 'Tip must be under 400 characters' });
    }
  }

  // --- Rate limiting ---
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (postType === 'TIP' || postType === 'QUIZ') {
    const existing = await Post.findOne({
      author: req.user.id,
      postType,
      createdAt: { $gte: since },
    });
    if (existing) {
      const nextAllowed = new Date(existing.createdAt).getTime() + 24 * 60 * 60 * 1000;
      return res.status(429).json({
        message: `You can only post one ${postType} per 24 hours.`,
        nextAllowedAt: nextAllowed,
      });
    }
  }

  if (postType === 'CODE') {
    const codePosts = await Post.find({
      author: req.user.id,
      postType: 'CODE',
      createdAt: { $gte: since },
    }).sort({ createdAt: 1 });

    if (codePosts.length >= 3) {
      const nextAllowed = new Date(codePosts[0].createdAt).getTime() + 24 * 60 * 60 * 1000;
      return res.status(429).json({
        message: 'You can only post 3 code snippets per 24 hours.',
        nextAllowedAt: nextAllowed,
      });
    }
  }

  try {
    const post = new Post({
      author: req.user.id,
      postType,
      language: language || null,
      code: code || '',
      caption: caption || '',
      quizQuestion: quizQuestion || '',
      tipText: tipText || '',
    });

    await post.save();
    await post.populate('author', 'user_id email avatarColor');

    res.status(201).json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

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

    // Trigger Notification for LIKE
    if (!alreadyLiked && post.author.toString() !== userId) {
      const notification = new Notification({
        recipient: post.author,
        sender: userId,
        type: 'LIKE',
        post: post._id,
      });
      await notification.save();
    }

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

      // Trigger Notification for COMMENT
      if (post.author.toString() !== req.user.id) {
        const notification = new Notification({
          recipient: post.author,
          sender: req.user.id,
          type: 'COMMENT',
          post: post._id,
          commentText: req.body.text,
        });
        await notification.save();
      }

      res.status(201).json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/posts/:id
// @desc    Update a post (only by author)
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    const { language, code, caption, tipText, quizQuestion } = req.body;

    // Validation based on existing post type
    if (post.postType === 'CODE') {
      if (language) post.language = language;
      if (code !== undefined) {
        if (!code.trim()) return res.status(400).json({ message: 'Code cannot be empty' });
        post.code = code;
      }
    }
    
    if (post.postType === 'QUIZ') {
      if (language !== undefined) post.language = language || null;
      if (code !== undefined) post.code = code || '';
    }

    if (post.postType === 'CODE' && caption !== undefined) post.caption = caption;
    
    if (post.postType === 'QUIZ') {
      if (quizQuestion !== undefined) {
        if (!quizQuestion.trim()) return res.status(400).json({ message: 'Quiz question cannot be empty' });
        if (quizQuestion.length > 200) return res.status(400).json({ message: 'Quiz question too long' });
        post.quizQuestion = quizQuestion;
      }
    }

    if (post.postType === 'TIP') {
      if (tipText !== undefined) {
        if (!tipText.trim()) return res.status(400).json({ message: 'Tip text cannot be empty' });
        if (tipText.length > 400) return res.status(400).json({ message: 'Tip text too long' });
        post.tipText = tipText;
      }
    }

    post.isEdited = true; // Optional: track if edited
    await post.save();
    await post.populate('author', 'user_id email avatarColor');

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

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
