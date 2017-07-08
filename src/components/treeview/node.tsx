import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { autobind } from 'office-ui-fabric-react/lib';
import Tree, { TreeNode } from './tree';
import { RenderTree } from './index';

export default class Node extends React.Component<NodeProps, any>{
  renderCollapse() {
    const { index } = this.props;

    if (index.children && index.children.length) {
      const collapsed = index.node.collapsed;
      let classes = "collapse ";
      collapsed ? classes += 'caret-right' : classes += 'caret-down';

      return (
        <span
          className={classes}
          onMouseDown={function (e) { e.stopPropagation() }}
          onClick={this.handleCollapse}>
        </span>
      );
    }

    return null;
  }

  renderChildren() {
    const { index, tree, dragging } = this.props;

    if (index.children && index.children.length) {
      const childrenStyles: React.CSSProperties = {};
      if (index.node.collapsed) {
        childrenStyles.display = 'none';
      }

      childrenStyles.paddingLeft = this.props.paddingLeft + 'px';

      return (
        <div className="children" style={childrenStyles}>
          {index.children.map((child) => {
            var childIndex = tree.getIndex(child);
            return (
              <Node
                tree={tree}
                index={childIndex}
                key={childIndex.id}
                dragging={dragging}
                paddingLeft={this.props.paddingLeft}
                onCollapse={this.props.onCollapse}
                onDragStart={this.props.onDragStart}
              />
            );
          })}
        </div>
      );
    }

    return null;
  }

  render() {
    const { tree, index, dragging } = this.props;
    const node = index.node;
    const styles = {};

    let classes = "m-node";
    if (index.id === dragging) {
      classes += " placeholder";
    }

    return (
      <div
        className={classes}
        style={styles}
      >
        <div
          className="inner"
          ref="inner"
          onMouseDown={this.handleMouseDown}>
          {this.renderCollapse()}
          {tree.renderNode(node)}
        </div>
        {this.renderChildren()}
      </div>
    );
  }

  @autobind
  private handleCollapse(e) {
    e.stopPropagation();
    const nodeId = this.props.index.id;
    if (this.props.onCollapse) {
      this.props.onCollapse(nodeId);
    }
  }

  @autobind
  private handleMouseDown(e) {
    const { index, onDragStart } = this.props;
    const nodeId = index.id;
    const dom = this.refs.inner;

    if (typeof onDragStart === 'function') {
      onDragStart(nodeId, dom, e);
    }
  }
}

export interface NodeProps {
  index: TreeNode;
  tree: RenderTree
  dragging: number;
  paddingLeft: string | number;
  onCollapse?: (id: number) => void;
  onDragStart?: (id: number, dom: React.ReactInstance, e: Event) => void;
}