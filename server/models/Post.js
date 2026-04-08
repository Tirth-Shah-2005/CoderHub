const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postType: {
      type: String,
      enum: ['CODE', 'TIP', 'QUIZ'],
      default: 'CODE',
    },
    // --- CODE & QUIZ fields ---
    language: {
      type: String,
      enum: [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#',
        'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'HTML', 'CSS',
        'SQL', 'Shell', 'Other',
      ],
      default: null,
    },
    code: {
      type: String,
      trim: true,
      default: '',
    },
    caption: {
      type: String,
      default: '',
      maxlength: 300,
    },
    // --- QUIZ field ---
    quizQuestion: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    // --- TIP field ---
    tipText: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
