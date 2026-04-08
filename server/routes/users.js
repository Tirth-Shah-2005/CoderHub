const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   GET /api/users/search?q=username
// @desc    Search users by user_id (partial match)
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 1) return res.json([]);

    let users = await User.find({
      user_id: { $regex: q, $options: 'i' },
    })
      .select('user_id bio avatarColor profileImage followers following createdAt')
      .limit(15);

    // If logged in, calculate mutuals and sort
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.user.id);
        if (currentUser) {
          const myFollowing = (currentUser.following || []).map((id) => String(id));

          // Map users with mutual connection logic
          const enrichedUsers = await Promise.all(
            users.map(async (u) => {
              const uFollowers = u.followers || [];
              const myFollowingIds = currentUser.following.map(id => id.toString());
              
              const mutualIds = uFollowers.filter((f) => 
                myFollowingIds.includes(f.toString())
              );
              
              let mutualSample = [];
              if (mutualIds.length > 0) {
                const sampleUsers = await User.find({ _id: { $in: mutualIds.slice(0, 2) } }).select(
                  'user_id'
                );
                mutualSample = sampleUsers.map((su) => su.user_id);
              }

              return {
                ...u.toObject(),
                mutualCount: mutualIds.length,
                mutualSample,
              };
            })
          );

          // Sort: mutual connections first
          enrichedUsers.sort((a, b) => b.mutualCount - a.mutualCount);
          users = enrichedUsers;
        }
      } catch (_) {}
    }

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/suggestions
// @desc    Get account suggestions (connected or new)
// @access  Private
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const myFollowing = currentUser.following;

    // 1. Friends of friends (mutual connections)
    const followedUsers = await User.find({ _id: { $in: myFollowing } });
    let fofIds = [];
    followedUsers.forEach((u) => {
      fofIds = [...fofIds, ...u.following.map((id) => id.toString())];
    });

    // 2. New accounts (< 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Exclude self and already followed
    const excludeIds = [...myFollowing.map((id) => id.toString()), req.user.id];

    // Query for suggestions
    let suggestions = await User.find({
      _id: { $nin: excludeIds },
      $or: [{ _id: { $in: fofIds } }, { createdAt: { $gte: weekAgo } }],
    })
      .select('user_id avatarColor bio profileImage createdAt')
      .limit(15);

    // If still not enough, get some random active accounts
    if (suggestions.length < 5) {
      const moreSuggestions = await User.find({
        _id: { $nin: [...excludeIds, ...suggestions.map((s) => s._id.toString())] },
      })
        .select('user_id avatarColor bio profileImage createdAt')
        .limit(5);
      suggestions = [...suggestions, ...moreSuggestions];
    }

    res.json(suggestions.slice(0, 10)); // Return top 10
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
    let mutualFollowers = [];
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const currentUserId = decoded.user.id;
        isFollowing = user.followers.some((id) => id.toString() === currentUserId);

        // Mutual Followers: People I follow who also follow this user
        const currentUser = await User.findById(currentUserId);
        if (currentUser) {
          mutualFollowers = await User.find({
            _id: { $in: user.followers, $in: currentUser.following },
          })
            .select('user_id')
            .limit(3);
        }
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
      mutualFollowers,
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

    // Trigger Notification for FOLLOW
    if (!alreadyFollowing) {
      const notification = new Notification({
        recipient: targetUser._id,
        sender: req.user.id,
        type: 'FOLLOW',
      });
      await notification.save();
    }

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
    body('name').optional().isLength({ max: 50 }).withMessage('Name max 50 chars'),
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
      const { name, bio, avatarColor, profileImage } = req.body;
      const update = {};
      if (name !== undefined) update.name = name;
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
