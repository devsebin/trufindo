import { IOtp } from "@/database/otp/otp-db-interface";
import { IInputUser, IUser } from "@/database/users/users-db-interface";
import User from "@/database/users/users-db-model";
import { Request } from "express";
import mongoose, { ClientSession, HydratedDocument, Model } from "mongoose";
import { authenticationErrors } from "../authentication.messages";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { buildUserObject, throwError } from "../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  IDeclaimerInput,
  IVerifyOtpInput,
} from "../payloads/verify-otp.interface";
import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import createUserService from "../../users/services/create-user.service";

class userService {
  private userRepository: Model<IUser>;
  private readonly declaimerRepository = Model<IDeclaimer>;

  constructor() {
    this.userRepository = User;
    this.declaimerRepository = DeclaimerModel;
  }

  async execute(
    otpDoc: HydratedDocument<IOtp>,
    req: Request,
    object: IVerifyOtpInput,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<HydratedDocument<IUser>> {
    let user: HydratedDocument<IUser>;
    if (otpDoc.otp_type === "register") {
      await this.validateDeclaimers(otpDoc.declaimers, session);
      const userObject = await buildUserObject({
        role: otpDoc.user_type,
        phone: otpDoc.phoneNumber,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        user_location: req.geoData?.city ?? "",
        user_country: req.geoData?.country ?? "",
        user_region: req.geoData?.region ?? "",
        user_city: req.geoData?.city ?? "",
        last_login: new Date(),
        declaimer: otpDoc.declaimers,
      });
      // await createUserService.execute(userObject);
      user = await this.createUser(userObject, session, dbTransactions);
    } else if (otpDoc.otp_type === "login") {
      user = await this.findUser(otpDoc, session, dbTransactions);
    }

    return user!;
  }

  private async validateDeclaimers(
    declaimers: IDeclaimerInput[],
    session: ClientSession,
  ): Promise<void> {
    try {
      if (!Array.isArray(declaimers)) {
        throwError(
          "invalid_declaimer_id",
          ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
            message: "Invalid declaimers",
          }),
        );
      }
      const ids = declaimers.map((d) => d.declaimer_id);
      // 1. Validate ObjectId format
      const validIds: string[] = [];
      const invalidFormatIds: string[] = [];

      for (const id of ids) {
        if (mongoose.Types.ObjectId.isValid(id)) {
          validIds.push(id.toString());
        } else {
          invalidFormatIds.push(id.toString());
        }
      }

      // 2. Query DB only with valid IDs
      const objectIds = validIds.map((id) => new mongoose.Types.ObjectId(id));

      const existingDeclaimers = await this.declaimerRepository
        .find({ _id: { $in: objectIds } })
        .session(session)
        .select("_id");

      const foundIds = new Set(existingDeclaimers.map((d) => d._id.toString()));

      // 3. Find missing IDs
      const missingIds = validIds.filter((id) => !foundIds.has(id));

      // 4. Check accepted flag
      const unacceptedIds = declaimers
        .filter((d) => !d.accepted)
        .map((d) => d.declaimer_id);

      if (
        missingIds.length ||
        invalidFormatIds.length ||
        unacceptedIds.length
      ) {
        const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
          message: "Invalid declaimers",
          data: {
            missingIds,
            invalidFormatIds,
            unacceptedIds,
          },
          filler: {
            missingIds,
            invalidFormatIds,
            unacceptedIds,
          },
        });

        throwError("invalid_declaimer_id", response);
      }
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error validating declaimers",
        authenticationErrors,
      );
    }
  }
  private async createUser(
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
    }
  }

  private async findUser(
    otpDoc: HydratedDocument<IOtp>,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<HydratedDocument<IUser>> {
    try {
      const user = await this.userRepository
        .findOne({ phone: otpDoc.phoneNumber, is_active: true })
        .session(session);

      if (!user) {
        throwError(
          "user_not_found",
          ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
            message: "User not found",
            data: { phoneNumber: otpDoc.phoneNumber },
            filler: { phoneNumber: otpDoc.phoneNumber },
          }),
        );
      }

      if (user.role !== otpDoc.user_type) {
        throwError(
          "role_mismatch",
          ResponseBuilder.error(ErrorTypes.UNAUTHORIZED, {
            message: "User role mismatch",
            data: { requested: otpDoc.user_type, actual: user.role },
          }),
        );
      }

      return user as HydratedDocument<IUser>;
    } catch (error) {
      rethrowIfKnown(error, "Error validating user", authenticationErrors);
    }
  }
}

export default new userService();
