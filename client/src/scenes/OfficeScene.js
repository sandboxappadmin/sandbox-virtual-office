import Phaser from 'phaser';
import { socket } from '../socket.js';
import { startCall, receiveOffer, receiveAnswer, receiveIceCandidate, endCall, isInCall, getCurrentCallTarget } from '../webrtc.js';

const TILE = 32;
const SPEED = 160;
const PROXIMITY_PX = 80;

// Office layout — 0=empty, 1=wall, 2=floor, 3=carpet, 4=meeting
// 40 cols × 30 rows
const MAP = (() => {
  const W = 1, F = 2, C = 3, M = 4, E = 0;
  return [
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
    [W,C,C,C,C,C,C,C,C,C,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,C,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,C,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,C,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,C,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,C,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,W,W,W,W,E,W,W,W,W,W,W,W,W,W,E,W,W,W,W,W,W,W,E,W,W,W,W,W,W,W,W,W,W,W,E,W,W,W,W],
    [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W],
    [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W],
    [W,W,W,W,W,E,W,W,W,W,W,W,W,W,W,E,W,W,W,W,W,W,W,E,W,W,W,W,W,W,W,W,W,W,W,E,W,W,W,W],
    [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,C,C,C,C,C,C,C,C,C,W],
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
  ];
})();

const COLS = MAP[0].length;
const ROWS = MAP.length;

// Named zones [x, y, w, h, label, color]
const ZONES = [
  { x: 1, y: 1, w: 9, h: 6,  label: 'Engineering', color: 0x4f8ef7, alpha: 0.06 },
  { x: 11, y: 1, w: 8, h: 6, label: 'Design',      color: 0xe040fb, alpha: 0.06 },
  { x: 20, y: 1, w: 9, h: 6, label: 'Product',     color: 0x00bcd4, alpha: 0.06 },
  { x: 30, y: 1, w: 9, h: 6, label: 'Lounge',      color: 0x4caf50, alpha: 0.06 },
  { x: 11, y: 8, w: 8, h: 6, label: 'Meeting A',   color: 0xff9800, alpha: 0.1  },
  { x: 20, y: 8, w: 9, h: 6, label: 'Meeting B',   color: 0xff9800, alpha: 0.1  },
  { x: 1, y: 8, w: 8, h: 6,  label: 'Customer Sup',color: 0xf44336, alpha: 0.06 },
  { x: 30, y: 8, w: 9, h: 6, label: 'Platform',    color: 0x9c27b0, alpha: 0.06 },
  { x: 1, y: 15, w: 8, h: 7, label: 'Video + Infra',color:0x2196f3, alpha: 0.06 },
  { x: 11, y: 15, w:8, h: 7, label: 'OCTO',        color: 0x009688, alpha: 0.06 },
  { x: 20, y: 15, w:9, h: 7, label: 'Flex',        color: 0x607d8b, alpha: 0.06 },
  { x: 30, y: 15, w:9, h: 7, label: 'People',      color: 0x8bc34a, alpha: 0.06 },
];

