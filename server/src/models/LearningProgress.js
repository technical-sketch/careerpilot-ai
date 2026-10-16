import mongoose from 'mongoose';

const learningProgressSchema = new mongoose.Schema({
  profileKey: { type: String, required: true, unique: true, maxlength: 120 },
  completedTasks: [{ type: String, maxlength: 180 }],
  attempts: [{ type: mongoose.Schema.Types.Mixed }],
  interviewSessions: [{ type: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });

export default mongoose.models.LearningProgress || mongoose.model('LearningProgress', learningProgressSchema);
