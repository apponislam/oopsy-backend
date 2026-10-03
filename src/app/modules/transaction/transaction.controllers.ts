import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { TransactionService } from "./transaction.services";
import { StripeService } from "./stripe.services";
import { StripeWebhookService } from "./stripe.webhook";

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?._id || req.body.user;
    const { amount, title, listingId } = req.body;

    const result = await StripeService.createPaymentIntent({
        amount,
        user: userId,
        title,
        listingId,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment intent created successfully",
        data: result,
    });
});

const processRefund = catchAsync(async (req: Request, res: Response) => {
    const { transactionId, amount, reason } = req.body;

    const result = await StripeService.processRefund({
        transactionId,
        amount,
        reason,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Refund processed successfully",
        data: result,
    });
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    const result = await StripeWebhookService.handleStripeWebhook(signature, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Webhook processed successfully",
        data: result,
    });
});

const createTransaction = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?._id || req.body.user;
    const result = await TransactionService.createTransaction({
        ...req.body,
        user: userId,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Transaction created successfully",
        data: result,
    });
});

const getTransactionHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?._id || (req.query.userId as string);
    const { searchTerm, type, page, limit } = req.query;

    const result = await TransactionService.getTransactionHistory(userId, {
        searchTerm: searchTerm as string,
        type: type as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Transaction history fetched successfully",
        stats: result.summary,
        meta: result.meta,
        data: result.data,
    });
});

export const TransactionController = {
    createPaymentIntent,
    processRefund,
    handleStripeWebhook,
    createTransaction,
    getTransactionHistory,
};
