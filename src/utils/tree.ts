/**
 * 树工具共享的最小节点结构。
 *
 * 除保留的层级字段外，节点可以携带任意业务属性。
 */
export interface TreeNode {
    /** 当前层内生成的节点索引或业务 ID */
    id?: PropertyKey;
    /** 父节点标识；根节点通常为 `null` */
    parentId?: PropertyKey | null;
    /** 子节点列表 */
    children?: TreeNode[];
    /** 从根节点到当前节点的索引路径 */
    pathList?: PropertyKey[];
    /** 由路径生成、用于跨层查找的唯一标识 */
    uniqueId?: PropertyKey;
    /** 业务扩展字段 */
    [key: string]: unknown;
}

/**
 * 收集当前数组各节点的 `uniqueId`。
 *
 * 为保持参考行为，子树会被遍历但其返回值不会合并；无效输入返回空数组并输出警告。
 */
export function extractPathList<T extends TreeNode>(tree: T[]): PropertyKey[] {
    if (!Array.isArray(tree)) {
        console.warn("tree must be an array");
        return [];
    }
    if (tree.length === 0) return [];
    const paths: PropertyKey[] = [];
    for (const node of tree) {
        if (node.children?.length) extractPathList(node.children);
        if (node.uniqueId !== undefined) paths.push(node.uniqueId);
    }
    return paths;
}

/**
 * 原地补充索引、父级、路径和唯一标识，并删除仅含一个节点的 `children`。
 *
 * @returns 与输入相同的数组引用；无效输入返回空数组
 */
export function deleteChildren<T extends TreeNode>(tree: T[], pathList: PropertyKey[] = []): T[] {
    if (!Array.isArray(tree)) {
        console.warn("menuTree must be an array");
        return [];
    }
    if (tree.length === 0) return [];
    for (const [index, node] of tree.entries()) {
        if (node.children?.length === 1) delete node.children;
        node.id = index;
        node.parentId = pathList.length ? pathList[pathList.length - 1] : null;
        node.pathList = [...pathList, index];
        node.uniqueId = node.pathList.length > 1 ? node.pathList.join("-") : node.pathList[0];
        if (node.children?.length) deleteChildren(node.children, node.pathList);
    }
    return tree;
}

/** 原地补充索引、父级和路径字段；返回同一数组引用，无效输入返回空数组 */
export function buildHierarchyTree<T extends TreeNode>(tree: T[], pathList: PropertyKey[] = []): T[] {
    if (!Array.isArray(tree)) {
        console.warn("tree must be an array");
        return [];
    }
    if (tree.length === 0) return [];
    for (const [index, node] of tree.entries()) {
        node.id = index;
        node.parentId = pathList.length ? pathList[pathList.length - 1] : null;
        node.pathList = [...pathList, index];
        if (node.children?.length) buildHierarchyTree(node.children, node.pathList);
    }
    return tree;
}

/** 按 `uniqueId` 深度查找节点；未找到或输入无效时返回空数组 */
export function getNodeByUniqueId<T extends TreeNode>(tree: T[], uniqueId: PropertyKey): T | [] {
    if (!Array.isArray(tree)) {
        console.warn("menuTree must be an array");
        return [];
    }
    if (tree.length === 0) return [];
    const node = tree.find((item) => item.uniqueId === uniqueId);
    if (node) return node;
    const children = tree.flatMap((item) => item.children ?? []) as T[];
    return getNodeByUniqueId(children, uniqueId);
}

/** 按 `uniqueId` 原地合并字段；返回同一数组引用，无效输入返回空数组 */
export function appendFieldByUniqueId<T extends TreeNode>(
    tree: T[],
    uniqueId: PropertyKey,
    fields: Record<string, unknown>,
): T[] {
    if (!Array.isArray(tree)) {
        console.warn("menuTree must be an array");
        return [];
    }
    if (tree.length === 0) return [];
    for (const node of tree) {
        if (node.uniqueId === uniqueId && Object.prototype.toString.call(fields) === "[object Object]") {
            Object.assign(node, fields);
        }
        if (node.children?.length) appendFieldByUniqueId(node.children, uniqueId, fields);
    }
    return tree;
}

/**
 * 按可配置的 id、parentId 和 children 字段将平铺数据原地组织为树。
 *
 * 函数会在原始数据对象上写入子节点字段；父标识不存在于数据集中的节点会成为根节点。
 */
export function handleTree<T extends Record<string, unknown>>(
    data: T[],
    id = "id",
    parentId = "parentId",
    children = "children",
): Array<T & TreeNode> {
    if (!Array.isArray(data)) {
        console.warn("data must be an array");
        return [];
    }
    const childrenByParent = new Map<unknown, Array<T & TreeNode>>();
    const nodesById = new Map<unknown, T & TreeNode>();
    for (const source of data) {
        const node = source as T & TreeNode;
        const parent = source[parentId];
        const siblings = childrenByParent.get(parent) ?? [];
        siblings.push(node);
        childrenByParent.set(parent, siblings);
        nodesById.set(source[id], node);
    }
    const roots = data.filter((item) => !nodesById.has(item[parentId])) as Array<T & TreeNode>;

    function attach(node: T & TreeNode): void {
        const childNodes = childrenByParent.get(node[id]);
        Object.assign(node, { [children]: childNodes });
        if (childNodes) for (const child of childNodes) attach(child);
    }
    for (const root of roots) attach(root);
    return roots;
}
