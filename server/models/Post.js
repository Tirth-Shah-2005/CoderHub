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
    language: {
      type: String,
      required: [true, 'Programming language is required'],
      enum: [
        'JavaScript',
        'TypeScript',
        'Python',
        'Java',
        'C',
        'C++',
        'C#',
        'Go',
        'Rust',
        'PHP',
        'Ruby',
        'Swift',
        'Kotlin',
        'HTML',
        'CSS',
        'SQL',
        'Shell',
        'Other',
      ],
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
      trim: true,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 300,
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
