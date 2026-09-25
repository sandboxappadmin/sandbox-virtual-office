import Phaser from 'phaser';
import { socket } from '../socket.js';
import { startCall, receiveOffer, receiveAnswer, receiveIceCandidate, endCall, isInCall } from '../webrtc.js';

const TILE  = 16;
const SCALE = 2.5;   // upscale 16px tiles to ~40px on screen
const TS    = TILE * SCALE; // effective tile size on screen = 40px
const SPEED = 180;
const COLS  = 50;
const ROWS  = 26;

// ── Map: 0=void 1=wall 2=floor 3=carpet 4=meeting 5=lounge ───────────────
const W=1,F=2,C=3,M=4,L=5,_=0;
const MAP = [
  [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,W,W,W,W,_,W,W,W,W,W,W,W,W,W,_,W,W,W,W,W,W,W,_,W,W,W,W,W,W,W,W,W,W,W,_,W,W,W,W,W,W,W,W,W,_,W,W,W,W],
  [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W],
  [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W],
  [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W],
  [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W],
  [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W],
  [W,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W,M,M,M,M,M,M,M,M,M,W,F,F,F,F,F,F,F,F,F,W,W,M,M,M,M,M,M,M,M,W],
  [W,W,W,W,W,_,W,W,W,W,W,W,W,W,W,_,W,W,W,W,W,W,W,_,W,W,W,W,W,W,W,W,W,W,W,_,W,W,W,W,W,W,W,W,W,_,W,W,W,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,C,C,C,C,C,C,C,C,W,W,F,F,F,F,F,F,F,F,W,F,F,F,F,F,F,F,F,F,W,L,L,L,L,L,L,L,L,L,W,C,C,C,C,C,C,C,C,C,W],
  [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
];

// ── Named zones ───────────────────────────────────────────────────────────
const ZONES = [
  { id:'eng',     col:1,  row:1,  w:9,  h:6,  label:'⚙️ Engineering',    color:0x4f8ef7 },
  { id:'design',  col:11, row:1,  w:8,  h:6,  label:'🎨 Design',          color:0xe040fb },
  { id:'product', col:20, row:1,  w:9,  h:6,  label:'📦 Product',         color:0x00bcd4 },
  { id:'lounge',  col:30, row:1,  w:9,  h:6,  label:'☕ Lounge',          color:0x4caf50 },
  { id:'eng2',    col:40, row:1,  w:9,  h:6,  label:'🔧 Platform',        color:0x9c27b0 },
  { id:'meetA',   col:11, row:8,  w:8,  h:6,  label:'📅 Meeting Room A',  color:0xff9800 },
  { id:'meetB',   col:20, row:8,  w:9,  h:6,  label:'📅 Meeting Room B',  color:0xff9800 },
  { id:'cs',      col:1,  row:8,  w:8,  h:6,  label:'🎧 Customer Support',color:0xf44336 },
  { id:'meetC',   col:41, row:8,  w:8,  h:6,  label:'📅 Meeting Room C',  color:0xff9800 },
  { id:'video',   col:1,  row:15, w:8,  h:7,  label:'🎬 Video + Infra',   color:0x2196f3 },
  { id:'octo',    col:11, row:15, w:8,  h:7,  label:'🐙 OCTO',            color:0x009688 },
  { id:'flex',    col:20, row:15, w:9,  h:7,  label:'🌀 Flex',            color:0x607d8b },
  { id:'people',  col:30, row:15, w:9,  h:7,  label:'👥 People',          color:0x8bc34a },
  { id:'ops',     col:40, row:15, w:9,  h:7,  label:'🛠 Ops',             color:0xff5722 },
];

// ── Floor colors for each zone type ──────────────────────────────────────
const FLOOR_COLOR = { 2:0xe8eaf6, 3:0xf3e5f5, 4:0xfff8e1, 5:0xe8f5e9 };
const WALL_COLOR  = 0x1e2a4a;
const VOID_COLOR  = 0x0d1117;

export class OfficeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OfficeScene' });
    this.remotePlayers  = {};
    this.myPlayer       = null;
    this.cursors        = null;
    this.wasd           = null;
    this.nearbyIds      = new Set();
    this.currentZone    = null;
    this.lastMoveEmit   = 0;
    this.myData         = null;
  }

  init() {
    this.myData = window.__playerData || { name: 'Player', avatar: 0 };
  }

  create() {
    const mapPxW = COLS * TS;
    const mapPxH = ROWS * TS;
    this.physics.world.setBounds(0, 0, mapPxW, mapPxH);

    this._drawMap();
    this._drawZones();
    this._drawFurniture();
    this._spawnPlayer();
    this._setupCamera(mapPxW, mapPxH);
    this._setupInput();
    this._bindSocket();

    const roomId = import.meta.env.VITE_ROOM_ID || 'main-office';
    socket.emit('join-room', {
      roomId,
      playerData: {
        x: this.myPlayer.body.x,
        y: this.myPlayer.body.y,
        ...this.myData,
      },
    });
  }

  update(time) {
    if (!this.myPlayer) return;

    let dx = 0, dy = 0;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    if (left)  dx = -SPEED;
    if (right) dx =  SPEED;
    if (up)    dy = -SPEED;
    if (down)  dy =  SPEED;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    this.myPlayer.setVelocity(dx, dy);

    // Update label + ring
    const px = this.myPlayer.x, py = this.myPlayer.y;
    this._myLabel.setPosition(px, py - 26);
    this._myRing.setPosition(px, py);

    // Zone detection
    this._checkZone(px, py);

    // Emit movement throttled
    if (time - this.lastMoveEmit > 40) {
      this.lastMoveEmit = time;
      socket.emit('player-move', { x: px, y: py, isMoving: dx !== 0 || dy !== 0 });
    }

    // Update remote labels
    Object.values(this.remotePlayers).forEach((p) => {
      if (p.label) p.label.setPosition(p.sprite.x, p.sprite.y - 26);
    });
  }

  // ── Map drawing ───────────────────────────────────────────────────────────
  _drawMap() {
    const g = this.add.graphics().setDepth(0);

    for (let r = 0; r < MAP.length; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = MAP[r]?.[c] ?? 0;
        const x = c * TS, y = r * TS;

        if (t === 0) {
          g.fillStyle(VOID_COLOR); g.fillRect(x, y, TS, TS);
          continue;
        }
        if (t === 1) {
          // Wall: draw base + top highlight
          g.fillStyle(WALL_COLOR); g.fillRect(x, y, TS, TS);
          g.fillStyle(0x2a3d6b, 1); g.fillRect(x, y, TS, 4);
          g.fillStyle(0x0d1a38, 1); g.fillRect(x, y+TS-3, TS, 3);
          continue;
        }
        // Floor types
        const fc = FLOOR_COLOR[t] ?? 0xe8eaf6;
        g.fillStyle(fc); g.fillRect(x, y, TS, TS);
        // Subtle tile grid lines
        g.lineStyle(0.5, 0x000000, 0.06);
        g.strokeRect(x, y, TS, TS);
      }
    }

    // Wall collision bodies
    this._wallGroup = this.physics.add.staticGroup();
    for (let r = 0; r < MAP.length; r++) {
      for (let c = 0; c < COLS; c++) {
        if (MAP[r]?.[c] === 1) {
          const b = this.add.rectangle(c*TS+TS/2, r*TS+TS/2, TS, TS, 0,0).setDepth(0);
          this.physics.add.existing(b, true);
          this._wallGroup.add(b);
        }
      }
    }
  }

  // ── Zone overlays ─────────────────────────────────────────────────────────
  _drawZones() {
    ZONES.forEach((z) => {
      const px = z.col * TS, py = z.row * TS;
      const pw = z.w * TS,   ph = z.h * TS;
      const g  = this.add.graphics().setDepth(1);

      // Soft tinted overlay
      g.fillStyle(z.color, 0.07); g.fillRect(px, py, pw, ph);
      // Border
      g.lineStyle(2, z.color, 0.35); g.strokeRect(px+1, py+1, pw-2, ph-2);
      // Corner accents
      const cs = 10;
      g.lineStyle(3, z.color, 0.8);
      [[px,py],[px+pw,py],[px,py+ph],[px+pw,py+ph]].forEach(([cx,cy]) => {
        const sx = cx === px ? 1 : -1, sy = cy === py ? 1 : -1;
        g.beginPath(); g.moveTo(cx,cy+sy*cs); g.lineTo(cx,cy); g.lineTo(cx+sx*cs,cy); g.strokePath();
      });

      // Zone label (top-left)
      this.add.text(px+8, py+7, z.label, {
        fontSize: '10px',
        color: '#' + z.color.toString(16).padStart(6,'0'),
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setDepth(3).setAlpha(0.85);
    });

    // Corridor / hallway subtle lines
    const hg = this.add.graphics().setDepth(1);
    hg.lineStyle(1, 0xffffff, 0.05);
    for (let c = 0; c < COLS; c++) hg.strokeRect(c*TS, 0, TS, MAP.length*TS);
    for (let r = 0; r < MAP.length; r++) hg.strokeRect(0, r*TS, COLS*TS, TS);
  }

  // ── Furniture ─────────────────────────────────────────────────────────────
  _drawFurniture() {
    const add = (key,c,r,ox=0,oy=0) =>
      this.add.image(c*TS+ox, r*TS+oy, key).setDepth(4).setOrigin(0,0);

    // Engineering desks
    [[2,2],[4,2],[6,2],[2,4],[4,4],[6,4]].forEach(([c,r]) => add('desk',c,r));
    // Design desks
    [[12,2],[14,2],[16,2],[12,4],[14,4]].forEach(([c,r]) => add('desk',c,r));
    // Product desks
    [[21,2],[23,2],[25,2],[21,4],[23,4]].forEach(([c,r]) => add('desk',c,r));
    // Platform desks
    [[41,2],[43,2],[45,2],[41,4],[43,4]].forEach(([c,r]) => add('desk',c,r));
    // Bottom zones desks
    [[2,16],[4,16],[6,16],[2,18],[4,18]].forEach(([c,r]) => add('desk',c,r));
    [[12,16],[14,16],[16,16],[12,18]].forEach(([c,r]) => add('desk',c,r));
    [[21,16],[23,16],[25,16],[21,18]].forEach(([c,r]) => add('desk',c,r));
    [[41,16],[43,16],[45,16],[41,18]].forEach(([c,r]) => add('desk',c,r));

    // Meeting tables
    [[11,9,16,16],[20,9,16,16],[41,9,0,16]].forEach(([c,r,ox,oy]) =>
      this.add.image(c*TS+ox, r*TS+oy, 'meeting-table').setDepth(4).setOrigin(0,0));

    // Sofas in lounges
    [[31,3,0,0],[31,4,0,0],[31,17,0,0],[31,18,0,0]].forEach(([c,r,ox,oy]) =>
      this.add.image(c*TS+ox, r*TS+oy, 'sofa').setDepth(4).setOrigin(0,0));

    // Whiteboards
    [[12,8,8,0],[20,8,8,0],[41,8,8,0]].forEach(([c,r,ox,oy]) =>
      this.add.image(c*TS+ox, r*TS+oy, 'whiteboard').setDepth(4).setOrigin(0,0));

    // Plants at corners and hallways
    [[1,1],[9,1],[1,6],[9,6],
     [10,7],[29,7],[40,7],[49,7],
     [1,14],[9,14],[10,14],[29,14],
     [1,21],[9,21],[40,21],[49,21]].forEach(([c,r]) => add('plant',c,r));

    // Water coolers
    [[10,10],[29,10],[10,18],[29,18]].forEach(([c,r]) => add('cooler',c,r));
  }

  // ── Local player spawn ────────────────────────────────────────────────────
  _spawnPlayer() {
    const spawn = this._findSpawn();
    const idx   = this.myData.avatar ?? 0;

    this.myPlayer = this.physics.add.image(spawn.x, spawn.y, `avatar-${idx}`)
      .setScale(1.4)
      .setDepth(10)
      .setCollideWorldBounds(true);

    this.physics.add.collider(this.myPlayer, this._wallGroup);

    // Ring indicator
    this._myRing = this.add.image(spawn.x, spawn.y, 'player-ring')
      .setScale(1.4).setDepth(9).setAlpha(0.85);

    // Name label
    this._myLabel = this.add.text(spawn.x, spawn.y - 26, this.myData.name, {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: 'rgba(79,142,247,0.75)',
      padding: { x:5, y:2 },
    }).setOrigin(0.5).setDepth(11);
  }

  _findSpawn() {
    for (let r = ROWS-2; r >= 1; r--)
      for (let c = 1; c < COLS-1; c++)
        if ([2,3,5].includes(MAP[r]?.[c]))
          return { x: c*TS + TS/2, y: r*TS + TS/2 };
    return { x: 5*TS, y: 5*TS };
  }

  // ── Camera ────────────────────────────────────────────────────────────────
  _setupCamera(w, h) {
    this.cameras.main
      .setBounds(0, 0, w, h)
      .startFollow(this.myPlayer, true, 0.08, 0.08)
      .setZoom(1.6);
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // V key → video call nearest
    this.input.keyboard.on('keydown-V', () => {
      const ids = [...this.nearbyIds];
      if (ids.length && !isInCall()) {
        const target = ids[0];
        const p = this.remotePlayers[target];
        startCall(target, p?.name || target);
      }
    });
  }

  // ── Socket events ─────────────────────────────────────────────────────────
  _bindSocket() {
    socket.on('room-state', ({ players }) => {
      Object.entries(players).forEach(([id, p]) => {
        if (id !== socket.id) this._addRemote(id, p);
      });
      this._updatePlayerList();
    });

    socket.on('player-joined', (p) => {
      if (p.id !== socket.id) this._addRemote(p.id, p);
      this._sysMsg(`${p.name} joined the office 👋`);
      this._updatePlayerList();
    });

    socket.on('player-moved', ({ id, x, y }) => {
      if (this.remotePlayers[id])
        this.remotePlayers[id].sprite.setPosition(x, y);
    });

    socket.on('player-left', (id) => {
      const p = this.remotePlayers[id];
      if (p) {
        this._sysMsg(`${p.name} left`);
        p.sprite.destroy(); p.label?.destroy();
        delete this.remotePlayers[id];
        this._updatePlayerList();
      }
    });

    socket.on('proximity-update', ({ nearby }) => {
      this.nearbyIds = new Set(nearby);
      this._showProximityToast(nearby);
      this._updatePlayerList();
    });

    socket.on('rtc-offer',         ({ fromId, offer })    => { const p = this.remotePlayers[fromId]; receiveOffer(fromId, p?.name||fromId, offer); });
    socket.on('rtc-answer',        ({ answer })            => receiveAnswer(answer));
    socket.on('rtc-ice-candidate', ({ candidate })         => receiveIceCandidate(candidate));
    socket.on('call-ended',        ()                      => endCall());
  }

  // ── Remote player ─────────────────────────────────────────────────────────
  _addRemote(id, data) {
    if (this.remotePlayers[id]) return;
    const idx = data.avatar ?? 0;
    const sprite = this.add.image(data.x, data.y, `avatar-${idx}`)
      .setScale(1.3).setDepth(10);

    const label = this.add.text(data.x, data.y - 26, data.name, {
      fontSize: '9px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: { x:4, y:2 },
    }).setOrigin(0.5).setDepth(11);

    this.remotePlayers[id] = { sprite, label, name: data.name, id };
  }

  // ── Zone detection ────────────────────────────────────────────────────────
  _checkZone(px, py) {
    const col = Math.floor(px / TS);
    const row = Math.floor(py / TS);
    const zone = ZONES.find(z =>
      col >= z.col && col < z.col+z.w &&
      row >= z.row && row < z.row+z.h
    );
    const zoneId = zone?.id || null;
    if (zoneId !== this.currentZone) {
      this.currentZone = zoneId;
      this._onZoneChange(zone);
    }
  }

  _onZoneChange(zone) {
    const banner = document.getElementById('zone-banner');
    if (!banner) return;
    if (!zone) { banner.style.opacity = '0'; return; }
    banner.textContent = zone.label;
    banner.style.borderColor = '#' + zone.color.toString(16).padStart(6,'0');
    banner.style.opacity = '1';
    clearTimeout(this._zoneBannerTimer);
    this._zoneBannerTimer = setTimeout(() => { banner.style.opacity = '0'; }, 2500);
  }

  // ── Proximity toast ───────────────────────────────────────────────────────
  _showProximityToast(nearby) {
    const toast = document.getElementById('proximity-toast');
    if (!toast) return;
    if (!nearby.length) { toast.style.display = 'none'; return; }
    const names = nearby.map(id => this.remotePlayers[id]?.name || 'Someone').join(', ');
    toast.innerHTML = `📍 <b>${names}</b> is nearby &nbsp;·&nbsp; Press <kbd>V</kbd> to video call`;
    toast.style.display = 'block';
  }

  // ── Player list ───────────────────────────────────────────────────────────
  _updatePlayerList() {
    const body = document.getElementById('pl-body');
    if (!body) return;
    body.innerHTML = '';
    const me = document.createElement('div');
    me.className = 'pl-item';
    me.innerHTML = `<span class="pl-dot"></span>${this.myData.name} <em>(you)</em>`;
    body.appendChild(me);
    Object.values(this.remotePlayers).forEach(p => {
      const el = document.createElement('div');
      el.className = 'pl-item';
      const nearby = this.nearbyIds.has(p.id);
      el.innerHTML = `<span class="pl-dot${nearby?' nearby':''}"></span>${p.name}`;
      body.appendChild(el);
    });
  }

  // ── System chat ───────────────────────────────────────────────────────────
  _sysMsg(text) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;
    const el = document.createElement('div');
    el.className = 'chat-msg system';
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }
}
