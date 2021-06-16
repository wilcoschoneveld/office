import { Axis, Mesh, MeshBuilder, Scene, Tools, Vector3, WebXRState } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, StackPanel, TextBlock } from "@babylonjs/gui";
import { IMachine } from "./state";

export function createGui(scene: Scene, machine: IMachine) {
    const bucketRoot = scene.getMeshByName("Bucket__root__")!;

    const plane = MeshBuilder.CreatePlane("welcomePlane", { size: 1 });
    plane.isPickable = false;
    plane.isVisible = false;

    const guiTexture = AdvancedDynamicTexture.CreateForMesh(plane);
    const panel = new StackPanel();
    guiTexture.addControl(panel);

    var title = new TextBlock();
    title.text = "Office Challenge";
    title.color = "white";
    title.fontSize = 80;
    title.height = `${90 + 40}px`;
    title.paddingBottom = "40px";
    panel.addControl(title);

    var description = new TextBlock();
    description.text =
        "Hold the grip button to spawn a ball in your hand,\n" +
        "then swing your arm and release to throw!\n\n" +
        "The goal is to throw the ball in the bucket. ";
    description.color = "white";
    description.fontSize = 45;
    description.height = `${45 * 5}px`;
    panel.addControl(description);

    machine.subscribe((state) => {
        if (state.currentState === "welcome") {
            plane.position = bucketRoot.position.clone();
            plane.rotationQuaternion = bucketRoot.rotationQuaternion!.clone();
            plane.rotate(Axis.Y, Tools.ToRadians(90));
            plane.position.y += 1.5;
            plane.isVisible = true;
        } else {
            plane.isVisible = false;
        }
    });

    // const plane = MeshBuilder.CreatePlane("plane", { size: 10 });
    // plane.position.y = 2;
    // var advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);
    // var text1 = new TextBlock();
    // text1.text = "Wilco Schoneveld";
    // text1.color = "white";
    // text1.fontSize = 100;
    // advancedTexture.addControl(text1);
    // // plane.setParent(scene.getCameraByName("main"));
    // plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
}

export function createDebugGui(scene: Scene, machine: IMachine) {
    const width = 0.5;
    const height = 0.1;
    const plane = MeshBuilder.CreatePlane("plane", { width, height });
    plane.isPickable = false;
    plane.position = new Vector3(0, -0.5, 1);
    plane.rotation = new Vector3(0, Tools.ToRadians(180), 0);
    plane.isVisible = false;

    var advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane, width * 1024, height * 1024, false);

    var text1 = new TextBlock();
    text1.color = "white";
    text1.fontSize = 40;
    text1.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    text1.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    advancedTexture.addControl(text1);

    machine.subscribe((state) => {
        text1.text = `state: ${state.currentState} / level: ${state.levelNumber}`;

        if (state.xr && state.xr.baseExperience.state == WebXRState.IN_XR) {
            plane.isVisible = true;
            plane.parent = state.xr.baseExperience.camera;
        } else {
            plane.isVisible = false;
            plane.parent = null;
        }
    });
}
