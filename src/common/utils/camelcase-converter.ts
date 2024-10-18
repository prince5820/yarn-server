const toCamelCase = (str: string) => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

export const convertKeysToCamelCase = (obj: any) => {
  return Object.keys(obj).reduce((acc, key) => {
    const camelCaseKey = toCamelCase(key);
    acc[camelCaseKey] = obj[key];
    return acc;
  }, {} as any);
};

export const convertArrayKeysToCamelCase = (arr: any[]) => {
  return arr.map(item => convertKeysToCamelCase(item));
};