export class OfficeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OfficeScene' });
    this.remotePlayers = {};
    this.myPlayer = null;
    this.cursors = null;
    this.wasd = null;
    this.nearbyIds = new Set();
    this.lastMoveTime = 0;
    this.myData = null;
  }

  init(data) {
    this.myData = window.__playerData || { name: 'Player', avatar: 0 };
  }

  create() {
    const mapW = COLS * TILE;
    const mapH = ROWS * TILE;

    // ── World bounds ─────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, mapW, mapH);

    // ── Draw tilemap ─────────────────────────────────────────────────────────
    const tileMap = { 0: null, 1: 'wall', 2: 'floor', 3: 'carpet', 4: 'meeting-floor' };
    this.mapLayer = this.add.layer();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = MAP[row][col];
        const key = tileMap[tile];
        if (key) {
          this.add.image(col * TILE + TILE / 2, row * TILE + TILE / 2, key).setDepth(0);
        }
      }
    }

    // ── Zone overlays ────────────────────────────────────────────────────────
    ZONES.forEach((z) => {
      const px = z.x * TILE;
      const py = z.y * TILE;
      const pw = z.w * TILE;
      const ph = z.h * TILE;

      const g = this.add.graphics().setDepth(1);
      g.fillStyle(z.color, z.alpha);
      g.fillRect(px, py, pw, ph);
      g.lineStyle(1, z.color, 0.3);
      g.strokeRect(px, py, pw, ph);

      this.add.text(px + 6, py + 6, z.label, {
        fontSize: '9px',
        color: '#' + z.color.toString(16).padStart(6, '0'),
        fontStyle: 'bold',
        alpha: 0.8,
      }).setDepth(2).setAlpha(0.7);
    });

    // ── Furniture ─────────────────────────────────────────────────────────────
    this._placeFurniture();

    // ── Collision layer ───────────────────────────────────────────────────────
    this.wallGroup = this.physics.add.staticGroup();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (MAP[row][col] === 1) {
          const b = this.add.rectangle(col * TILE + TILE / 2, row * TILE + TILE / 2, TILE, TILE, 0x000000, 0).setDepth(0);
          this.physics.add.existing(b, true);
          this.wallGroup.add(b);
        }
      }
    }

    // ── Local player ─────────────────────────────────────────────────────────
    const spawn = this._findSpawn();
    this.myPlayer = this._createPlayerSprite(spawn.x, spawn.y, socket.id, this.myData.name, this.myData.avatar, true);

    this.physics.add.collider(this.myPlayer.sprite, this.wallGroup);

    // ── Camera ───────────────────────────────────────────────────────────────
    this.cameras.main
      .setBounds(0, 0, mapW, mapH)
      .startFollow(this.myPlayer.sprite, true, 0.1, 0.1)
      .setZoom(1.4);

    // ── Input ─────────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // ── Socket events ─────────────────────────────────────────────────────────
    this._bindSocketEvents();

    // Join room
    const roomId = import.meta.env.VITE_ROOM_ID || 'main-office';
    socket.emit('join-room', {
      roomId,
      playerData: { x: spawn.x, y: spawn.y, ...this.myData },
    });
  }

  // ── Update loop ────────────────────────────────────────────────────────────
  update(time) {
    if (!this.myPlayer) return;
    const { sprite } = this.myPlayer;
    const vx = 0, vy = 0;
    let dx = 0, dy = 0;

    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    if (left)  dx = -SPEED;
    if (right) dx =  SPEED;
    if (up)    dy = -SPEED;
    if (down)  dy =  SPEED;

    sprite.body.setVelocity(dx, dy);

    let direction = this.myPlayer.direction;
    if (dx < 0) direction = 'left';
    else if (dx > 0) direction = 'right';
    else if (dy < 0) direction = 'up';
    else if (dy > 0) direction = 'down';

    const isMoving = dx !== 0 || dy !== 0;

    // Update label position
    this.myPlayer.label.setPosition(sprite.x, sprite.y - 22);
    this.myPlayer.direction = direction;

    // Emit move every ~50ms
    if (time - this.lastMoveTime > 50) {
      this.lastMoveTime = time;
      socket.emit('player-move', {
        x: sprite.x,
        y: sprite.y,
        direction,
        isMoving,
      });
    }

    // Update remote player labels
    Object.values(this.remotePlayers).forEach((p) => {
      if (p.label) p.label.setPosition(p.sprite.x, p.sprite.y - 22);
    });
  }

  // ── Socket bindings ────────────────────────────────────────────────────────
  _bindSocketEvents() {
    socket.on('room-state', ({ players }) => {
      Object.entries(players).forEach(([id, p]) => {
        if (id !== socket.id) this._addRemotePlayer(id, p);
      });
      this._updatePlayerList();
    });

    socket.on('player-joined', (p) => {
      if (p.id !== socket.id) this._addRemotePlayer(p.id, p);
      this._systemChat(`${p.name} joined the office 👋`);
      this._updatePlayerList();
    });

    socket.on('player-moved', ({ id, x, y }) => {
      if (this.remotePlayers[id]) {
        this.remotePlayers[id].sprite.setPosition(x, y);
      }
    });

    socket.on('player-left', (id) => {
      if (this.remotePlayers[id]) {
        const name = this.remotePlayers[id].name;
        this.remotePlayers[id].sprite.destroy();
        this.remotePlayers[id].label.destroy();
        delete this.remotePlayers[id];
        this._systemChat(`${name} left the office`);
        this._updatePlayerList();
      }
    });

    socket.on('proximity-update', ({ nearby }) => {
      this.nearbyIds = new Set(nearby);
      this._handleProximity(nearby);
    });

    // WebRTC
    socket.on('rtc-offer', ({ fromId, offer }) => {
      const p = this.remotePlayers[fromId];
      const name = p ? p.name : fromId;
      receiveOffer(fromId, name, offer);
    });
    socket.on('rtc-answer', ({ answer }) => receiveAnswer(answer));
    socket.on('rtc-ice-candidate', ({ candidate }) => receiveIceCandidate(candidate));
    socket.on('call-ended', () => endCall());
  }

  // ── Proximity / auto-call ──────────────────────────────────────────────────
  _proximityCooldown = {};

  _handleProximity(nearby) {
    const toast = document.getElementById('proximity-toast');
    if (nearby.length === 0) {
      toast.style.display = 'none';
      return;
    }

    const names = nearby.map((id) => this.remotePlayers[id]?.name || id).join(', ');
    toast.textContent = `📍 Near: ${names} — Press V to video call`;
    toast.style.display = 'block';

    // Press V to call nearest
    this.input.keyboard.once('keydown-V', () => {
      const targetId = nearby[0];
      if (!isInCall() && targetId && !this._proximityCooldown[targetId]) {
        this._proximityCooldown[targetId] = true;
        setTimeout(() => delete this._proximityCooldown[targetId], 10000);
        const p = this.remotePlayers[targetId];
        startCall(targetId, p?.name || targetId);
      }
    });
  }

  // ── Player sprite factory ──────────────────────────────────────────────────
  _createPlayerSprite(x, y, id, name, avatarIdx, isLocal) {
    const idx = avatarIdx ?? 0;
    const sprite = isLocal
      ? this.physics.add.image(x, y, `avatar-${idx}`).setDepth(10).setCollideWorldBounds(true)
      : this.add.image(x, y, `avatar-${idx}`).setDepth(10);

    // Glow ring for local player
    if (isLocal) {
      const ring = this.add.graphics().setDepth(9);
      ring.lineStyle(3, 0x4f8ef7, 0.7);
      ring.strokeCircle(0, 0, 16);
      ring.setPosition(x, y);
      // Attach ring update to update loop via event
      this.events.on('update', () => {
        ring.setPosition(sprite.x, sprite.y);
      });
    }

    // Name label
    const label = this.add.text(x, y - 22, name, {
      fontSize: '8px',
      color: isLocal ? '#4f8ef7' : '#ffffff',
      fontStyle: isLocal ? 'bold' : 'normal',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 3, y: 2 },
    }).setOrigin(0.5).setDepth(11);

    return { sprite, label, name, id, direction: 'down', avatarIdx: idx };
  }

  _addRemotePlayer(id, data) {
    if (this.remotePlayers[id]) return;
    const p = this._createPlayerSprite(data.x, data.y, id, data.name, data.avatar ?? 0, false);
    this.remotePlayers[id] = { ...p, name: data.name };
  }

  // ── Furniture placement ────────────────────────────────────────────────────
  _placeFurniture() {
    const places = [
      // Engineering desks
      { key: 'desk', x: 3, y: 3 }, { key: 'desk', x: 5, y: 3 }, { key: 'desk', x: 7, y: 3 },
      { key: 'desk', x: 3, y: 5 }, { key: 'desk', x: 5, y: 5 },
      // Design desks
      { key: 'desk', x: 13, y: 3 }, { key: 'desk', x: 15, y: 3 }, { key: 'desk', x: 17, y: 3 },
      // Meeting tables
      { key: 'meeting-table', x: 14, y: 11 }, { key: 'meeting-table', x: 24, y: 11 },
      // Plants
      { key: 'plant', x: 2, y: 2 }, { key: 'plant', x: 38, y: 2 },
      { key: 'plant', x: 2, y: 20 }, { key: 'plant', x: 38, y: 20 },
      // Water coolers
      { key: 'cooler', x: 10, y: 14 }, { key: 'cooler', x: 29, y: 14 },
    ];
    places.forEach(({ key, x, y }) => {
      this.add.image(x * TILE + TILE, y * TILE + TILE, key).setDepth(3).setAlpha(0.9);
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  _findSpawn() {
    // Walk-able tiles for spawn
    for (let r = ROWS - 2; r >= 1; r--) {
      for (let c = 1; c < COLS - 1; c++) {
        if (MAP[r][c] === 2 || MAP[r][c] === 3) {
          return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
        }
      }
    }
    return { x: 5 * TILE, y: 5 * TILE };
  }

  _systemChat(text) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;
    const el = document.createElement('div');
    el.className = 'chat-msg system';
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  _updatePlayerList() {
    const body = document.getElementById('pl-body');
    if (!body) return;
    body.innerHTML = '';

    const me = document.createElement('div');
    me.className = 'pl-item';
    me.innerHTML = `<div class="pl-dot"></div><span>${this.myData.name} (you)</span>`;
    body.appendChild(me);

    Object.values(this.remotePlayers).forEach((p) => {
      const el = document.createElement('div');
      el.className = 'pl-item';
      const isNearby = this.nearbyIds.has(p.id);
      el.innerHTML = `<div class="pl-dot${isNearby ? ' nearby' : ''}"></div><span>${p.name}</span>`;
      body.appendChild(el);
    });
  }
}
