import { Color4, Mesh, ParticleSystem, Scene, Texture, Tools, Vector3 } from "@babylonjs/core";

export function createConfetti(scene: Scene) {
    const particleTexture = new Texture("empty.png", scene);

    confettiParticles(scene, "yellow", particleTexture, Color4.FromHexString("#CECB3EFF"));
    confettiParticles(scene, "red", particleTexture, Color4.FromHexString("#C83E3EFF"));
    confettiParticles(scene, "green", particleTexture, Color4.FromHexString("#32A232FF"));
}

export function confettiParticles(scene: Scene, name: string, texture: Texture, color: Color4) {
    const particleSystem = new ParticleSystem(name, 500, scene);

    const source = new Mesh(name + "_source");
    source.parent = scene.getMeshByName("Bucket");
    source.position.y = 0.3;

    particleSystem.particleTexture = texture;
    particleSystem.emitter = source;

    particleSystem.minScaleX = 0.1;
    particleSystem.maxScaleX = 1;
    particleSystem.minScaleY = 0.1;
    particleSystem.maxScaleY = 0.5;

    particleSystem.addSizeGradient(0, 0.1, 0.2);
    particleSystem.addSizeGradient(1, 0.02, 0.05);

    particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    particleSystem.color1 = color;
    particleSystem.color2 = color;
    particleSystem.colorDead = color;

    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = 10;

    particleSystem.minInitialRotation = 0;
    particleSystem.maxInitialRotation = Tools.ToRadians(180);

    particleSystem.addDragGradient(0, 0.2);
    particleSystem.addDragGradient(0.5, 0.8);
    particleSystem.addDragGradient(1, 1);

    particleSystem.minLifeTime = 0.7;
    particleSystem.maxLifeTime = 1;

    particleSystem.emitRate = 30;
    particleSystem.minEmitPower = 5;
    particleSystem.maxEmitPower = 5;

    particleSystem.minEmitBox = new Vector3(-0.1, -0.1, -0.1);
    particleSystem.maxEmitBox = new Vector3(0.1, 0.1, 0.1);

    particleSystem.direction1 = new Vector3(-0.5, 1, -0.5);
    particleSystem.direction2 = new Vector3(0.5, 1, 0.5);

    particleSystem.targetStopDuration = 5;

    particleSystem.start();
}
