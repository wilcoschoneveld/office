import { Mesh, MeshBuilder, Scene, Tools, Vector3, WebXRState } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import { IMachine } from "./state";

export function createGui(scene: Scene, machine: IMachine) {
    const plane = MeshBuilder.CreatePlane("plane", { size: 10 });
    plane.position.y = 2;
    var advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);
    var text1 = new TextBlock();
    text1.text = "Wilco Schoneveld";
    text1.color = "white";
    text1.fontSize = 100;
    advancedTexture.addControl(text1);
    // plane.setParent(scene.getCameraByName("main"));
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
}

export function createDebugGui(scene: Scene, machine: IMachine) {
    const width = 0.5;
    const height = 0.1;
    const plane = MeshBuilder.CreatePlane("plane", { width, height });
    plane.position = new Vector3(0, -0.5, 1);
    plane.rotation = new Vector3(0, Tools.ToRadians(180), 0);
    plane.isVisible = false;

    var advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane, width * 1024, height * 1024, false);

    var text1 = new TextBlock();
    text1.color = "white";
    text1.fontSize = 50;
    text1.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    text1.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

    advancedTexture.addControl(text1);

    machine.subscribe((state) => {
        text1.text = `state: ${state.currentState}`;

        if (state.xr && state.xr.baseExperience.state == WebXRState.IN_XR) {
            plane.isVisible = true;
            plane.parent = state.xr.baseExperience.camera;
        } else {
            plane.isVisible = false;
            plane.parent = null;
        }
    });
}
