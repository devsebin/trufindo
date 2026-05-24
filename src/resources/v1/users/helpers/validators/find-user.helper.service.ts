import { IUser } from "@/database/users/users-db-interface";
import UserModel from "@/database/users/users-db-model";
import StrictFilterQuery from "@/utils/helpers/query-filter";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { IBaseFindOptions } from "@/utils/interfaces/base-find-query.interface";
import { HydratedDocument, Model, Types } from "mongoose";
import { throwError } from "../../users.helper";
import { rethrowIfKnown } from "@/utils/responses/error.response";

export type UserQuery = StrictFilterQuery<IUser & { _id: Types.ObjectId }>;
class findUserHelperService {
  private readonly userRepository: Model<IUser>;

  constructor() {
    this.userRepository = UserModel;
  }

  public async execute(
    query: UserQuery,
    errorMap: Record<string, { message: string; status: number }>,
    options: IBaseFindOptions = {},
  ): Promise<HydratedDocument<IUser> | null> {
    const {
      throwIfExists = false,
      throwIfNotFound = false,
      returnDocument = true,
      lean = false,
      select,
    } = options;

    try {
      let dbQuery = this.userRepository.findOne(query);

      if (select) {
        dbQuery = dbQuery.select(select);
      }

      if (lean) {
        dbQuery = dbQuery.lean();
      }

      const document = await dbQuery;

      if (throwIfExists && document) {
        const response = ResponseBuilder.error(ErrorTypes.CONFLICT, {
          message: "user already present with the given id",
          data: { country_id: query._id },
          filler: { 0: query._id },
        });
        throwError("user_already_exists", response);
      }

      if (throwIfNotFound && !document) {
        const response = ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
          message: "user not found with the given id",
          data: { country_id: query._id },
          filler: { 0: query._id },
        });
        throwError("user_not_found", response);
      }

      if (!returnDocument) {
        return null;
      }

      return document as HydratedDocument<IUser>;
    } catch (error) {
      rethrowIfKnown(error, "Error while finding user", errorMap);
    }
  }
}

export default new findUserHelperService();
