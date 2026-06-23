import { CommonServiceFieldsInterface } from "@/utils/definitions/constants/db-constants";
import mongoose, { Types } from "mongoose";

export type TestResult = "pass" | "fail" | "pending";

export interface ITestLog {
  date: Date;
  result: TestResult;
  details?: string;
}

export interface ICountryProviderConfig {
  api_key?: string;
  api_secret?: string;
  endpoint_url?: string;
  timeout_ms?: number;
  retry_attempts?: number;
  webhook_url?: string;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface IType {
  name: string;
  description: string;
  payloadSchema?: Record<string, any>; // keep for admin validation if needed
  is_tested: boolean;
  test_log?: ITestLog[]; // optional if is_tested = false
  is_default: boolean;
  is_active: boolean;
}

export interface ISupportedCountry {
  countryId: mongoose.Types.ObjectId;
  countryCode: string;
  config?: ICountryProviderConfig;
  type: IType[];
  supportFrom: Date;
  supportUntil?: Date;
  is_tested?: boolean;
  is_active?: boolean;
}

export interface IProvider extends CommonServiceFieldsInterface {
  name: string;
  description?: string;
  supportedCountries: ISupportedCountry[]; // array of countries
}

export interface IProviderDocument extends IProvider, Document {}
