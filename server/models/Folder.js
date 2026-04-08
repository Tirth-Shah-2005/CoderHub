const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: 30,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isCollaboration: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Folder', FolderSchema);
