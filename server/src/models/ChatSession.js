import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerProfile', default: null },
  title: { type: String, default: 'Career chat' },
  messages: [messageSchema]
}, { timestamps: true });

export default mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);
