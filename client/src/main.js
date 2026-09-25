import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { OfficeScene } from './scenes/OfficeScene.js';
import { socket, connectSocket } from './socket.js';
import { endCall } from './webrtc.js';

// ── Avatar picker ──────────────────────────────────────────────────────────
let selectedAvatar = 0;
document.querySelectorAll('.avatar-opt').forEach((el) => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.avatar-opt').forEach((e) => e.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = parseInt(el.dataset.idx, 10);
  });
});

// ── Join button ────────────────────────────────────────────────────────────
document.getElementById('join-btn').addEventListener('click', joinOffice);
document.getElementById('player-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinOffice();
});

function joinOffice() {
  const nameInput = document.getElementById('player-name');
  const name = nameInput.value.trim() || `Guest_${Math.floor(Math.random() * 999)}`;

  window.__playerData = { name, avatar: selectedAvatar };

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  connectSocket();
  initPhaser();
  initChat();
}

// ── Phaser init ────────────────────────────────────────────────────────────
function initPhaser() {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-canvas',
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: [BootScene, OfficeScene],
  };

  const game = new Phaser.Game(config);

  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });
}

// ── Chat wiring ────────────────────────────────────────────────────────────
function initChat() {
  const input   = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const msgs    = document.getElementById('chat-messages');
  const toggle  = document.getElementById('chat-toggle');
  const panel   = document.getElementById('chat-panel');
  const roomId  = import.meta.env.VITE_ROOM_ID || 'main-office';

  let collapsed = false;

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    msgs.style.display = collapsed ? 'none' : '';
    document.getElementById('chat-input-row').style.display = collapsed ? 'none' : '';
    toggle.textContent = collapsed ? '+' : '—';
  });

  function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    socket.emit('chat-message', { roomId, message: text });
    input.value = '';
  }

  sendBtn.addEventListener('click', sendMsg);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMsg(); });

  socket.on('chat-message', (msg) => {
    const el = document.createElement('div');
    el.className = 'chat-msg';
    const isMe = msg.senderId === socket.id;
    el.innerHTML = `<span class="sender" style="color:${isMe ? '#4f8ef7' : '#e040fb'}">${msg.senderName}</span><span class="text">${escapeHtml(msg.text)}</span>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  });
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Prevent page scroll when arrow keys used ──────────────────────────────
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});
