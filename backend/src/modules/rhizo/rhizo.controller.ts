import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import rhizoService from './rhizo.service';

class RhizoController {
  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const result = await rhizoService.handleEvent(req.body);
    return res.status(200).json(result);
  });
}

export default new RhizoController();
