import { IProvider } from "@/database/provider/provider-db-interface";
import { Strict } from "@/utils/helpers/query-filter";
import mongoose from "mongoose";
import { IInputSupportedCountryDTO } from "../dto/link-country.dto";

/**
 * Base payload (all fields optional, strictly from IUser)
 */
export interface IInputProviderPayload extends Partial<IProvider> {}

/**
 * Strict payload
 * - only IUser keys allowed
 * - required business fields enforced
 */
export interface IInputIProviderPayloadStrict extends Strict<
  Partial<IProvider> & Required<Pick<IProvider, "name">>
> {}

export interface IUpdateIProviderPayloadStrict extends Strict<
  Partial<IProvider> & Required<Pick<IProvider, "name">>
> {}

export interface IInputSupportedCountryPayloadStrict extends Strict<
  IInputSupportedCountryDTO &
    Required<Pick<IInputSupportedCountryDTO, "countryId">>
> {}
