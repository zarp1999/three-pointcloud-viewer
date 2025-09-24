import { Color, Texture } from 'three';
import { IClassification, IGradient } from '../materials/types';
/**
 * Generates a texture from a color.
 *
 * @param width - The width of the texture.
 * @param height - The height of the texture.
 * @param color - The color of the texture.
 * @returns The generated texture.
 */
export declare function generateDataTexture(width: number, height: number, color: Color): Texture;
/**
 * Generates a texture from a gradient.
 *
 * @param gradient - The gradient to generate the texture from.
 * @returns The generated texture.
 */
export declare function generateGradientTexture(gradient: IGradient): Texture;
export declare function generateClassificationTexture(classification: IClassification): Texture;
