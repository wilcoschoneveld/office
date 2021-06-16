import {
    ActionManager,
    AmmoJSPlugin,
    ArcRotateCamera,
    Color3,
    DirectionalLight,
    Engine,
    ExecuteCodeAction,
    HemisphericLight,
    Mesh,
    PhysicsImpostor,
    Scene,
    SceneLoader,
    ShadowGenerator,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3,
    WebXRControllerPhysics,
    WebXRDefaultExperience,
    WebXRFeatureName,
    WebXRInputSource,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { prepareConfetti } from "./confetti";
import { createDebugGui, createGui } from "./gui";
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
    // Cannot use cannon-es because it doesn't support compound physics bodies as nice
    const ammoModule = await import("ammo.js").then((Ammo) => new Ammo.default());
    scene.enablePhysics(gravityVector, new AmmoJSPlugin(true, ammoModule));

    await SceneLoader.AppendAsync("./", "office.glb");
    const shadowGenerator = enableShadows(scene);

    const groundMesh = scene.getMeshByName("Ground") as Mesh;
    groundMesh.setParent(null);
    groundMesh.physicsImpostor = new PhysicsImpostor(groundMesh, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        friction: 1,
        restitution: 0.6,
    });

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

    const triggerMesh = scene.getMeshByName("trigger") as Mesh;
    triggerMesh.isVisible = false;

    const ballMesh = scene.getMeshByName("Ball") as Mesh;
    ballMesh.isVisible = false;

    const materialAmiga = new StandardMaterial("amiga", scene);
    materialAmiga.diffuseTexture = new Texture("/amiga.jpeg", scene);
    materialAmiga.emissiveColor = new Color3(0.5, 0.5, 0.5);

    ballMesh.material = materialAmiga;

    // const ball = ballMesh.clone();
    // ball.setParent(null);
    // ball.position = new Vector3(0, 1, 0);

    // const impostor = new PhysicsImpostor(
    //     //
    //     ball,
    //     PhysicsImpostor.SphereImpostor,
    //     {
    //         mass: 0.1,
    //         friction: 1,
    //         restitution: 0.9,
    //     } as any
    // );
    // ball.physicsImpostor = impostor;

    // const ball2 = ballMesh.clone();
    // ball2.position = new Vector3(0.01, 0.5, 0);
    // ball2.setParent(null);

    // ball2.physicsImpostor = new PhysicsImpostor(
    //     //
    //     ball2,
    //     PhysicsImpostor.SphereImpostor,
    //     {
    //         mass: 0.1,
    //     }
    // );

    // const test = ball2.physicsImpostor.physicsBody.getBroadphaseProxy();
    // test.m_collisionFilterMask = 0;
    // console.log(test.m_collisionFilterGroup);
    // console.log(test.m_collisionFilterMask);

    // ball.physicsImpostor.setLinearVelocity(new Vector3(3, 0, 0));
    // ball.physicsImpostor.physicsBody.setDamping(0.4, 0.9);

    // const action = new ExecuteCodeAction(
    //     {
    //         trigger: ActionManager.OnIntersectionEnterTrigger,
    //         parameter: triggerMesh,
    //     },
    //     () => {
    //         machine.send({ name: "BallInBucket" });
    //     }
    // );

    // ball.actionManager = new ActionManager(scene);
    // ball.actionManager.registerAction(action);

    for (const node of scene.getNodes()) {
        if (node instanceof Mesh || node instanceof TransformNode) {
            if (node.metadata?.gltf?.extras?.physics === 1) {
                const mass = node.metadata.gltf.extras.mass ?? 1;
                createCompoundPhysics(node, mass);
            }
        }
    }

    const bucketRoot = scene.getMeshByName("Bucket__root__")!;

    const xr = await WebXRDefaultExperience.CreateAsync(scene, {
        floorMeshes: [groundMesh],
    });

    let liveBalls: Array<Mesh> = [];

    if (xr.baseExperience) {
        xr.baseExperience.onStateChangedObservable.add(() => {
            machine.send({ name: "ChangeXRStateEvent", xr });
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
                    group: 4, // group 4 (custom)
                    mask: -1 ^ 2, // all but static group (bit 2)
                },
            }
        ) as WebXRControllerPhysics;

        xr.baseExperience.onInitialXRPoseSetObservable.add((xrCamera) => {
            // Move to the office
            const playerStart = scene.getTransformNodeByName("player_start")!;
            xrCamera.position = playerStart.position.clone();
            xrCamera.rotationQuaternion = playerStart.rotationQuaternion!.clone();

            const bucketWelcome = scene.getTransformNodeByName("bucket_welcome")!;
            bucketRoot.position = bucketWelcome.position.clone();
            bucketRoot.rotationQuaternion = bucketWelcome.rotationQuaternion!.clone();
        });

        const newBalls = new Map<WebXRInputSource, Mesh>();

        xr.input.onControllerAddedObservable.add((controller) => {
            controller.onMotionControllerInitObservable.add((motionController) => {
                const linearVelocity = Vector3.Zero();
                const angularVelocity = Vector3.Zero();
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

                                    const physicsImpostor = new PhysicsImpostor(
                                        //
                                        ball,
                                        PhysicsImpostor.SphereImpostor,
                                        {
                                            mass: 0.1,
                                            friction: 1,
                                            restitution: 0.9,
                                            group: 1, // dynamic group
                                            mask: -1 ^ 4, // all but group 4 (controllers)
                                        } as any
                                    );

                                    const controllerImposter = xrPhysics.getImpostorForController(controller)!;

                                    const v = linearVelocity.addInPlace(
                                        controllerImposter.getLinearVelocity()!.subtract(linearVelocity).scale(0.8) // exponential smoothing
                                    );

                                    const w = angularVelocity.addInPlace(
                                        controllerImposter.getAngularVelocity()!.subtract(angularVelocity).scale(0.8) // exponential smoothing
                                    );

                                    const r = ball.position.subtract(controllerImposter.getObjectCenter());

                                    physicsImpostor.setLinearVelocity(v.add(w.cross(r)));
                                    physicsImpostor.setAngularVelocity(w);
                                    physicsImpostor.physicsBody.setDamping(0.4, 0.9);

                                    const actionManager = new ActionManager(scene);

                                    const action = new ExecuteCodeAction(
                                        {
                                            trigger: ActionManager.OnIntersectionEnterTrigger,
                                            parameter: {
                                                mesh: triggerMesh,
                                                usePreciseIntersection: true,
                                            },
                                        },
                                        () => {
                                            machine.send({ name: "BallInBucketEvent" });
                                            actionManager.unregisterAction(action);
                                        }
                                    );

                                    actionManager.registerAction(action);
                                    ball.actionManager = actionManager;
                                    ball.physicsImpostor = physicsImpostor;

                                    liveBalls.push(ball);

                                    setInterval(() => {
                                        // Ball should collide with all
                                        physicsImpostor.physicsBody.getBroadphaseProxy().m_collisionFilterMask = -1;
                                    }, 500);
                                }
                            }
                        }
                    });
                }
            });
        });
    }

    scene.onAfterRenderObservable.add(() => {
        liveBalls = liveBalls.filter((ball, i) => {
            const maxBalls = 5;
            if (ball.position.y < -0.5 || liveBalls.length - maxBalls > i) {
                // out of bounds
                ball.dispose();
                return false;
            }
            return true;
        });
    });

    machine.subscribe((state) => {
        if (state.currentState === "level") {
            liveBalls.forEach((ball) => ball.dispose());
            liveBalls = [];

            const bucketLevel = scene.getTransformNodeByName(`bucket_level${state.levelNumber}`)!;
            bucketRoot.position = bucketLevel.position.clone();
            bucketRoot.rotationQuaternion = bucketLevel.rotationQuaternion!.clone();
        }
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

    createGui(scene, machine);

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

    prepareConfetti(scene, machine);

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
}

bootstrap();
