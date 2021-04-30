import { Matrix, Mesh, Vector3 } from "@babylonjs/core";

export function prepareMesh(mesh: Mesh) {
    mesh.setParent(null);
    const { x, y, z } = mesh.scaling;
    const scaleMatrix = Matrix.Scaling(x, y, z);
    mesh.bakeTransformIntoVertices(scaleMatrix);
    mesh.scaling = new Vector3(1, 1, 1);
}
