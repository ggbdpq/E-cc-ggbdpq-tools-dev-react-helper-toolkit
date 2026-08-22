/** 随机颜色的输出格式 */
export type ColorType = "rgb" | "hex" | "hsl";

/** `randomColor` 的生成配置 */
export interface ColorOptions {
    /** 颜色格式，默认 `rgb` */
    type?: ColorType;
    /** 生成数量；`0` 返回单个颜色，大于 `0` 返回颜色数组，默认 `0` */
    num?: number;
}

/** HSL 线性渐变的生成配置 */
export interface GradientOptions {
    /** 基础色相，范围通常为 `0` 到 `360`；默认随机 */
    baseHue?: number;
    /** 第二个色标相对基础色相的偏移量，默认 `30` */
    hueOffset?: number;
    /** 饱和度百分比，默认 `70` */
    saturation?: number;
    /** 亮度百分比，默认 `60` */
    lightness?: number;
    /** 渐变角度，单位为度，默认 `135` */
    angle?: number;
    /** 是否忽略 `baseHue` 并随机色相 */
    randomizeHue?: boolean;
    /** 是否忽略 `saturation` 并在 `50` 到 `100` 间随机 */
    randomizeSaturation?: boolean;
    /** 是否忽略 `lightness` 并在 `40` 到 `70` 间随机 */
    randomizeLightness?: boolean;
    /** 是否忽略 `angle` 并随机渐变角度 */
    randomizeAngle?: boolean;
}

/** RGB 三个通道组成的元组 */
export type RgbColor = [number, number, number];

function createRandomColor(type: ColorType): string | undefined {
    switch (type) {
        case "rgb":
            if (typeof document === "undefined") return undefined;
            return window.crypto.getRandomValues(new Uint8Array(3)).toString();
        case "hex":
            return `#${Math.floor(Math.random() * 0xffffff)
                .toString(16)
                .padStart(6, `${Math.random() * 10}`)}`;
        case "hsl":
            return [360 * Math.random(), `${100 * Math.random()}%`, `${100 * Math.random()}%`].toString();
    }
}

/**
 * 生成一个或多个随机颜色。
 *
 * `rgb` 使用浏览器 `crypto`，非浏览器环境返回 `undefined`；颜色文本不包含 `rgb(...)` 外壳。
 */
export function randomColor(options: ColorOptions = {}): string | string[] | undefined {
    const type = options.type ?? "rgb";
    const count = options.num ?? 0;
    if (count === 0) return createRandomColor(type);

    const colors: string[] = [];
    for (let index = 0; index < count; index++) {
        const color = createRandomColor(type);
        if (color === undefined) return undefined;
        colors.push(color);
    }
    return colors;
}

function getRandomInRange(minimum: number, maximum: number): number {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function generateHsl(hue: number, saturation: number, lightness: number): string {
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/** 生成包含三个 HSL 色标的 CSS `linear-gradient` 字符串 */
export function randomGradient(options: GradientOptions = {}): string {
    const {
        baseHue = getRandomInRange(0, 360),
        hueOffset = 30,
        saturation = 70,
        lightness = 60,
        angle = 135,
        randomizeHue = false,
        randomizeSaturation = false,
        randomizeLightness = false,
        randomizeAngle = false,
    } = options;
    const finalHue = randomizeHue ? getRandomInRange(0, 360) : baseHue;
    const finalSaturation = randomizeSaturation ? getRandomInRange(50, 100) : saturation;
    const finalLightness = randomizeLightness ? getRandomInRange(40, 70) : lightness;
    const finalAngle = randomizeAngle ? getRandomInRange(0, 360) : angle;
    return `linear-gradient(${finalAngle}deg, ${generateHsl(finalHue, finalSaturation, finalLightness)}, ${generateHsl(
        (finalHue + hueOffset) % 360,
        finalSaturation,
        finalLightness,
    )}, ${generateHsl((finalHue + 180) % 360, finalSaturation, finalLightness)})`;
}

/**
 * 将六位十六进制颜色转换为 RGB 元组。
 *
 * @throws {TypeError} 输入无法拆分为三个十六进制通道时抛出
 */
export function hexToRgb(value: string): RgbColor {
    const matches = value.replace("#", "").match(/../g);
    if (!matches || matches.length < 3) throw new TypeError("Invalid hex color");
    return [Number.parseInt(matches[0], 16), Number.parseInt(matches[1], 16), Number.parseInt(matches[2], 16)];
}

/** 将三个颜色通道拼接为十六进制颜色；调用方负责保证通道位于 `0` 到 `255` */
export function rgbToHex(red: number, green: number, blue: number): string {
    const components = [red, green, blue].map((value) => value.toString(16).padStart(2, "0"));
    return `#${components.join("")}`;
}

/** 按 `level` 比例降低十六进制颜色亮度；通常传入 `0` 到 `1` */
export function darken(color: string, level: number): string {
    const [red, green, blue] = hexToRgb(color);
    return rgbToHex(Math.floor(red * (1 - level)), Math.floor(green * (1 - level)), Math.floor(blue * (1 - level)));
}

/** 按 `level` 比例将十六进制颜色向白色混合；通常传入 `0` 到 `1` */
export function lighten(color: string, level: number): string {
    const [red, green, blue] = hexToRgb(color);
    return rgbToHex(
        Math.floor((255 - red) * level + red),
        Math.floor((255 - green) * level + green),
        Math.floor((255 - blue) * level + blue),
    );
}
