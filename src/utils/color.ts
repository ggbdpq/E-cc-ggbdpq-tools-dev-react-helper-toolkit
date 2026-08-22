export type ColorType = "rgb" | "hex" | "hsl";

export interface ColorOptions {
    type?: ColorType;
    num?: number;
}

export interface GradientOptions {
    baseHue?: number;
    hueOffset?: number;
    saturation?: number;
    lightness?: number;
    angle?: number;
    randomizeHue?: boolean;
    randomizeSaturation?: boolean;
    randomizeLightness?: boolean;
    randomizeAngle?: boolean;
}

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

export function hexToRgb(value: string): RgbColor {
    const matches = value.replace("#", "").match(/../g);
    if (!matches || matches.length < 3) throw new TypeError("Invalid hex color");
    return [Number.parseInt(matches[0], 16), Number.parseInt(matches[1], 16), Number.parseInt(matches[2], 16)];
}

export function rgbToHex(red: number, green: number, blue: number): string {
    const components = [red, green, blue].map((value) => value.toString(16).padStart(2, "0"));
    return `#${components.join("")}`;
}

export function darken(color: string, level: number): string {
    const [red, green, blue] = hexToRgb(color);
    return rgbToHex(Math.floor(red * (1 - level)), Math.floor(green * (1 - level)), Math.floor(blue * (1 - level)));
}

export function lighten(color: string, level: number): string {
    const [red, green, blue] = hexToRgb(color);
    return rgbToHex(
        Math.floor((255 - red) * level + red),
        Math.floor((255 - green) * level + green),
        Math.floor((255 - blue) * level + blue),
    );
}
