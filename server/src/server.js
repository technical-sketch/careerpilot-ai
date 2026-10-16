import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = Number(process.env.PORT) || 5000;
await connectDatabase();
app.listen(port, () => {
  console.log(`🚀 CareerPilot API running at http://localhost:${port}`);
  console.log(
  process.env.GEMINI_API_KEY
    ? '🤖 Gemini AI key detected.'
    : '🧪 Demo AI enabled. Add GEMINI_API_KEY to server/.env for real AI.'
);
});
