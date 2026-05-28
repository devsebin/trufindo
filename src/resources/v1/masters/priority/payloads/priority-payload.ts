import { IPriorities } from "@/database/priority/priority-db-interface";
import { Strict } from "@/utils/helpers/query-filter";

/**
 * Base payload (all fields optional, strictly from IUser)
 */
export interface IInputUserPayload extends Partial<IPriorities> {}

/**
 * Strict payload
 * - only IUser keys allowed
 * - required business fields enforced
 */
export interface IInputPriorityPayloadStrict extends Strict<
  Partial<IPriorities> &
    Required<Pick<IPriorities, "title" | "label" | "color">>
> {}

export interface IUpdatePriorityPayloadStrict extends Strict<
  Partial<IPriorities> &
    Required<Pick<IPriorities, "title" | "label" | "color">>
> {}
