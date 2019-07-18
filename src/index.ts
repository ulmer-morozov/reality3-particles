import {Particlizator, SourceFormat} from './Particlizator';

console.log('See this in your browser console: Typescript Webpack Starter Launched');

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const myLibrary = new Particlizator(canvas);

myLibrary.animate(0);
myLibrary.loadModel(require('./assets/pointcloud.ply'), SourceFormat.PLY);

const _window = window as any;

const geSourceFileType = (filename: string): SourceFormat => {
    filename = filename !== undefined ? filename.toLowerCase() : '';

    const isTypeOf = (extension: string): boolean => filename.indexOf(extension) >= 0;

    if (isTypeOf('.ply'))
        return SourceFormat.PLY;

    if (isTypeOf('.obj'))
        return SourceFormat.OBJ;

    if (isTypeOf('.gltf') || isTypeOf('.glb'))
        return SourceFormat.GLTF;

    if (isTypeOf('.fbx'))
        return SourceFormat.FBX;

    return SourceFormat.NotSet;
}

_window.dropHandler = (event: DragEvent): void => {
    event.preventDefault();
    canvas.classList.remove('drag-active');

    const file = event.dataTransfer.files[0];

    const fileType = geSourceFileType(file.name);

    if (fileType === SourceFormat.NotSet) {
        alert("Allowed only .ply .obj .fbx .gltf or .glb files")
        return;
    }

    const fileUrl = URL.createObjectURL(file);
    myLibrary.loadModel(fileUrl, fileType);

    console.log('URL ' + fileUrl);
}

_window.addEventListener("dragover", (e: DragEvent) => e.preventDefault(), false);

_window.dragEnterHandler = (event: DragEvent): void => {
    canvas.classList.add('drag-active');

    console.log(event.dataTransfer.items[0])
}

_window.dragLeaveHandler = (event: DragEvent): void => {
    canvas.classList.remove('drag-active');

    console.log(event.dataTransfer.items[0])
}

window.onbeforeunload = () => {
    return "Scene will be cleared. Are you sure?";
};
