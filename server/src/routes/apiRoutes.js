import { Router } from 'express';
import mongoose from 'mongoose';

import CareerProfile from '../models/CareerProfile.js';
import Analysis from '../models/Analysis.js';
import ChatSession from '../models/ChatSession.js';
import LearningProgress from '../models/LearningProgress.js';

import {
  createCareerAnalysis,
  streamAssistantReply,
  createInterviewFeedback,
  isRealAIEnabled,
} from '../services/llmService.js';

const router = Router();

const memory = {
  profiles: [],
  analyses: [],
  chats: [],
  progress: new Map(),
};

const dbOn = () => mongoose.connection.readyState === 1;
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const idString = (item) => {
  const plain =
    typeof item?.toObject === 'function'
      ? item.toObject()
      : { ...item };

  return {
    ...plain,
    _id: String(plain._id),
  };
};

function logError(label, error) {
  console.error(label, {
    message: error?.message || 'Unknown error',
    status: error?.status || error?.statusCode || null,
    code: error?.code || null,
    type: error?.type || null,
  });
}

// HEALTH CHECK
router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'careerpilot-api',
    storage: dbOn() ? 'mongodb' : 'memory',
    aiProvider: isRealAIEnabled()
      ? 'gemini-configured'
      : 'demo-mode',
    time: new Date().toISOString(),
  });
});

