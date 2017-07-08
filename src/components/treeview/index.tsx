import * as React from 'react';
import { autobind } from 'office-ui-fabric-react/lib';
import Tree, { TreeNode } from './tree';
import Node from './node';

export default class TreeView extends React.Component<UITreeProps, UITreeState> {
  private dragging: DraggingNode;
  private _updated: boolean;
  private _startX: number;
  private _startY: number;
  private _offsetX: number;
  private _offsetY: number;
  private _start: boolean;

  constructor(props: UITreeProps) {
    super(props);

    let treeStuffs = new RenderTree(props.tree);

    this.state = this.init(props);
  }

  getDefaultProps() {
    return {
      paddingLeft: 20
    };
  }

  public componentWillReceiveProps(nextProps: UITreeProps) {
    if (!this._updated) {
      this.setState(this.init(nextProps));
    } else {
      this._updated = false;
    }
  }

  private init(props: UITreeProps): { tree: RenderTree, dragging: DraggingNode } {
    let tree: RenderTree = new RenderTree(props.tree);
    tree.isNodeCollapsed = props.isNodeCollapsed;
    tree.renderNode = props.renderNode;
    tree.changeNodeCollapsed = props.changeNodeCollapsed;
    tree.updateNodesPosition();

    return {
      tree: tree,
      dragging: {
        id: 0,
        x: 0,
        y: 0,
        w: 0,
        h: 0
      }
    };
  }

  getDraggingDom() {
    var tree = this.state.tree;
    var dragging = this.state.dragging;

    if (dragging && dragging.id) {
      var draggingIndex = tree.getIndex(dragging.id);
      var draggingStyles = {
        top: dragging.y,
        left: dragging.x,
        width: dragging.w
      };

      return (
        <div className="m-draggable" style={draggingStyles}>
          <Node
            tree={tree}
            index={draggingIndex}
            dragging={dragging && dragging.id}
            paddingLeft={this.props.paddingLeft}
          />
        </div>
      );
    }

    return null;
  }

  render() {
    var tree = this.state.tree;
    var dragging = this.state.dragging;
    var draggingDom = this.getDraggingDom();

    return (
      <div className="m-tree">
        {draggingDom}
        <Node
          tree={tree}
          index={tree.getIndex(1)}
          key={1}
          paddingLeft={this.props.paddingLeft}
          onDragStart={this.dragStart}
          onCollapse={this.toggleCollapse}
          dragging={dragging && dragging.id}
        />
      </div>
    );
  }

  @autobind
  private dragStart(id, dom, e) {
    this.dragging = {
      id: id,
      w: dom.offsetWidth,
      h: dom.offsetHeight,
      x: dom.offsetLeft,
      y: dom.offsetTop
    };

    this._startX = dom.offsetLeft;
    this._startY = dom.offsetTop;
    this._offsetX = e.clientX;
    this._offsetY = e.clientY;
    this._start = true;

    window.addEventListener('mousemove', this.drag);
    window.addEventListener('mouseup', this.dragEnd);
  };

