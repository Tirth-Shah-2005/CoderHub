const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('user_id')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('user_id must be 3-20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('user_id can only contain letters, numbers, and underscores'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, email, password } = req.body;

    try {
      // Check if user_id already exists
      const existingUserId = await User.findOne({ user_id });
      if (existingUserId) {
        return res.status(400).json({ message: `Username "${user_id}" is already taken` });
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = new User({ user_id, email, password: hashedPassword });
      await user.save();

      // Create JWT payload
      const payload = {
        user: {
          id: user._id,
          user_id: user.user_id,
          email: user.email,
        },
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          user_id: user.user_id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('Register Error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user and return token
// @access  Public
router.post(
  '/login',
  [
    body('identifier').notEmpty().withMessage('user_id or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    try {
      // Find by user_id or email
      const user = await User.findOne({
        $or: [{ user_id: identifier }, { email: identifier.toLowerCase() }],
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const payload = {
        user: {
          id: user._id,
          user_id: user.user_id,
          email: user.email,
        },
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: {
          id: user._id,
          user_id: user.user_id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('Login Error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
const authMiddleware = require('../middleware/auth');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
