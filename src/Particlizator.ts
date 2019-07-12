import * as THREE from 'three';
import {GUI} from 'dat.gui';
import {PLYLoader} from 'three/examples/jsm/loaders/PLYLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {spriteCollection, SpritePreset} from "./spriteCollection";
import {nameof, saveImage} from "./utils";
import {ISettings} from "./ISettings";

export class Particlizator {
    private readonly scene: THREE.Scene;
    private readonly controls: OrbitControls;
    private readonly renderer: THREE.WebGLRenderer;
    private readonly camera: THREE.PerspectiveCamera;

    private readonly gui: GUI;
    private readonly settings: ISettings;
    private readonly presets: { [label: string]: SpritePreset };

    private animationId: number;
    private pointsMaterial: THREE.PointsMaterial;

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.presets = {};

        spriteCollection.forEach(sprite => this.presets[sprite.label] = new SpritePreset(sprite));

        this.settings = {
            particleSize: 0.5,
            sprite: 'point',
            fog: false,
            fogDensity: 0
        }

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.y = 0;
        this.camera.position.z = 200;

        this.scene = new THREE.Scene();
        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: canvas,
            preserveDrawingBuffer: true // для экспорта
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.autoClear = true;

        this.controls = new OrbitControls(this.camera, this.canvas);

        this.gui = new GUI({autoPlace: true});

        this.initGui();

        window.addEventListener('resize', this.onWindowResize, false);
    }

    public loadModel = (url: string): void => {
        this.scene.children.forEach(child => this.scene.remove(child));

        const loader = new PLYLoader();

        loader.load(url, (geometry: THREE.BufferGeometry) => {
            geometry.computeVertexNormals();
            geometry.scale(0.1, 0.1, 0.1);

            this.pointsMaterial = new THREE.PointsMaterial({
                alphaTest: 0.5,
                transparent: true,
                sizeAttenuation: true
            });

            const starField = new THREE.Points(geometry, this.pointsMaterial);
            this.scene.add(starField);

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

        this.scene.fog = new THREE.FogExp2(0xffffff, this.settings.fogDensity);
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
        const size = new THREE.Vector2();

        this.renderer.getSize(size);
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(4094, 4096, true);

        this.camera.aspect = 1;
        this.camera.updateProjectionMatrix();

        this.render(0);

        saveImage(this.renderer.domElement, 'particle-poster');

        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(size.width, size.height, true);

        this.camera.aspect = cameraAspect;
        this.camera.updateProjectionMatrix();

        this.animate();
    }
}