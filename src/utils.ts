import {ISettings} from "./ISettings";

const downloadBlob = (blob: Blob, name: string): void => {
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = name;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

export const saveSvg = (svgEl: SVGElement, name: string): void => {
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = svgEl.outerHTML;
    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, svgData], {type: "image/svg+xml;charset=utf-8"});
    downloadBlob(svgBlob, `${name}.svg`);
};

export const saveImage = (canvas: HTMLCanvasElement, name: string): void => {
    canvas.toBlob(blob => {
        downloadBlob(blob, name);
    }, "image/png", 1)
}

export function nameof<T>(propertyFunction: (x: T) => any): string {
    return /\.([^\.;]+);?\s*\}$/.exec(propertyFunction.toString())[1];
}

export const settingsName = (func: (s: ISettings) => any): string => nameof<ISettings>(func);
