
import { useCallback, useEffect, useMemo, useState } from 'react';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const STORAGE_KEY = 'careerpilot-workspace-v2';
const AUTH_KEY = 'careerpilot-auth-v1';

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

const starterRoadmap = [
  { week: 1, topic: 'Strengthen the foundations', goal: 'Build confidence in the core skills used every day.', tasks: ['Review JavaScript fundamentals', 'Practise HTML and responsive CSS', 'Write a short learning reflection'] },
  { week: 2, topic: 'Build a focused mini-project', goal: 'Turn your knowledge into a project you can explain.', tasks: ['Plan a small React application', 'Build a form and reusable components', 'Publish the code to GitHub'] },
  { week: 3, topic: 'Connect the full stack', goal: 'Understand how a frontend communicates with a backend.', tasks: ['Create an Express API endpoint', 'Connect a database collection', 'Test success and error responses'] },
  { week: 4, topic: 'Test, present and prepare', goal: 'Make your work easier to review and discuss.', tasks: ['Add validation and basic tests', 'Write a clear project README', 'Practise a three-minute project demo'] }
];

const interviewPrompts = [
  {
    category: 'Introduction',
    question: 'Tell me about yourself.'
  },
  {
    category: 'Project Explanation',
    question: 'Tell me about a project you built. What problem did it solve, and what part did you implement yourself?'
  },
  {
    category: 'Time Management',
    question: 'How do you manage your time effectively?'
  },
  {
    category: 'Handling Feedback',
    question: 'How would you respond to negative feedback?'
  },
  {
    category: 'Strengths',
    question: 'What are your greatest strengths?'
  },
  {
    category: 'Career Goals',
    question: 'Where do you see yourself in the next five years?'
  }
];


async function api(path, options = {}) {
  const auth = loadAuth();

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(auth?.token
        ? { Authorization: `Bearer ${auth.token}` }
        : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}


function getWorkspaceKey(user) {
  // The backend auth response uses user.id. Email is a fallback for older accounts.
  const id = user?.id || user?._id || user?.userId;
  const email = user?.email?.trim().toLowerCase();
  const identity = id ? `id-${id}` : email ? `email-${email}` : null;
  return identity ? `${STORAGE_KEY}:${identity}` : null;
}

function emptyWorkspace(user) {
  return {
    form: {
      name: user?.name || '',
      targetRole: 'Full Stack Developer',
      experience: 'Beginner',
      skillsText: 'JavaScript, React, HTML/CSS',
      resumeText: ''
    },
    profileId: null,
    analysis: null,
    completedTasks: [],
    interviewSessions: []
  };
}

function loadLocal(user) {
  const key = getWorkspaceKey(user);
  if (!key) return emptyWorkspace(user);

  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (!saved || typeof saved !== 'object') return emptyWorkspace(user);
    return {
      ...emptyWorkspace(user),
      ...saved,
      form: { ...emptyWorkspace(user).form, ...(saved.form || {}) },
      completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks : [],
      interviewSessions: Array.isArray(saved.interviewSessions) ? saved.interviewSessions : []
    };
  } catch {
    return emptyWorkspace(user);
  }
}

function saveLocal(value, user) {
  const key = getWorkspaceKey(user);
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing may block storage.
  }
}

function Icon({ name }) {
  const paths = {
    grid: '▦',
    profile: '◉',
    progress: '↗',
    interview: '◷',
    coach: '◌',
    settings: '⚙',
    arrow: '↗',
    spark: '•',
    check: '✓',
    book: '▤',
    target: '◎',
    clock: '◷',
    trend: '⌁',
    menu: '☰'
  };

  return (
    <span className="icon" aria-hidden="true">
      {paths[name] || '•'}
    </span>
  );
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function ProgressRing({ value = 0 }) {
  return (
    <div
      className="progress-ring"
      style={{
        '--progress': `${Math.min(100, Math.max(0, value)) * 3.6}deg`
      }}
    >
      <div>
        <strong>{Math.round(value)}%</strong>
        <span>complete</span>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('careerpilot-theme') === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('careerpilot-theme', theme); } catch {}
  }, [theme]);

  const [health, setHealth] = useState(null);
  const [auth, setAuth] = useState(loadAuth);
  const localInitial = useMemo(() => loadLocal(auth?.user), [auth?.user?.id, auth?.user?._id, auth?.user?.email]);
