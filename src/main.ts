import "./style.css";
import {
    AmmoJSPlugin,
    ArcRotateCamera,
    Engine,
    HemisphericLight,
    Mesh,
    PhysicsImpostor,
    Scene,
    SceneLoader,
    Vector3,
    WebXRDefaultExperience,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as Ammo from "ammo.js";
import "@babylonjs/inspector";

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

    await SceneLoader.AppendAsync("./", "ground.glb");

    // await SceneLoader.AppendAsync("./", "office.glb", scene);

    // scene.getMeshByName("Cube.024")!.visibility = 0;

    const floorMesh = scene.getMeshByName("Cube")!;
    // const bucket = scene.getMeshByName("Cylinder.001")!;
    // bucket.position.y += 1;

    const xr = await WebXRDefaultExperience.CreateAsync(scene, {
        floorMeshes: [floorMesh],
    });

    xr.baseExperience.onInitialXRPoseSetObservable.add((xrCamera) => {
        // Move to the office
        xrCamera.position.x = 0;
        xrCamera.position.y = 0;
        xrCamera.position.z = 0;
    });

    // const gravityVector = new Vector3(0, -9.81, 0);
    // const ammoModule = await new Ammo();
    // scene.enablePhysics(gravityVector, new AmmoJSPlugin(true, ammoModule));

    // const floorCollider = Mesh.CreateBox("floorCollider", 1);
    // floorCollider.scaling = new Vector3(5, 0.1, 5);
    // floorCollider.position = new Vector3(-0.5, 0.5, 5.72);

    // const bucketCollider = Mesh.CreateBox("bucketCollider", 1);
    // bucketCollider.scaling = new Vector3(0.4, 0.6, 0.4);
    // bucketCollider.position = new Vector3(-2.4, 1.85, 4.13);
    // // bucket.parent = bucketCollider;
    // // bucket.scaling = new Vector3(1, 1, 1);
    // // bucket.position = new Vector3(0, 0, 0);

    // floorCollider.physicsImpostor = new PhysicsImpostor(floorCollider, PhysicsImpostor.BoxImpostor, { mass: 0 });
    // bucketCollider.physicsImpostor = new PhysicsImpostor(bucketCollider, PhysicsImpostor.BoxImpostor, { mass: 1 });

    // scene.debugLayer.show();

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
