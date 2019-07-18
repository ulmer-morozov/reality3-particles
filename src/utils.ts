import { ISettings } from "./ISettings";

const downloadBlob = (blob: Blob, name: string): string => {
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = name;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    return downloadLink.href;
}

export const saveImage = (canvas: HTMLCanvasElement, name: string): Promise<void> => {
    const promise = new Promise<void>((resolve, reject) => {
        canvas.toBlob
            (
                blob => {
                    const blobUrl = downloadBlob(blob, name);
                    setTimeout(() => {
                        URL.revokeObjectURL(blobUrl);
                        resolve();
                    }, 100);
                },
                "image/png",
                1
            )
    });

    return promise;
}

export function nameof<T>(propertyFunction: (x: T) => any): string {
    const matches = /\.([^\.;]+);?\s*\}$/.exec(propertyFunction.toString());
    if (matches == null || matches.length < 2)
        throw new Error(`nameOf error ${propertyFunction}`);

    return matches[1];
}

export const settingsName = (func: (s: ISettings) => any): string => nameof<ISettings>(func);
