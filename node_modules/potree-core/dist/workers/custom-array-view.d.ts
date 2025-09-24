export declare class CustomArrayView {
    private u8;
    private tmp;
    private tmpf;
    private tmpu8;
    constructor(buffer: ArrayBuffer);
    getUint32(i: number): number;
    getUint16(i: number): number;
    getFloat32(i: number): number;
    getUint8(i: number): number;
}
