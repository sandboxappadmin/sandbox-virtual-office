import Phaser from 'phaser';
import { BootScene }   from './scenes/BootScene.js';
import { OfficeScene } from './scenes/OfficeScene.js';
import { socket, connectSocket } from './socket.js';

// ── Avatar picker ──────────────────────────────────────────────────────────
let selectedAvatar = 0;
document.querySelectorAll('.avatar-opt').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.avatar-opt').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = parseInt(el.dataset.idx, 10);
  });
});

// ── Join ───────────────────────────────────────────────────────────────────
document.getElementById('join-btn').addEventListener('click', joinOffice);
document.getElementById('player-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') joinOffice();
});

function joinOffice() {
  const raw  = document.getElementById('player-name').value.trim();
  const name = raw || `Guest_${Math.floor(Math.random()*999)}`;
  window.__playerData = { name, avatar: selectedAvatar };

  document.getElementById('login-screen').style.display  = 'none';
  document.getElementById('game-container').style.display = 'block';

  connectSocket();
  initChat();
  initPhaser();
}

// ── Phaser ─────────────────────────────────────────────────────────────────
function initPhaser() {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-canvas',
    backgroundColor: '#0d1117',
    physics: { default: 'arcade', arcade: { gravity: { y:0 }, debug: false } },
    scene: [BootScene, OfficeScene],
  });
  window.addEventListener('resize', () =>
    game.scale.resize(window.innerWidth, window.innerHeight));
}

// ── Chat ───────────────────────────────────────────────────────────────────
function initChat() {
  const input   = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const msgs    = document.getElementById('chat-messages');
  const roomId  = import.meta.env.VITE_ROOM_ID || 'main-office';

  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    socket.emit('chat-message', { roomId, message: text });
    input.value = '';
  };

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

  socket.on('chat-message', (msg) => {
    const el = document.createElement('div');
    const isMe = msg.senderId === socket.id;
    el.className = `chat-msg${isMe ? '' : ' them'}`;
    el.innerHTML = `<span class="sender">${msg.senderName}</span><span class="text">${esc(msg.text)}</span>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;

    // Badge on topbar if chat is collapsed
    const chatPanel = document.getElementById('chat-panel');
    const msgsEl    = document.getElementById('chat-messages');
    if (!isMe && msgsEl.style.display === 'none') {
      // could add badge here
    }
  });
}

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// ── Prevent scroll hijack ──────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)
      && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
  }
});
