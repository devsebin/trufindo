import { IUser } from "@/database/users/users-db-interface";
import UserModel from "@/database/users/users-db-model";
import mongoose, { HydratedDocument, Model } from "mongoose";
import { IInputUserPayload } from "../payloads/user-input.interface";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { throwError } from "../users.helper";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { userErrorMessages } from "../users.messages";

class createUserHelperService {
  private readonly userRepository: Model<IUser>;
  constructor() {
    this.userRepository = UserModel;
  }

  public async execute(
    payload: IInputUserPayload,
    session: mongoose.ClientSession,
    DbTransactions: DbTransaction[],
  ): Promise<HydratedDocument<IUser>> {
    try {
      const doc = new this.userRepository(payload);
      await doc.save({ session });

      if (!doc) {
        const response = ResponseBuilder.error(
          ErrorTypes.INTERNAL_SERVER_ERROR,
          {
            message: "Error while creating user",
            data: { payload: payload },
          },
        );
        return throwError("user_not_created", response);
      }
      DbTransactions.push(
        await createDbTransaction(
          tableName.User,
          apiMethods.POST,
          operationTypes.Create,
          doc.toObject(),
        ),
      );
      return doc.toObject();
    } catch (error) {
      rethrowIfKnown(error, "Error while creating user", userErrorMessages);
    }
  }
}

export default new createUserHelperService();
