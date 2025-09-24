import { Box3, Vector2 } from 'three';
/**
 * Digital Elevation Model (DEM) Node class.
 *
 * This class represents a node in a hierarchical structure for storing elevation data.
 */
export declare class DEMNode {
    name: string;
    box: Box3;
    tileSize: number;
    /**
     * The level of the node in the hierarchy.
     */
    level: number;
    /**
     * The elevation data for the node, stored as a Float32Array.
     *
     * Each element corresponds to a height value at a specific position in the tile.
     */
    data: Float32Array;
    /**
     * The children of this node, which are also DEMNode instances.
     *
     * This allows for a hierarchical structure where each node can have multiple child nodes.
     */
    children: DEMNode[];
    /**
     * The mipmap data for the node, which is an array of Float32Arrays.
     *
     * Each element in the mipMap corresponds to a different level of detail for the elevation data.
     */
    mipMap: Float32Array[];
    /**
     * Indicates whether the mipmap needs to be updated.
     *
     * This is set to true when the node is created or when the elevation data changes, and should be set to false after the mipmap has been created.
     */
    mipMapNeedsUpdate: boolean;
    constructor(name: string, box: Box3, tileSize: number);
    /**
     * Creates the mipmap for this node.
     */
    createMipMap(): void;
    /**
     * Gets the UV coordinates for a given position within the bounding box of this node.
     *
     * @param position - The position in 2D space for which to calculate the UV coordinates.
     * @returns UV coordinates as a tuple [u, v].
     */
    uv(position: Vector2): [number, number];
    /**
     * Heights at a specific mipmap level for a given position.
     *
     * @param position - The position in 2D space for which to calculate the height.
     * @param mipMapLevel - The mipmap level to use for height calculation.
     * @returns Height at the specified position and mipmap level, or null if no valid height is found.
     */
    heightAtMipMapLevel(position: Vector2, mipMapLevel: number): number;
    /**
     * Gets the height at a specific position by checking all mipmap levels.
     *
     * @param position - The position in 2D space for which to calculate the height.
     * @returns Returns the height at the specified position, or null if no valid height is found.
     */
    height(position: Vector2): any;
    /**
     * Travels through the hierarchy of DEM nodes, applying a handler function to each node.
     *
     * @param handler - A function that takes a DEMNode and a level as arguments, allowing custom processing of each node.
     * @param level - The current level in the hierarchy, starting from 0 for the root node.
     */
    traverse(handler: (node: DEMNode, level: number) => void, level?: number): void;
}
