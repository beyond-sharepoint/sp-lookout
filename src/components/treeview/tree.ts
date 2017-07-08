export default class Tree<T extends TreeNode> {
    private _cnt: number;
    private _obj: { children?: any, [others: string]: any };
    private _indexes: { [key: number]: TreeNode }

    public constructor(obj?: { children?: any, [others: string]: any }) {
        this._cnt = 1;
        this._obj = obj || { children: [] };
        this._indexes = {};
        this.buildTree(this._obj);
    }

    public get obj(): { children?: any, [others: string]: any } {
        return this._obj;
    }

    public get indexes(): { [key: number]: TreeNode } {
        return this._indexes;
    }

    public getIndex(id: number): TreeNode {
        var index = this._indexes[id];
        if (index) {
            return index;
        }

        throw Error("A node for the given id could not be found.");
    };

    public get(id): { children?: any, [others: string]: any } {
        var index = this.getIndex(id);
        if (index && index.node) {
            return index.node;
        }
        throw Error("Unable to retrieve the NodeObj for the given id.");
    };

    public remove(id): { children?: any, [others: string]: any } | null {
        const index = this.getIndex(id);
        if (!index) {
            return null;
        }

        const node = this.get(id);
        const parentIndex = this.getIndex(index.parent);
        if (!parentIndex) {
            throw Error("Unable to find the parent for the given node.");
        }

        const parentNode = this.get(index.parent);
        if (!parentNode) {
            throw Error("Unable to find the parent node.");
        }

        parentNode.children.splice(parentNode.children.indexOf(node), 1);
        parentIndex.children.splice(parentIndex.children.indexOf(id), 1);
        this.removeIndex(index);
        this.updateChildren(parentIndex.children);

        return node;
    };


    public insert(obj, parentId, i) {
        var parentIndex = this.getIndex(parentId);
        var parentNode = this.get(parentId);

        var index = this.buildTree(obj);
        index.parent = parentId;

        parentNode.children = parentNode.children || [];
        parentIndex.children = parentIndex.children || [];

        parentNode.children.splice(i, 0, obj);
        parentIndex.children.splice(i, 0, index.id);

        this.updateChildren(parentIndex.children);
        if (parentIndex.parent) {
            this.updateChildren(this.getIndex(parentIndex.parent).children);
        }

        return index;
    };

    public insertBefore(obj, destId) {
        var destIndex = this.getIndex(destId);
        var parentId = destIndex.parent;
        var i = this.getIndex(parentId).children.indexOf(destId);
        return this.insert(obj, parentId, i);
    };

    public insertAfter(obj, destId) {
        var destIndex = this.getIndex(destId);
        var parentId = destIndex.parent;
        var i = this.getIndex(parentId).children.indexOf(destId);
        return this.insert(obj, parentId, i + 1);
    };

    public prepend(obj, destId) {
        return this.insert(obj, destId, 0);
    };

    public append(obj, destId) {
        var destIndex = this.getIndex(destId);
        destIndex.children = destIndex.children || [];
        return this.insert(obj, destId, destIndex.children.length);
    };

    private buildTree(obj: { children?: any, [others: string]: any }) {
        const indexes = this._indexes;
        let startId = this._cnt;

        let index = {
            id: startId,
            node: obj,
            parent: 0,
            children: [],
            prev: null,
            next: null
        }

        indexes[this._cnt] = index;
        this._cnt++;

        if (obj.children && obj.children.length) {
            this.walk(obj.children, index);
        }
        return index;
    };

    private walk(objs: Array<{ children?: any, [others: string]: any }>, parent: TreeNode) {
        let children: Array<number> = [];

        objs.forEach((obj, i) => {
            let index: TreeNode = {
                id: this._cnt,
                node: obj,
                parent: 0,
                children: [],
                prev: null,
                next: null
            };

            if (parent) {
                index.parent = parent.id;
            }

            this._indexes[this._cnt] = index;
            children.push(this._cnt);
            this._cnt++;

            if (obj.children && obj.children.length) {
                this.walk(obj.children, index);
            }
        });
        parent.children = children;

        children.forEach((id, i) => {
            let index = this._indexes[id];
            if (i > 0) {
                index.prev = children[i - 1];
            }
            if (i < children.length - 1) {
                index.next = children[i + 1];
            }
        })
    }

    private removeIndex(index) {
        var self = this;
        del(index);

        function del(index) {
            delete self._indexes[index.id + ''];
            if (index.children && index.children.length) {
                index.children.forEach(function (child) {
                    del(self.getIndex(child));
                });
            }
        }
    };

    private updateChildren(children: Array<number>): void {
        children.forEach((id, i) => {
            let index = this.getIndex(id);
            if (!index) {
                return;
            }
            index.prev = index.next = null;
            if (i > 0) {
                index.prev = children[i - 1];
            }
            if (i < children.length - 1) {
                index.next = children[i + 1];
            }
        });
    };
}

export interface TreeNode {
    id: number;
    parent: number;
    children: Array<number>;
    prev: number | null;
    next: number | null;
    node: { children?: any, [others: string]: any };
}