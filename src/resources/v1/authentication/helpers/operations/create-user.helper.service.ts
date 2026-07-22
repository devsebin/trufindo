import mongoose, { ClientSession, HydratedDocument, Model } from "mongoose";
import User from "@/database/users/users-db-model";
import { IInputUser, IUser } from "@/database/users/users-db-interface";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { throwError } from "../../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { authenticationErrors } from "../../authentication.messages";

class createUserHelperService {
  private readonly userRepository: Model<IUser>;

  constructor() {
    this.userRepository = User;
  }

  public async execute(
    user: IInputUser,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<HydratedDocument<IUser>> {
    try {
      const doc = await this.userRepository.create([user], {
        session,
      });
      if (!doc || doc.length === 0) {
        const response = ResponseBuilder.error(
          ErrorTypes.INTERNAL_SERVER_ERROR,
          {
            message: "Error while creating user",
            data: { user: user },
            filler: { user: user },
          },
        );
        return throwError("auth_session_not_created", response);
      }

      const userDocument = doc[0];

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
      return null as any;
    }
  }
}

export default new createUserHelperService();
