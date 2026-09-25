import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Progress bar
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const box = this.add.graphics();

    box.lineStyle(2, 0x4f8ef7);
    box.strokeRect(width / 2 - 160, height / 2 - 12, 320, 24);

    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0x4f8ef7);
      bar.fillRect(width / 2 - 158, height / 2 - 10, 316 * v, 20);
    });
  }

  create() {
    // Generate all graphics procedurally — no external asset files needed
    this._generateTiles();
    this._generateAvatars();
    this._generateFurniture();
    this.scene.start('OfficeScene');
  }

  // ── Tile textures ──────────────────────────────────────────────────────────
  _generateTiles() {
    const tileSize = 32;

    // Floor tile — light grey with subtle grid
    const floor = this.make.graphics({ x: 0, y: 0, add: false });
    floor.fillStyle(0xf0f0f8);
    floor.fillRect(0, 0, tileSize, tileSize);
    floor.lineStyle(1, 0xdddde8, 0.6);
    floor.strokeRect(0, 0, tileSize, tileSize);
    floor.generateTexture('floor', tileSize, tileSize);
    floor.destroy();

    // Wall tile — dark blue-grey
    const wall = this.make.graphics({ x: 0, y: 0, add: false });
    wall.fillStyle(0x2d3561);
    wall.fillRect(0, 0, tileSize, tileSize);
    wall.lineStyle(1, 0x3d4571, 1);
    wall.strokeRect(0, 0, tileSize, tileSize);
    wall.generateTexture('wall', tileSize, tileSize);
    wall.destroy();

    // Carpet area — soft purple
    const carpet = this.make.graphics({ x: 0, y: 0, add: false });
    carpet.fillStyle(0xe8e4f8);
    carpet.fillRect(0, 0, tileSize, tileSize);
    carpet.lineStyle(1, 0xd0c8f0, 0.5);
    carpet.strokeRect(0, 0, tileSize, tileSize);
    carpet.generateTexture('carpet', tileSize, tileSize);
    carpet.destroy();

    // Meeting room floor — warm beige
    const meeting = this.make.graphics({ x: 0, y: 0, add: false });
    meeting.fillStyle(0xfff3e8);
    meeting.fillRect(0, 0, tileSize, tileSize);
    meeting.lineStyle(1, 0xffe0cc, 0.5);
    meeting.strokeRect(0, 0, tileSize, tileSize);
    meeting.generateTexture('meeting-floor', tileSize, tileSize);
    meeting.destroy();
  }

  // ── Avatar textures ────────────────────────────────────────────────────────
  _generateAvatars() {
    const colors = [0x4f8ef7, 0xe040fb, 0x00bcd4, 0x4caf50, 0xff9800, 0xf44336];
    const emojis = ['🧑', '👩', '🧔', '👱', '🧕', '🧑‍💼'];

    colors.forEach((color, i) => {
      const size = 28;
      const g = this.make.graphics({ x: 0, y: 0, add: false });

      // Circle body
      g.fillStyle(color, 1);
      g.fillCircle(size / 2, size / 2, size / 2);

      // Subtle border
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeCircle(size / 2, size / 2, size / 2 - 1);

      g.generateTexture(`avatar-${i}`, size, size);
      g.destroy();

      // Name tag bg
      const tag = this.make.graphics({ x: 0, y: 0, add: false });
      tag.fillStyle(color, 0.9);
      tag.fillRoundedRect(0, 0, 80, 18, 4);
      tag.generateTexture(`nametag-${i}`, 80, 18);
      tag.destroy();
    });

    // Generic unknown avatar
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x888888, 1);
    g.fillCircle(14, 14, 14);
    g.generateTexture('avatar-unknown', 28, 28);
    g.destroy();
  }

  // ── Furniture textures ─────────────────────────────────────────────────────
  _generateFurniture() {
    // Desk (top-down view)
    const desk = this.make.graphics({ x: 0, y: 0, add: false });
    desk.fillStyle(0xd4a574);
    desk.fillRect(0, 0, 48, 32);
    desk.lineStyle(2, 0xb8885a);
    desk.strokeRect(0, 0, 48, 32);
    // Monitor
    desk.fillStyle(0x2d3561);
    desk.fillRect(10, 4, 28, 18);
    desk.fillStyle(0x4f8ef7, 0.3);
    desk.fillRect(12, 6, 24, 14);
    desk.generateTexture('desk', 48, 32);
    desk.destroy();

    // Chair
    const chair = this.make.graphics({ x: 0, y: 0, add: false });
    chair.fillStyle(0x455a64);
    chair.fillRect(4, 4, 24, 24);
    chair.fillStyle(0x546e7a);
    chair.fillRect(6, 6, 20, 20);
    chair.generateTexture('chair', 32, 32);
    chair.destroy();

    // Meeting table (large oval)
    const mtable = this.make.graphics({ x: 0, y: 0, add: false });
    mtable.fillStyle(0xd4a574);
    mtable.fillEllipse(80, 40, 160, 80);
    mtable.lineStyle(2, 0xb8885a);
    mtable.strokeEllipse(80, 40, 160, 80);
    mtable.generateTexture('meeting-table', 160, 80);
    mtable.destroy();

    // Plant
    const plant = this.make.graphics({ x: 0, y: 0, add: false });
    plant.fillStyle(0x5d4037);
    plant.fillRect(10, 20, 12, 10);
    plant.fillStyle(0x4caf50);
    plant.fillCircle(16, 16, 14);
    plant.fillStyle(0x66bb6a);
    plant.fillCircle(10, 12, 8);
    plant.fillCircle(22, 12, 8);
    plant.generateTexture('plant', 32, 32);
    plant.destroy();

    // Water cooler
    const cooler = this.make.graphics({ x: 0, y: 0, add: false });
    cooler.fillStyle(0xbdbdbd);
    cooler.fillRect(4, 8, 24, 24);
    cooler.fillStyle(0x90caf9, 0.7);
    cooler.fillRect(8, 4, 16, 14);
    cooler.generateTexture('cooler', 32, 32);
    cooler.destroy();

    // Zone labels
    const zones = ['Engineering', 'Design', 'Product', 'Meeting Rm A', 'Meeting Rm B', 'Lounge'];
    zones.forEach((name, i) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x000000, 0.3);
      g.fillRoundedRect(0, 0, 120, 26, 6);
      g.generateTexture(`zone-bg-${i}`, 120, 26);
      g.destroy();
    });
  }
}
