import mongoose, { ClientSession, Model } from "mongoose";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";

class getDeclaimerVersionHelperService {
  private readonly declaimerRepository: Model<IDeclaimer>;

  constructor() {
    this.declaimerRepository = DeclaimerModel;
  }

  public async execute(
    key: string,
    language: string,
    country: string,
    session: ClientSession,
  ): Promise<number> {
    const lastDeclaimer = await this.declaimerRepository
      .findOne({ key, language, country })
      .sort({ version: -1 })
      .lean()
      .session(session);

    if (!lastDeclaimer) return 1;
    return lastDeclaimer.version + 1;
  }
}

export default new getDeclaimerVersionHelperService();
