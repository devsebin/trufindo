import { Request, Response } from "express";

class countryController {
  async Index(req: Request, res: Response) {}
  async Store(req: Request, res: Response) {}
  async Show(req: Request, res: Response) {}
  async Update(req: Request, res: Response) {}
  async Delete(req: Request, res: Response) {}
  async Search(req: Request, res: Response) {}
  async import(req: Request, res: Response) {}
  async export(req: Request, res: Response) {}
  async exportTemplate(req: Request, res: Response) {}
  async activate(req: Request, res: Response) {}
  async deactivate(req: Request, res: Response) {}
}

export default new countryController();