  @autobind
  private drag(e) {
    if (this._start) {
      this.setState({
        dragging: this.dragging
      });
      this._start = false;
    }

    var tree = this.state.tree;
    var dragging = this.state.dragging;
    var paddingLeft = this.props.paddingLeft;
    var newIndex: RenderTreeNode | null = null;
    var index = tree.getIndex(dragging.id) as RenderTreeNode;
    var collapsed = index.node.collapsed;

    var _startX = this._startX;
    var _startY = this._startY;
    var _offsetX = this._offsetX;
    var _offsetY = this._offsetY;

    var pos = {
      x: _startX + e.clientX - _offsetX,
      y: _startY + e.clientY - _offsetY
    };
    dragging.x = pos.x;
    dragging.y = pos.y;

    var diffX = dragging.x - paddingLeft / 2 - (index.left - 2) * paddingLeft;
    var diffY = dragging.y - dragging.h / 2 - (index.top - 2) * dragging.h;

    if (diffX < 0) { // left
      if (index.parent && !index.next) {
        newIndex = tree.move(index.id, index.parent, 'after');
      }
    } else if (diffX > paddingLeft) { // right
      if (index.prev) {
        var prevNode = tree.getIndex(index.prev).node;
        if (!prevNode.collapsed && !prevNode.leaf) {
          newIndex = tree.move(index.id, index.prev, 'append');
        }
      }
    }

    if (newIndex) {
      index = newIndex;
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    if (diffY < 0) { // up
      let above: RenderTreeNode | null = tree.getNodeByTop(index.top - 1);
      if (above) {
        newIndex = tree.move(index.id, above.id, 'before');
      }
    } else if (diffY > dragging.h) { // down
      if (index.next) {
        let below = tree.getIndex(index.next);
        if (below.children && below.children.length && !below.node.collapsed) {
          newIndex = tree.move(index.id, index.next, 'prepend');
        } else {
          newIndex = tree.move(index.id, index.next, 'after');
        }
      } else {
        let below: RenderTreeNode | null = tree.getNodeByTop(index.top + index.height);
        if (below && below.parent !== index.id) {
          if (below.children && below.children.length) {
            newIndex = tree.move(index.id, below.id, 'prepend');
          } else {
            newIndex = tree.move(index.id, below.id, 'after');
          }
        }
      }
    }

    if (newIndex) {
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    this.setState({
      tree: tree,
      dragging: dragging
    });
  }

  @autobind
  dragEnd() {
    this.setState({
      dragging: {
        id: 0,
        x: 0,
        y: 0,
        w: 0,
        h: 0
      }
    });

    this.change(this.state.tree);
    window.removeEventListener('mousemove', this.drag);
    window.removeEventListener('mouseup', this.dragEnd);
  }

  @autobind
  change(tree) {
    this._updated = true;
    if (this.props.onChange) {
      this.props.onChange(tree.obj);
    }
  }

  toggleCollapse(nodeId) {
    var tree = this.state.tree;
    var index = tree.getIndex(nodeId);
    var node = index.node;
    node.collapsed = !node.collapsed;
    tree.updateNodesPosition();

    this.setState({
      tree: tree
    });

    this.change(tree);
  }
};

export class RenderTree extends Tree<RenderTreeNode> {
  renderNode: (node: any) => void;
  isNodeCollapsed: boolean;
  changeNodeCollapsed: (isCollapsed: boolean) => void;

  public getNodeByTop(top: number): RenderTreeNode | null {
    const indexes = this.indexes;
    for (let id in indexes) {
      if (indexes.hasOwnProperty(id)) {
        let index = indexes[id] as RenderTreeNode;
        if (index.top === top) {
          return index;
        }
      }
    }

    return null;
  };

  public updateNodesPosition() {
    var top = 1;
    var left = 1;
    var root = this.getIndex(1) as RenderTreeNode;
    var self = this;

    root.top = top++;
    root.left = left++;

    if (root.children && root.children.length) {
      walk(root.children, root, left, root.node.collapsed);
    }

    function walk(children, parent, left, collapsed) {
      var height = 1;
      children.forEach(function (id) {
        var node = self.getIndex(id) as RenderTreeNode;
        if (collapsed) {
          node.top = 0;
          node.left = 0;
        } else {
          node.top = top++;
          node.left = left;
        }

        if (node.children && node.children.length) {
          height += walk(node.children, node, left + 1, collapsed || node.node.collapsed);
        } else {
          node.height = 1;
          height += 1;
        }
      });

      if (parent.node.collapsed) parent.height = 1;
      else parent.height = height;
      return parent.height;
    }
  };


  public move(fromId, toId, placement: 'before' | 'after' | 'prepend' | 'append'): RenderTreeNode | null {
    if (fromId === toId || toId === 1) {
      return null;
    }

    let obj = this.remove(fromId);
    let index: TreeNode;

    if (placement === 'before') {
      index = this.insertBefore(obj, toId);
    }
    else if (placement === 'after') {
      index = this.insertAfter(obj, toId);
    }
    else if (placement === 'prepend') {
      index = this.prepend(obj, toId);
    }
    else if (placement === 'append') {
      index = this.append(obj, toId);
    } else {
      throw Error("Invalid placement token");
    }

    // todo: perf
    this.updateNodesPosition();
    return index as RenderTreeNode;
  };
}

export interface RenderTreeNode extends TreeNode {
  top: number;
  left: number;
  height: number;
}

interface DraggingNode {
  id: number;
  w: number;
  h: number;
  x: number;
  y: number;
}

export interface UITreeState {
  tree: RenderTree;
  dragging: DraggingNode;
}

export interface UITreeProps {
  tree: {};
  isNodeCollapsed: boolean;
  changeNodeCollapsed: (isCollapsed: boolean) => void;
  paddingLeft: number;
  renderNode: (any) => void;
  onChange?: Function;
}