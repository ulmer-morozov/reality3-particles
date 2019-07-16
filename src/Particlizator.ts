import { GUI } from 'dat.gui';
import { spriteCollection, SpritePreset } from "./spriteCollection";
import { nameof, saveImage } from "./utils";
import { ISettings } from "./ISettings";
import { Scene } from './three/scenes/Scene';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls';
import { WebGLRenderer } from './three/renderers/WebGLRenderer';
import { PerspectiveCamera } from './three/cameras/PerspectiveCamera';
import { PointsMaterial } from './three/materials/PointsMaterial';
import { BufferGeometry } from './three/core/BufferGeometry';
import { Points } from './three/objects/Points';
import { FogExp2 } from './three/scenes/FogExp2';
import { Vector2 } from './three/math/Vector2';
import { PLYLoader } from './three/examples/jsm/loaders/PLYLoader';
import { OBJLoader } from './three/examples/jsm/loaders/OBJLoader';
import { Group } from './three/objects/Group';
import { Mesh } from './three/objects/Mesh';

export class Particlizator {
    private readonly scene: Scene;
    private readonly controls: OrbitControls;
    private readonly renderer: WebGLRenderer;
    private readonly camera: PerspectiveCamera;

    private readonly gui: GUI;
    private readonly settings: ISettings = {
        particleSize: 0.5,
        sprite: 'point',
        fog: false,
        fogDensity: 0
    };

    private readonly presets: { [label: string]: SpritePreset };

    private animationId: number;
    private pointsMaterial: PointsMaterial;

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.presets = {};

        spriteCollection.forEach(sprite => this.presets[sprite.label] = new SpritePreset(sprite));

        this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.y = 0;
        this.camera.position.z = 200;

        this.scene = new Scene();
        this.scene.add(this.camera);

        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: canvas,
            preserveDrawingBuffer: true // для экспорта
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.autoClear = true;

        this.controls = new OrbitControls(this.camera, this.canvas);

        this.gui = new GUI({ autoPlace: true });

        this.initGui();

        window.addEventListener('resize', this.onWindowResize, false);
    }

    public loadModel = (url: string): void => {
        this.scene.children.forEach(child => this.scene.remove(child));

        const isPlyFile = url.toLowerCase().indexOf('.ply') >= 0;

        this.pointsMaterial = new PointsMaterial({
            alphaTest: 0.5,
            transparent: true,
            sizeAttenuation: true
        });

        if (isPlyFile) {
            const loader = new PLYLoader();

            loader.load(url, (geometry: BufferGeometry): void => {
                geometry.computeVertexNormals();
                geometry.scale(0.1, 0.1, 0.1);

                const starField = new Points(geometry, this.pointsMaterial);
                this.scene.add(starField);

                this.spriteUpdate(this.settings.sprite);
                this.particlesUpdate();
            });

            return;
        }

        const loader = new OBJLoader();

        loader.load(url, (group: Group): void => {
            for (let i = 0; i < group.children.length; i++) {
                const child = group.children[i];

                if (child.type !== 'Mesh')
                    continue;

                const geometry = (child as Mesh).geometry;

                geometry.computeVertexNormals();
                geometry.scale(10, 10, 10);

                const starField = new Points(geometry, this.pointsMaterial);
                this.scene.add(starField);
            }

            this.spriteUpdate(this.settings.sprite);
            this.particlesUpdate();


        });


    }

    private initGui = (): void => {
        this.gui.add(this.settings, nameof<ISettings>(x => x.particleSize), 0.01, 1)
            .step(0.01)
            .onChange(this.particlesUpdate);

        this.addPresetsToGui();

        this.gui.add(this.settings, nameof<ISettings>(x => x.fog))
            .onChange(this.fogUpdate);

        this.gui.add(this.settings, nameof<ISettings>(x => x.fogDensity), 0, 0.1)
            .step(0.001)
            .onChange(this.fogUpdate);

        this.gui.add(this, nameof<Particlizator>(x => x.storeImage));
    }

    private spriteUpdate = (spriteLabel: string): void => {
        if (this.pointsMaterial === undefined)
            return;

        const preset = this.presets[spriteLabel];

        this.pointsMaterial.map = preset.texture;
    }

    private particlesUpdate = (): void => {
        if (this.pointsMaterial === undefined)
            return;

        this.pointsMaterial.size = this.settings.particleSize;
    };

    private fogUpdate = (): void => {
        if (this.settings.fog === false && this.scene.fog === undefined)
            return;

        if (this.settings.fog === false) {
            this.scene.fog = undefined;
            return;
        }

        this.scene.fog = new FogExp2(0xffffff, this.settings.fogDensity);
    }

    private render = (timestamp: number): void => {
        const time = timestamp * 0.00015;
        this.renderer.render(this.scene, this.camera);
        this.controls.update();
    }

    animate = (time: number = 0) => {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = undefined;
        }

        this.animationId = requestAnimationFrame(this.animate);
        this.render(time);
    }

    private onWindowResize = (): void => {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    private addPresetsToGui() {
        const spriteLabels = spriteCollection.map(x => x.label);

        this.gui.add(this.settings, nameof<ISettings>(x => x.sprite), spriteLabels)
            .onChange(this.spriteUpdate);
    }

    private storeImage = (): void => {
        if (this.renderer === undefined)
            return;

        cancelAnimationFrame(this.animationId);

        const cameraAspect = this.camera.aspect;
        const size = new Vector2();

        this.renderer.getSize(size);
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(4094, 4096, true);

        this.camera.aspect = 1;
        this.camera.updateProjectionMatrix();

        this.render(0);

        saveImage(this.renderer.domElement, 'particle-poster').then
            (
                () => {
                    this.renderer.setPixelRatio(devicePixelRatio);
                    this.renderer.setSize(size.width, size.height, true);

                    this.camera.aspect = cameraAspect;
                    this.camera.updateProjectionMatrix();

                    this.animate();
                }
            );
    }
}
