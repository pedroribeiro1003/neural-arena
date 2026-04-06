import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.spritesheet(
      "player",
      "https://labs.phaser.io/assets/sprites/dude.png",
      { frameWidth: 32, frameHeight: 48 }
    );

    this.load.image(
      "enemy",
      "https://labs.phaser.io/assets/sprites/space-baddie.png"
    );

    this.load.image(
      "bullet",
      "https://labs.phaser.io/assets/sprites/bullets/bullet11.png"
    );

    // 🔫 NOVA ARMA (TRANSPARENTE)
    this.load.image(
      "gun",
      "https://i.imgur.com/V4imZXZ.png"
    );
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setBackgroundColor("#0f172a");

    // MENU
    this.title = this.add.text(width / 2, height / 2 - 60, "NEURAL ARENA", {
      fontSize: "48px",
      color: "#00ffcc"
    }).setOrigin(0.5);

    this.startBtn = this.add.text(width / 2, height / 2 + 20, "INICIAR", {
      fontSize: "32px",
      backgroundColor: "#00ffcc",
      color: "#000",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    this.startBtn.on("pointerdown", () => this.startGame());

    this.isStarted = false;
  }

  startGame() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.children.removeAll();

    // PLAYER
    this.player = this.physics.add.sprite(width / 2, height / 2, "player");
    this.player.setScale(1.4);
    this.player.setCollideWorldBounds(true);

    this.keys = this.input.keyboard.addKeys("W,A,S,D");

    // 🔫 ARMA (AJUSTADA)
    this.gun = this.add.image(this.player.x, this.player.y, "gun");
    this.gun.setScale(0.3); // 🔥 tamanho ideal
    this.gun.setOrigin(0.3, 0.5);

    // ANIMAÇÕES
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "player", frame: 4 }]
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    // SCORE
    this.startTime = this.time.now;
    this.bestScore = this.registry.get("bestScore") || 0;

    this.scoreText = this.add.text(20, 20, "", {
      fontSize: "20px",
      color: "#fff"
    });

    this.bestText = this.add.text(20, 50, "", {
      fontSize: "20px",
      color: "#00ffcc"
    });

    // GAME OVER
    this.gameOverText = this.add.text(width / 2, height / 2 - 40, "", {
      fontSize: "64px",
      color: "#ff0044"
    }).setOrigin(0.5);

    this.restartBtn = this.add.text(width / 2, height / 2 + 40, "REINICIAR", {
      fontSize: "28px",
      backgroundColor: "#ffffff",
      color: "#000",
      padding: { x: 15, y: 8 }
    })
      .setOrigin(0.5)
      .setInteractive()
      .setVisible(false);

    this.restartBtn.on("pointerdown", () => this.scene.restart());

    // INIMIGOS
    this.enemies = this.physics.add.group();
    this.enemySpeed = 100;

    for (let i = 0; i < 3; i++) {
      this.spawnEnemy();
    }

    this.spawnEvent = this.time.addEvent({
      delay: 2000,
      callback: () => {
        this.spawnEnemy();
        this.enemySpeed += 2;
      },
      loop: true
    });

    // BALAS
    this.bullets = this.physics.add.group();

    this.input.on("pointerdown", (pointer) => {
      if (this.isGameOver) return;

      const bullet = this.physics.add.image(
        this.gun.x,
        this.gun.y,
        "bullet"
      );

      bullet.setScale(0.8);

      this.bullets.add(bullet);

      const angle = Phaser.Math.Angle.Between(
        this.gun.x,
        this.gun.y,
        pointer.worldX,
        pointer.worldY
      );

      const speed = 700;

      bullet.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    });

    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      (bullet, enemy) => {
        bullet.destroy();
        enemy.destroy();
      }
    );

    this.isGameOver = false;
    this.isStarted = true;
  }

  update() {
    if (!this.isStarted || this.isGameOver) return;

    const speed = 240;

    this.player.setVelocity(0);

    if (this.keys.A.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play("left", true);
    } else if (this.keys.D.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play("right", true);
    } else {
      this.player.anims.play("turn");
    }

    if (this.keys.W.isDown) this.player.setVelocityY(-speed);
    if (this.keys.S.isDown) this.player.setVelocityY(speed);

    // 🔫 ARMA SEGUINDO MOUSE
    const pointer = this.input.activePointer;

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      pointer.worldX,
      pointer.worldY
    );

    this.gun.setRotation(angle);

    const offset = 20; // 🔥 melhor encaixe

    this.gun.x = this.player.x + Math.cos(angle) * offset;
    this.gun.y = this.player.y + Math.sin(angle) * offset;

    // 🔥 PLAYER VIRA PRO LADO DO MOUSE
    this.player.setFlipX(pointer.worldX < this.player.x);

    // SCORE
    const t = Math.floor((this.time.now - this.startTime) / 1000);
    this.scoreText.setText("Tempo: " + t);
    this.bestText.setText("Recorde: " + this.bestScore);

    // IA DOS INIMIGOS
    this.enemies.getChildren().forEach((enemy) => {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) return;

      enemy.setVelocity(
        (dx / dist) * this.enemySpeed,
        (dy / dist) * this.enemySpeed
      );

      if (dist < 35) this.gameOver(t);
    });

    // LIMPAR BALAS
    this.bullets.getChildren().forEach((bullet) => {
      if (
        bullet.x < 0 ||
        bullet.x > this.scale.width ||
        bullet.y < 0 ||
        bullet.y > this.scale.height
      ) {
        bullet.destroy();
      }
    });
  }

  spawnEnemy() {
    if (this.isGameOver) return;

    const enemy = this.physics.add.image(
      Math.random() * this.scale.width,
      Math.random() * this.scale.height,
      "enemy"
    );

    enemy.setScale(1.8);
    this.enemies.add(enemy);
  }

  gameOver(score) {
    this.isGameOver = true;

    this.spawnEvent.remove(false);

    if (score > this.bestScore) {
      this.registry.set("bestScore", score);
    }

    this.gameOverText.setText("GAME OVER");
    this.restartBtn.setVisible(true);
  }
}