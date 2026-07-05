import type { Request, Response, NextFunction } from 'express';
import * as monitoringService from '../services/monitoring.service.js';
import { successResponse } from '@itbengal/utils';
import { ValidationError } from '../middleware/errorHandler.js';

export async function getSiteMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const { siteId } = req.params;
    if (!siteId) {
      throw new ValidationError('siteId parameter is required');
    }
    const metrics = await monitoringService.getSiteMetrics(siteId as string);
    res.json(successResponse(metrics, 'Site metrics retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
