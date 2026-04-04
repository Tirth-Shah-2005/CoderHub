const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   GET /api/users/search?q=username
// @desc    Search users by user_id (partial match)
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 1) return res.json([]);

    const users = await User.find({
      user_id: { $regex: q, $options: 'i' },
    })
      .select('user_id bio avatarColor profileImage followers following createdAt')
      .limit(8);

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:userId
// @desc    Get public user profile + posts + follow status
// @access  Public (but checks auth token for isFollowing)
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.params.userId }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'user_id avatarColor bio');

    // Check if the requesting user follows this profile
    let isFollowing = false;
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        isFollowing = user.followers.some(
          (id) => id.toString() === decoded.user.id
        );
      } catch (_) {}
    }

    res.json({
      user: {
        ...user.toObject(),
        followersCount: user.followers.length,
        followingCount: user.following.length,
      },
      posts,
      isFollowing,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:userId/follow
// @desc    Toggle follow / unfollow a user
// @access  Private
router.put('/:userId/follow', authMiddleware, async (req, res) => {
  try {
    if (req.params.userId === req.user.user_id) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const targetUser = await User.findOne({ user_id: req.params.userId });
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const currentUser = await User.findById(req.user.id);
    const alreadyFollowing = targetUser.followers.some(
      (id) => id.toString() === req.user.id
    );

    if (alreadyFollowing) {
      // Unfollow
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== req.user.id
      );
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUser._id.toString()
      );
    } else {
      // Follow
      targetUser.followers.push(req.user.id);
      currentUser.following.push(targetUser._id);
    }

    await Promise.all([targetUser.save(), currentUser.save()]);

    res.json({
      isFollowing: !alreadyFollowing,
      followersCount: targetUser.followers.length,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile/edit
// @desc    Update bio and avatarColor
// @access  Private
router.put(
  '/profile/edit',
  authMiddleware,
  [
    body('bio').optional().isLength({ max: 200 }).withMessage('Bio max 200 chars'),
    body('avatarColor').optional().isString(),
    body('profileImage').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { bio, avatarColor, profileImage } = req.body;
      const update = {};
      if (bio !== undefined) update.bio = bio;
      if (avatarColor !== undefined) update.avatarColor = avatarColor;
      if (profileImage !== undefined) update.profileImage = profileImage;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: update },
        { new: true }
      ).select('-password');

      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
