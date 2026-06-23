import { Types } from "mongoose";
import { IInputIProviderPayloadStrict } from "../payloads/provider-payload";

export interface IProviderDTO {
  name: string;
  description?: string;
  status_id?: Types.ObjectId;
  is_active?: boolean;
}
export function toProviderDTO(
  body: IInputIProviderPayloadStrict,
): IProviderDTO {
  return {
    name: body.name,
    description: body.description,
    status_id: body.status_id,
    is_active: body.is_active,
  };
}
