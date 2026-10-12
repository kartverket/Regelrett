type SortFunc = (a: string, b: string) => number;

export const standardColumnSort: SortFunc = (a, b) => {
  return a.localeCompare(b);
};

const customSort = (a: string, b: string, priorityOrder: string[]): number => {
  const priValueA = priorityOrder.indexOf(a);
  const priValueB = priorityOrder.indexOf(b);

  // If for some reason both values are not in the priority order list, lets use standard-sort
  if (priValueA < 0 && priValueB < 0) {
    return standardColumnSort(a, b);
  }

  return priValueA - priValueB;
};

export const prirorityColumnSort: SortFunc = (a, b) => {
  const priorityOrder = ["kan", "bør", "(må)", "må"];
  return customSort(a, b, priorityOrder);
};

export const ledetidColumnSort: SortFunc = (a, b) => {
  const priorityOrder = [
    "kort (< 1 mnd)",
    "middels (1-3 mnd)",
    "lang (> 3 mnd)",
  ];
  return customSort(a, b, priorityOrder);
};

export const getSortFuncForColumn = (columnId: string): SortFunc => {
  switch (columnId.toLowerCase()) {
    case "pri":
      return prirorityColumnSort;
    case "ledetid":
      return ledetidColumnSort;
    default:
      return standardColumnSort;
  }
};
