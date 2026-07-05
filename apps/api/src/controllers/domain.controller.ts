import type { Request, Response, NextFunction } from 'express';
import * as domainService from '../services/domain.service.js';
import { successResponse } from '@itbengal/utils';
import { ValidationError } from '../middleware/errorHandler.js';

export async function searchDomains(req: Request, res: Response, next: NextFunction) {
  try {
    const { domainName } = req.body;
    if (!domainName) {
      throw new ValidationError('domainName is required in body');
    }
    const results = await domainService.searchDomains(domainName);
    res.json(successResponse(results, 'Domain availability check completed'));
  } catch (error) {
    next(error);
  }
}

export async function listDomains(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    const domains = await domainService.listDomains(orgId);
    res.json(successResponse(domains, 'Domains retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getDomainDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    if (!id) {
      throw new ValidationError('Domain ID parameter is required');
    }

    const domain = await domainService.getDomainDetails(id as string, orgId);
    res.json(successResponse(domain, 'Domain details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function registerDomain(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const { domainName, tld } = req.body;

    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    if (!domainName || !tld) {
      throw new ValidationError('domainName and tld are required in body');
    }

    const result = await domainService.requestDomainRegistration(orgId, domainName, tld);
    res.status(201).json(successResponse(result, 'Domain registration request submitted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function toggleWhoisPrivacy(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const { id } = req.params;
    const { enabled } = req.body;

    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    if (!id) {
      throw new ValidationError('Domain ID parameter is required');
    }
    if (enabled === undefined) {
      throw new ValidationError('enabled is required in body');
    }

    const result = await domainService.toggleWhoisPrivacy(id as string, orgId, enabled);
    res.json(successResponse(result, 'WHOIS privacy status updated'));
  } catch (error) {
    next(error);
  }
}

export async function addDnsRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    if (!id) {
      throw new ValidationError('Domain ID parameter is required');
    }

    const result = await domainService.addDnsRecord(id as string, orgId, req.body);
    res.status(201).json(successResponse(result, 'DNS record added successfully'));
  } catch (error) {
    next(error);
  }
}

export async function updateDnsRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const { id, recordId } = req.params;

    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    if (!id || !recordId) {
      throw new ValidationError('Domain ID and Record ID parameters are required');
    }

    const result = await domainService.updateDnsRecord(id as string, orgId, recordId as string, req.body);
    res.json(successResponse(result, 'DNS record updated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteDnsRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const { id, recordId } = req.params;

    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    if (!id || !recordId) {
      throw new ValidationError('Domain ID and Record ID parameters are required');
    }

    await domainService.deleteDnsRecord(id as string, orgId, recordId as string);
    res.json(successResponse({ success: true }, 'DNS record deleted successfully'));
  } catch (error) {
    next(error);
  }
}
