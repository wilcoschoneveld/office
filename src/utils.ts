import { Mesh, PhysicsImpostor, TransformNode } from "@babylonjs/core";

export function createCompoundPhysics(mesh: Mesh | TransformNode, mass = 1) {
    // Create a new root mesh
    const root = new Mesh(mesh.name + "__root__");

    // Position the root in the world center of the mesh.
    root.position.copyFrom(mesh.getAbsolutePosition());

    // Loop over all hitboxes (assuming all child meshes are hitboxes).
    for (const child of mesh.getChildMeshes()) {
        // Set the parent of the hitbox to the newly created root.
        child.setParent(root);

        if (child.name.startsWith("hitbox")) {
            // Add a box physics imposter to the hitbox.
            child.physicsImpostor = new PhysicsImpostor(child, PhysicsImpostor.BoxImpostor, { mass: 0 });

            // Hide the original hitbox mesh.
            child.isVisible = false;
        }
    }

    // Add a root imposter to finish the compound physics object.
    root.physicsImpostor = new PhysicsImpostor(root, PhysicsImpostor.NoImpostor, { mass });

    // Add the original mesh to the root.
    mesh.setParent(root);

    return root;
}
