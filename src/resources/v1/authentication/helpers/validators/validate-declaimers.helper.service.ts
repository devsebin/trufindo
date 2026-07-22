import mongoose, { ClientSession, Model } from "mongoose";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { IDeclaimerInput } from "../../payloads/verify-otp.interface";
import { throwError } from "../../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { authenticationErrors } from "../../authentication.messages";

class validateDeclaimersHelperService {
  private readonly declaimerRepository: Model<IDeclaimer>;

  constructor() {
    this.declaimerRepository = DeclaimerModel;
  }

  public async execute(
    declaimers: IDeclaimerInput[],
    session: ClientSession,
    checkEmpty: boolean = false,
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

      if (checkEmpty && declaimers.length === 0) {
        const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
          message: "Declaimers are required for registration",
        });
        throwError("declaimer_required", response);
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
}

export default new validateDeclaimersHelperService();
