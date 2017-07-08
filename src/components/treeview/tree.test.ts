import Tree from './tree';

function _tree() {
  return new Tree({
    module: 'root',
    children: [{
      module: 'a',
      children: [{ module: 'c' }]
    }, {
      module: 'b'
    }]
  });
}

describe('tree.js', function () {
  it('empty json', function () {
    var tree = new Tree();
    expect(tree.obj).toEqual({ children: [] });
  });

  it('build()', function () {
    var tree = _tree();
    var obj = tree.obj;
    var indexes = tree.indexes;

    expect(indexes['1']).toEqual({
      id: 1,
      node: obj,
      children: [2, 4]
    });

    expect(indexes['2']).toEqual({
      id: 2,
      parent: 1,
      children: [3],
      node: obj.children[0],
      next: 4,
    });

    expect(indexes['3']).toEqual({
      id: 3,
      parent: 2,
      node: obj.children[0].children[0]
    });

    expect(indexes['4']).toEqual({
      id: 4,
      parent: 1,
      node: obj.children[1],
      prev: 2
    });
  });

  it('get()', function () {
    var tree = _tree();
    var obj = tree.obj;
    var indexes = tree.indexes;

    expect(tree.get(1)).toEqual(obj);
    expect(tree.get(10)).toEqual(null);
  });

  it('remove()', function () {
    var tree = _tree();
    var obj = tree.obj;
    var indexes = tree.indexes;

    var node = tree.remove(2);
    expect(node).toEqual({ module: 'a', children: [{ module: 'c' }] });
    expect(obj).toEqual({
      module: 'root',
      children: [{ module: 'b' }]
    });
    expect(tree.getIndex(2)).toBe(undefined);
    expect(tree.getIndex(3)).toBe(undefined);
  });

  it('insert()', function () {
    var tree = _tree();
    var obj = tree.obj;
    var indexes = tree.indexes;

    tree.insert({ module: 'd' }, 3, 0);
    expect(obj).toEqual({
      module: 'root',
      children: [{
        module: 'a',
        children: [{
          module: 'c',
          children: [{ module: 'd' }]
        }]
      }, { module: 'b' }]
    });
  });

  it('insertBefore()', function () {
    var tree = _tree();
    var obj = tree.obj;
    var indexes = tree.indexes;

    tree.insertBefore({ module: 'd' }, 3);

    expect(obj).toEqual({
      module: 'root',
      children: [{
        module: 'a',
        children: [
          { module: 'd' },
          { module: 'c' }
        ]
      }, { module: 'b' }]
    });
  });

  it('insertAfter()', function () {
    var tree = _tree();
    var obj = tree.obj;
    var indexes = tree.indexes;

    tree.insertAfter({ module: 'd' }, 3);
    expect(obj).toEqual({
      module: 'root',
      children: [{
        module: 'a',
        children: [
          { module: 'c' },
          { module: 'd' }
        ]
      }, { module: 'b' }]
    });
  });

  it('prepend()', function () {
    var tree = _tree();
    var obj = tree.obj;
    var indexes = tree.indexes;

    tree.prepend({ module: 'd' }, 1);
    expect(obj).toEqual({
      module: 'root',
      children: [{
        module: 'd'
      }, {
        module: 'a',
        children: [{ module: 'c' }]
      }, {
        module: 'b'
      }]
    });
  });

  it('append()', function () {
    var tree = _tree();
    var obj = tree.obj;
    var indexes = tree.indexes;

    tree.append({ module: 'd' }, 1);
    expect(obj).toEqual({
      module: 'root',
      children: [{
        module: 'a',
        children: [{ module: 'c' }]
      }, {
        module: 'b'
      }, {
        module: 'd'
      }]
    });
  });
});