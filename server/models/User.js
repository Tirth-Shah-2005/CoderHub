const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: [true, 'user_id is required'],
      unique: true,
      trim: true,
      minlength: [3, 'user_id must be at least 3 characters'],
      maxlength: [20, 'user_id must be at most 20 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'user_id can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: 200,
    },
    avatarColor: {
      type: String,
      default: 'linear-gradient(135deg, #58a6ff, #bc8cff)',
    },
    profileImage: {
      type: String,
      default: '',
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    linkedAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    membershipLevel: { type: String, default: 'FREE' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
