type FieldCondition<T> =
  | T
  | {
      $in?: T[];
      $nin?: T[];
      $eq?: T;
      $ne?: T;
      $gt?: T;
      $gte?: T;
      $lt?: T;
      $lte?: T;
      $regex?: string;
      $exists?: boolean;
    };

type StrictFilterQuery<T> = {
  [K in keyof T]?: FieldCondition<T[K]>;
} & {
  $or?: StrictFilterQuery<T>[];
  $and?: StrictFilterQuery<T>[];
  $in?: unknown[];
};

export type Strict<T> = {
  [K in keyof T]: T[K];
};
export default StrictFilterQuery;
