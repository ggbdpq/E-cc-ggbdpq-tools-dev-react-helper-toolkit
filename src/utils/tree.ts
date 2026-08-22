export interface TreeNode {
    id?: PropertyKey;
    parentId?: PropertyKey | null;
    children?: TreeNode[];
    pathList?: PropertyKey[];
    uniqueId?: PropertyKey;
    [key: string]: unknown;
}

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

/** 按可配置的 id、parentId 和 children 字段将平铺数据原地组织为树。 */
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
