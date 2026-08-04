const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['success', 'warning', 'info', 'error', 'status_update', 'action_required'],
    default: 'info',
  },
  relatedApplicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
