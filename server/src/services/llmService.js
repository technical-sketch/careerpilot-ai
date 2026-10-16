
import OpenAI from "openai";

const DEMO_MODE = !process.env.GEMINI_API_KEY;

const client = DEMO_MODE
  ? null
  : new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL:
        "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

export const isRealAIEnabled = () => Boolean(client);

function getModels() {
  const primary =
    process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const fallbacks = (
    process.env.GEMINI_FALLBACK_MODELS ||
    "gemini-2.5-flash-lite"
  )
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set([primary, ...fallbacks])];
}

async function withModelFallback(callback) {
  if (!client) {
    throw new Error(
      "Gemini API key missing. Add GEMINI_API_KEY to server/.env"
    );
  }

  let lastError;

  for (const model of getModels()) {
    try {
      console.log(`Trying Gemini model: ${model}`);
      const result = await callback(model);
      console.log(`Gemini success: ${model}`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(
        `Gemini model ${model} failed:`,
        error.message
      );
    }
  }

  throw new Error(
    `All configured Gemini models failed: ${
      lastError?.message || "Unknown error"
    }`
  );
}

function parseJSON(content) {
  if (!content) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return JSON.parse(cleaned);
}

async function generateText(messages, options = {}) {
  return withModelFallback(async (model) => {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      ...(options.json
        ? { response_format: { type: "json_object" } }
        : {}),
    });

    return response.choices?.[0]?.message?.content || "";
  });
}

// --------------------------------------------------
// 1. CAREER ANALYSIS
// --------------------------------------------------

export async function createCareerAnalysis(input = {}) {
  if (!client) {
    return {
      mode: "demo",
      summary:
        "Add your Gemini API key to enable personalized career analysis.",
      strengths: [
        "Willingness to learn",
        "Interest in technology",
        "Career development mindset",
      ],
      missingSkills: [
        "Problem solving",
        "Practical project experience",
        "Interview preparation",
      ],
      recommendations: [
        "Practice coding every day.",
        "Build projects related to your target role.",
        "Improve your resume and portfolio.",
      ],
      roadmap: [
        {
          week: 1,
          title: "Build your foundation",
          tasks: [
            "Review programming basics",
            "Practice simple coding problems",
          ],
        },
        {
          week: 2,
          title: "Build a project",
          tasks: [
            "Choose a beginner project",
            "Upload your code to GitHub",
          ],
        },
        {
          week: 3,
          title: "Prepare for interviews",
          tasks: [
            "Practice technical questions",
            "Explain your projects clearly",
          ],
        },
        {
          week: 4,
          title: "Prepare to apply",
          tasks: [
            "Improve your resume",
            "Apply for suitable roles",
          ],
        },
      ],
    };
  }

  const prompt = `
You are CareerPilot AI, a practical career mentor.

Analyze the candidate information below.
Return ONLY valid JSON with these keys:
summary, strengths, missingSkills, recommendations, roadmap.

Requirements:
- strengths, missingSkills and recommendations must be arrays of strings.
- roadmap must contain four weekly objects.
- Each weekly object must have week, title and tasks.
- tasks must be an array of strings.
- Give realistic, beginner-friendly advice.
- Do not invent qualifications or experience.

Candidate information:
${JSON.stringify(input, null, 2)}
`;

  const content = await generateText(
    [{ role: "user", content: prompt }],
    { json: true, temperature: 0.4 }
  );

  return {
    mode: "ai",
    ...parseJSON(content),
  };
}

// --------------------------------------------------
// 2. CAREERPILOT CHATBOT
// --------------------------------------------------

