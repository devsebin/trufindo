// import { Request, Response, NextFunction } from "express";
// import token from "@/utils/token";
// import UserModel from "@/database/users/users-db-model";
// import Token from "@/utils/interfaces/token.interface";
// import { errorResponse } from "@/utils/responses/error.response";
// import jwt from "jsonwebtoken";
// import {
//   errorMessages,
//   statusCodes,
// } from "@/utils/definitions/constants/common";
// import RefreshSessionModel from "@/database/auth-sessions/auth-session-db-model";
// import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";

// async function authenticate(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<Response | void> {
//   const bearer = req.headers.authorization;

//   if (!bearer || !bearer.startsWith("Bearer ")) {
//     return res
//       .status(statusCodes.Unauthorized)
//       .json(
//         errorResponse(
//           errorMessages.AuthenticationRequired,
//           statusCodes.Unauthorized,
//         ),
//       );
//   }

//   const accessToken = bearer.split("Bearer ")[1].trim();
//   try {
//     const payload: Token | jwt.JsonWebTokenError =
//       await token.verifyToken(accessToken);

//     if (payload instanceof jwt.JsonWebTokenError) {
//       return res
//         .status(statusCodes.Unauthorized)
//         .json(
//           errorResponse(
//             errorMessages.AuthenticationRequired,
//             statusCodes.Unauthorized,
//           ),
//         );
//     }

//     if (payload.jti) {
//       const session = await RefreshSessionModel.findOne({
//         tokenId: payload.jti,
//       });
//       if (!session || session.isRevoked) {
//         const response = ResponseBuilder.permissionError(
//           ErrorTypes.UNAUTHORIZED,
//           {
//             message: "You are not logged in. Please log in to continue.",
//           },
//         );
//         return res
//           .status(statusCodes.Unauthorized)
//           .json(
//             errorResponse(
//               errorMessages.AuthenticationRequired,
//               statusCodes.Unauthorized,
//               [response],
//             ),
//           );
//       }
//     }

//     const user = await UserModel.findById(payload.id)
//       .select("-password")
//       .exec();

//     if (!user) {
//       return res
//         .status(statusCodes.Unauthorized)
//         .json(
//           errorResponse(
//             errorMessages.AuthenticationRequired,
//             statusCodes.Unauthorized,
//           ),
//         );
//     }

//     req.user = user;

//     return next();
//   } catch (error) {
//     if (error instanceof jwt.JsonWebTokenError) {
//       return res
//         .status(statusCodes.Unauthorized)
//         .json(
//           errorResponse(
//             errorMessages.AuthenticationRequired,
//             statusCodes.Unauthorized,
//           ),
//         );
//     }
//     return res
//       .status(statusCodes.Unauthorized)
//       .json(
//         errorResponse(errorMessages.SomethingWentWrong, statusCodes.BadRequest),
//       );
//   }
// }

// export default authenticate;
