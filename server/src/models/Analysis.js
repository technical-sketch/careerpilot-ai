import mongoose from 'mongoose';

const roadmapItemSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  topic: { type: String, required: true },
  goal: { type: String, required: true },
  tasks: [{ type: String }]
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerProfile', default: null },
  targetRole: { type: String, required: true },
  strengths: [{ type: String }],
  missingSkills: [{ type: String }],
  recommendations: [{ type: String }],
  roadmap: [roadmapItemSchema],
  demoMode: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Analysis || mongoose.model('Analysis', analysisSchema);
