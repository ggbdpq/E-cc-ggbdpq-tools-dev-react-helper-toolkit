import { centsToDollars, priceToThousands, type AmountOptions } from "../utils/amount";
import { randomColor, type ColorOptions } from "../utils/color";
import { bd09togcj02, type Coordinate } from "../utils/coordtransform";
import { debounce, delay, throttle } from "../utils/debounce";
import { isArray, isObject, isString } from "../utils/is";
import { average, formatBytes } from "../utils/math";

type Equal<TLeft, TRight> =
    (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2
        ? true
        : false;
type Expect<T extends true> = T;

type DelayResult = Expect<Equal<ReturnType<typeof delay>, Promise<void>>>;
type CoordinateResult = Expect<Equal<ReturnType<typeof bd09togcj02>, Coordinate>>;
type AverageResult = Expect<Equal<ReturnType<typeof average>, number>>;
type BytesResult = Expect<Equal<ReturnType<typeof formatBytes>, string>>;

const amountOptions = { digit: 2, round: true } satisfies AmountOptions;
const colorOptions = { type: "hex", num: 2 } satisfies ColorOptions;
centsToDollars(100);
priceToThousands(100, amountOptions);
randomColor(colorOptions);

const values: unknown = [1, 2];
if (isArray(values)) values.push(3);
const value: unknown = "text";
if (isString(value)) value.toUpperCase();
const record: unknown = { id: 1 };
if (isObject(record)) record.id;

const debounced = debounce((value: number) => value * 2);
debounced(1);
const throttled = throttle((value: string) => value.length);
throttled("x");

// @ts-expect-error amount options digit 必须是 number。
priceToThousands(100, { digit: "2" });
// @ts-expect-error Coordinate 只包含两个数字。
const invalidCoordinate: Coordinate = [1, 2, 3];

export type FoundationUtilsTypeTests = DelayResult | CoordinateResult | AverageResult | BytesResult;
