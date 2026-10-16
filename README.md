# CareerPilot AI

**AI-powered career readiness and skill-development platform**  
*Assess your skills. Build your path. Achieve your career goals.*

CareerPilot helps students and early-career job seekers turn a target role into a practical learning journey. It combines a career profile, AI-assisted skill-gap analysis, a four-week roadmap, a skill quiz, progress tracking, interview practice, and a streaming AI career coach.

> CareerPilot is an educational learning companion, not a hiring service or a guarantee of employment. AI feedback can be imperfect; review it and only claim skills or experience you can demonstrate.

## Features

- **Career profile:** target role, experience level, current skills and optional resume/project text.
- **AI skill-gap analysis:** strengths, potential development areas, practical recommendations and a four-week roadmap.
- **Skill assessment:** eight beginner-friendly full-stack questions, score calculation, answer explanations and attempt history.
- **Progress tracking:** check off roadmap tasks, view completion percentage, quiz history and interview practice history.
- **Interview practice:** role-focused questions, answer submission, score, strengths and improvement suggestions.
- **Adaptive next steps:** dashboard highlights useful next actions based on the learner's current profile, quiz attempts and task completion.
- **Streaming AI career coach:** ask about learning priorities, project ideas, skills and interview preparation.
- **Demo mode:** the app can run without an OpenAI key or MongoDB; it clearly labels demo AI responses and uses temporary server storage.
- **Responsive UI:** desktop sidebar and mobile navigation, readable cards, accessible focus states and small-screen layouts.

## Tech stack

- Frontend: React, Vite, JavaScript and CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose (optional for local demo)
- AI: OpenAI API (`gpt-4o-mini` by default), server-side only

## Requirements

- Node.js 18 or newer (Node.js 20 LTS recommended)
- npm
- Optional: OpenAI API key for real AI responses
- Optional: MongoDB connection string for database persistence

## Run locally

1. Extract the ZIP and open the `careerpilot-ai` folder in VS Code.
2. Open a terminal at the project root.
3. Install dependencies:

   ```bash
   npm run install:all
   ```

4. Copy `server/.env.example` to `server/.env`.
   - Windows PowerShell: `Copy-Item server/.env.example server/.env`
   - Windows Command Prompt: `copy server\.env.example server\.env`
   - Or use VS Code Explorer: right-click `.env.example`, copy, paste into `server`, rename the copy to `.env`.
5. For demo mode, leave `OPENAI_API_KEY` and `MONGODB_URI` blank. For real AI, put your own API key in `OPENAI_API_KEY`. To save data in MongoDB, put your connection string in `MONGODB_URI`.
6. Start the app from the root folder:

   ```bash
   npm run dev
   ```

7. Open **http://localhost:5173**. The API health endpoint is **http://localhost:5000/api/health**.

The frontend and backend run together in the same terminal. Press `Ctrl + C` to stop both.

## Environment variables

`server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
MONGODB_URI=
```

`client/.env.example` documents the frontend API base URL. Usually you do not need to change it for local development:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**Never put your OpenAI key in a frontend `VITE_` variable or commit `.env` to GitHub.** `.gitignore` excludes environment files other than `.env.example`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API and storage health |
| POST | `/api/profiles` | Create a career profile |
| GET | `/api/profiles/:id` | Read a profile |
| POST | `/api/analyses` | Generate and save career analysis |
| GET | `/api/analyses/:id` | Read an analysis |
| POST | `/api/chats` | Create a chat session |
| POST | `/api/chats/:id/messages/stream` | Send a message and stream a reply |
| GET | `/api/progress/:key` | Read learning progress |
| PUT | `/api/progress/:key` | Save completed tasks, assessment attempts and interview sessions |
| POST | `/api/interviews/feedback` | Generate interview-answer feedback |

## Data and demo behaviour

- Without `MONGODB_URI`, server-side profiles, analyses, chats and progress are temporary and reset when the server restarts.
- The browser stores the learner's current workspace in local storage for convenience. This is not a secure account system; avoid sensitive personal data on shared devices.
- With MongoDB configured, profiles, analyses, chats and progress can be persisted. This starter does not include user authentication or account-level ownership controls, so do not expose it publicly with real user data until authentication and authorization are added.
- Without `OPENAI_API_KEY`, analysis, chat and interview feedback use deterministic demo responses. Demo feedback is not produced by a live AI model.
- The built-in assessment is a learning aid, not a validated professional certification.

## Troubleshooting

- **`npm` is not recognized:** install Node.js LTS, restart VS Code and run `node -v` and `npm -v`.
- **Port 5000 or 5173 is already in use:** stop the other process or change the relevant port/configuration.
- **Frontend says API disconnected:** ensure `npm run dev` starts both processes and check the backend terminal for errors.
- **OpenAI error:** verify the API key, account access, billing/usage and model availability. The project can still be explored in demo mode.
- **MongoDB not connected:** check the URI, database user permissions and Atlas network access. The app falls back to temporary storage if the connection fails.

## Suggested demo flow

1. Create a career plan for a target role.
2. Review strengths, potential skill gaps and the four-week roadmap.
3. Take the skill assessment and read the explanations.
4. Mark completed roadmap tasks in Progress.
5. Answer an interview question and review feedback.
6. Ask the AI coach for a project idea or a practical next step.

## Recommended future improvements

- Add authentication and enforce profile ownership.
- Add a larger role-specific question bank and practical coding exercises.
- Add file upload with safe PDF/DOCX text extraction.
- Add richer progress analytics and editable task plans.
- Add automated tests for API routes and React workflows.
- Add deployment monitoring, CI/CD and usage/cost controls before public launch.

## License

Educational capstone starter. Add a license and attribution details appropriate to your intended use before public distribution.
