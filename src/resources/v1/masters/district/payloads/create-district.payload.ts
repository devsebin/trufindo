import { IDistrict } from "@/database/district/district-db-interface";
import { Strict } from "@/utils/helpers/query-filter";

export interface IInputDistrictPayload extends Partial<IDistrict> {}

export interface IInputDistrictPayloadStrict extends Strict<
  Partial<IDistrict> & Required<Pick<IDistrict, "name" | "code">>
> {}

export interface IUpdateDistrictPayloadStrict extends Strict<
  Partial<IDistrict> & Required<Pick<IDistrict, "name" | "code">>
> {}
