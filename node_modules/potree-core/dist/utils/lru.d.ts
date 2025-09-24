import { IPointCloudTreeNode } from '../types';
export type Node = IPointCloudTreeNode;
export declare class LRUItem {
    node: Node;
    next: LRUItem | null;
    previous: LRUItem | null;
    constructor(node: Node);
}
/**
 * A doubly-linked-list of the least recently used elements.
 */
export declare class LRU {
    pointBudget: number;
    /**
     * The least recently used item.
     */
    first: LRUItem | null;
    /**
     * The most recently used item
     */
    last: LRUItem | null;
    /**
     * The total number of points in the LRU cache.
     */
    numPoints: number;
    /**
     * Items in the LRU cache, indexed by node ID.
     */
    private items;
    /**
     * Creates a new LRU cache with a specified point budget.
     *
     * @param pointBudget The maximum number of points that can be stored in the LRU cache.
     */
    constructor(pointBudget?: number);
    get size(): number;
    /**
     * Checks if the LRU cache contains the specified node.
     *
     * @param node - The node to check for in the LRU cache.
     * @returns Returns true if the node is in the cache, false otherwise.
     */
    has(node: Node): boolean;
    /**
     * Makes the specified the most recently used item. if the list does not contain node, it will be added.
     *
     * @param node - The node to touch, making it the most recently used item in the LRU cache.
     */
    touch(node: Node): void;
    /**
     * Adds a new node to the LRU cache, making it the most recently used item.
     *
     * @param node - The node to add to the LRU cache.
     */
    private addNew;
    /**
     * Touches an existing item in the LRU cache, moving it to the end of the list (most recently used).
     *
     * @param item - The LRUItem to touch, making it the most recently used item in the cache.
     */
    private touchExisting;
    /**
     * Removes a node from the LRU cache.
     *
     * @param node - The node to remove from the LRU cache.
     */
    remove(node: Node): void;
    /**
     * Gets the least recently used item from the LRU cache.
     *
     * @returns Returns the least recently used node, or undefined if the cache is empty.
     */
    getLRUItem(): Node | undefined;
    /**
     * Frees up memory by removing the least recently used items until the number of points is below the point budget.
     *
     * @returns - Returns nothing.
     */
    freeMemory(): void;
    /**
     * Disposes of a subtree starting from the specified node and removes it from the LRU cache.
     *
     * @param node - The root node of the subtree to dispose of.
     */
    disposeSubtree(node: Node): void;
}
