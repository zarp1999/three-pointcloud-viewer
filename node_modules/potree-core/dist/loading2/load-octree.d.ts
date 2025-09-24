import { type RequestManager } from './RequestManager';
/**
 * Loads an octree geometry from a specified URL using the provided request manager.
 *
 * @param url - The URL of the octree geometry to load.
 * @param requestManager - The request manager to handle network requests.
 * @returns A promise that resolves to the loaded octree geometry.
 */
export declare function loadOctree(url: string, requestManager: RequestManager): Promise<import("./OctreeGeometry").OctreeGeometry>;
