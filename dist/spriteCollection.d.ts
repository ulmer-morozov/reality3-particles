import { Texture as Three_Texture } from 'three';
interface ISprite {
    url: string;
    label: string;
}
export declare const spriteCollection: ISprite[];
export declare class SpritePreset {
    readonly label: string;
    readonly url: string;
    readonly texture: Three_Texture;
    constructor(sprite: ISprite);
}
export {};
