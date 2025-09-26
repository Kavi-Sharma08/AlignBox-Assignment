// Auth toggle logic

const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const toggleAuth = document.getElementById('toggle-auth');

let isLoginMode = true;

function setAuthMode(loginMode) {
  isLoginMode = loginMode;
  loginBtn.style.display = loginMode ? '' : 'none';
  registerBtn.style.display = loginMode ? 'none' : '';
  toggleAuth.innerHTML = loginMode
    ? "Don't have an account? <a href='#' id='show-register'>Register</a>"
    : "Already have an account? <a href='#' id='show-login'>Login</a>";
}

// Event delegation for toggleAuth
toggleAuth.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'show-register') {
    e.preventDefault();
    setAuthMode(false);
  } else if (e.target && e.target.id === 'show-login') {
    e.preventDefault();
    setAuthMode(true);
  }
});

setAuthMode(true);

loginBtn.onclick = async () => {
  username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) return toast(authMsg, 'Enter username and password');
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.userId) {
    userId = data.userId;
    toast(authMsg, 'Logged in', true);
    show(roomSection);
  } else {
    toast(authMsg, data.error || 'Login failed');
  }
};

registerBtn.onclick = async () => {
  username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) return toast(authMsg, 'Enter username and password');
  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.message && data.message.includes('success')) {
    toast(authMsg, data.message, true);
    setTimeout(() => {
      toast(authMsg, '', true);
      setAuthMode(true);
    }, 1000);
  } else {
    toast(authMsg, data.error || 'Register failed');
  }
};
// State
let userId = null;
let username = '';
let roomId = '';
let socket = null;
let anonymous = false;

// Sections / Elements
const authSection = document.getElementById('auth-section');
const roomSection = document.getElementById('room-section');
const chatSection = document.getElementById('chat-section');
const authMsg = document.getElementById('auth-msg');
const roomMsg = document.getElementById('room-msg');
const createdRoomId = document.getElementById('created-room-id');
const roomIdDisplay = document.getElementById('room-id-display');
const messagesEl = document.getElementById('messages');
const typingEl = document.getElementById('typing');
const anonToggle = document.getElementById('anonToggle');
const anonBanner = document.getElementById('anonBanner');

function show(section) {
  [authSection, roomSection, chatSection].forEach(s => s.style.display = 'none');
  section.style.display = 'block';
}

// Initial view
show(authSection);

function toast(el, text, ok=false) {
  el.textContent = text || '';
  el.style.color = ok ? '#16a34a' : '#d9534f';
}

function renderMessage({ sender, text, mine=false, time=Date.now() }) {
  const row = document.createElement('div');
  row.className = 'msg ' + (mine ? 'out' : 'in');

  if (!mine) {
    const av = document.createElement('div');
    av.className = 'avatar';
    row.appendChild(av);
  }

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (!mine) {
    const lab = document.createElement('div');
    lab.className = 'sender';
    lab.textContent = sender;
    bubble.appendChild(lab);
  }

  const txt = document.createElement('div');
  txt.className = 'text';
  txt.textContent = text;
  bubble.appendChild(txt);

  const meta = document.createElement('div');
  meta.className = 'meta';
  const t = new Date(time);
  const ts = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
  const timeEl = document.createElement('span');
  timeEl.className = 'time';
  timeEl.textContent = ts;
  meta.appendChild(timeEl);

  if (mine) {
    const ticks = document.createElement('span');
    ticks.className = 'ticks';
    ticks.innerHTML = '<i class="tick"></i><i class="tick"></i>';
    meta.appendChild(ticks);
  }

  bubble.appendChild(meta);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  // Always scroll to bottom after rendering
  setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 0);
}

// Auth wiring

// Room creation/join
document.getElementById('create-room-btn').onclick = async () => {
  const res = await fetch('http://localhost:5000/api/room/create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorId: userId })
  });
  const data = await res.json();
  if (data.roomId) {
    roomId = data.roomId;
    createdRoomId.style.display = 'block';
    createdRoomId.textContent = 'Room ID: ' + roomId;
    toast(roomMsg, 'Share this Room ID with others', true);
    setTimeout(() => {
      connectAndEnter(roomId);
    }, 1200);
  } else {
    toast(roomMsg, data.error || 'Room create failed');
  }
};

document.getElementById('join-room-btn').onclick = async () => {
  const input = document.getElementById('room-id-input').value.trim();
  if (!input) return toast(roomMsg, 'Enter a Room ID');
  const res = await fetch('http://localhost:5000/api/room/join', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId: input })
  });
  const data = await res.json();
  if (data.roomId) {
    roomId = data.roomId;
    toast(roomMsg, 'Joined room: ' + roomId, true);
    setTimeout(() => {
      connectAndEnter(roomId);
    }, 800);
  } else {
    toast(roomMsg, data.error || 'Join failed');
  }
};

function connectAndEnter(rid) {
  show(chatSection);
  roomIdDisplay.textContent = rid;
  messagesEl.innerHTML = '';
  if (!socket) {
    socket = io('http://localhost:5000');
    socket.on('receiveMessage', ({ username: who, message, createdAt }) => {
      renderMessage({ sender: who, text: message, mine: who === (anonymous ? 'Anonymous' : username), time: createdAt });
    });
    socket.on('userJoined', (msg) => renderMessage({ sender: 'System', text: msg }));
    socket.on('typing', ({ username: who, typing }) => {
      typingEl.hidden = !typing;
      if (typing) typingEl.textContent = `${who} is typing…`;
    });
  }
  socket.emit('joinRoom', { roomId: rid, username });
  loadHistory(rid);
}

// Chat send
const composerForm = document.getElementById('composerForm');
const inputEl = document.getElementById('messageInput');
document.getElementById('sendBtn').onclick = sendNow;
composerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendNow();
});

function sendNow() {
  const text = inputEl.value.trim();
  if (!text || !socket) return;
  const displaySender = anonymous ? 'Anonymous' : username;
  socket.emit('sendMessage', { roomId, username: displaySender, message: text });
  saveMessage(roomId, userId, text, anonymous);
  inputEl.value = '';
}

// typing
let typingTimer=null;
inputEl.addEventListener('input', () => {
  if (!socket) return;
  socket.emit('typing', { roomId, username, typing: true });
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => socket.emit('typing', { roomId, username, typing: false }), 800);
});

// leave room
document.getElementById('leave-room-btn').onclick = () => {
  if (socket) socket.emit('leaveRoom', { roomId, username });
  messagesEl.innerHTML = '';
  show(roomSection);
};

// history
async function loadHistory(rid) {
  const res = await fetch(`http://localhost:5000/api/message/${rid}`);
  const list = await res.json();
  messagesEl.innerHTML = '';
  list.forEach(m => {
    const who = m.is_anonymous ? 'Anonymous' : m.username || m.user_id;
    renderMessage({ sender: who, text: m.message, mine: who === (anonymous ? 'Anonymous' : username), time: m.created_at });
  });
}

// persist
async function saveMessage(rid, uid, text, isAnonymous) {
  await fetch('http://localhost:5000/api/message/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId: rid, userId: uid, message: text, isAnonymous })
  });
}

// anon toggle
anonToggle.addEventListener('click', () => {
  anonymous = !anonymous;
  anonToggle.setAttribute('aria-pressed', String(anonymous));
  anonBanner.hidden = !anonymous;
});
