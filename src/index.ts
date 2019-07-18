import {Particlizator, SourceFormat} from './Particlizator';

console.log('See this in your browser console: Typescript Webpack Starter Launched');

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const myLibrary = new Particlizator(canvas);
myLibrary.animate(0);
myLibrary.loadModel(require('./assets/pointcloud.ply'), SourceFormat.PLY);

const _window = window as any;

_window.dropHandler = (event: DragEvent): void => {
    event.preventDefault();
    canvas.classList.remove('drag-active');

    const file = event.dataTransfer.files[0];

    const fileName = file.name.toLowerCase();

    const isPly = fileName.indexOf('.ply') >= 0;
    const isObj = fileName.indexOf('.obj') >= 0;

    if (!isPly && !isObj) {
        alert("Allowed only .ply or .obj files")
        return;
    }

    const fileUrl = URL.createObjectURL(file);

    if (isPly)
        myLibrary.loadModel(fileUrl, SourceFormat.PLY);
    else if (isObj)
        myLibrary.loadModel(fileUrl, SourceFormat.OBJ);
    else
        console.error(`cant load url ${fileName}. wrong type`);

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
