import {
    createYear,
    dateFormat,
    getCurrentDate,
    getCurrentWeek,
    getTime,
    monthDays,
    type CurrentDateOptions,
    type CurrentDateResult,
    type TimeParts,
} from "../utils/date";
import { getLocation, getQueryMap, type QueryMap } from "../utils/url";
import { buildGUID, buildPrefixUUID, buildUUID, uuid } from "../utils/uuid";

type Equal<TLeft, TRight> =
    (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2
        ? true
        : false;
type Expect<T extends true> = T;

type DateFormatResult = Expect<Equal<ReturnType<typeof dateFormat>, string>>;
type WeekResult = Expect<Equal<ReturnType<typeof getCurrentWeek>, string>>;
type MonthDaysResult = Expect<Equal<ReturnType<typeof monthDays>, number>>;
type YearsResult = Expect<Equal<ReturnType<typeof createYear>, number[]>>;
type CurrentDateReturn = Expect<Equal<ReturnType<typeof getCurrentDate>, CurrentDateResult>>;
type TimeReturn = Expect<Equal<ReturnType<typeof getTime>, TimeParts>>;
type LocationReturn = Expect<Equal<ReturnType<typeof getLocation>, Location | undefined>>;
type QueryReturn = Expect<Equal<ReturnType<typeof getQueryMap>, QueryMap>>;
type UuidReturn = Expect<Equal<ReturnType<typeof uuid>, string>>;

const options = { type: 2, prefix: "周" } satisfies CurrentDateOptions;
getCurrentDate(options);
buildUUID();
buildGUID();
buildPrefixUUID("order-");
uuid(8, 16, "id-");

// @ts-expect-error 日期格式类型只允许 1、2、3。
getCurrentDate({ type: 4 });
// @ts-expect-error 月份天数只接受 Date 或字符串。
monthDays(2024);
// @ts-expect-error UUID 长度必须是 number。
uuid("8");

export type DateUrlUuidTypeTests =
    | DateFormatResult
    | WeekResult
    | MonthDaysResult
    | YearsResult
    | CurrentDateReturn
    | TimeReturn
    | LocationReturn
    | QueryReturn
    | UuidReturn;
