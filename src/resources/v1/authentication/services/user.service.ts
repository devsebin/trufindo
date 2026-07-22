import { IOtp } from "@/database/otp/otp-db-interface";
import { IUser } from "@/database/users/users-db-interface";
import { Request } from "express";
import { ClientSession, HydratedDocument } from "mongoose";
import { buildUserObject } from "../authentication.helper";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { IVerifyOtpInput } from "../payloads/verify-otp.interface";

import validateDeclaimersHelperService from "../helpers/validators/validate-declaimers.helper.service";
import findUserHelperService from "../helpers/validators/find-user.helper.service";
import createUserHelperService from "../helpers/operations/create-user.helper.service";

class userService {
  async execute(
    otpDoc: HydratedDocument<IOtp>,
    req: Request,
    object: IVerifyOtpInput,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<HydratedDocument<IUser>> {
    let user: HydratedDocument<IUser>;
    if (otpDoc.otp_type === "register") {
      await validateDeclaimersHelperService.execute(otpDoc.declaimers, session);
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
      user = await createUserHelperService.execute(userObject, session, dbTransactions);
    } else if (otpDoc.otp_type === "login") {
      user = await findUserHelperService.findUserByPhone(otpDoc.phoneNumber, otpDoc.user_type, session);
    }

    return user!;
  }
}

export default new userService();
