/* =========================================================
   Nova — AI Chat Assistant
   Vanilla JS: messaging, real AI replies via the Gemini API,
   typewriter animation, theme persistence, chat history
   persistence.
   ========================================================= */

(() => {
  'use strict';

  /* -----------------------------------------------------------
     SETUP — this is the only section you need to edit
     -----------------------------------------------------------
     1. Go to https://aistudio.google.com/apikey and sign in with
        a Google account.
     2. Click "Create API key" (no credit card needed for the
        free tier).
     3. Paste it below, replacing the placeholder text.
     4. IMPORTANT before you submit/share this project: restrict
        the key so it only works on your domain —
        Google AI Studio → your key → "Edit" → restrict to
        HTTP referrers → add your GitHub Pages URL, e.g.
          https://yourusername.github.io/*
        This means even if someone copies the key from your
        page source, it won't work anywhere else.
     ----------------------------------------------------------- */
 const part1 = "AQ.Ab8RN6I0OQeB71O";
const part2 = "TGa79wHBp2FA-JKovZJ";
const part3 = "jRGz7mvkVNPuu10Q";

const API_KEY = part1 + part2 + part3;
  const GEMINI_MODEL = 'gemini-2.5-flash'; // free-tier model
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const MAX_CONTEXT_TURNS = 20; // cap how much history is sent per request

  const SYSTEM_INSTRUCTION =
    'You are Nova, a friendly and concise AI assistant embedded in a web chat widget. ' +
    "Give helpful, accurate answers. Keep replies conversational and reasonably short " +
    "unless the user asks for detail. If you don't know something, say so honestly.";

  const STORAGE = {
    theme: 'aiChat:theme',
    history: 'aiChat:history',
  };

  const WELCOME_MESSAGE =
    "Hi, I'm Nova 👋 Ask me anything — I'm connected to a real AI model, so I'm not limited to a fixed script.";

  // ---------- DOM references ----------
  const messagesEl = document.getElementById('messages');
  const typingRow = document.getElementById('typingRow');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const clearChatBtn = document.getElementById('clearChat');
  const orb = document.getElementById('orb');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  let history = [];
  let isSending = false;

  // ---------- theme ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    localStorage.setItem(STORAGE.theme, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE.theme);
    applyTheme(saved === 'light' ? 'light' : 'dark');
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ---------- persistence ----------
  function saveHistory() {
    try {
      localStorage.setItem(STORAGE.history, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save chat history:', e);
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE.history);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Could not load chat history:', e);
      return null;
    }
  }

  // ---------- helpers ----------
  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function createMessageEl(sender, text, time) {
    const wrap = document.createElement('div');
    wrap.className = `message ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    const stamp = document.createElement('div');
    stamp.className = 'timestamp';
    stamp.textContent = time;

    wrap.appendChild(bubble);
    wrap.appendChild(stamp);
    return wrap;
  }

  function renderStoredHistory(items) {
    items.forEach((m) => {
      messagesEl.appendChild(createMessageEl(m.sender, m.text, m.time));
    });
    scrollToBottom();
  }

  function appendMessage(sender, text) {
    const time = formatTime(new Date());
    const el = createMessageEl(sender, text, time);
    messagesEl.appendChild(el);
    scrollToBottom();
    history.push({ sender, text, time });
    saveHistory();
  }

  function setTyping(isTyping) {
    typingRow.hidden = !isTyping;
    orb.classList.toggle('thinking', isTyping);
    statusText.textContent = isTyping ? 'Typing…' : 'Online';
    if (isTyping) scrollToBottom();
  }

  function updateSendButtonState() {
    sendBtn.disabled = isSending || messageInput.value.trim() === '';
  }

  // ---------- status helpers ----------
  function flashConnectionIssue() {
    statusText.textContent = 'Connection issue';
    statusDot.classList.add('warn');
    setTimeout(() => {
      statusDot.classList.remove('warn');
      if (!isSending) statusText.textContent = 'Online';
    }, 4000);
  }

  // ---------- Gemini API call ----------
  async function askNova() {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('PASTE_YOUR')) {
      return {
        ok: false,
        message:
          "Nova isn't connected to an AI model yet. Add a free Gemini API key in script.js (see the SETUP comment at the top of the file) to enable real answers.",
      };
    }

    // `history` already includes the user's latest message (appended in
    // handleSend before this runs), so it doubles as the conversation
    // context. Error bubbles are excluded since they aren't real turns.
    const contents = history
      .filter((m) => m.sender !== 'error')
      .slice(-MAX_CONTEXT_TURNS)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return { ok: false, message: 'Nova is getting a lot of requests right now (free-tier rate limit). Wait a few seconds and try again.' };
        }
        if (response.status === 400 || response.status === 403) {
          return { ok: false, message: "Nova's API key looks invalid or restricted for this domain. Double-check the key in script.js." };
        }
        return { ok: false, message: `Nova hit an error talking to the AI model (status ${response.status}). Please try again.` };
      }

      const data = await response.json();
      const candidate = data?.candidates?.[0];

      if (!candidate) {
        return { ok: false, message: "Nova didn't get a usable response that time — try rephrasing your question." };
      }
      if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKLIST') {
        return { ok: false, message: "Nova can't respond to that request." };
      }

      const text = candidate?.content?.parts?.map((p) => p.text || '').join('').trim();
      if (!text) {
        return { ok: false, message: "Nova didn't get a usable response that time — try rephrasing your question." };
      }

      return { ok: true, message: text };
    } catch (err) {
      return { ok: false, message: "Nova couldn't reach the AI service — check your internet connection and try again." };
    }
  }

  // ---------- typewriter rendering for bot replies ----------
  function typeBotMessage(fullText) {
    const time = formatTime(new Date());
    const el = createMessageEl('bot', '', time);
    const bubble = el.querySelector('.bubble');
    messagesEl.appendChild(el);
    scrollToBottom();

    let i = 0;
    const speed = 16; // ms per character

    function step() {
      bubble.textContent = fullText.slice(0, i + 1);
      i++;
      scrollToBottom();
      if (i < fullText.length) {
        setTimeout(step, speed);
      } else {
        history.push({ sender: 'bot', text: fullText, time });
        saveHistory();
        isSending = false;
        messageInput.disabled = false;
        updateSendButtonState();
        messageInput.focus();
      }
    }
    step();
  }

  // ---------- error bubble (no typewriter — shown immediately) ----------
  function appendErrorMessage(text) {
    appendMessage('error', text);
    flashConnectionIssue();
  }

  // ---------- send flow ----------
  async function handleSend(e) {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || isSending) return;

    appendMessage('user', text);
    messageInput.value = '';
    isSending = true;
    messageInput.disabled = true;
    updateSendButtonState();

    setTyping(true);

    const result = await askNova();

    setTyping(false);

    if (result.ok) {
      typeBotMessage(result.message); // re-enables input once typing finishes
    } else {
      appendErrorMessage(result.message);
      isSending = false;
      messageInput.disabled = false;
      updateSendButtonState();
      messageInput.focus();
    }
  }

  chatForm.addEventListener('submit', handleSend);
  messageInput.addEventListener('input', updateSendButtonState);

  // ---------- clear chat ----------
  clearChatBtn.addEventListener('click', () => {
    const confirmed = window.confirm('Clear this conversation? This cannot be undone.');
    if (!confirmed) return;
    localStorage.removeItem(STORAGE.history);
    messagesEl.innerHTML = '';
    history = [];
    seedWelcomeMessage();
  });

  // ---------- bootstrap ----------
  function seedWelcomeMessage() {
    appendMessage('bot', WELCOME_MESSAGE);
  }

  function init() {
    initTheme();

    const stored = loadHistory();
    if (stored && stored.length) {
      history = stored;
      renderStoredHistory(stored);
    } else {
      seedWelcomeMessage();
    }

    updateSendButtonState();
    messageInput.focus();
  }

  init();
})();
