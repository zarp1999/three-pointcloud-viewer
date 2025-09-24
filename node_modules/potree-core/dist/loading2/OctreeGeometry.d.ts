import { NodeLoader, Metadata } from './OctreeLoader';
import { Box3, Sphere, Vector3 } from 'three';
import { PointAttributes } from './PointAttributes';
import { OctreeGeometryNode } from './OctreeGeometryNode';
export declare class OctreeGeometry {
    loader: NodeLoader;
    boundingBox: Box3;
    root: OctreeGeometryNode;
    url: string | null;
    pointAttributes: PointAttributes | null;
    spacing: number;
    tightBoundingBox: Box3;
    numNodesLoading: number;
    maxNumNodesLoading: number;
    boundingSphere: Sphere;
    tightBoundingSphere: Sphere;
    offset: Vector3;
    scale: [number, number, number];
    disposed: boolean;
    projection?: Metadata['projection'];
    constructor(loader: NodeLoader, boundingBox: Box3);
    dispose(): void;
}
