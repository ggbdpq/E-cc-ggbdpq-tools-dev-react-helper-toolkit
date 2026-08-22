const X_PI = (3.14159265358979324 * 3000) / 180;
const PI = 3.1415926535897932384626;
const EARTH_RADIUS = 6378245;
const ECCENTRICITY = 0.00669342162296594323;

/** 按 `[经度, 纬度]` 排列的坐标元组 */
export type Coordinate = [number, number];

function transformLatitude(longitude: number, latitude: number): number {
    let result =
        -100 +
        2 * longitude +
        3 * latitude +
        0.2 * latitude * latitude +
        0.1 * longitude * latitude +
        0.2 * Math.sqrt(Math.abs(longitude));
    result += ((20 * Math.sin(6 * longitude * PI) + 20 * Math.sin(2 * longitude * PI)) * 2) / 3;
    result += ((20 * Math.sin(latitude * PI) + 40 * Math.sin((latitude / 3) * PI)) * 2) / 3;
    result += ((160 * Math.sin((latitude / 12) * PI) + 320 * Math.sin((latitude * PI) / 30)) * 2) / 3;
    return result;
}

function transformLongitude(longitude: number, latitude: number): number {
    let result =
        300 +
        longitude +
        2 * latitude +
        0.1 * longitude * longitude +
        0.1 * longitude * latitude +
        0.1 * Math.sqrt(Math.abs(longitude));
    result += ((20 * Math.sin(6 * longitude * PI) + 20 * Math.sin(2 * longitude * PI)) * 2) / 3;
    result += ((20 * Math.sin(longitude * PI) + 40 * Math.sin((longitude / 3) * PI)) * 2) / 3;
    result += ((150 * Math.sin((longitude / 12) * PI) + 300 * Math.sin((longitude / 30) * PI)) * 2) / 3;
    return result;
}

/** 将百度 BD-09 坐标转换为国测局 GCJ-02 坐标 */
export function bd09togcj02(longitude: number, latitude: number): Coordinate {
    const x = longitude - 0.0065;
    const y = latitude - 0.006;
    const radius = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
    return [radius * Math.cos(theta), radius * Math.sin(theta)];
}

/** 将国测局 GCJ-02 坐标转换为百度 BD-09 坐标 */
export function gcj02tobd09(longitude: number, latitude: number): Coordinate {
    const radius = Math.sqrt(longitude * longitude + latitude * latitude) + 0.00002 * Math.sin(latitude * X_PI);
    const theta = Math.atan2(latitude, longitude) + 0.000003 * Math.cos(longitude * X_PI);
    return [radius * Math.cos(theta) + 0.0065, radius * Math.sin(theta) + 0.006];
}

function getGcjOffset(longitude: number, latitude: number): Coordinate {
    let latitudeOffset = transformLatitude(longitude - 105, latitude - 35);
    let longitudeOffset = transformLongitude(longitude - 105, latitude - 35);
    const radialLatitude = (latitude / 180) * PI;
    let magic = Math.sin(radialLatitude);
    magic = 1 - ECCENTRICITY * magic * magic;
    const squareRoot = Math.sqrt(magic);
    latitudeOffset =
        (latitudeOffset * 180) / (((EARTH_RADIUS * (1 - ECCENTRICITY)) / (magic * squareRoot)) * PI);
    longitudeOffset = (longitudeOffset * 180) / ((EARTH_RADIUS / squareRoot) * Math.cos(radialLatitude) * PI);
    return [longitudeOffset, latitudeOffset];
}

/** 将 WGS-84 坐标转换为 GCJ-02；境外坐标原样返回 */
export function wgs84togcj02(longitude: number, latitude: number): Coordinate {
    if (out_of_china(longitude, latitude)) return [longitude, latitude];
    const [longitudeOffset, latitudeOffset] = getGcjOffset(longitude, latitude);
    return [longitude + longitudeOffset, latitude + latitudeOffset];
}

/** 使用偏移量近似地将 GCJ-02 坐标转换为 WGS-84；境外坐标原样返回 */
export function gcj02towgs84(longitude: number, latitude: number): Coordinate {
    if (out_of_china(longitude, latitude)) return [longitude, latitude];
    const [longitudeOffset, latitudeOffset] = getGcjOffset(longitude, latitude);
    return [longitude - longitudeOffset, latitude - latitudeOffset];
}

/** 判断坐标是否位于实现使用的中国大陆经纬度矩形范围之外 */
export function out_of_china(longitude: number, latitude: number): boolean {
    return !(longitude > 73.66 && longitude < 135.05 && latitude > 3.86 && latitude < 53.55);
}
