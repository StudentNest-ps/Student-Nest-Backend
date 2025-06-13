const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