const [authMode, setAuthMode] = useState('login');
const [authName, setAuthName] = useState('');
const [authEmail, setAuthEmail] = useState('');
const [authPassword, setAuthPassword] = useState('');
const [authBusy, setAuthBusy] = useState(false);
const [authError, setAuthError] = useState('');

  const [form, setForm] = useState(
    localInitial.form || {
      name: '',
      targetRole: 'Full Stack Developer',
      experience: 'Beginner',
      skillsText: 'JavaScript, React, HTML/CSS',
      resumeText: ''
    }
  );

  const [profileId, setProfileId] = useState(localInitial.profileId || null);
  const [analysis, setAnalysis] = useState(localInitial.analysis || null);
  const [completedTasks, setCompletedTasks] = useState(localInitial.completedTasks || []);
  const [interviewSessions, setInterviewSessions] = useState(localInitial.interviewSessions || []);

  const [activeTab, setActiveTab] = useState('overview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I’m your CareerPilot coach. Tell me your target role, ask about a skill, or request a small project idea to practise.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  const [interviewIndex, setInterviewIndex] = useState(0);
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [interviewBusy, setInterviewBusy] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState(null);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const skills = useMemo(
    () => form.skillsText.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30),
    [form.skillsText]
  );

  const roadmap = analysis?.roadmap?.length ? analysis.roadmap : starterRoadmap;

  const allTasks = useMemo(
    () =>
      roadmap.flatMap((week) =>
        (week.tasks || []).map((task, index) => ({
          id: `w${week.week}-${index}`,
          week: week.week,
          task
        }))
      ),
    [roadmap]
  );

  const progressPercent = allTasks.length
    ? Math.round(
        (allTasks.filter((task) => completedTasks.includes(task.id)).length /
          allTasks.length) *
          100
      )
    : 0;

  const updateForm = (key) => (event) => {
    setForm((old) => ({ ...old, [key]: event.target.value }));
  };

  const persistWorkspace = useCallback(
    (next = {}) => {
      if (!auth?.token || !auth?.user) return;
      saveLocal(
        {
          form,
          profileId,
          analysis,
          completedTasks,
          interviewSessions,
          ...next
        },
        auth.user
      );
    },
    [auth, form, profileId, analysis, completedTasks, interviewSessions]
  );

  useEffect(() => {
    api('/health')
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
  }, []);

  useEffect(() => {
    if (!profileId || !auth?.token) return undefined;

    let cancelled = false;
    api(`/progress/${encodeURIComponent(profileId)}`)
      .then(({ progress }) => {
        if (cancelled || !progress) return;
        setCompletedTasks(Array.isArray(progress.completedTasks) ? progress.completedTasks : []);
        setInterviewSessions(Array.isArray(progress.interviewSessions) ? progress.interviewSessions : []);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [profileId, auth?.token]);

  useEffect(() => {
    persistWorkspace();
  }, [persistWorkspace]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  async function runAnalysis(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const profileResult = await api('/profiles', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim() || 'Learner',
          targetRole: form.targetRole,
          skills,
          resumeText: form.resumeText
        })
      });

      const savedId = profileResult.profile._id;
      setProfileId(savedId);

      const result = await api('/analyses', {
        method: 'POST',
        body: JSON.stringify({
          profileId: savedId,
          name: form.name || 'Learner',
          targetRole: form.targetRole,
          skills,
          resumeText: form.resumeText
        })
      });

      setAnalysis(result.analysis);

      api(`/progress/${encodeURIComponent(savedId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          completedTasks,
          interviewSessions
        })
      }).catch(() => {});

      setActiveTab('overview');
      setToast('Your career plan is ready');
    } catch (e) {
      setError(`${e.message}. Check that the backend is running, then try again.`);
    } finally {
      setBusy(false);
    }
  }

  async function startChat() {
    if (chatId) return chatId;

    const result = await api('/chats', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        title: `Career chat — ${form.targetRole}`
      })
    });

    setChatId(result.chat._id);
    return result.chat._id;
  }

  async function sendMessage(event) {
    event?.preventDefault();

    const text = chatInput.trim();

    if (!text || chatBusy) return;

    setChatInput('');
    setError('');

    setMessages((old) => [
      ...old,
      { role: 'user', content: text },
      { role: 'assistant', content: '' }
    ]);

    setChatBusy(true);

    try {
      const id = await startChat();

      const response = await fetch(
        `${API}/chats/${encodeURIComponent(id)}/messages/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(loadAuth()?.token
              ? { Authorization: `Bearer ${loadAuth().token}` }
              : {})
          },
          body: JSON.stringify({
            content: text,
            targetRole: form.targetRole
          })
        }
      );

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Could not connect to the chat service.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const line = evt.split('\n').find((part) => part.startsWith('data: '));
          if (!line) continue;

          const payload = JSON.parse(line.slice(6));

          if (payload.error) throw new Error(payload.error);

          if (payload.token) {
            setMessages((old) =>
              old.map((message, index) =>
                index === old.length - 1
                  ? { ...message, content: message.content + payload.token }
                  : message
              )
            );
          }
        }
      }
    } catch (e) {
      setError(e.message);

      setMessages((old) =>
        old.map((message, index) =>
          index === old.length - 1 && !message.content
            ? {
                ...message,
                content: 'Sorry, I could not get a reply. Check the API server and try again.'
              }
            : message
        )
      );
    } finally {
      setChatBusy(false);
    }
  }

  function toggleTask(taskId) {
    const next = completedTasks.includes(taskId)
      ? completedTasks.filter((id) => id !== taskId)
      : [...completedTasks, taskId];

    setCompletedTasks(next);

    if (profileId) {
      api(`/progress/${encodeURIComponent(profileId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          completedTasks: next,
          interviewSessions
        })
      }).catch(() => {});
    }

    setToast('Learning progress updated');
  }

  async function submitInterview(event) {
    event.preventDefault();

    const answer = interviewAnswer.trim();
    const question = interviewPrompts[interviewIndex].question;

    if (answer.length < 12) {
      setError('Add a little more detail to your answer so the coach can give useful feedback.');
      return;
    }

    setInterviewBusy(true);
    setError('');
    setInterviewFeedback(null);

    try {
      const result = await api('/interviews/feedback', {
        method: 'POST',
        body: JSON.stringify({
          targetRole: form.targetRole,
          question,
          answer
        })
      });

      // The backend currently returns the feedback object directly. This also
      // supports an API response wrapped as { feedback, demoMode }.
      const raw = result.feedback || result;
      const rawScore = raw.overallScore ?? raw.score ?? null;
      const scoreNumber = rawScore === null ? null : Number(rawScore);
      const score = Number.isFinite(scoreNumber)
        ? Math.round(Math.max(0, Math.min(100, scoreNumber)) / 10)
        : null;

      const feedback = {
        score,
        summary: raw.summary || raw.feedback || 'Feedback is not available for this answer.',
        strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
        improvements: Array.isArray(raw.improvements) ? raw.improvements : [],
        nextStep: raw.nextStep || raw.suggestedNextStep || '',
        suggestedAnswer: raw.suggestedAnswer || '',
        demoMode: result.demoMode === true || raw.mode === 'demo'
      };

      const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        question,
        answer,
        feedback,
        score,
        demoMode: feedback.demoMode
      };

      const nextSessions = [...interviewSessions, session];
      setInterviewFeedback(feedback);
      setInterviewSessions(nextSessions);

      if (profileId) {
        api(`/progress/${encodeURIComponent(profileId)}`, {
          method: 'PUT',
          body: JSON.stringify({ completedTasks, interviewSessions: nextSessions })
        }).catch(() => {});
      }

      setToast(feedback.demoMode ? 'AI feedback unavailable' : 'Interview feedback saved');
    } catch (e) {
      setError(e.message || 'Could not evaluate your answer. Please check the server and try again.');
    } finally {
      setInterviewBusy(false);
    }
  }

  function nextInterviewQuestion() {
    setInterviewIndex((old) => (old + 1) % interviewPrompts.length);
    setInterviewAnswer('');
    setInterviewFeedback(null);
  }

  const navItems = [
    { id: 'overview', label: 'Career overview', icon: 'grid' },
    { id: 'profile', label: 'Career profile', icon: 'profile' },
    { id: 'progress', label: 'My progress', icon: 'progress' },
    { id: 'interview', label: 'Interview practice', icon: 'interview' },
    { id: 'coach', label: 'AI career coach', icon: 'coach' }
  ];

  const pageTitle =
    navItems.find((item) => item.id === activeTab)?.label || 'Career overview';

  function navigate(id) {
    setActiveTab(id);
    setMobileNavOpen(false);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
async function submitAuth(event) {
  event.preventDefault();
  setAuthBusy(true);
  setAuthError('');

  try {
    const isSignup = authMode === 'signup';

    const result = await api(
      isSignup ? '/auth/signup' : '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(
          isSignup
            ? {
                name: authName.trim(),
                email: authEmail.trim(),
                password: authPassword
              }
            : {
                email: authEmail.trim(),
                password: authPassword
              }
        )
      }
    );

    const savedAuth = {
      token: result.token,
      user: result.user
    };

    // Load only the workspace belonging to the account that just signed in.
    const workspace = loadLocal(savedAuth.user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(savedAuth));

    setForm(workspace.form);
    setProfileId(workspace.profileId);
    setAnalysis(workspace.analysis);
    setCompletedTasks(workspace.completedTasks);
    setInterviewSessions(workspace.interviewSessions);
    setActiveTab('overview');
    setChatId(null);
    setMessages([
      {
        role: 'assistant',
        content: 'Hi! I’m your CareerPilot coach. Tell me your target role, ask about a skill, or request a small project idea to practise.'
      }
    ]);
    setChatInput('');
    setInterviewAnswer('');
    setInterviewFeedback(null);
    setError('');
    setAuth(savedAuth);
    setAuthPassword('');
    setToast(
      isSignup ? 'Account created successfully' : 'Login successful'
    );
  } catch (error) {
    setAuthError(error.message);
  } finally {
    setAuthBusy(false);
  }
}

function logout() {
  // Do not remove saved workspace data; it belongs to the account and should persist.
  localStorage.removeItem(AUTH_KEY);
  setAuth(null);
  setAuthPassword('');
  setAuthEmail('');
  setAuthName('');
  setAuthError('');
  setForm(emptyWorkspace(null).form);
  setProfileId(null);
  setAnalysis(null);
  setCompletedTasks([]);
  setInterviewSessions([]);
  setActiveTab('overview');
  setChatId(null);
  setMessages([
    {
      role: 'assistant',
      content: 'Hi! I’m your CareerPilot coach. Tell me your target role, ask about a skill, or request a small project idea to practise.'
    }
  ]);
  setChatInput('');
  setInterviewAnswer('');
  setInterviewFeedback(null);
  setError('');
}


  return (
  !auth?.token ? (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '24px',
      background: 'var(--page-bg)',
      color: 'var(--ink)'
    }} className="auth-screen" data-theme={theme}>
      <button type="button" className="theme-toggle auth-theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle color theme">
        {theme === 'dark' ? '☀ Light mode' : '☾ Dark mode'}
      </button>
      <form
        onSubmit={submitAuth}
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '32px',
          background: 'var(--panel)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
          borderRadius: '24px',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <h1>CareerPilot AI</h1>
        <p>
          {authMode === 'signup'
            ? 'Create your account to get started.'
            : 'Welcome back. Sign in to continue.'}
        </p>

        {authMode === 'signup' && (
          <label style={{ display: 'block', marginBottom: '16px' }}>
            Name
            <input
              className="auth-input"
              style={{ display: 'block', width: '100%', padding: '12px', marginTop: '6px' }}
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              required
              maxLength={80}
              autoComplete="name"
            />
          </label>
        )}

        <label style={{ display: 'block', marginBottom: '16px' }}>
          Email
          <input
            style={{ display: 'block', width: '100%', padding: '12px', marginTop: '6px' }}
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          Password
          <input
            style={{ display: 'block', width: '100%', padding: '12px', marginTop: '6px' }}
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
          />
        </label>

        {authError && (
          <p role="alert" style={{ color: '#b42318' }}>
            {authError}
          </p>
        )}

        <button
          type="submit"
          disabled={authBusy}
          style={{
            width: '100%',
            padding: '13px',
            border: 0,
            borderRadius: '10px',
            background: '#6546d7',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          {authBusy
            ? 'Please wait...'
            : authMode === 'signup'
              ? 'Create account'
              : 'Log in'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          {authMode === 'signup'
            ? 'Already have an account? '
            : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'signup' ? 'login' : 'signup');
              setAuthError('');
            }}
            style={{
              border: 0,
              background: 'none',
              color: '#6546d7',
              cursor: 'pointer'
            }}
          >
            {authMode === 'signup' ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </form>
    </main>
  ) : (
    <div className={`app-shell theme-${theme}`} data-theme={theme}>
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a
          className="brand"
          href="#top"
          onClick={() => navigate('overview')}
        >
          <img className="brand-logo" src="/careerpilot-logo.png" alt="CareerPilot AI logo" style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0 }} />
          <span>
            career<span className="brand-light">pilot</span>
            <small>YOUR AI CAREER COMPANION</small>
          </span>
        </a>

        <div className="side-label">YOUR WORKSPACE</div>

        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'selected' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="side-orb" aria-hidden="true">✓</div>
          <strong>Your next chapter starts here.</strong>
          <p>Small steps today. A stronger career tomorrow.</p>
          <div className="sidebar-mini-progress">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <small>{progressPercent}% of your current roadmap complete</small>
          <span className="privacy-note">Built for learning · Not a job guarantee</span>
        </div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileNavOpen((old) => !old)}
            aria-label="Toggle navigation"
          >
            <Icon name="menu" />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{pageTitle}</strong>
          </div>

          <div className="topbar-right">
            <span className={`status-dot ${health?.ok ? 'online' : ''}`} />
            <span className="status-label">
              {health?.ok
                ? health.storage === 'mongodb'
                  ? 'MongoDB connected'
                  : 'Demo workspace'
                : 'API disconnected'}
            </span>
            <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle color theme" title="Switch theme">
              {theme === 'dark' ? '☀' : '☾'} <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <div className="avatar">
  {(auth?.user?.name?.[0] || form.name.trim()[0] || 'Y').toUpperCase()}
</div>

<button className="button button-ghost" onClick={logout}>
  Log out
</button>
          </div>
        </header>

        {error && (
          <div className="alert" role="alert">
            <span>!</span>
            <div>{error}</div>
            <button onClick={() => setError('')} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        {toast && (
          <div className="toast" role="status">
            <span>✓</span>
            {toast}
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            <section className="hero dashboard-hero">
              <div className="hero-copy">
                <span className="hero-kicker">
                  YOUR PERSONAL CAREER COMPANION
                </span>
                <h1>
                  Make your next move
                  <br />
                  <em>your best move.</em>
                </h1>
                <p>
                  Know where you stand, practise what matters, and turn your
                  career goal into small wins you can track.
                </p>

                <div className="hero-actions">
                  <button
                    className="button button-primary"
                    onClick={() => navigate('profile')}
                  >
                    Build my career plan <span>↗</span>
                  </button>
                </div>

                <div className="hero-trust">
                  <span>✓ Beginner-friendly</span>
                  <span>✓ Personalised guidance</span>
                  <span>✓ Progress you can see</span>
                </div>
              </div>

              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="art-core career-logo-core">
                  <img src="/careerpilot-logo.png" alt="CareerPilot AI" />
                </div>

                <div className="float-card float-card-top">
                  <span className="mini-icon violet">↗</span>
                  <div>
                    <small>YOUR NEXT STEP</small>
                    <strong>
                      {progressPercent ? 'Keep the momentum' : 'Start with one skill'}
                    </strong>
                  </div>
                </div>

                <div className="float-card float-card-bottom">
                  <span className="mini-icon mint">✓</span>
                  <div>
                    <small>YOUR LEARNING PATH</small>
                    <strong>{progressPercent}% complete</strong>
                  </div>
                </div>

                
                
              </div>
            </section>

            <section className="welcome-row">
              <div>
                <span className="eyebrow">YOUR DASHBOARD</span>
                <h2>
                  {form.name.trim()
                    ? `Welcome back, ${form.name.trim()}!`
                    : 'Your career journey, at a glance.'}
                </h2>
                <p>One clear next step is better than a hundred tabs open.</p>
              </div>

              <button
                className="text-button"
                onClick={() => navigate('profile')}
              >
                Edit career goal <span>↗</span>
              </button>
            </section>

            <section className="stats-grid">
              <div className="stat-card stat-purple">
                <div className="stat-top">
                  <span>Roadmap progress</span>
                  <span className="stat-icon">↗</span>
                </div>
                <div className="stat-value">
                  {progressPercent}
                  <small>%</small>
                </div>
                <div className="stat-foot">
                  <div className="meter">
                    <span style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span>{completedTasks.length} tasks done</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Interview practices</span>
                  <span className="stat-icon amber-icon">◎</span>
                </div>
                <div className="stat-value">
                  {interviewSessions.length}
                  <small> sessions</small>
                </div>
                <div className="stat-note">
                  Every answer is a chance to improve
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Career goal</span>
                  <span className="stat-icon blue-icon">◎</span>
                </div>
                <div className="stat-role">{form.targetRole}</div>
                <div className="stat-note">
                  {form.experience} · {skills.length} listed skills
                </div>
              </div>
            </section>

            <section className="overview-grid">
              <div className="panel focus-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-icon">↗</span>
                    <div>
                      <h3>Your next best steps</h3>
                      <p>Simple actions to keep you moving</p>
                    </div>
                  </div>
                  <span className="pill">THIS WEEK</span>
                </div>

                <div className="focus-list">
                  {[
                    {
                      num: '01',
                      title:
                        progressPercent === 100
                          ? 'Choose a portfolio project'
                          : analysis?.missingSkills?.[0] || 'Create your career plan',
                      sub:
                        progressPercent === 100
                          ? 'Apply your learning to a practical project'
                          : analysis
                            ? 'Start with a suggested development area'
                            : 'Add your skills and generate a personalised roadmap',
                      action: analysis ? 'progress' : 'profile',
                      label: analysis ? 'View roadmap' : 'Create career plan'
                    },
                    {
                      num: '02',
                      title:
                        allTasks.length > 0 && completedTasks.length >= allTasks.length
                          ? 'Add a portfolio project'
                          : 'Finish one roadmap task',
                      sub:
                        allTasks.length > 0 && completedTasks.length >= allTasks.length
                          ? 'Show what you can do with your skills'
                          : 'Learning sticks when you practise',
                      action: 'progress',
                      label: 'View tasks'
                    },
                    {
                      num: '03',
                      title: interviewSessions.length
                        ? 'Improve your last interview answer'
                        : 'Practise explaining your work',
                      sub: interviewSessions.length
                        ? 'Use your latest feedback to make the next answer clearer'
                        : 'Build confidence before an interview',
                      action: 'interview',
                      label: 'Practise now'
                    }
                  ].map((step) => (
                    <div className="focus-item" key={step.num}>
                      <span className="focus-number">{step.num}</span>
                      <div className="focus-copy">
                        <strong>{step.title}</strong>
                        <span>{step.sub}</span>
                      </div>
                      <button
                        onClick={() => navigate(step.action)}
                        aria-label={step.label}
                      >
                        ↗
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel journey-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-icon mint-panel-icon">◎</span>
                    <div>
                      <h3>Your learning journey</h3>
                      <p>From learning to showing your skills</p>
                    </div>
                  </div>
                </div>

                <div className="journey-track">
                  {[
                    {
                      icon: '01',
                      title: 'Know your skills',
                      sub: 'Career profile',
                      done: Boolean(analysis)
                    },
                    {
                      icon: '02',
                      title: 'Build a habit',
                      sub: 'Track your progress',
                      done: completedTasks.length > 0
                    },
                    {
                      icon: '03',
                      title: 'Get interview-ready',
                      sub: 'Practice answers',
                      done: interviewSessions.length > 0
                    }
                  ].map((step, i) => (
                    <div
                      className={`journey-step ${step.done ? 'done' : ''}`}
                      key={step.icon}
                    >
                      <span className="journey-dot">
                        {step.done ? '✓' : step.icon}
                      </span>
                      <div>
                        <strong>{step.title}</strong>
                        <small>{step.sub}</small>
                      </div>
                      {i < 2 && <span className="journey-line" />}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bottom-cta">
              <div className="cta-symbol">✓</div>
              <div>
                <strong>Progress beats perfection.</strong>
                <p>
                  Pick one skill, spend 20 minutes practising it, and mark the
                  task complete.
                </p>
              </div>
              <button
                className="button button-light"
                onClick={() => navigate('progress')}
              >
                Continue learning <span>→</span>
              </button>
            </section>
          </>
        )}

        {activeTab === 'profile' && (
          <section className="content-section profile-page">
            <SectionTitle
              eyebrow="START WITH YOU"
              title="Tell us where you want to go."
              description="Share your goal and current skills. CareerPilot will turn that context into a practical starting plan."
            />

            <div className="profile-grid">
              <form className="panel form-panel" onSubmit={runAnalysis}>
                <div className="panel-heading">
                  <div>
                    <span className="step-number">01</span>
                    <h3>Your career profile</h3>
                  </div>
                  <span className="optional-tag">PERSONALISE</span>
                </div>

                <label>
                  Your name <span className="muted">(optional)</span>
                  <input
                    value={form.name}
                    onChange={updateForm('name')}
                    placeholder="e.g. Alex"
                    maxLength={80}
                  />
                </label>

                <label>
                  Target career role <span className="required">*</span>
                  <select
                    value={form.targetRole}
                    onChange={updateForm('targetRole')}
                  >
                    <option>Full Stack Developer</option>
                    <option>Frontend Developer</option>
                    <option>Backend Developer</option>
                    <option>Python Developer</option>
                    <option>Data Analyst</option>
                    <option>AI / ML Engineer</option>
                    <option>UI/UX Designer</option>
                    <option>Software Tester</option>
                  </select>
                </label>

                <label>
                  Current experience level
                  <select
                    value={form.experience}
                    onChange={updateForm('experience')}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Experienced</option>
                  </select>
                </label>

                <label>
                  Skills you know <span className="muted">(comma-separated)</span>
                  <input
                    value={form.skillsText}
                    onChange={updateForm('skillsText')}
                    placeholder="JavaScript, React, SQL, Python"
                    maxLength={1200}
                  />
                </label>

                <div className="skill-preview">
                  {skills.map((skill) => (
                    <span className="skill-chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                  {!skills.length && (
                    <span className="muted">Add a few skills to get started.</span>
                  )}
                </div>

                <label>
                  Resume or project experience{' '}
                  <span className="muted">(optional)</span>
                  <textarea
                    value={form.resumeText}
                    onChange={updateForm('resumeText')}
                    rows="6"
                    maxLength={12000}
                    placeholder="Describe projects, coursework, internships or practical work. Avoid sensitive personal details."
                  />
                </label>

                <div className="char-count">
                  {form.resumeText.length.toLocaleString()} / 12,000 characters
                </div>

                <button
                  className="button button-primary button-full"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <span className="spinner" /> Analysing your profile…
                    </>
                  ) : (
                    <>
                      Generate my career plan <span>↗</span>
                    </>
                  )}
                </button>

                <p className="form-footnote">
                  <span>ⓘ</span> AI suggestions can be imperfect. Review them
                  and only claim skills you can demonstrate.
                </p>
              </form>

              <div className="side-info">
                <div className="panel what-panel">
                  <div className="illustration-badge">✓</div>
                  <span className="eyebrow">YOUR PERSONAL PLAN</span>
                  <h3>
                    Make the next step <em>clear.</em>
                  </h3>
                  <p>
                    Your profile helps organise the skills, projects and
                    practice that may support your target role.
                  </p>

                  <div className="mini-roadmap">
                    <div className="road-step">
                      <span>1</span>
                      <div>
                        <strong>Understand your starting point</strong>
                        <small>Skills and strengths</small>
                      </div>
                    </div>
                    <div className="road-line" />
                    <div className="road-step">
                      <span>2</span>
                      <div>
                        <strong>Focus on what matters</strong>
                        <small>Potential skill gaps</small>
                      </div>
                    </div>
                    <div className="road-line" />
                    <div className="road-step">
                      <span>3</span>
                      <div>
                        <strong>Practise with a plan</strong>
                        <small>Weekly learning tasks</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tip-card">
                  <span className="tip-icon">→</span>
                  <div>
                    <strong>Tip for a better plan</strong>
                    <p>
                      Include projects and practical experience—not just a list
                      of technologies.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {analysis && (
              <div className="analysis-preview panel">
                <div className="analysis-preview-head">
                  <div>
                    <span className="eyebrow">LATEST ANALYSIS</span>
                    <h3>Your starting point for {analysis.targetRole}</h3>
                  </div>
                  {analysis.demoMode && (
                    <span className="demo-badge">DEMO RESPONSE</span>
                  )}
                </div>

                <div className="results-grid">
                  <div className="result-card strengths-card">
                    <h4>✓ Strengths to build on</h4>
                    <ul>
                      {(analysis.strengths || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="result-card gaps-card">
                    <h4>◎ Potential skill gaps</h4>
                    <ul>
                      {(analysis.missingSkills || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <h4 className="inline-heading">Recommended next steps</h4>

                <div className="recommendation-list">
                  {(analysis.recommendations || []).map((item, i) => (
                    <div className="recommendation" key={i}>
                      <span>0{i + 1}</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>

                <button
                  className="button button-primary"
                  onClick={() => navigate('progress')}
                >
                  View learning roadmap <span>→</span>
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'progress' && (
          <section className="content-section">
            <SectionTitle
              eyebrow="SMALL WINS ADD UP"
              title="Your progress, made visible."
              description="Track your roadmap tasks and decide what to work on next."
              action={
                <button
                  className="button button-ghost"
                  onClick={() => navigate('profile')}
                >
                  Update my plan ↗
                </button>
              }
            />

            <div className="progress-overview-grid">
              <div className="panel progress-summary">
                <div>
                  <span className="eyebrow">ROADMAP COMPLETION</span>
                  <h3>You're building momentum.</h3>
                  <p>
                    Mark a task complete when you've practised it—not just read
                    about it.
                  </p>
                  <div className="progress-big-line">
                    <strong>{completedTasks.length}</strong>
                    <span>of {allTasks.length} tasks complete</span>
                  </div>
                </div>
                <ProgressRing value={progressPercent} />
              </div>

              <div className="panel progress-metrics">
                <div className="metric-row">
                  <span className="metric-icon amber-icon">◎</span>
                  <div>
                    <strong>{interviewSessions.length}</strong>
                    <small>Interview answers practised</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="roadmap-section-head">
              <div>
                <span className="eyebrow">YOUR LEARNING PLAN</span>
                <h3>Four-week roadmap</h3>
              </div>
              <span className="pill">
                {analysis ? 'PERSONALISED' : 'STARTER PLAN'}
              </span>
            </div>

            {!analysis && (
              <div className="info-banner">
                <span>✓</span>
                <p>
                  This is a starter roadmap.{' '}
                  <button
                    className="inline-link"
                    onClick={() => navigate('profile')}
                  >
                    Create your career plan
                  </button>{' '}
                  to get AI recommendations for your target role.
                </p>
              </div>
            )}

            <div className="progress-roadmap">
              {roadmap.map((week) => (
                <div className="panel progress-week" key={week.week}>
                  <div className="progress-week-head">
                    <span className="week-number">
                      W{String(week.week).padStart(2, '0')}
                    </span>
                    <div>
                      <h4>{week.topic}</h4>
                      <p>{week.goal}</p>
                    </div>
                    <span className="week-fraction">
                      {(week.tasks || []).filter((task, i) =>
                        completedTasks.includes(`w${week.week}-${i}`)
                      ).length}
                      /{(week.tasks || []).length}
                    </span>
                  </div>

                  <div className="task-list">
                    {(week.tasks || []).map((task, i) => {
                      const id = `w${week.week}-${i}`;
                      const done = completedTasks.includes(id);

                      return (
                        <label
                          className={`task-row ${done ? 'task-done' : ''}`}
                          key={id}
                        >
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggleTask(id)}
                          />
                          <span className="custom-check">
                            {done ? '✓' : ''}
                          </span>
                          <span>{task}</span>
                          {done && <small>Completed</small>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="history-grid">
              <div className="panel history-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-icon mint-panel-icon">✓</span>
                    <div>
                      <h3>Interview practice</h3>
                      <p>Practice makes answers clearer</p>
                    </div>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate('interview')}
                  >
                    Practise ↗
                  </button>
                </div>

                {interviewSessions.length ? (
                  <div className="history-list">
                    {[...interviewSessions]
                      .reverse()
                      .slice(0, 5)
                      .map((session) => (
                        <div className="history-row" key={session.id}>
                          <div className="history-badge interview-badge">
                            ✓
                          </div>
                          <div className="history-main">
                            <strong>
                              {session.question.slice(0, 56)}
                              {session.question.length > 56 ? '…' : ''}
                            </strong>
                            <small>
                              {new Date(session.date).toLocaleDateString()}
                            </small>
                          </div>
                          <strong className="history-score">
                            {session.score}/10
                          </strong>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span>✓</span>
                    <strong>Prepare with practice</strong>
                    <p>
                      Answer role-relevant questions and get feedback on
                      clarity and detail.
                    </p>
                    <button
                      className="button button-ghost"
                      onClick={() => navigate('interview')}
                    >
                      Practise an answer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'interview' && (
          <section className="content-section">
            <SectionTitle
              eyebrow="PRACTISE WITH CONFIDENCE"
              title="Your interview practice room."
              description="Answer one question at a time. Get actionable feedback, then practise again with a clearer example."
              action={
                <span className="pill">
                  {interviewSessions.length} ANSWERS PRACTISED
                </span>
              }
            />

            <div className="interview-layout">
              <div className="interview-main panel">
                <div className="interview-topline">
                  <span className="interview-tag">
                    {interviewPrompts[interviewIndex].category}
                  </span>
                  <span>
                    QUESTION {String(interviewIndex + 1).padStart(2, '0')} /{' '}
                    {String(interviewPrompts.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="interview-quote">“</div>
                <h3>{interviewPrompts[interviewIndex].question}</h3>
                <p className="interview-hint">
                  Tip: explain your thinking, include a specific example, and
                  be honest about what you did yourself.
                </p>

                <form onSubmit={submitInterview}>
                  <label htmlFor="interview-answer">Your answer</label>
                  <textarea
                    id="interview-answer"
                    rows="8"
                    value={interviewAnswer}
                    onChange={(e) => setInterviewAnswer(e.target.value)}
                    maxLength={5000}
                    placeholder="Structure your answer…"
                  />

                  <div className="answer-footer">
                    <span>{interviewAnswer.length}/5,000 characters</span>
                    <button
                      className="button button-primary"
                      disabled={
                        interviewBusy || interviewAnswer.trim().length < 12
                      }
                    >
                      {interviewBusy ? (
                        <>
                          <span className="spinner" /> Reviewing answer…
                        </>
                      ) : (
                        <>
                          Get AI feedback <span>↗</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {interviewFeedback && (
                  <div className="feedback-card">
                    <div className="feedback-heading">
                      <div>
                        <span className="eyebrow">YOUR FEEDBACK</span>
                        <h4>{interviewFeedback.demoMode ? 'AI feedback unavailable' : 'Your answer review'}</h4>
                      </div>
                      <div className="feedback-score">
                        <strong>{interviewFeedback.score === null ? '—' : interviewFeedback.score}</strong>
                        <span>/10</span>
                      </div>
                    </div>

                    <p>{interviewFeedback.summary}</p>

                    <div className="feedback-columns">
                      <div>
                        <strong>What you did well</strong>
                        {interviewFeedback.strengths.length ? (
                          <ul>{interviewFeedback.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        ) : (
                          <p>No strengths were evaluated.</p>
                        )}
                      </div>
                      <div>
                        <strong>What you can improve</strong>
                        {interviewFeedback.improvements.length ? (
                          <ul>{interviewFeedback.improvements.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        ) : (
                          <p>No improvement points are available.</p>
                        )}
                      </div>
                    </div>

                    {interviewFeedback.nextStep && (
                      <div className="sample-answer">
                        <strong>Suggested next step</strong>
                        <p>{interviewFeedback.nextStep}</p>
                      </div>
                    )}

                    {interviewFeedback.suggestedAnswer && (
                      <div className="sample-answer">
                        <strong>Example of a stronger answer</strong>
                        <p>{interviewFeedback.suggestedAnswer}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={nextInterviewQuestion}
                    >
                      Next question <span>→</span>
                    </button>

                    {interviewFeedback.demoMode && (
                      <small className="demo-note">
                        No score has been assigned because AI evaluation was unavailable. Check the Gemini API key and server logs.
                      </small>
                    )}
                  </div>
                )}
              </div>

              <aside className="interview-side">
                <div className="panel interview-guide">
                  <span className="eyebrow">ANSWER FRAMEWORK</span>
                  <h3>Keep it clear and specific.</h3>

                  <div className="framework-step">
                    <span>1</span>
                    <div>
                      <strong>Context</strong>
                      <p>What was the problem or situation?</p>
                    </div>
                  </div>

                  <div className="framework-step">
                    <span>2</span>
                    <div>
                      <strong>Your action</strong>
                      <p>What did you personally do, and why?</p>
                    </div>
                  </div>

                  <div className="framework-step">
                    <span>3</span>
                    <div>
                      <strong>Outcome</strong>
                      <p>What changed or what did you learn?</p>
                    </div>
                  </div>
                </div>

                <div className="panel interview-progress-card">
                  <span className="panel-icon mint-panel-icon">✓</span>
                  <h3>Confidence comes from reps.</h3>
                  <p>
                    Every attempt is saved to your local progress history.
                    Focus on making your next answer clearer than the last.
                  </p>
                  <div className="interview-total">
                    <strong>{interviewSessions.length}</strong>
                    <span>answers practised</span>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}

        {activeTab === 'coach' && (
          <section className="content-section chat-section">
            <SectionTitle
              eyebrow="YOUR AI MENTOR"
              title="Let's figure out your next move."
              description={`Ask about ${form.targetRole}, skill gaps, learning plans, projects or interview preparation.`}
            />

            <div className="chat-panel">
              <div className="chat-top">
                <div className="coach-avatar">CP</div>
                <div>
                  <strong>CareerPilot Coach</strong>
                  <span><i /> Here to help you learn</span>
                </div>
                <span className="chat-top-tag">AI ASSISTANT</span>
              </div>

              <div className="chat-suggestions">
                <span>Try asking:</span>
                {[
                  'What should I learn first?',
                  'Give me a beginner project idea',
                  'How can I explain my project?'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setChatInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div
                    className={`message-row ${message.role}`}
                    key={`${message.role}-${index}`}
                  >
                    <div className="message-avatar">
                      {message.role === 'assistant'
                        ? '✓'
                        : (form.name.trim()[0] || 'Y').toUpperCase()}
                    </div>
                    <div className="message-bubble">
                      {message.content || (
                        <span className="typing">
                          <i /><i /><i />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <form className="chat-composer" onSubmit={sendMessage}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask something about your career…"
                  maxLength={5000}
                />
                <button
                  className="send-button"
                  disabled={chatBusy || !chatInput.trim()}
                  aria-label="Send message"
                >
                  {chatBusy ? '…' : '↑'}
                </button>
              </form>

              <p className="chat-disclaimer">
                AI can make mistakes. Verify important career decisions and
                never share sensitive personal information.
              </p>
            </div>
          </section>
        )}

        <footer className="footer">
          <span>✓ CareerPilot AI</span>
          <span>Built for learning, one step at a time.</span>
          <span>Career guidance is educational, not a job guarantee.</span>
        </footer>
      </main>
    </div>
  )
  );
}

