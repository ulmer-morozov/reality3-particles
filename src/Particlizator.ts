import * as THREE from 'three';
import {GUI} from 'dat.gui';
import {PLYLoader} from 'three/examples/jsm/loaders/PLYLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer';
import {spriteCollection, SpritePreset} from "./spriteCollection";
import {nameof, saveImage, saveSvg, settingsName} from "./utils";
import {ISettings} from "./ISettings";

export class Particlizator {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private svgRender: SVGRenderer;

    private animationId: number;

    private renderToSVG = false;

    private controls: OrbitControls;

    private gui: GUI;

    private presets: { [label: string]: SpritePreset };

    private settings: ISettings;

    private pointsMaterial: THREE.PointsMaterial;

    executeDependency() {
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
            preserveDrawingBuffer: true // для экспорта
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = true;
        // this.renderer.setClearColor(new THREE.Color(0xffffff));
        // this.renderer.setClearAlpha(0);


        this.svgRender = new SVGRenderer();
        this.svgRender.setSize(window.innerWidth, window.innerHeight);
        this.svgRender.autoClear = true;
        this.svgRender.setClearColor(new THREE.Color(0xffffff), 0);

        const renderElement = this.renderToSVG
            ? this.svgRender.domElement
            : this.renderer.domElement;

        document.body.appendChild(renderElement);

        this.controls = new OrbitControls(this.camera, renderElement as any);

        this.initGui();
        this.matChanger();

        window.addEventListener('resize', this.onWindowResize, false);


        // PLY file
        const loader = new PLYLoader();

        loader.load(require('./assets/pointcloud2.ply'), (geometry: THREE.BufferGeometry) => {
            geometry.computeVertexNormals();

            geometry.scale(0.1, 0.1, 0.1);


            if (this.renderToSVG) {
                const cube = new THREE.BoxBufferGeometry(20, 20, 20);
                const mesh = new THREE.Mesh(cube, new THREE.MeshBasicMaterial({
                    vertexColors: THREE.VertexColors,
                    color: 0x0000ff
                }));
                // mesh.position.x = 500;
                mesh.rotation.x = Math.random();
                mesh.rotation.y = Math.random();
                // this.scene.add(mesh);


                this.pointsMaterial = new THREE.PointsMaterial({color: 0x000000, size: 0.1, sizeAttenuation: true});
                const starField = new THREE.Points(geometry, this.pointsMaterial);

                this.scene.add(starField);

            } else {

                const textureUrl = require('./assets/sprites/black-point.png');
                const sprite = new THREE.TextureLoader().load(textureUrl);
                this.pointsMaterial = new THREE.PointsMaterial({
                    color: 0xff0000,
                    size: this.settings.particleSize,
                    map: sprite,
                    alphaTest: 0.5,
                    transparent: true,
                    sizeAttenuation: true
                });
                const starField = new THREE.Points(geometry, this.pointsMaterial);


                this.scene.add(starField);
            }

            this.spriteUpdate(this.settings.sprite);
            this.particlesUpdate();
        });

        // this.scene.add(new THREE.AxesHelper(5))

    }

    private matChanger = (): void => {

    };

    private initGui = (): void => {
        this.gui = new GUI({autoPlace: true});

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

        window.onclick = () => {
            if (!this.renderToSVG)
                return;

            saveSvg(this.svgRender.domElement, 'file.svg');
            window.onclick = undefined;
        }
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

        if (this.renderToSVG)
            this.svgRender.render(this.scene, this.camera);
        else
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
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
