import { convertPath } from "../utils/convertPath";
import { nameCamelize, nameHyphenate } from "../utils/nameTransform";
import {
    hideTextAtIndex,
    splitNum,
    subBefore,
    subBothSides,
    type HideTextIndex,
} from "../utils/substring";
import { removeAllSpace, removeLeftSpace } from "../utils/space";

type Equal<TLeft, TRight> =
    (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2
        ? true
        : false;
type Expect<T extends true> = T;

const range = { start: 1, end: 3 } satisfies HideTextIndex;

type SpaceResult = Expect<Equal<ReturnType<typeof removeLeftSpace>, string>>;
type NameResult = Expect<Equal<ReturnType<typeof nameCamelize>, string>>;
type PathResult = Expect<Equal<ReturnType<typeof convertPath>, string>>;
type BeforeResult = Expect<Equal<ReturnType<typeof subBefore>, string>>;
type BothSidesResult = Expect<Equal<ReturnType<typeof subBothSides>, [string, string]>>;
type SplitResult = Expect<Equal<ReturnType<typeof splitNum>, number[] | "">>;
type MaskResult = Expect<Equal<ReturnType<typeof hideTextAtIndex>, string>>;

removeAllSpace(" a b ");
nameHyphenate("helloWorld");
hideTextAtIndex("hello", [1, range]);

// @ts-expect-error 字符串工具不接受 number。
removeLeftSpace(1);
// @ts-expect-error 隐藏区间必须同时包含 start 和 end。
hideTextAtIndex("hello", { start: 1 });

export type TextUtilsTypeTests =
    | SpaceResult
    | NameResult
    | PathResult
    | BeforeResult
    | BothSidesResult
    | SplitResult
    | MaskResult;
