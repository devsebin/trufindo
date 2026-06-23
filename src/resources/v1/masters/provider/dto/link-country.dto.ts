import {
  ICountryProviderConfig,
  IType,
} from "@/database/provider/provider-db-interface";
import mongoose from "mongoose";
import { IInputSupportedCountryPayloadStrict } from "../payloads/provider-payload";

export interface IInputSupportedCountryDTO {
  countryId: mongoose.Types.ObjectId;
  countryCode?: string;
  config?: ICountryProviderConfig;
  type?: IType[];
  supportFrom: Date;
  supportUntil?: Date;
  is_tested?: boolean;
  is_active?: boolean;
}

export function toLinkCountryDTO(
  body: IInputSupportedCountryPayloadStrict,
): IInputSupportedCountryDTO {
  return {
    countryId: body.countryId,
    countryCode: body.countryCode,
    config: body.config,
    type: body.type,
    supportFrom: body.supportFrom,
    supportUntil: body.supportUntil,
    is_tested: body.is_tested,
    is_active: body.is_active,
  };
}
