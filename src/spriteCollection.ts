import {
    Texture as Three_Texture,
    TextureLoader as Three_TextureLoader,
    PointsMaterial as Three_PointsMaterial
} from 'three';

interface ISprite {
    url: string;
    label: string;
}

export const spriteCollection: ISprite[] = [
    {url: require('./assets/sprites/black-point.png'), label: 'point'},
    {url: require('./assets/sprites/arrow_spt.png'), label: 'arrow'},
    {url: require('./assets/sprites/c_spt.png'), label: 'copyright'},
    {url: require('./assets/sprites/Friday_spt.png'), label: 'lines'},
    {url: require('./assets/sprites/lift_spt.png'), label: 'lift'},
    {url: require('./assets/sprites/love_spt.png'), label: 'love'},
    {url: require('./assets/sprites/stripes_spt.png'), label: 'stripes'},
    {url: require('./assets/sprites/X_spt.png'), label: 'cross'}
];

export class SpritePreset {
    public readonly label: string;
    public readonly url: string;
    public readonly texture: Three_Texture;

    constructor(sprite: ISprite) {
        this.url = sprite.url;
        this.label = sprite.label;

        const loader = new Three_TextureLoader();

        this.texture = loader.load(this.url);
    }
}