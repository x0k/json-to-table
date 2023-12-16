export function makeObjectPropertiesStabilizer() {
  let count = 0;
  const order: Record<string, number> = {};
  return <V>(obj: Record<string, V>) => {
    const entries = Object.entries(obj);
    const keys = new Array<string>(entries.length);
    const values = new Array<V>(entries.length);
    for (const [key, val] of entries) {
      const index = (order[key] ??= count++);
      keys[index] = key;
      values[index] = val;
    }
    return [keys, values] as const;
  };
}
