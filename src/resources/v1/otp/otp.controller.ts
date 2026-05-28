import { Request, Response } from "express";
class otpController {
  async Send(req: Request, res: Response) {}
  async Verify(req: Request, res: Response) {}
  async Resend(req: Request, res: Response) {}
}

export default new otpController();
