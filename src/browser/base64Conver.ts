export interface GrayImageOptions {
    red?: number;
    green?: number;
    blue?: number;
    scale?: number;
}

export function dataURLtoBlob(dataUrl: string): Blob {
    const [metadata, encoded] = dataUrl.split(",");
    const mime = metadata.match(/:(.*?);/)?.[1];
    if (!mime || encoded === undefined) throw new TypeError("Invalid data URL");
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mime });
}

export function urlToBase64(url: string, mimeType = "image/png", encoderOptions?: number): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof document === "undefined") {
            reject(new Error("Browser environment required"));
            return;
        }
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const image = new Image();
        image.crossOrigin = "";
        image.onload = () => {
            if (!context) {
                reject(new Error("Canvas context unavailable"));
                return;
            }
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);
            resolve(canvas.toDataURL(mimeType, encoderOptions));
        };
        image.onerror = () => reject(new Error("Image load failed"));
        image.src = url;
    });
}

export function convertImageToGray(url: string, options: GrayImageOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof document === "undefined") {
            reject(new Error("Browser environment required"));
            return;
        }
        const { red = 0.3, green = 0.59, blue = 0.11, scale = 1 } = options;
        const image = new Image();
        if (new URL(url, window.location.href).origin !== window.location.origin) {
            image.crossOrigin = "anonymous";
            image.referrerPolicy = "no-referrer";
        }
        image.onload = () => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) {
                reject(new Error("Canvas context unavailable"));
                return;
            }
            canvas.width = image.width * scale;
            canvas.height = image.height * scale;
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                for (let index = 0; index < imageData.data.length; index += 4) {
                    const grayscale =
                        imageData.data[index] * red + imageData.data[index + 1] * green + imageData.data[index + 2] * blue;
                    imageData.data[index] = imageData.data[index + 1] = imageData.data[index + 2] = grayscale;
                }
                context.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL());
            } catch (error) {
                reject(error);
            }
        };
        image.onerror = () => reject(new Error("图片加载失败"));
        image.src = url;
    });
}
