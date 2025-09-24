import { RequestManager } from './loading2/RequestManager';
import { Camera, Frustum, Ray, Vector2, Vector3, WebGLRenderer } from 'three';
import { PointCloudOctree } from './point-cloud-octree';
import { PickParams, PointCloudOctreePicker } from './point-cloud-octree-picker';
import { IPointCloudTreeNode, IPotree, IVisibilityUpdateResult, PickPoint } from './types';
import { BinaryHeap } from './utils/binary-heap';
import { LRU } from './utils/lru';
/**
 * Represents an item in a processing queue for point cloud operations.
 *
 * This class is typically used to manage nodes within a point cloud structure, associating each node with a specific weight and its parent node if applicable.
 */
export declare class QueueItem {
    pointCloudIndex: number;
    weight: number;
    node: IPointCloudTreeNode;
    parent?: IPointCloudTreeNode | null;
    /**
     * Creates a new QueueItem instance.
     *
     * @param pointCloudIndex - The index of the point cloud this item belongs to.
     * @param weight - The weight or priority associated with this queue item.
     * @param node - The point cloud tree node represented by this queue item.
     * @param parent - (Optional) The parent node of the current node, or null if it has no parent.
     */
    constructor(pointCloudIndex: number, weight: number, node: IPointCloudTreeNode, parent?: IPointCloudTreeNode | null);
}
export declare class Potree implements IPotree {
    static picker: PointCloudOctreePicker | undefined;
    _pointBudget: number;
    _rendererSize: Vector2;
    maxNumNodesLoading: number;
    get features(): {
        SHADER_INTERPOLATION: boolean;
        SHADER_SPLATS: boolean;
        SHADER_EDL: boolean;
        precision: string;
    };
    lru: LRU;
    loadPointCloud(url: string, baseUrl: string): Promise<PointCloudOctree>;
    loadPointCloud(url: string, requestManager: RequestManager): Promise<PointCloudOctree>;
    updatePointClouds(pointClouds: PointCloudOctree[], camera: Camera, renderer: WebGLRenderer): IVisibilityUpdateResult;
    static pick(pointClouds: PointCloudOctree[], renderer: WebGLRenderer, camera: Camera, ray: Ray, params?: Partial<PickParams>): PickPoint | null;
    get pointBudget(): number;
    set pointBudget(value: number);
    private updateVisibility;
    private updateTreeNodeVisibility;
    private updateChildVisibility;
    private updateBoundingBoxVisibility;
    private shouldClip;
    updateVisibilityStructures: (pointClouds: PointCloudOctree[], camera: Camera) => {
        frustums: Frustum[];
        cameraPositions: Vector3[];
        priorityQueue: BinaryHeap<QueueItem>;
    };
}
