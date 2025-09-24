import { Box3, Color, LineSegments } from 'three';
/**
 * Helper class to visualize a Box3 bounding box in 3D space.
 *
 * Code adapted from three.js BoxHelper.js
 */
export declare class Box3Helper extends LineSegments {
    constructor(box: Box3, color?: Color);
}
