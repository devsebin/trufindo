// import { IOtp } from "@/database/otp/otp-db-interface";
// import { IUser } from "@/database/users/users-db-interface";
// import { Model } from "mongoose";

// interface Options {
//   phone: string;
//   country: string;
//   device_id: string;
//   type: string;
//   user_type: string;
//   declaimers: IDeclaimerInput[];
// }

// const OTP_EXPIRY_MINUTES = 5;
// const OTP_COOLDOWN_SECONDS = 30;
// const OTP_MAX_REQUESTS = 5; // per window
// const OTP_WINDOW_MINUTES = 10;

// class sentOtpService {
//   private userRepository: Model<IUser>;
//   private otpRepository: Model<IOtp>;
//   private countryRepository: Model<ICountry>;
//   private declaimerRepository: Model<IDeclaimer>;

//   constructor() {
//     this.userRepository = User;
//     this.otpRepository = OtpModel;
//     this.countryRepository = CountryModel;
//     this.declaimerRepository = DeclaimerModel;
//   }

//   async execute(object: Options): Promise<SingleResponse | ErrorResponse> {
//     const dbTransactions: DbTransaction[] = [];
//     const session = await mongoose.startSession();

//     try {
//       session.startTransaction();

//       // Normalize phone number
//       const phoneE164 = await this.normalizePhone(
//         object.phone,
//         object.country,
//         session,
//       );

//       if (object.type === "register") {
//         await this.validateUser(phoneE164, session);
//         await this.validateDeclaimers(object.declaimers, session);
//       }

//       // Apply OTP rate limits & cooldown
//       await this.checkOtpRateLimits(phoneE164, session);

//       // Expire old OTPs
//       await this.expireOldOtps(phoneE164, session);

//       // Generate OTP
//       const otp = await generateOTP();
//       const otpDocument: IOtpInput = {
//         phoneNumber: phoneE164,
//         country_code: object.country,
//         device_id: object.device_id,
//         otp_type: object.type,
//         user_type: object.user_type,
//         otp_hash: await bcrypt.hash(otp, 10),
//         expires_at: generateOTPExpiry(OTP_EXPIRY_MINUTES),
//         last_seen_at: new Date(),
//         declaimers: object.declaimers,
//       };

//       // Store OTP
//       const otpDocumentSaved = await this.storeOtp(
//         otpDocument,
//         session,
//         dbTransactions,
//       );

//       await session.commitTransaction();
//       console.log(otp);
//       return returnAuthenticationSuccess(
//         "otp_sent_successfully",
//         otpResponse(otpDocumentSaved),
//         dbTransactions,
//       );
//     } catch (error) {
//       await session.abortTransaction();
//       const err = error as Error & { data?: any };
//       return buildErrorResult(err.message, authenticationErrors, err.data);
//     } finally {
//       session.endSession();
//     }
//   }

//   /* --- Helper functions --- */

//   private async normalizePhone(
//     phone: string,
//     countryCode: string,
//     session: ClientSession,
//   ): Promise<string> {
//     try {
//       const country = await this.countryRepository
//         .findOne({ iso_code: countryCode.toUpperCase() })
//         .session(session);

//       if (!country) {
//         const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
//           message: "Country not found for the provided country code",
//           data: { countryCode },
//           filler: { countryCode },
//         });
//         throwError("country_not_found", response);
//       }

//       const phoneNumber = parsePhoneNumberFromString(
//         phone,
//         countryCode.toUpperCase() as any,
//       );

//       if (!phoneNumber || !phoneNumber.isValid()) {
//         const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
//           message: "Invalid phone number format",
//           data: { phoneNumber: phone, countryCode: countryCode.toUpperCase() },
//           filler: {
//             phoneNumber: phone,
//             countryCode: countryCode.toUpperCase(),
//           },
//         });
//         throwError("invalid_phone_number", response);
//       }

//       if (phoneNumber.country !== countryCode.toUpperCase()) {
//         const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
//           message: "Phone number does not match the provided country code",
//           data: { phoneNumber: phone, countryCode },
//           filler: { phoneNumber: phone, countryCode },
//         });
//         throwError("phone_country_mismatch", response);
//       }

//       return phoneNumber.number; // normalized E.164
//     } catch (error) {
//       rethrowIfKnown(error, "Error normalizing phone", authenticationErrors);
//     }
//   }

