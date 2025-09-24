/**
 * Gets the features supported by the WebGL context.
 *
 * @returns An object containing the features supported by the WebGL context.
 */
export declare const getFeatures: () => {
    SHADER_INTERPOLATION: boolean;
    SHADER_SPLATS: boolean;
    SHADER_EDL: boolean;
    precision: string;
};
