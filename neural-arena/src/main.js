import Phaser from "phaser";
import GameScene from "./scenes/GameScene";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#0f172a",
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);