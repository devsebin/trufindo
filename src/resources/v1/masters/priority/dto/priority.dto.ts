import { capitalize } from "@/utils/helpers/capitalize-string.helper";
import generateLabel from "@/utils/helpers/generate-label.helper";
import { IInputPriorityPayloadStrict } from "../payloads/priority-payload";

export interface IPriorityDTO {
  title: string;
  color: string;
  label: string;
  description?: string;
}
export function toPriorityDTO(body: IInputPriorityPayloadStrict): IPriorityDTO {
  return {
    title: capitalize(body.title),
    color: body.color,
    label: generateLabel(body.title),
    description: body.description,
  };
}
