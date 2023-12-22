import { Node, Tree, insert, traverse } from "@/lib/binary-tree";

interface KeyNode<V> extends Node<number, KeyNode<V>> {
  key: string;
  val: V;
}

export function makeObjectPropertiesStabilizer() {
  let count = 0;
  const order: Record<string, number> = {};
  return <V>(obj: Record<string, V>) => {
    const entries = Object.entries(obj);
    let tree: Tree<number, KeyNode<V>> = undefined;
    for (const [key, val] of entries) {
      const index = (order[key] ??= count++);
      tree = insert(tree, {
        key,
        val,
        value: index,
      });
    }
    const keys: string[] = [];
    const values: V[] = [];
    traverse(tree, (node) => {
      keys.push(node.key);
      values.push(node.val);
    });
    return [keys, values] as const;
  };
}
