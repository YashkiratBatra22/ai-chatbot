/* =========================================================
   AI Chatbot Interface
   Vanilla JS: messaging, rule-based auto-replies, typewriter
   animation, theme persistence, chat history persistence.
   ========================================================= */

(() => {
  'use strict';

  const STORAGE = {
    theme: 'aiChat:theme',
    history: 'aiChat:history',
  };

  const WELCOME_MESSAGE =
    "Hi! I'm your AI assistant. Ask me anything — I'm still learning, but I'll do my best.";

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

  // ---------- auto-response engine ----------
  function getBotResponse(input) {
    const text = input.toLowerCase().trim();

    const rules = [
      {
        test: /\b(hi|hello|hey|yo|sup)\b/,
        responses: ['Hey there! How can I help you today?', "Hello! What's on your mind?", 'Hi! Nice to see you.'],
      },
      {
        test: /how are you/,
        responses: ["I'm running smoothly, thanks for asking! How about you?", 'All systems are good on my end!'],
      },
      {
        test: /\b(your name|who are you)\b/,
        responses: ["I'm a demo AI chat interface built with HTML, CSS and JavaScript."],
      },
      {
        test: /\btime\b/,
        responses: [() => `It's currently ${formatTime(new Date())} on your device.`],
      },
      {
        test: /\b(date|today)\b/,
        responses: [
          () =>
            `Today is ${new Date().toLocaleDateString([], {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}.`,
        ],
      },
      {
        test: /\bjoke\b/,
        responses: [
          'Why do programmers prefer dark mode? Because light attracts bugs.',
          'I tried to catch some fog earlier. I mist.',
          "There are 10 types of people: those who understand binary and those who don't.",
        ],
      },
      {
        test: /\b(thank|thanks)\b/,
        responses: ["You're welcome!", 'Anytime!', 'Glad I could help.'],
      },
      {
        test: /\b(bye|goodbye|see you)\b/,
        responses: ['See you soon!', 'Goodbye! Come back anytime.', 'Take care!'],
      },
      {
        test: /\b(help|what can you do)\b/,
        responses: ['I can chat with you, tell a joke, share the time or date, and remember our conversation. Try asking something!'],
      },
      {
        test: /\b(theme|dark mode|light mode)\b/,
        responses: ['You can switch themes anytime using the moon or sun icon up top.'],
      },
    ];

    for (const rule of rules) {
      if (rule.test.test(text)) {
        const pick = rule.responses[Math.floor(Math.random() * rule.responses.length)];
        return typeof pick === 'function' ? pick() : pick;
      }
    }

    const fallbacks = [
      "That's interesting — tell me more.",
      "I'm a simple demo bot, so I might not fully understand that, but I'm listening!",
      "Got it. Anything else you'd like to ask?",
      "Hmm, I don't have a great answer for that yet, but I'm always learning.",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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

  // ---------- send flow ----------
  function handleSend(e) {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || isSending) return;

    appendMessage('user', text);
    messageInput.value = '';
    isSending = true;
    messageInput.disabled = true;
    updateSendButtonState();

    setTyping(true);

    const thinkDelay = 600 + Math.random() * 900;
    setTimeout(() => {
      setTyping(false);
      const reply = getBotResponse(text);
      typeBotMessage(reply);
    }, thinkDelay);
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
