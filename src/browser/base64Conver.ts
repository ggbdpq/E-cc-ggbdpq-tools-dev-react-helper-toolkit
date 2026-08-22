/** 图片灰度转换的通道权重和缩放配置 */
export interface GrayImageOptions {
    /** 红色通道权重，默认 `0.3` */
    red?: number;
    /** 绿色通道权重，默认 `0.59` */
    green?: number;
    /** 蓝色通道权重，默认 `0.11` */
    blue?: number;
    /** 输出 Canvas 相对原图的缩放倍率，默认 `1` */
    scale?: number;
}

/**
 * 将 Base64 data URL 解码为 Blob。
 *
 * @throws {TypeError} 输入不包含 MIME 元数据或 Base64 数据时抛出
 * @throws 当前运行环境没有 `atob`，或 Base64 内容无法解码时抛出
 */
export function dataURLtoBlob(dataUrl: string): Blob {
    const [metadata, encoded] = dataUrl.split(",");
    const mime = metadata.match(/:(.*?);/)?.[1];
    if (!mime || encoded === undefined) throw new TypeError("Invalid data URL");
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mime });
}

/**
 * 通过浏览器 Image 和 Canvas 将图片地址转换为 data URL。
 *
 * 非浏览器环境、图片加载失败或 Canvas 不可用时返回拒绝的 Promise。
 */
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

/**
 * 将图片按通道权重转换为灰度 PNG data URL。
 *
 * 跨域图片需要服务端允许 CORS，否则读取像素时 Promise 会被拒绝。
 */
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