export async function getAssistantReply(
  messages = [],
  targetRole = "Software Developer"
) {
  if (!client) {
    return "Hi! I am CareerPilot AI. Add your Gemini API key to enable AI-powered career guidance.";
  }

  const chatMessages = messages
    .filter(
      (message) =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string"
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  return generateText([
    {
      role: "system",
      content: `
You are CareerPilot AI, a friendly career assistant.

Target role: ${targetRole}

Help users with:
- Career planning
- Skills and learning roadmaps
- Resume improvement
- Interview preparation
- Software development projects
- Job search preparation

Give clear, practical and beginner-friendly answers.
Do not claim to guarantee employment.
`,
    },
    ...chatMessages,
  ]);
}

// --------------------------------------------------
// 3. STREAMING CHAT
// --------------------------------------------------

export async function streamAssistantReply(
  messages = [],
  targetRole = "Software Developer",
  onToken = () => {}
) {
  if (!client) {
    const demoReply =
      "Hi! I am CareerPilot AI. Add your Gemini API key to enable AI chat.";

    for (const word of demoReply.split(" ")) {
      onToken(word + " ");
    }

    return demoReply;
  }

  const chatMessages = [
    {
      role: "system",
      content: `
You are CareerPilot AI.
Help the user with career planning, skills, projects,
resumes and interviews.
Target role: ${targetRole}
Keep responses practical and easy to understand.
`,
    },
    ...messages
      .filter(
        (message) =>
          message &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string"
      )
      .map((message) => ({
        role: message.role,
        content: message.content,
      })),
  ];

  // Finish each model attempt before emitting tokens.
  // This avoids duplicate text if a fallback is needed.
  const fullReply = await withModelFallback(async (model) => {
    const response = await client.chat.completions.create({
      model,
      messages: chatMessages,
      stream: false,
    });

    const content =
      response.choices?.[0]?.message?.content || "";

    if (!content.trim()) {
      throw new Error("Empty assistant response.");
    }

    return content;
  });

  const chunks = fullReply.match(/\S+\s*/g) || [fullReply];

  for (const chunk of chunks) {
    onToken(chunk);
  }

  return fullReply;
}

// --------------------------------------------------
// 4. INTERVIEW FEEDBACK
// --------------------------------------------------

export async function createInterviewFeedback(input = {}) {
  const question = String(input.question || "").trim();
  const answer = String(input.answer || "").trim();
  const targetRole = String(input.targetRole || "entry-level role").trim();

  if (!question) {
    throw new Error("Interview question is required.");
  }

  if (answer.length < 12) {
    throw new Error("Please provide a more detailed answer before requesting feedback.");
  }

  const unavailableFeedback = {
    mode: "demo",
    overallScore: null,
    summary:
      "AI evaluation is currently unavailable. Your answer has not been scored. Configure the Gemini API and try again for question-specific feedback.",
    strengths: [],
    improvements: [
      "Enable the Gemini AI service to receive feedback based on your answer."
    ],
    nextStep:
      "When you answer, explain the main idea, give a relevant example, and describe the result or why it matters.",
    suggestedAnswer: ""
  };

  if (!client) {
    return unavailableFeedback;
  }

  const prompt = `
You are CareerPilot AI, an experienced interviewer and beginner-friendly career coach.
Evaluate the candidate's answer against the exact interview question below.

Target role: ${targetRole}

Exact interview question:
${question}

Candidate's answer:
${answer}

Return ONLY valid JSON with exactly these keys:
{
  "overallScore": 0,
  "summary": "A concise evaluation specific to this answer",
  "strengths": ["Specific thing done well"],
  "improvements": ["Specific missing, unclear, or incorrect point"],
  "nextStep": "One actionable next step",
  "suggestedAnswer": "A stronger example answer to the exact question"
}

Evaluation rules:
- overallScore must be an integer from 0 to 100.
- Judge relevance, correctness, clarity, and completeness for this question.
- Identify technical errors when relevant.
- For project questions, evaluate the problem, the candidate's own contribution, implementation, and outcome where the answer provides that information.
- For debugging questions, evaluate whether the steps are logical and systematic.
- For conceptual questions, evaluate whether the concept is explained correctly and supported with a suitable example when requested.
- Do not give generic praise that could apply to every answer.
- Do not claim the candidate did anything they did not mention.
- If the answer is vague or incomplete, say exactly what is missing and score accordingly.
- The suggestedAnswer is an example for learning, not a claim about the candidate's actual experience. For personal project questions, use placeholders rather than inventing personal history.
- Use simple, encouraging language suitable for a beginner.
- strengths and improvements must be arrays of strings. If none apply, return an empty array.
`;

  try {
    const content = await generateText(
      [{ role: "user", content: prompt }],
      { json: true, temperature: 0.2 }
    );
    const parsed = parseJSON(content);
    const numericScore = Number(parsed.overallScore);

    if (!Number.isFinite(numericScore)) {
      throw new Error("Gemini returned an invalid interview score.");
    }

    return {
      mode: "ai",
      overallScore: Math.round(Math.max(0, Math.min(100, numericScore))),
      summary: String(parsed.summary || "Your answer was evaluated.").trim(),
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.map(String).filter(Boolean)
        : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.map(String).filter(Boolean)
        : [],
      nextStep: String(parsed.nextStep || "Practice answering this question with a clear example.").trim(),
      suggestedAnswer: String(parsed.suggestedAnswer || "").trim()
    };
  } catch (error) {
    console.error("Interview feedback generation failed:", error.message);
    return {
      ...unavailableFeedback,
      summary:
        "AI evaluation could not be completed. No score has been assigned. Check your Gemini API key, model configuration, and server logs, then try again."
    };
  }
}
