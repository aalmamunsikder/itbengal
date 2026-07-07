import type { Request, Response, NextFunction } from 'express';
import * as billingService from '../services/billing.service.js';
import { successResponse } from '@itbengal/utils';
import { ValidationError } from '../middleware/errorHandler.js';

export async function getPlans(_req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await billingService.getPlans();
    res.json(successResponse(plans, 'Plans retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    const sub = await billingService.getSubscription(orgId);
    res.json(successResponse(sub, 'Subscription retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    const invoices = await billingService.getInvoices(orgId);
    res.json(successResponse(invoices, 'Invoices retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function subscribeToPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const { planId } = req.body;

    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    if (!planId) {
      throw new ValidationError('Missing planId');
    }

    const result = await billingService.createSubscription(orgId, planId);
    res.status(201).json(successResponse(result, 'Subscription request created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function payManualBkash(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const { invoiceId, senderNumber, trxId, amount } = req.body;

    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    if (!invoiceId || !senderNumber || !trxId || !amount) {
      throw new ValidationError('Missing required billing fields');
    }

    const result = await billingService.payBkash(
      orgId,
      invoiceId,
      senderNumber,
      trxId,
      Number(amount)
    );
    res.status(201).json(successResponse(result, 'bKash payment claim submitted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function approvePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      throw new ValidationError('Missing paymentId');
    }

    const result = await billingService.approveBkashPayment(paymentId);
    res.json(successResponse(result, 'Payment claim approved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function checkoutCart(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const { items } = req.body;

    if (!orgId) {
      throw new ValidationError('Organization ID header is missing');
    }
    if (!items || !Array.isArray(items)) {
      throw new ValidationError('Missing or invalid items array in request body');
    }

    const result = await billingService.checkoutCart(orgId, items);
    res.status(201).json(successResponse(result, 'Checkout completed successfully, invoice generated'));
  } catch (error) {
    next(error);
  }
}
