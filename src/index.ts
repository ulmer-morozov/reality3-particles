import { Particlizator } from './Particlizator';

console.log('See this in your browser console: Typescript Webpack Starter Launched');

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const myLibrary = new Particlizator(canvas);
myLibrary.animate(0);
myLibrary.loadModel(require('./assets/pointcloud.ply'));

const _window = window as any;

_window.dropHandler = (event: DragEvent): void => {
    event.preventDefault();
    canvas.classList.remove('drag-active');

    const file = event.dataTransfer.files[0];

    if (file.name.toLowerCase().indexOf('.ply') < 0) {
        alert("Allowed only .ply files")
        return;
    }

    const fileUrl = URL.createObjectURL(file);

    myLibrary.loadModel(fileUrl);
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
