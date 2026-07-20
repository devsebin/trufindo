import { CommonServiceFieldsInterface } from "@/utils/definitions/constants/db-constants";
import { Types } from "mongoose";

export interface IDistrict extends CommonServiceFieldsInterface {
  name: string; // Name of the district
  code: string; // Short code for the district
  country_id?: Types.ObjectId; // Optional link to country
}

export interface IDistrictDocument extends IDistrict, Document {}

export default IDistrict;
