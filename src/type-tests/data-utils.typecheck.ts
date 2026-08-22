import { extractFields, getKeyList, swapOrder } from "../utils/array";
import { clone, cloneDeep } from "../utils/clone";
import { deepEqual } from "../utils/deep";
import { createFormData, type FormDataOptions } from "../utils/formData";
import { cleanObject, delObjectProperty, entries, type CleanOptions, type DeepClean } from "../utils/object";
import { handleTree, type TreeNode } from "../utils/tree";

type Equal<TLeft, TRight> =
    (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2
        ? true
        : false;
type Expect<T extends true> = T;

const users = [{ id: 1, name: "A" }];
const ids = extractFields(users, "id");
type ExtractResult = Expect<Equal<typeof ids, Array<{ id: number }>>>;
type CloneResult = Expect<Equal<ReturnType<typeof clone<{ id: number }>>, { id: number }>>;
type DeepCloneResult = Expect<Equal<ReturnType<typeof cloneDeep<{ id: number }>>, { id: number }>>;

const omitted = delObjectProperty({ id: 1, name: "A" }, "name");
type OmitResult = Expect<Equal<typeof omitted, { id: number }>>;
const objectEntries = entries({ id: 1, name: "A" });
type EntriesResult = Expect<Equal<(typeof objectEntries)[number], ["id", number] | ["name", string]>>;
type Cleaned = DeepClean<{ id: number; nested: { value: string } }>;
const options = { excludeEmptyArrays: true } satisfies CleanOptions;
const formOptions = { fileKey: "file" } satisfies FormDataOptions;
cleanObject({ id: 1 }, options);
createFormData({ id: 1 }, formOptions);
deepEqual({ id: 1 }, { id: 1 });
getKeyList(users, "id");
swapOrder(users, 0, 0);
handleTree<TreeNode & { name: string }>([{ id: 1, parentId: 0, name: "A" }]);

// @ts-expect-error extractFields 只能提取存在的键。
extractFields(users, "missing");

export type DataUtilsTypeTests = ExtractResult | CloneResult | DeepCloneResult | OmitResult | EntriesResult | Cleaned;
