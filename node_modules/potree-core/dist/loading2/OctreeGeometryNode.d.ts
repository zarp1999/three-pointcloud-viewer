import { IPointCloudTreeNode } from './../types';
import { Box3, Sphere, BufferGeometry } from 'three';
import { OctreeGeometry } from './OctreeGeometry';
/**
 * Represents a node in an octree structure for point cloud geometry.
 */
export declare class OctreeGeometryNode implements IPointCloudTreeNode {
    name: string;
    octreeGeometry: OctreeGeometry;
    boundingBox: Box3;
    /** Indicates if the node's geometry has been loaded. */
    loaded: boolean;
    /** Indicates if the node's geometry is currently loading. */
    loading: boolean;
    /** Reference to the parent node, or null if this is the root. */
    parent: OctreeGeometryNode | null;
    /** The geometry data associated with this node, or null if not loaded. */
    geometry: BufferGeometry | null;
    /** Optional type identifier for the node. */
    nodeType?: number;
    /** Optional byte offset for the node's data in the source file. */
    byteOffset?: bigint;
    /** Optional byte size of the node's data in the source file. */
    byteSize?: bigint;
    /** Optional byte offset for the node's hierarchy data. */
    hierarchyByteOffset?: bigint;
    /** Optional byte size of the node's hierarchy data. */
    hierarchyByteSize?: bigint;
    /** Indicates if the node has children. */
    hasChildren: boolean;
    /** The spacing value for the node's points. */
    spacing: number;
    /** Optional density value for the node's points. */
    density?: number;
    /** Indicates if the node is a leaf node (has no children). */
    isLeafNode: boolean;
    /** Indicates if this node is a tree node (always false for geometry nodes). */
    readonly isTreeNode: boolean;
    /** Indicates if this node is a geometry node (always true). */
    readonly isGeometryNode: boolean;
    /** Array of child nodes (up to 8 for an octree), or null if no child at that position. */
    readonly children: ReadonlyArray<OctreeGeometryNode | null>;
    /** Static counter for generating unique node IDs. */
    static IDCount: number;
    /** Unique identifier for this node. */
    id: number;
    /** Index of this node within its parent. */
    index: number;
    /** Bounding sphere enclosing the node's geometry. */
    boundingSphere: Sphere;
    /** Number of points contained in this node. */
    numPoints: number;
    /** Level of the node in the octree hierarchy. */
    level: number;
    /** Array of handlers to be called once when the node is disposed. */
    oneTimeDisposeHandlers: Function[];
    constructor(name: string, octreeGeometry: OctreeGeometry, boundingBox: Box3);
    getLevel(): number;
    isLoaded(): boolean;
    getBoundingSphere(): Sphere;
    getBoundingBox(): Box3;
    load(): void;
    getNumPoints(): number;
    dispose(): void;
    traverse(cb: (node: OctreeGeometryNode) => void, includeSelf?: boolean): void;
}
