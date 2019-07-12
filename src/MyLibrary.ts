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
    enabled: boolean;
    jsDepthCalculation: boolean;
    shaderFocus: boolean;
    fstop: number;
    maxblur: number;
    showFocus: boolean;
    focalDepth: number;
    manualdof: boolean;
    vignetting: boolean;
    depthblur: boolean;
    threshold: number;
    gain: number;
    bias: number;
    fringe: number;
    focalLength: number;
    noise: boolean;
    pentagon: boolean;
    dithering: number;

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

    private cameraTarget: THREE.Vector3;

    private gui: GUI;

    private effectController: ISettings = {
        enabled: false,
        jsDepthCalculation: false,
        shaderFocus: false,
        fstop: 2.2,
        maxblur: 1.0,
        showFocus: false,
        focalDepth: 2.8,
        manualdof: false,
        vignetting: false,
        depthblur: false,
        threshold: 0.5,
        gain: 0.0,
        bias: 0.0,
        fringe: 0.0,
        focalLength: 35,
        noise: true,
        pentagon: false,
        dithering: 0.0001,

        particleSize: 1.0
    };


    private windowHalfX = window.innerWidth / 2;
    private windowHalfY = window.innerHeight / 2;
    private shaderSettings = {
        rings: 3,
        samples: 4
    };

    private mouse = new THREE.Vector2();
    private raycaster = new THREE.Raycaster();
    private distance = 100;
    private target = new THREE.Vector3(0, 20, -50);
    private planes: THREE.Mesh[] = [];
    private leaves = 100;

    private materialDepth: THREE.ShaderMaterial;

    private postprocessingscene: THREE.Scene;
    private postprocessingcamera: THREE.OrthographicCamera;

    private postprocessingrtTextureDepth: THREE.WebGLRenderTarget;
    private postprocessingrtTextureColor: THREE.WebGLRenderTarget;

    private postprocessingbokeh_uniforms: IBokehShaderUniforms;
    private postprocessingmaterialBokeh: THREE.ShaderMaterial;

    private postprocessingenabled = false;
    private postprocessingquad: THREE.Mesh;


    private starsMaterial: THREE.PointsMaterial;


    executeDependency() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.y = 0;
        this.camera.position.z = 200;

        this.scene = new THREE.Scene();
        this.scene.add(this.camera);

        // this.scene.fog = new THREE.Fog(0xffffff, 0, 250);
        this.scene.fog = new THREE.FogExp2(0xffffff, 0.02);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = true;
        this.renderer.setClearColor(0xffffff);

        this.svgRender = new SVGRenderer();
        this.svgRender.setSize(window.innerWidth, window.innerHeight);
        this.svgRender.autoClear = true;
        this.svgRender.setClearColor(new THREE.Color(0xffffff), 0);

        if (this.renderToSVG)
            document.body.appendChild(this.svgRender.domElement);
        else
            document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera);

        const depthShader = BokehDepthShader;

        this.materialDepth = new THREE.ShaderMaterial({
            uniforms: depthShader.uniforms,
            vertexShader: depthShader.vertexShader,
            fragmentShader: depthShader.fragmentShader
        });

        this.materialDepth.uniforms['mNear'].value = this.camera.near;
        this.materialDepth.uniforms['mFar'].value = this.camera.far;

        // skybox
        const urls = [
            'https://threejs.org/examples/textures/cube/Bridge2/posx.jpg',
            'https://threejs.org/examples/textures/cube/Bridge2/negx.jpg',
            'https://threejs.org/examples/textures/cube/Bridge2/posy.jpg',
            'https://threejs.org/examples/textures/cube/Bridge2/negy.jpg',
            'https://threejs.org/examples/textures/cube/Bridge2/posz.jpg',
            'https://threejs.org/examples/textures/cube/Bridge2/negz.jpg'
        ];

        const textureCube = new THREE.CubeTextureLoader().load(urls);
        textureCube.format = THREE.RGBFormat;

        const shader = THREE.ShaderLib['cube'];
        shader.uniforms['tCube'].value = textureCube;

        const skyMaterial = new THREE.ShaderMaterial({
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: shader.uniforms,
            depthWrite: false,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(new THREE.BoxBufferGeometry(1000, 1000, 1000), skyMaterial);

        // this.scene.add(sky);

        // plane particles
        const planePiece = new THREE.PlaneBufferGeometry(10, 10, 1, 1);
        const planeMat = new THREE.MeshPhongMaterial({
            color: 0xffffff * 0.4,
            shininess: 0.5,
            specular: 0xffffff,
            envMap: textureCube,
            side: THREE.DoubleSide
        });
        const rand = Math.random;

        for (let i = 0; i < this.leaves; i++) {
            const plane: any = new THREE.Mesh(planePiece, planeMat);
            plane.rotation.set(rand(), rand(), rand());
            plane.rotation.dx = rand() * 0.1;
            plane.rotation.dy = rand() * 0.1;
            plane.rotation.dz = rand() * 0.1;
            plane.position.set(rand() * 150, 0 + rand() * 300, rand() * 150);
            plane.position.dx = (rand() - 0.5);
            plane.position.dz = (rand() - 0.5);
            // this.scene.add(plane);
            this.planes.push(plane);
        }

        // adding Monkeys
        const loader2 = new THREE.BufferGeometryLoader();

        loader2.load('https://threejs.org/examples/models/json/suzanne_buffergeometry.json', (monkeyGeometry) => {

            monkeyGeometry = new THREE.SphereBufferGeometry(1, 20, 20);
            monkeyGeometry.computeVertexNormals();


            const material = new THREE.MeshBasicMaterial({color: 0x333333});

            const monkeys = 20;

            for (let i = 0; i < monkeys; i++) {
                const mesh = new THREE.Mesh(monkeyGeometry, material);
                mesh.position.z = Math.cos(i / monkeys * Math.PI * 2) * 200;
                mesh.position.y = Math.sin(i / monkeys * Math.PI * 3) * 20;
                mesh.position.x = Math.sin(i / monkeys * Math.PI * 2) * 200;
                mesh.rotation.y = i / monkeys * Math.PI * 2;
                mesh.scale.setScalar(30);
                // this.scene.add(mesh);
            }
        });

        const megaBallGeometry = new THREE.SphereBufferGeometry(300, 20, 20);
        const megaBallMaterial = new THREE.MeshBasicMaterial({color: 0x333333, side: THREE.DoubleSide});
        const megaBallMesh = new THREE.Mesh(megaBallGeometry, megaBallMaterial);

        megaBallMesh.position.z = -500;

        // this.scene.add(megaBallMesh);


        // add balls
        const geometry = new THREE.SphereBufferGeometry(1, 20, 20);

        for (let i = 0; i < 20; i++) {
            const ballmaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff * Math.random(),
                shininess: 0.5,
                specular: 0xffffff,
                envMap: textureCube
            });

            const mesh = new THREE.Mesh(geometry, ballmaterial);
            mesh.position.x = (Math.random() - 0.5) * 200;
            mesh.position.y = Math.random() * 50;
            mesh.position.z = (Math.random() - 0.5) * 200;
            mesh.scale.multiplyScalar(10);
            // this.scene.add(mesh);
        }
        // lights
        // this.scene.add(new THREE.AmbientLight(0x222222));
        let directionalLight = new THREE.DirectionalLight(0xffffff, 2);

        directionalLight.position.set(2, 1.2, 10).normalize();
        this.scene.add(directionalLight);

        directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-2, 1.2, -10).normalize();
        this.scene.add(directionalLight);

        this.initPostProcessing();


        this.initGui();
        this.matChanger();

        document.addEventListener('mousemove', this.onDocumentMouseMove, false);
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
                this.starsMaterial = new THREE.PointsMaterial({
                    color: 0xff0000,
                    size: 0.5,
                    map: sprite,
                    alphaTest: 0.5,
                    transparent: true,
                    sizeAttenuation: true
                });
                const starField = new THREE.Points(geometry, this.starsMaterial);


                this.scene.add(starField);
            }

            this.render(0);

        });

        // this.scene.add(new THREE.AxesHelper(5))

    }

    private matChanger = (): void => {
        for (let e in this.effectController) {
            if (e in this.postprocessingbokeh_uniforms) {
                this.postprocessingbokeh_uniforms[e].value = this.effectController[e];
            }
        }
        this.postprocessingenabled = this.effectController.enabled;
        this.postprocessingbokeh_uniforms['znear'].value = this.camera.near;
        this.postprocessingbokeh_uniforms['zfar'].value = this.camera.far;
        this.camera.setFocalLength(this.effectController.focalLength);


        window.onclick = () => {
            if (!this.renderToSVG)
                return;

            saveSvg(this.svgRender.domElement, 'file.svg');
            window.onclick = undefined;
        }
    };

    private initGui = (): void => {
        const matChanger = this.matChanger;
        this.gui = new GUI({autoPlace: false});

        this.gui.add(this.effectController, 'enabled').onChange(matChanger);
        this.gui.add(this.effectController, 'jsDepthCalculation').onChange(matChanger);
        this.gui.add(this.effectController, 'shaderFocus').onChange(matChanger);
        this.gui.add(this.effectController, 'focalDepth', 0.0, 100.0).listen().onChange(matChanger);
        this.gui.add(this.effectController, 'fstop', 0.1, 100, 0.001).onChange(matChanger);
        this.gui.add(this.effectController, 'maxblur', 0.0, 5.0, 0.025).onChange(matChanger);
        this.gui.add(this.effectController, 'showFocus').onChange(matChanger);
        this.gui.add(this.effectController, 'manualdof').onChange(matChanger);
        this.gui.add(this.effectController, 'vignetting').onChange(matChanger);
        this.gui.add(this.effectController, 'depthblur').onChange(matChanger);
        this.gui.add(this.effectController, 'threshold', 0, 1, 0.001).onChange(matChanger);
        this.gui.add(this.effectController, 'gain', 0, 100, 0.001).onChange(matChanger);
        this.gui.add(this.effectController, 'bias', 0, 3, 0.001).onChange(matChanger);
        this.gui.add(this.effectController, 'fringe', 0, 5, 0.001).onChange(matChanger);
        this.gui.add(this.effectController, 'focalLength', 16, 80, 0.001).onChange(matChanger);
        this.gui.add(this.effectController, 'noise').onChange(matChanger);
        this.gui.add(this.effectController, 'dithering', 0, 0.001, 0.0001).onChange(matChanger);
        this.gui.add(this.effectController, 'pentagon').onChange(matChanger);

        this.gui.add(this.effectController, nameof(x => x.particleSize), 0.01, 20).step(0.1).onChange(this.particlesUpdate);


        this.gui.add(this.shaderSettings, 'rings', 1, 8).step(1).onChange(this.shaderUpdate);
        this.gui.add(this.shaderSettings, 'samples', 1, 13).step(1).onChange(this.shaderUpdate);
    }

    private initPostProcessing = (): void => {
        this.postprocessingscene = new THREE.Scene();

        this.postprocessingcamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);
        this.postprocessingcamera.position.z = 100;

        this.postprocessingscene.add(this.postprocessingcamera);

        const pars = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBFormat
        };

        this.postprocessingrtTextureDepth = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, pars);
        this.postprocessingrtTextureColor = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, pars);


        this.postprocessingbokeh_uniforms = MyBokehShader.createUniforms();
        this.postprocessingbokeh_uniforms['tColor'].value = this.postprocessingrtTextureColor.texture;
        this.postprocessingbokeh_uniforms['tDepth'].value = this.postprocessingrtTextureDepth.texture;
        this.postprocessingbokeh_uniforms['textureWidth'].value = window.innerWidth;
        this.postprocessingbokeh_uniforms['textureHeight'].value = window.innerHeight;

        this.postprocessingmaterialBokeh = new THREE.ShaderMaterial({
            uniforms: this.postprocessingbokeh_uniforms,
            vertexShader: MyBokehShader.vertexShader,
            fragmentShader: MyBokehShader.fragmentShader,
            defines: {
                RINGS: this.shaderSettings.rings,
                SAMPLES: this.shaderSettings.samples
            }
        });

        this.postprocessingquad = new THREE.Mesh(new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight), this.postprocessingmaterialBokeh);
        this.postprocessingquad.position.z = -500;
        this.postprocessingscene.add(this.postprocessingquad);
    }

    private particlesUpdate = (): void => {
        if (this.starsMaterial === undefined)
            return;

        this.starsMaterial.size = this.effectController.particleSize;

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


        // stats.update();
    }


    private shaderUpdate = (): void => {
        this.postprocessingmaterialBokeh.defines.RINGS = this.shaderSettings.rings;
        this.postprocessingmaterialBokeh.defines.SAMPLES = this.shaderSettings.samples;
        this.postprocessingmaterialBokeh.needsUpdate = true;
    }

    private linearize = (depth: number): number => {
        const zfar = this.camera.far;
        const znear = this.camera.near;
        return -zfar * znear / (depth * (zfar - znear) - zfar);
    }
    private smoothstep = (near: number, far: number, depth: number): number => {
        const x = this.saturate((depth - near) / (far - near));
        return x * x * (3 - 2 * x);
    }

    private saturate = (x: number): number => {
        return Math.max(0, Math.min(1, x));
    }

    private onWindowResize = (): void => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        this.postprocessingrtTextureDepth.setSize(window.innerWidth, window.innerHeight);
        this.postprocessingrtTextureColor.setSize(window.innerWidth, window.innerHeight);
        this.postprocessingbokeh_uniforms['textureWidth'].value = window.innerWidth;
        this.postprocessingbokeh_uniforms['textureHeight'].value = window.innerHeight;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    private onDocumentMouseMove = (event: MouseEvent): void => {
        this.mouse.x = (event.clientX - this.windowHalfX) / this.windowHalfX;
        this.mouse.y = -(event.clientY - this.windowHalfY) / this.windowHalfY;
        this.postprocessingbokeh_uniforms['focusCoords'].value.set(event.clientX / window.innerWidth, 1 - (event.clientY / window.innerHeight));
    }

}

export default MyLibrary;
