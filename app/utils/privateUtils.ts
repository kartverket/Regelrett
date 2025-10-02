/* eslint-disable @typescript-eslint/no-explicit-any */
// Subset copy from https://github.com/Airtable/blocks/blob/master/packages/sdk/src/private_utils.ts
export type ObjectValues<T extends object> = T[keyof T];

export type ObjectMap<K extends keyof any, V> = { [P in K]: V };

export function keys<Obj extends object>(obj: Obj): Array<keyof Obj> {
  return Object.keys(obj) as any;
}

export function has<T extends object>(obj: T, key: keyof any): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

const invertedEnumCache: WeakMap<object, object> = new WeakMap();

function getInvertedEnumMemoized<K extends string, V extends string>(
  enumObj: ObjectMap<K, V>,
): ObjectMap<V, K> {
  const existingInvertedEnum = invertedEnumCache.get(enumObj);
  if (existingInvertedEnum) {
    return existingInvertedEnum as any;
  }
  const invertedEnum = {} as ObjectMap<V, K>;
  for (const enumKey of keys(enumObj)) {
    const enumValue = enumObj[enumKey];
    invertedEnum[enumValue] = enumKey;
  }
  invertedEnumCache.set(enumObj, invertedEnum);
  return invertedEnum;
}

export function getEnumValueIfExists<K extends string, V extends string>(
  enumObj: ObjectMap<K, V>,
  valueToCheck: string,
): V | null {
  const invertedEnum = getInvertedEnumMemoized(enumObj);
  if (has(invertedEnum, valueToCheck) && invertedEnum[valueToCheck]) {
    const enumKey = invertedEnum[valueToCheck];
    return enumObj[enumKey];
  }
  return null;
}
