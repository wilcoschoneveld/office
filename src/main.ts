import {
    AmmoJSPlugin,
    ArcRotateCamera,
    Color3,
    DirectionalLight,
    Engine,
    HemisphericLight,
    Light,
    Mesh,
    PhysicsImpostor,
    Scene,
    SceneLoader,
    ShadowGenerator,
    TransformNode,
    Vector3,
    WebXRControllerPhysics,
    WebXRDefaultExperience,
    WebXRFeatureName,
    WebXRInputSource,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { createConfetti } from "./confetti";
import { createDebugGui } from "./gui";
import { createMachine, IMachine } from "./state";
import "./style.css";
import { createCompoundPhysics } from "./utils";

function enableShadows(scene: Scene) {
    const sunLight = scene.getLightByName("Sun") as DirectionalLight;

    const shadowGenerator = new ShadowGenerator(1024, sunLight);
    shadowGenerator.bias = 0.000002;

    shadowGenerator.addShadowCaster(scene.getMeshByName("Bucket")!, false);
    shadowGenerator.addShadowCaster(scene.getMeshByName("Wall")!);
    shadowGenerator.addShadowCaster(scene.getMeshByName("Ball")!);

    for (const node of scene.getNodes()) {
        if (node instanceof Mesh) {
            if (node.name.startsWith("Wall")) {
                node.receiveShadows = true;
            }

            if (["plant", "pot", "pot2"].some((n) => node.name === n)) {
                shadowGenerator.addShadowCaster(node);
            }
        }
    }

    scene.getMeshByName("Wall");
    scene.getMeshByName("Ground")!.receiveShadows = true;

    return shadowGenerator;
}

async function createScene(engine: Engine, machine: IMachine) {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    // Add a camera to the scene and attach it to the canvas
    const camera = new ArcRotateCamera(
        //
        "main",
        0,
        Math.PI / 3,
        20,
        new Vector3(0, 0, 0),
        scene
    );
    camera.attachControl(true);
    camera.alpha = 0.5 * Math.PI;
    camera.beta = 1.381;

    const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);
    light.intensity = 0.6;
    light.groundColor = new Color3(1, 1, 1);

    const gravityVector = new Vector3(0, -9.81, 0);
    const ammoModule = await import("ammo.js").then((Ammo) => new Ammo.default());
    scene.enablePhysics(gravityVector, new AmmoJSPlugin(true, ammoModule));

    await SceneLoader.AppendAsync("./", "office.glb");
    for (const node of scene.getNodes()) {
        if (node instanceof Light) {
            // node.intensity = Math.sqrt(node.intensity);
        }

        if (node instanceof Mesh && node.name.startsWith("Window")) {
            node.isVisible = false;
        }
    }

    const shadowGenerator = enableShadows(scene);

    const plantNode = scene.getNodeByName("Plant") as TransformNode;
    const plantRoot = createCompoundPhysics(plantNode);

    const groundMesh = scene.getMeshByName("Ground") as Mesh;
    groundMesh.setParent(null);
    groundMesh.physicsImpostor = new PhysicsImpostor(groundMesh, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        friction: 0.5,
    });
    groundMesh.physicsImpostor.physicsBody.setRollingFriction(0.5);

    const wallMesh = scene.getMeshByName("Wall") as Mesh;
    wallMesh.setParent(null);
    wallMesh.physicsImpostor = new PhysicsImpostor(wallMesh, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        friction: 0.5,
    });

    const wallMesh2 = scene.getMeshByName("Wall.001") as Mesh;
    wallMesh2.setParent(null);
    wallMesh2.physicsImpostor = new PhysicsImpostor(wallMesh2, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        friction: 0.5,
    });

    const bucketMesh = scene.getMeshByName("Bucket") as Mesh;
    const bucketRoot = createCompoundPhysics(bucketMesh);

    const ballMesh = scene.getMeshByName("Ball") as Mesh;
    ballMesh.isVisible = false;

    // const ball = ballMesh.clone();
    // ball.position = new Vector3(0, 5, 0);
    // ball.isVisible = true;
    // ball.setParent(null);

    // ball.physicsImpostor = new PhysicsImpostor(
    //     //
    //     ball,
    //     PhysicsImpostor.SphereImpostor,
    //     {
    //         mass: 0.1,
    //     }
    // );
    // ball.physicsImpostor.setLinearVelocity(new Vector3(3, 0, 0));
    // ball.physicsImpostor.physicsBody.setRollingFriction(0.5);

    const xr = await WebXRDefaultExperience.CreateAsync(scene, {
        floorMeshes: [groundMesh],
    });

    let liveBalls: Array<Mesh> = [];

    if (xr.baseExperience) {
        xr.baseExperience.onStateChangedObservable.add(() => {
            machine.send({ name: "ChangeXRState", xr });
        });

        const xrPhysics = xr.baseExperience.featuresManager.enableFeature(
            WebXRFeatureName.PHYSICS_CONTROLLERS,
            "latest",
            {
                xrInput: xr.input,
                physicsProperties: {
                    restitution: 0.5,
                    impostorSize: 0.1,
                    impostorType: PhysicsImpostor.SphereImpostor,
                },
            }
        ) as WebXRControllerPhysics;

        xr.baseExperience.onInitialXRPoseSetObservable.add((xrCamera) => {
            // Move to the office
            xrCamera.position.x = 0;
            xrCamera.position.y = 0;
            xrCamera.position.z = 0;
        });

        const newBalls = new Map<WebXRInputSource, Mesh>();

        xr.input.onControllerAddedObservable.add((controller) => {
            controller.onMotionControllerInitObservable.add((motionController) => {
                const squeezeComponent = motionController.getComponentOfType("squeeze");
                if (squeezeComponent) {
                    squeezeComponent.onButtonStateChangedObservable.add(() => {
                        if (squeezeComponent.changes.pressed) {
                            if (squeezeComponent.pressed) {
                                const newBall = ballMesh.clone();
                                newBall.isVisible = true;
                                newBall.setParent(controller.grip!);
                                newBall.position = new Vector3(0, 0, -0.1);
                                newBalls.set(controller, newBall);

                                shadowGenerator.addShadowCaster(newBall);
                            } else {
                                const ball = newBalls.get(controller);

                                if (ball) {
                                    ball.setParent(null);

                                    ball.physicsImpostor = new PhysicsImpostor(
                                        //
                                        ball,
                                        PhysicsImpostor.SphereImpostor,
                                        {
                                            mass: 0.1,
                                        }
                                    );

                                    ball.physicsImpostor.physicsBody.setRollingFriction(0.5);

                                    const vel = xrPhysics.getImpostorForController(controller)!.getLinearVelocity();
                                    ball.physicsImpostor.setLinearVelocity(vel);
                                    liveBalls.push(ball);
                                }
                            }
                        }
                    });
                }
            });
        });
    }

    scene.onAfterRenderObservable.add(() => {
        liveBalls = liveBalls.filter((ball) => {
            if (ball.position.y < -0.5) {
                // out of bounds
                shadowGenerator.removeShadowCaster(ball);
                ball.dispose();
                return false;
            }
            return true;
        });
    });

    return scene;
}

async function bootstrap() {
    // Get the canvas element
    const canvas = document.getElementById("root") as HTMLCanvasElement;

    // Generate the BABYLON 3D engine
    const engine = new Engine(canvas, true);

    // Add your code here matching the playground format
    const machine = createMachine();
    const scene = await createScene(engine, machine); //Call the createScene function

    createConfetti(scene);

    if (process.env.NODE_ENV === "development") {
        createDebugGui(scene, machine);

        if (!navigator.userAgent.includes("Quest")) {
            await import("@babylonjs/inspector");
            scene.debugLayer.show();
        }
    }

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
}

bootstrap();
