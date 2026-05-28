import mongoose, { ClientSession, Model } from "mongoose";

import { rethrowIfKnown } from "@/utils/responses/error.response";

import { IPriorities } from "@/database/priority/priority-db-interface";
import PriorityModel from "@/database/priority/priority-db-model";

export interface IBaseFindOptions {
  setDefault?: boolean;
  session?: ClientSession;
}
class findPriorityDefaultSetterHelperService {
  private readonly priorityRepository: Model<IPriorities>;

  constructor() {
    this.priorityRepository = PriorityModel;
  }

  public async execute(
    body: Partial<IPriorities>,
    errorMap: Record<string, { message: string; status: number }>,
    options: IBaseFindOptions & {
      session?: mongoose.ClientSession;
    } = {},
  ): Promise<Partial<IPriorities>> {
    const { setDefault = false, session } = options;

    try {
      let dbQuery = this.priorityRepository.findOne({
        is_default: true,
        is_active: true,
        is_deleted: false,
      });

      if (session) {
        dbQuery = dbQuery.session(session);
      }

      const document = await dbQuery;

      if (setDefault && !document) {
        body.is_default = true;
      }

      return body as Partial<IPriorities>;
    } catch (error) {
      rethrowIfKnown(error, "Error while finding priority", errorMap);
    }
  }
}

export default new findPriorityDefaultSetterHelperService();
