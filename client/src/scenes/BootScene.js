import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.scale;

    // ── Loading screen ────────────────────────────────────────────────────────
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f1e);
    this.add.text(width / 2, height / 2 - 60, '🏢 SNBX Virtual Office', {
      fontSize: '26px', color: '#4f8ef7', fontStyle: 'bold',
    }).setOrigin(0.5);

    const loadText = this.add.text(width / 2, height / 2 - 20, 'Loading...', {
      fontSize: '13px', color: '#888',
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(width / 2, height / 2 + 20, 280, 6, 0x222244).setOrigin(0.5);
    const bar   = this.add.rectangle(width / 2 - 140, height / 2 + 20, 0, 6, 0x4f8ef7).setOrigin(0, 0.5);

    this.load.on('progress', (v) => { bar.width = 280 * v; });
    this.load.on('fileprogress', (f) => { loadText.setText(`Loading: ${f.key}`); });

    // ── LPC tilesets ──────────────────────────────────────────────────────────
    // 16x16 tiles, atlas is 512px wide = 32 columns
    this.load.image('base_out', '/assets/tilesets/base_out_atlas.png');
    this.load.image('terrain',  '/assets/tilesets/terrain_atlas.png');

    // ── Tilemaps (JSON) — we build these procedurally so no file needed ───────
    // Avatar spritesheet — generate procedurally below after load
  }

  create() {
    this._genAvatars();
    this._genFurniture();
    this._genUI();
    this._buildTilemap();
    this.scene.start('OfficeScene');
  }

  // ── Procedural avatar circles (6 color variants) ──────────────────────────
  _genAvatars() {
    const palette = [0x4f8ef7, 0xe040fb, 0x00bcd4, 0x4caf50, 0xff9800, 0xf44336,
                     0x9c27b0, 0x009688, 0xffeb3b, 0x795548, 0x607d8b, 0xff5722];
    palette.forEach((col, i) => {
      const g = this.make.graphics({ add: false });
      // Shadow
      g.fillStyle(0x000000, 0.25);
      g.fillCircle(15, 17, 13);
      // Body
      g.fillStyle(col, 1);
      g.fillCircle(14, 14, 13);
      // Shine
      g.fillStyle(0xffffff, 0.25);
      g.fillEllipse(10, 9, 10, 7);
      // Border
      g.lineStyle(2, 0xffffff, 0.4);
      g.strokeCircle(14, 14, 13);
      g.generateTexture(`avatar-${i}`, 28, 28);
      g.destroy();
    });

    // Local player ring
    const ring = this.make.graphics({ add: false });
    ring.lineStyle(3, 0xffffff, 0.9);
    ring.strokeCircle(18, 18, 16);
    ring.generateTexture('player-ring', 36, 36);
    ring.destroy();
  }

  // ── Furniture sprites ─────────────────────────────────────────────────────
  _genFurniture() {
    // Desk (top-down)
    const desk = this.make.graphics({ add: false });
    desk.fillStyle(0xc8956c); desk.fillRect(0, 0, 48, 30);
    desk.fillStyle(0xa0724a); desk.fillRect(0, 26, 48, 4);
    desk.fillStyle(0x1a1a2e); desk.fillRect(8, 4, 30, 18);
    desk.fillStyle(0x1e3a8a, 0.6); desk.fillRect(10, 6, 26, 14);
    desk.fillStyle(0xffffff, 0.15); desk.fillRect(10, 6, 26, 3);
    desk.generateTexture('desk', 48, 30);
    desk.destroy();

    // Chair
    const chair = this.make.graphics({ add: false });
    chair.fillStyle(0x37474f); chair.fillRect(2, 2, 28, 28);
    chair.fillStyle(0x546e7a); chair.fillRect(4, 4, 24, 20);
    chair.fillStyle(0x455a64); chair.fillRect(4, 24, 24, 6);
    chair.generateTexture('chair', 32, 32);
    chair.destroy();

    // Meeting table (oval, large)
    const mt = this.make.graphics({ add: false });
    mt.fillStyle(0xb8860b); mt.fillEllipse(100, 48, 196, 90);
    mt.fillStyle(0xd4a422); mt.fillEllipse(100, 44, 188, 82);
    mt.lineStyle(2, 0x8b6914); mt.strokeEllipse(100, 44, 188, 82);
    mt.generateTexture('meeting-table', 200, 92);
    mt.destroy();

    // Plant
    const pl = this.make.graphics({ add: false });
    pl.fillStyle(0x6d4c41); pl.fillRect(11, 22, 10, 10);
    pl.fillStyle(0x388e3c); pl.fillCircle(16, 18, 14);
    pl.fillStyle(0x43a047); pl.fillCircle(10, 14, 9);
    pl.fillStyle(0x43a047); pl.fillCircle(22, 14, 9);
    pl.fillStyle(0x66bb6a, 0.5); pl.fillCircle(16, 12, 7);
    pl.generateTexture('plant', 32, 32);
    pl.destroy();

    // Water cooler
    const wc = this.make.graphics({ add: false });
    wc.fillStyle(0xe0e0e0); wc.fillRect(6, 10, 20, 22);
    wc.fillStyle(0x90caf9, 0.85); wc.fillRect(9, 4, 14, 14);
    wc.fillStyle(0x1565c0, 0.4); wc.fillRect(9, 4, 14, 14);
    wc.fillStyle(0xef5350); wc.fillRect(10, 20, 5, 4);
    wc.fillStyle(0x42a5f5); wc.fillRect(17, 20, 5, 4);
    wc.generateTexture('cooler', 32, 32);
    wc.destroy();

    // Sofa (lounge)
    const sofa = this.make.graphics({ add: false });
    sofa.fillStyle(0x5c6bc0); sofa.fillRect(0, 8, 64, 24);
    sofa.fillStyle(0x7986cb); sofa.fillRect(0, 4, 64, 10);
    sofa.fillStyle(0x5c6bc0); sofa.fillRect(0, 8, 8, 24);
    sofa.fillStyle(0x5c6bc0); sofa.fillRect(56, 8, 8, 24);
    sofa.generateTexture('sofa', 64, 32);
    sofa.destroy();

    // Whiteboard
    const wb = this.make.graphics({ add: false });
    wb.fillStyle(0xffffff); wb.fillRect(0, 0, 64, 40);
    wb.lineStyle(3, 0x888888); wb.strokeRect(0, 0, 64, 40);
    wb.lineStyle(1, 0xcccccc); wb.strokeRect(4, 4, 56, 32);
    wb.generateTexture('whiteboard', 64, 40);
    wb.destroy();

    // Door
    const door = this.make.graphics({ add: false });
    door.fillStyle(0xd4a574); door.fillRect(0, 0, 16, 32);
    door.lineStyle(2, 0xa0724a); door.strokeRect(0, 0, 16, 32);
    door.fillStyle(0xffd700); door.fillCircle(12, 16, 2);
    door.generateTexture('door', 16, 32);
    door.destroy();
  }

  // ── UI elements ───────────────────────────────────────────────────────────
  _genUI() {
    // Zone label background pill
    const pill = this.make.graphics({ add: false });
    pill.fillStyle(0x000000, 0.45);
    pill.fillRoundedRect(0, 0, 140, 22, 11);
    pill.generateTexture('zone-pill', 140, 22);
    pill.destroy();
  }

  // ── Build tilemap data ────────────────────────────────────────────────────
  // We create a Phaser tilemap from scratch using the LPC atlas.
  // LPC base_out_atlas is 512px wide, 16px tiles = 32 cols per row.
  // Key tile indices (row*32 + col, 0-based):
  //   Grass floor:     row 0, col 0  → index 0
  //   Stone floor:     row 1, col 16 → index 48
  //   Wood floor:      row 2, col 0  → index 64
  //   Wall top:        row 4, col 0  → index 128
  //   Wall face:       row 5, col 0  → index 160
  //   Carpet:          row 3, col 0  → index 96
  _buildTilemap() {
    // Store tile index map for OfficeScene to use
    window.__tileConfig = {
      tileSize: 16,
      atlasWidth: 512,
      tilesPerRow: 32,
      // Tile indices into base_out_atlas
      tiles: {
        void:    -1,
        floor:   18,   // light stone
        wall:    160,  // dark wall face
        carpet:  96,   // warm carpet
        meeting: 112,  // meeting room floor
        lounge:  130,  // lounge/soft floor
        door:    176,
      },
    };
  }
}
