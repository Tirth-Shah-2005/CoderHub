const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const Post = require('../models/Post');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/folders
// @desc    Get all folders owned by or shared with current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const folders = await Folder.find({
      $or: [{ owner: req.user.id }, { collaborators: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .populate('owner', 'user_id avatarColor')
      .populate('collaborators', 'user_id avatarColor');

    res.json(folders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/folders/:id
// @desc    Get single folder with posts
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate('owner', 'user_id avatarColor')
      .populate('collaborators', 'user_id avatarColor')
      .populate({
        path: 'posts',
        populate: { path: 'author', select: 'user_id avatarColor bio' }
      });

    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    
    // Check permissions
    if (folder.owner.toString() !== req.user.id && !folder.collaborators.some(c => c._id.toString() === req.user.id)) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(folder);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/folders
// @desc    Create a new folder
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, isCollaboration } = req.body;
    const newFolder = new Folder({
      name,
      owner: req.user.id,
      isCollaboration: !!isCollaboration,
    });

    const folder = await newFolder.save();
    res.json(folder);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/folders/:id/posts/:postId
// @desc    Add post to folder
// @access  Private
router.post('/:id/posts/:postId', authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    // Check permissions (owner or collaborator)
    if (folder.owner.toString() !== req.user.id && !folder.collaborators.some(c => c.toString() === req.user.id)) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    if (folder.posts.includes(req.params.postId)) {
        return res.status(400).json({ message: 'Post already saved in this folder' });
    }

    folder.posts.push(req.params.postId);
    await folder.save();
    res.json(folder);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/folders/:id/invite
// @desc    Invite collaborator
// @access  Private (Owner only)
router.put('/:id/invite', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body; // user_id string
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    if (folder.owner.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Only owner can invite' });
    }

    const userToInvite = await User.findOne({ user_id: userId });
    if (!userToInvite) return res.status(404).json({ message: 'User not found' });

    if (folder.collaborators.includes(userToInvite._id)) {
        return res.status(400).json({ message: 'User already a collaborator' });
    }

    folder.collaborators.push(userToInvite._id);
    folder.isCollaboration = true;
    await folder.save();
    res.json(folder);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
