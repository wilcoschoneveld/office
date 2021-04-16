import './style.css';
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { SphereBuilder } from "@babylonjs/core/Meshes/Builders/sphereBuilder";

import "@babylonjs/core/Materials/standardMaterial";

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

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    
  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.8;

  // Our built-in 'sphere' shape.
  const sphere = SphereBuilder.CreateSphere(
      "sphere",
      { diameter: 2, segments: 32 },
      scene
  );

  // Move the sphere upward 1/2 its height
  sphere.position.y = 1;

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