// CREATE PROFILE
router.post('/profiles', async (req, res, next) => {
  try {
    const {
      name,
      targetRole,
      skills = [],
      resumeText = '',
    } = req.body || {};

    if (!String(name || '').trim() ||
        !String(targetRole || '').trim()) {
      return res.status(400).json({
        error: 'Name and target role are required.',
      });
    }

    if (String(resumeText).length > 12000) {
      return res.status(400).json({
        error: 'Resume text must be 12,000 characters or fewer.',
      });
    }

    const data = {
      name: String(name).trim().slice(0, 80),
      targetRole: String(targetRole).trim().slice(0, 120),
      skills: Array.isArray(skills)
        ? skills
            .map(String)
            .map((skill) => skill.trim())
            .filter(Boolean)
            .slice(0, 30)
        : [],
      resumeText: String(resumeText).slice(0, 12000),
    };

    const profile = dbOn()
      ? await CareerProfile.create(data)
      : {
          ...data,
          _id: `demo-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    if (!dbOn()) {
      memory.profiles.push(profile);
    }

    return res.status(201).json({
      profile: idString(profile),
      storage: dbOn() ? 'mongodb' : 'memory',
    });
  } catch (error) {
    logError('Profile creation failed:', error);
    return next(error);
  }
});

// GET PROFILE
router.get('/profiles/:id', async (req, res, next) => {
  try {
    const profile = dbOn()
      ? isValidId(req.params.id)
        ? await CareerProfile.findById(req.params.id).lean()
        : null
      : memory.profiles.find(
          (item) => String(item._id) === req.params.id
        );

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found.',
      });
    }

    return res.json({
      profile: idString(profile),
    });
  } catch (error) {
    return next(error);
  }
});

// CREATE CAREER ANALYSIS
router.post('/analyses', async (req, res, next) => {
  try {
    const {
      profileId = null,
      name = 'Learner',
      targetRole,
      skills = [],
      resumeText = '',
    } = req.body || {};

    if (!String(targetRole || '').trim()) {
      return res.status(400).json({
        error: 'Target role is required.',
      });
    }

    if (String(resumeText).length > 12000) {
      return res.status(400).json({
        error: 'Resume text must be 12,000 characters or fewer.',
      });
    }

    const input = {
      name: String(name).slice(0, 80),
      targetRole: String(targetRole).trim().slice(0, 120),
      skills: Array.isArray(skills)
        ? skills.map(String).slice(0, 30)
        : [],
      resumeText: String(resumeText).slice(0, 12000),
    };

    console.log('Generating career analysis...');

    const generated = await createCareerAnalysis(input);

    const data = {
      profileId:
        dbOn() && isValidId(profileId) ? profileId : null,
      targetRole: input.targetRole,
      strengths: (generated.strengths || []).slice(0, 8),
      missingSkills: (generated.missingSkills || []).slice(0, 8),
      recommendations: (generated.recommendations || []).slice(0, 8),
      roadmap: (generated.roadmap || [])
  .slice(0, 6)
  .map((item, index) => ({
    week: Number(
      String(item.week || index + 1).match(/\d+/)?.[0]
    ) || index + 1,

    topic:
      item.topic ||
      item.title ||
      `Career Roadmap - Week ${index + 1}`,

    goal:
      item.goal ||
      item.description ||
      `Practise important skills for ${input.targetRole}.`,

    tasks: Array.isArray(item.tasks)
      ? item.tasks
      : [],
  })),
      demoMode:
        generated.mode === 'demo' || Boolean(generated.demoMode),
    };

    const analysis = dbOn()
      ? await Analysis.create(data)
      : {
          ...data,
          _id: `analysis-${Date.now()}`,
          createdAt: new Date(),
        };

    if (!dbOn()) {
      memory.analyses.push(analysis);
    }

    return res.status(201).json({
      analysis: idString(analysis),
      storage: dbOn() ? 'mongodb' : 'memory',
    });
  } catch (error) {
    logError('Career analysis failed:', error);
    return next(error);
  }
});

// GET CAREER ANALYSIS
router.get('/analyses/:id', async (req, res, next) => {
  try {
    const analysis = dbOn()
      ? isValidId(req.params.id)
        ? await Analysis.findById(req.params.id).lean()
        : null
      : memory.analyses.find(
          (item) => String(item._id) === req.params.id
        );

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found.',
      });
    }

    return res.json({
      analysis: idString(analysis),
    });
  } catch (error) {
    return next(error);
  }
});

// CREATE CHAT SESSION
router.post('/chats', async (req, res, next) => {
  try {
    const {
      profileId = null,
      title = 'Career chat',
    } = req.body || {};

    const data = {
      profileId:
        dbOn() && isValidId(profileId) ? profileId : null,
      title: String(title).slice(0, 100),
      messages: [],
    };

    const chat = dbOn()
      ? await ChatSession.create(data)
      : {
          ...data,
          _id: `chat-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    if (!dbOn()) {
      memory.chats.push(chat);
    }

    console.log('Chat session created:', String(chat._id));

    return res.status(201).json({
      chat: idString(chat),
    });
  } catch (error) {
    logError('Chat creation failed:', error);
    return next(error);
  }
});

// GET CHAT SESSION
router.get('/chats/:id', async (req, res, next) => {
  try {
    const chat = dbOn()
      ? isValidId(req.params.id)
        ? await ChatSession.findById(req.params.id).lean()
        : null
      : memory.chats.find(
          (item) => String(item._id) === req.params.id
        );

    if (!chat) {
      return res.status(404).json({
        error: 'Chat session not found.',
      });
    }

    return res.json({
      chat: idString(chat),
    });
  } catch (error) {
    return next(error);
  }
});

// STREAM AI CHAT REPLY
router.post('/chats/:id/messages/stream', async (req, res, next) => {
  console.log('Chat route hit:', req.params.id);

  const {
    content,
    targetRole = 'my target role',
  } = req.body || {};

  const message = String(content || '').trim();

  if (!message) {
    return res.status(400).json({
      error: 'Message cannot be empty.',
    });
  }

  if (message.length > 5000) {
    return res.status(400).json({
      error: 'Message must be 5,000 characters or fewer.',
    });
  }

  let chat;

  try {
    chat = dbOn()
      ? isValidId(req.params.id)
        ? await ChatSession.findById(req.params.id)
        : null
      : memory.chats.find(
          (item) => String(item._id) === req.params.id
        );

    if (!chat) {
      return res.status(404).json({
        error: 'Chat session not found. Please create a new chat.',
      });
    }

    chat.messages.push({
      role: 'user',
      content: message,
      createdAt: new Date(),
    });

    if (dbOn()) {
      await chat.save();
    }
  } catch (error) {
    logError('Chat loading or saving failed:', error);
    return next(error);
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data) => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  try {
    if (isRealAIEnabled()) {
      console.log('Calling Gemini...');
      console.log(
        'Model:',
        process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      );
    } else {
      console.log(
        'Gemini API key not configured. Using demo chat reply.'
      );
    }

    const reply = await streamAssistantReply(
      chat.messages.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      String(targetRole).slice(0, 120),
      (token) => sendEvent({ token })
    );

    const finalReply = String(reply || '').trim();

    if (!finalReply) {
      sendEvent({
        error:
          'AI provider returned an empty reply. Check the model configuration.',
      });
      return res.end();
    }

    chat.messages.push({
      role: 'assistant',
      content: finalReply,
      createdAt: new Date(),
    });

    if (dbOn()) {
      await chat.save();
    }

    sendEvent({
      done: true,
      demoMode: !isRealAIEnabled(),
    });

    console.log('AI chat reply completed.');
    return res.end();
  } catch (error) {
    logError('Gemini chat error:', error);

    sendEvent({
      error: 'Gemini request failed. Check the server terminal.',
    });

    return res.end();
  }
});

// GET LEARNER PROGRESS
router.get('/progress/:key', async (req, res, next) => {
  try {
    const key = String(req.params.key || '').trim().slice(0, 120);

    if (!key) {
      return res.status(400).json({
        error: 'A progress key is required.',
      });
    }

    const record = dbOn()
      ? await LearningProgress.findOne({
          profileKey: key,
        }).lean()
      : memory.progress.get(key);

    return res.json({
      progress: record
        ? {
            completedTasks: record.completedTasks || [],
            attempts: record.attempts || [],
            interviewSessions: record.interviewSessions || [],
          }
        : {
            completedTasks: [],
            attempts: [],
            interviewSessions: [],
          },
      storage: dbOn() ? 'mongodb' : 'memory',
    });
  } catch (error) {
    return next(error);
  }
});

// UPDATE LEARNER PROGRESS
router.put('/progress/:key', async (req, res, next) => {
  try {
    const key = String(req.params.key || '').trim().slice(0, 120);

    if (!key) {
      return res.status(400).json({
        error: 'A progress key is required.',
      });
    }

    const body = req.body || {};

    const progress = {
      profileKey: key,
      completedTasks: Array.isArray(body.completedTasks)
        ? body.completedTasks.map(String).slice(0, 250)
        : [],
      attempts: Array.isArray(body.attempts)
        ? body.attempts.slice(-100)
        : [],
      interviewSessions: Array.isArray(body.interviewSessions)
        ? body.interviewSessions.slice(-100)
        : [],
    };

    if (dbOn()) {
      await LearningProgress.findOneAndUpdate(
        { profileKey: key },
        { $set: progress },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    } else {
      memory.progress.set(key, progress);
    }

    return res.json({
      ok: true,
      progress: {
        completedTasks: progress.completedTasks,
        attempts: progress.attempts,
        interviewSessions: progress.interviewSessions,
      },
      storage: dbOn() ? 'mongodb' : 'memory',
    });
  } catch (error) {
    logError('Progress update failed:', error);
    return next(error);
  }
});

// GENERATE INTERVIEW FEEDBACK
router.post('/interviews/feedback', async (req, res, next) => {
  try {
    const {
      targetRole = 'entry-level role',
      question,
      answer,
    } = req.body || {};

    if (!String(question || '').trim()) {
      return res.status(400).json({
        error: 'Interview question is required.',
      });
    }

    if (String(answer || '').trim().length < 12) {
      return res.status(400).json({
        error:
          'Please provide a more detailed answer before requesting feedback.',
      });
    }

    if (String(answer).length > 5000) {
      return res.status(400).json({
        error: 'Answer must be 5,000 characters or fewer.',
      });
    }

    const result = await createInterviewFeedback({
      targetRole: String(targetRole).slice(0, 120),
      question: String(question).slice(0, 1200),
      answer: String(answer).slice(0, 5000),
    });

    return res.json(result);
  } catch (error) {
    logError('Interview feedback failed:', error);
    return next(error);
  }
});

export default router;