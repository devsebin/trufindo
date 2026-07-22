import User from "@/database/users/users-db-model";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { ClientSession, Document, HydratedDocument } from "mongoose";
import { throwError } from "../authentication.helper";
import { authenticationErrors } from "../authentication.messages";
import { IUser } from "@/database/users/users-db-interface";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";

class registerService {
  private userRepository: any;
  constructor() {
    this.userRepository = User;
  }
  public async execute(
    user: IUser,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<HydratedDocument<IUser>> {
    try {
      const userDocument = new this.userRepository(user);
      await userDocument.save({ session });

      if (!userDocument) {
        const response = ResponseBuilder.error(
          ErrorTypes.INTERNAL_SERVER_ERROR,
          {
            message: "Error while creating user",
            data: { user: user },
            filler: { user: user },
          },
        );
        throwError("error_while_creating_user", response);
      }

      dbTransactions.push(
        await createDbTransaction(
          tableName.User,
          apiMethods.POST,
          operationTypes.Create,
          userDocument,
        ),
      );
      return userDocument;
    } catch (error) {
      rethrowIfKnown(error, "Error creating user", authenticationErrors);
    }
  }
}

export default new registerService();
