import { IPointCloudTreeNode } from '../types';
/**
 * Check if running on browser or node.js.
 *
 * @returns True if running on browser.
 */
export declare function isBrowser(): boolean;
/**
 * Returns the index of the node in the hierarchy from its name.
 *
 * @param name The name of the node.
 */
export declare function getIndexFromName(name: string): number;
/**
 * When passed to `[].sort`, sorts the array by level and index: r, r0, r3, r4, r01, r07, r30, ...
 *
 * @param a The first node.
 * @param b The second node.
 */
export declare function byLevelAndIndex(a: IPointCloudTreeNode, b: IPointCloudTreeNode): number;
