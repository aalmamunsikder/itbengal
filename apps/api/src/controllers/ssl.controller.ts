import type { Request, Response, NextFunction } from 'express';
import * as sslService from '../services/ssl.service.js';
import { successResponse } from '@itbengal/utils';
import { ValidationError } from '../middleware/errorHandler.js';

export async function getCertificates(req: Request, res: Response, next: NextFunction) {
  try {
    const { applicationId } = req.params;
    if (!applicationId) {
      throw new ValidationError('applicationId parameter is required');
    }
    const certs = await sslService.getCertificates(applicationId as string);
    res.json(successResponse(certs, 'SSL certificates retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function checkDns(req: Request, res: Response, next: NextFunction) {
  try {
    const { domainName } = req.body;
    if (!domainName) {
      throw new ValidationError('domainName is required in body');
    }
    const result = await sslService.checkDnsConfig(domainName);
    res.json(successResponse(result, 'DNS check completed'));
  } catch (error) {
    next(error);
  }
}

export async function provisionCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const { applicationId, domainName } = req.body;
    if (!applicationId || !domainName) {
      throw new ValidationError('applicationId and domainName are required in body');
    }
    const result = await sslService.provisionCertificate(applicationId, domainName);
    res.status(201).json(successResponse(result, 'SSL certificate provisioned successfully'));
  } catch (error) {
    next(error);
  }
}

export async function renewCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const { certificateId } = req.params;
    if (!certificateId) {
      throw new ValidationError('certificateId parameter is required');
    }
    const result = await sslService.renewCertificate(certificateId as string);
    res.json(successResponse(result, 'SSL certificate renewed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function listApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ValidationError('Organization ID not found in token');
    }
    const apps = await sslService.getApplications(orgId);
    res.json(successResponse(apps, 'Applications retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
