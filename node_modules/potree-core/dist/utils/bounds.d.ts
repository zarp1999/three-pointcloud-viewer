import { Box3, Matrix4 } from 'three';
/**
 * Computes the transformed bounding box of a given Box3 using a transformation matrix.
 *
 * @param box - The original bounding box to transform.
 * @param transform - The transformation matrix to apply.
 * @returns A new Box3 that represents the transformed bounding box.
 */
export declare function computeTransformedBoundingBox(box: Box3, transform: Matrix4): Box3;
/**
 * Creates a child AABB (Axis-Aligned Bounding Box) from a parent AABB based on the specified index.
 *
 * @param aabb - The parent AABB from which to create the child AABB.
 * @param index - The index that determines how to split the parent AABB into a child AABB.
 * @returns New Box3 representing the child AABB.
 */
export declare function createChildAABB(aabb: Box3, index: number): Box3;
