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

    await SceneLoader.AppendAsync("./", "scene.glb");

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

    const gravityVector = new Vector3(0, -9.81, 0);
    const ammoModule = await new Ammo();
    scene.enablePhysics(gravityVector, new AmmoJSPlugin(true, ammoModule));

    const test = Mesh.CreateBox("test", 1);
    test.physicsImpostor = new PhysicsImpostor(test, PhysicsImpostor.BoxImpostor, { mass: 1 });
    test.position.y += 25;
    test.position.x -= 3;

    const floorPhysicsRoot = new Mesh("floorPhysicsRoot");

    // floorMesh.parent = floorPhysicsRoot;
    floorPhysicsRoot.addChild(floorMesh);
    floorMesh.scaling.y = -floorMesh.scaling.y;
    console.log(floorMesh.scaling);

    floorMesh.physicsImpostor = new PhysicsImpostor(floorMesh, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        ignoreParent: true,
    });
    floorPhysicsRoot.physicsImpostor = new PhysicsImpostor(floorPhysicsRoot, PhysicsImpostor.NoImpostor, { mass: 0 });

    scene.debugLayer.show();

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
