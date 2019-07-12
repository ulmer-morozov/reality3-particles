import * as THREE from 'three';
import {GUI} from 'dat.gui';
import {PLYLoader} from 'three/examples/jsm/loaders/PLYLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer';


function saveSvg(svgEl: SVGElement, name: string) {
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = svgEl.outerHTML;
    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, svgData], {type: "image/svg+xml;charset=utf-8"});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

import {MyBokehShader, IBokehShaderUniforms} from './Bokeh';
import {BokehDepthShader} from './bokehDepthShader';

export interface Foo {
    executeDependency: Function;
}

interface ISettings {
    particleSize: number;
}

const nameof = (propertyFunction: (x: ISettings) => any): string => {
    return /\.([^\.;]+);?\s*\}$/.exec(propertyFunction.toString())[1];
}

export class MyLibrary implements Foo {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private svgRender: SVGRenderer;

    private renderToSVG = false;

    private controls: OrbitControls;

    private gui: GUI;

    private effectController: ISettings = {
        particleSize: 1.0
    };

    private pointsMaterial: THREE.PointsMaterial;

    executeDependency() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.y = 0;
        this.camera.position.z = 200;

        this.scene = new THREE.Scene();
        this.scene.add(this.camera);

        // this.scene.fog = new THREE.Fog(0xffffff, 0, 250);
        // this.scene.fog = new THREE.FogExp2(0xffffff, 0.02);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = true;
        this.renderer.setClearColor(0xffffff);

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


                const material = new THREE.PointsMaterial({color: 0x000000, size: 0.1, sizeAttenuation: true});
                const starField = new THREE.Points(geometry, material);

                this.scene.add(starField);

            } else {

                const textureUrl = require('./assets/black-point.png');
                const sprite = new THREE.TextureLoader().load(textureUrl);
                this.pointsMaterial = new THREE.PointsMaterial({
                    color: 0xff0000,
                    size: 0.5,
                    map: sprite,
                    alphaTest: 0.5,
                    transparent: true,
                    sizeAttenuation: true
                });
                const starField = new THREE.Points(geometry, this.pointsMaterial);


                this.scene.add(starField);
            }

            this.render(0);

        });

        // this.scene.add(new THREE.AxesHelper(5))

    }

    private matChanger = (): void => {

    };

    private initGui = (): void => {
        this.gui = new GUI({autoPlace: false});

        this.gui.add(this.effectController, nameof(x => x.particleSize), 0.01, 20).step(0.1).onChange(this.particlesUpdate);
        this.gui.close();

        window.onclick = () => {
            if (!this.renderToSVG)
                return;

            saveSvg(this.svgRender.domElement, 'file.svg');
            window.onclick = undefined;
        }
    }

    private particlesUpdate = (): void => {
        if (this.pointsMaterial === undefined)
            return;

        this.pointsMaterial.size = this.effectController.particleSize;
    };

    private render = (timestamp: number): void => {
        const time = timestamp * 0.00015;

        if (this.renderToSVG)
            this.svgRender.render(this.scene, this.camera);
        else
            this.renderer.render(this.scene, this.camera);

        this.controls.update();

    }

    animate = (time: number = 0) => {
        if (!this.renderToSVG)
            requestAnimationFrame(this.animate);
        this.render(time);
    }

    private onWindowResize = (): void => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

}
