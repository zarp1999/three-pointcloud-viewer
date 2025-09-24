import { PointAttributes } from './PointAttributes';
import { WorkerPool } from './WorkerPool';
import { OctreeGeometryNode } from './OctreeGeometryNode';
import { OctreeGeometry } from './OctreeGeometry';
import { RequestManager } from './RequestManager';
/**
 * NodeLoader is responsible for loading the geometry of octree nodes.
 */
export declare class NodeLoader {
    url: string;
    workerPool: WorkerPool;
    metadata: Metadata;
    requestManager: RequestManager;
    /**
     * Point attributes to be used when loading the geometry.
     */
    attributes?: PointAttributes;
    /**
     * Scale applied to the geometry when loading.
     */
    scale?: [number, number, number];
    /**
     * Offset applied to the geometry when loading.
     */
    offset?: [number, number, number];
    constructor(url: string, workerPool: WorkerPool, metadata: Metadata, requestManager: RequestManager);
    /**
     * Loads the geometry for a given octree node.
     *
     * @param node - The octree node to load.
     */
    load(node: OctreeGeometryNode): Promise<void>;
    parseHierarchy(node: OctreeGeometryNode, buffer: ArrayBuffer): void;
    loadHierarchy(node: OctreeGeometryNode): Promise<void>;
}
declare let typenameTypeattributeMap: {
    double: {
        ordinal: number;
        name: string;
        size: number;
    };
    float: {
        ordinal: number;
        name: string;
        size: number;
    };
    int8: {
        ordinal: number;
        name: string;
        size: number;
    };
    uint8: {
        ordinal: number;
        name: string;
        size: number;
    };
    int16: {
        ordinal: number;
        name: string;
        size: number;
    };
    uint16: {
        ordinal: number;
        name: string;
        size: number;
    };
    int32: {
        ordinal: number;
        name: string;
        size: number;
    };
    uint32: {
        ordinal: number;
        name: string;
        size: number;
    };
    int64: {
        ordinal: number;
        name: string;
        size: number;
    };
    uint64: {
        ordinal: number;
        name: string;
        size: number;
    };
};
type AttributeType = keyof typeof typenameTypeattributeMap;
/**
 * Attribute interface defines the structure of an attribute in the octree geometry.
 */
export interface Attribute {
    name: string;
    description: string;
    size: number;
    numElements: number;
    type: AttributeType;
    min: number[];
    max: number[];
}
/**
 * Metadata interface defines the structure of the metadata for an octree geometry.
 */
export interface Metadata {
    version: string;
    name: string;
    description: string;
    points: number;
    projection: string;
    hierarchy: {
        firstChunkSize: number;
        stepSize: number;
        depth: number;
    };
    offset: [number, number, number];
    scale: [number, number, number];
    spacing: number;
    boundingBox: {
        min: [number, number, number];
        max: [number, number, number];
    };
    encoding: string;
    attributes: Attribute[];
}
/**
 * OctreeLoader is responsible for loading octree geometries from a given URL.
 */
export declare class OctreeLoader {
    /**
     * WorkerPool instance used for managing workers for loading tasks.
     */
    workerPool: WorkerPool;
    /**
     * Parses the attributes from a JSON array and converts them into PointAttributes.
     *
     * @param jsonAttributes Array of attributes in JSON format.
     * @returns A PointAttributes instance containing the parsed attributes.
     */
    static parseAttributes(jsonAttributes: Attribute[]): PointAttributes;
    /**
     * Loads an octree geometry from a given URL using the provided RequestManager.
     *
     * @param url - The URL from which to load the octree geometry metadata.
     * @param requestManager - The RequestManager instance used to handle HTTP requests.
     * @returns Geometry object containing the loaded octree geometry.
     */
    load(url: string, requestManager: RequestManager): Promise<{
        geometry: OctreeGeometry;
    }>;
}
export {};