//   private async validateUser(
//     phoneE164: string,
//     session: ClientSession,
//   ): Promise<void> {
//     try {
//       const user = await this.userRepository
//         .findOne({ phone: phoneE164, is_active: true })
//         .session(session);
//       if (user) {
//         const response = ResponseBuilder.error(ErrorTypes.CONFLICT, {
//           message: "User with this phone number already exists",
//           data: { phoneNumber: phoneE164 },
//           filler: { phoneNumber: phoneE164 },
//         });
//         throwError("user_already_exists", response);
//       }
//     } catch (error) {
//       rethrowIfKnown(error, "Error validating user", authenticationErrors);
//     }
//   }

//   private async validateDeclaimers(
//     declaimers: IDeclaimerInput[],
//     session: ClientSession,
//   ): Promise<void> {
//     try {
//       const ids = declaimers.map((d) => d.declaimer_id);

//       const dbDeclaimers = await this.declaimerRepository
//         .find({
//           _id: { $in: ids },
//           is_active: true,
//         })
//         .session(session);

//       // Check if all exist
//       if (dbDeclaimers.length !== ids.length) {
//         const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
//           message: "One or more declaimer IDs are invalid",
//           data: { provided: ids },
//         });
//         throwError("invalid_declaimer_ids", response);
//       }
//     } catch (error) {
//       rethrowIfKnown(
//         error,
//         "Error validating declaimers",
//         authenticationErrors,
//       );
//     }
//   }

//   private async checkOtpRateLimits(
//     phoneE164: string,
//     session: ClientSession,
//   ): Promise<void> {
//     const now = new Date();
//     const windowStart = new Date(
//       now.getTime() - OTP_WINDOW_MINUTES * 60 * 1000,
//     );

//     const result = await this.otpRepository
//       .aggregate([
//         {
//           $match: { phoneNumber: phoneE164, createdAt: { $gte: windowStart } },
//         },
//         {
//           $group: {
//             _id: null,
//             count: { $sum: 1 },
//             lastCreated: { $max: "$createdAt" },
//           },
//         },
//       ])
//       .session(session);

//     const count = result[0]?.count || 0;
//     const lastCreated = result[0]?.lastCreated
//       ? new Date(result[0].lastCreated)
//       : null;

//     // Cooldown check
//     if (lastCreated) {
//       const secondsSinceLast = (now.getTime() - lastCreated.getTime()) / 1000;
//       if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
//         const response = ResponseBuilder.error(ErrorTypes.CONFLICT, {
//           message: "OTP cooldown active. Please wait before requesting again.",
//           data: {
//             phoneNumber: phoneE164,
//             cooldownSeconds: Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast),
//           },
//           filler: {
//             phoneNumber: phoneE164,
//             cooldownSeconds: Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast),
//           },
//         });
//         throwError("otp_cooldown_active", response);
//       }
//     }

//     if (count >= OTP_MAX_REQUESTS) {
//       const response = ResponseBuilder.error(ErrorTypes.CONFLICT, {
//         message: "OTP request limit exceeded. Please try again later.",
//         data: { phoneNumber: phoneE164, windowMinutes: OTP_WINDOW_MINUTES },
//         filler: { phoneNumber: phoneE164, windowMinutes: OTP_WINDOW_MINUTES },
//       });
//       throwError("otp_rate_limit_exceeded", response);
//     }
//   }

//   private async expireOldOtps(
//     phoneE164: string,
//     session: ClientSession,
//   ): Promise<void> {
//     const result = await this.otpRepository.updateMany(
//       { phoneNumber: phoneE164, is_active: true },
//       { is_active: false, expires_at: new Date() },
//       { session },
//     );

//     if (result.modifiedCount > 0) {
//       console.log(
//         `Expired ${result.modifiedCount} old OTP(s) for ${phoneE164}`,
//       );
//     }
//   }

//   private async storeOtp(
//     object: IOtpInput,
//     session: ClientSession,
//     dbTransactions: DbTransaction[],
//   ): Promise<IOtp & Document> {
//     try {
//       const OtpDocument = new this.otpRepository(object);
//       await OtpDocument.save({ session });

//       // Log the database transaction
//       dbTransactions.push(
//         await createDbTransaction(
//           tableName.Otp,
//           apiMethods.POST,
//           operationTypes.Create,
//           OtpDocument,
//         ),
//       );

//       return OtpDocument.toObject();
//     } catch (error) {
//       rethrowIfKnown(error, "Error storing OTP", authenticationErrors);
//     }
//   }
// }

// export default new sentOtpService();
