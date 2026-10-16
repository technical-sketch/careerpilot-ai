import mongoose from 'mongoose';

const careerProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  targetRole: { type: String, required: true, trim: true, maxlength: 120 },
  skills: [{ type: String, trim: true, maxlength: 80 }],
  resumeText: { type: String, default: '', maxlength: 12000 }
}, { timestamps: true });

export default mongoose.models.CareerProfile || mongoose.model('CareerProfile', careerProfileSchema);
