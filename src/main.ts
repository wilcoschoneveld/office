import "./style.css";
import {
    AmmoJSPlugin,
    ArcRotateCamera,
    CannonJSPlugin,
    Engine,
    HemisphericLight,
    Mesh,
    PhysicsImpostor,
    Scene,
    SceneLoader,
    Vector3,
    WebXRControllerPhysics,
    WebXRDefaultExperience,
    WebXRFeatureName,
    WebXRInputSource,
} from "@babylonjs/core";
import "@babylonjs/loaders";

async function createScene(engine: Engine) {
    const scene = new Scene(engine);
    // Add a camera to the scene and attach it to the canvas
    const camera = new ArcRotateCamera(
        //
        "camera",
        0,
        Math.PI / 3,
        20,
        new Vector3(0, 0, 0),
        scene
    );
    camera.attachControl(true);
    camera.alpha = 0.5 * Math.PI;
    camera.beta = 1.381;

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.8;

    const gravityVector = new Vector3(0, -9.81, 0);
    // const cannonModule = await import("cannon-es");
    // scene.enablePhysics(gravityVector, new CannonJSPlugin(true, undefined, cannonModule));
    const ammoModule = await import("ammo.js").then((Ammo) => new Ammo.default());
    scene.enablePhysics(gravityVector, new AmmoJSPlugin(true, ammoModule));

    await SceneLoader.AppendAsync("./", "test.babylon");

    const groundMesh = scene.getMeshByName("Ground") as Mesh;
    groundMesh.physicsImpostor = new PhysicsImpostor(groundMesh, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        friction: 0.5,
    });

    const bucketMesh = scene.getMeshByName("Bucket") as Mesh;
    for (const child of bucketMesh.getChildMeshes()) {
        child.physicsImpostor = new PhysicsImpostor(child, PhysicsImpostor.BoxImpostor, { mass: 0.1 });
        child.isVisible = false;
    }
    bucketMesh.physicsImpostor = new PhysicsImpostor(bucketMesh, PhysicsImpostor.NoImpostor, {
        mass: 1,
        friction: 0.3,
    });
    // bucketMesh.position.y += 2;
    // bucketMesh.physicsImpostor.setLinearVelocity(new Vector3(1, 0, 0));

    const ballMesh = scene.getMeshByName("Ball") as Mesh;
    // ballMesh.physicsImpostor = new PhysicsImpostor(ballMesh, PhysicsImpostor.SphereImpostor, { mass: 0.1 });

    const xr = await WebXRDefaultExperience.CreateAsync(scene, {
        floorMeshes: [groundMesh],
    });

    const xrPhysics = xr.baseExperience.featuresManager.enableFeature(WebXRFeatureName.PHYSICS_CONTROLLERS, "latest", {
        xrInput: xr.input,
        physicsProperties: {
            restitution: 0.5,
            impostorSize: 0.1,
            impostorType: PhysicsImpostor.SphereImpostor,
        },
    }) as WebXRControllerPhysics;

    xr.baseExperience.onInitialXRPoseSetObservable.add((xrCamera) => {
        // Move to the office
        xrCamera.position.x = 0;
        xrCamera.position.y = 0;
        xrCamera.position.z = 0;
    });

    const newBalls = new Map<WebXRInputSource, Mesh>();

    xr.input.onControllerAddedObservable.add((controller) => {
        controller.onMotionControllerInitObservable.add((motionController) => {
            console.log(motionController.getComponentIds());
            const squeezeComponent = motionController.getComponentOfType("squeeze");
            if (squeezeComponent) {
                squeezeComponent.onButtonStateChangedObservable.add(() => {
                    if (squeezeComponent.changes.pressed) {
                        if (squeezeComponent.pressed) {
                            const newBall = ballMesh.clone();
                            newBall.setParent(controller.grip!);
                            newBall.position = new Vector3(0, 0, 0.1);
                            newBalls.set(controller, newBall);
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

                                const vel = xrPhysics.getImpostorForController(controller)!.getLinearVelocity();
                                ball.physicsImpostor.setLinearVelocity(vel);
                            }
                        }
                    }
                });
            }
        });
    });

    // if (process.env.NODE_ENV === "development") {
    //     await import("@babylonjs/inspector");
    //     scene.debugLayer.show();
    // }

    return scene;
}

async function bootstrap() {
    // Get the canvas element
    const canvas = document.getElementById("root") as HTMLCanvasElement;

    // Generate the BABYLON 3D engine
    const engine = new Engine(canvas, true);

    // Add your code here matching the playground format
    const scene = await createScene(engine); //Call the createScene function

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
