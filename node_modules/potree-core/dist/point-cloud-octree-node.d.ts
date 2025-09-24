import { Box3, EventDispatcher, Object3D, Points, Sphere } from 'three';
import { PointCloudOctreeGeometryNode } from './point-cloud-octree-geometry-node';
import { IPointCloudTreeNode } from './types';
export declare class PointCloudOctreeNode extends EventDispatcher implements IPointCloudTreeNode {
    /**
     * Unique identifier for the node, automatically incremented.
     */
    geometryNode: PointCloudOctreeGeometryNode;
    /**
     * The scene node that represents this octree node in the 3D scene.
     *
     * It contains the points of the point cloud.
     */
    sceneNode: Points;
    /**
     * The index of the point cloud in the scene, if applicable.
     *
     * This is used to identify which point cloud this node belongs to.
     */
    pcIndex: number | undefined;
    /**
     * The bounding box node for this octree node, if applicable.
     *
     * This is used for visualizing the bounding box in the scene.
     */
    boundingBoxNode: Object3D | null;
    /**
     * An array of child nodes, which can be null if there are no children at that position.
     *
     * This is used to traverse the octree structure.
     */
    readonly children: (IPointCloudTreeNode | null)[];
    /**
     * Indicates whether the node's geometry has been loaded.
     */
    readonly loaded = true;
    /**
     * Indicates whether the node is currently loading.
     */
    readonly isTreeNode: boolean;
    /**
     * Indicates whether this node is a geometry node.
     *
     * This is always false for PointCloudOctreeNode, as it represents a tree node.
     */
    readonly isGeometryNode: boolean;
    constructor(geometryNode: PointCloudOctreeGeometryNode, sceneNode: Points);
    /**
     * Disposes of the resources used by this node.
     *
     * This method should be called when the node is no longer needed to free up memory.
     */
    dispose(): void;
    /**
     * Disposes of the scene node associated with this octree node.
     *
     * This method removes the geometry and its attributes from the scene node to free up resources.
     */
    disposeSceneNode(): void;
    /**
     * Traverses the octree node and executes a callback function for each node.
     *
     * @param cb - The callback function to execute for each node.
     * @param includeSelf - If true, the callback will also be executed for this node.
     */
    traverse(cb: (node: IPointCloudTreeNode) => void, includeSelf?: boolean): void;
    get id(): number;
    get name(): string;
    get level(): number;
    get isLeafNode(): boolean;
    get numPoints(): number;
    get index(): number;
    get boundingSphere(): Sphere;
    get boundingBox(): Box3;
    get spacing(): number;
}
