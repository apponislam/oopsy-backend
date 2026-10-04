import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { TransactionService } from "./transaction.services";
import { StripeService } from "../stripe/stripe.services";
import { StripeWebhookService } from "../stripe/stripe.webhook";
import config from "../../config";

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
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
    const userId = (req as any).user._id;
    const result = await TransactionService.createTransaction({
        payer: userId,
        ...req.body,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Transaction created successfully",
        data: result,
    });
});

const getTransactionHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
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

const getSingleTransaction = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user._id;

    const result = await TransactionService.getSingleTransaction(id, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Transaction details fetched successfully",
        data: result,
    });
});

// SUPER_ADMIN: Get all platform transactions
const getAllTransactionsForAdmin = catchAsync(async (req: Request, res: Response) => {
    const { searchTerm, type, page, limit } = req.query;

    const result = await TransactionService.getAllTransactionsForAdmin({
        searchTerm: searchTerm as string,
        type: type as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin all transactions fetched successfully",
        stats: result.summary,
        meta: result.meta,
        data: result.data,
    });
});

// SUPER_ADMIN: Get single transaction details
const getSingleTransactionForAdmin = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const result = await TransactionService.getSingleTransactionForAdmin(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin transaction details fetched successfully",
        data: result,
    });
});

const requestPayout = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { amount, remarks } = req.body;

    const result = await TransactionService.requestPayout(userId, Number(amount), remarks);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payout request submitted successfully. Waiting for admin approval.",
        data: result,
    });
});

const acceptPayout = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await TransactionService.acceptPayout(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payout request accepted successfully",
        data: result,
    });
});

const rejectPayout = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await TransactionService.rejectPayout(id as string, reason);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payout request rejected and amount refunded to user balance",
        data: result,
    });
});

const createConnectAccount = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const email = (req as any).user.email;

    const result = await StripeService.createConnectAccount(userId, email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stripe Connect account created successfully",
        data: result,
    });
});

const createAccountLink = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { returnUrl, refreshUrl } = req.body;

    const result = await StripeService.createAccountLink(userId, returnUrl, refreshUrl);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stripe Connect onboarding link generated successfully",
        data: result,
    });
});

const handleStripeReturn = catchAsync(async (req: Request, res: Response) => {
    res.redirect("oopsy://withdraw/onboarding-complete");
});

const handleStripeReauth = catchAsync(async (req: Request, res: Response) => {
    res.redirect("oopsy://withdraw/onboarding-reauth");
});

export const TransactionController = {
    createPaymentIntent,
    processRefund,
    handleStripeWebhook,
    createTransaction,
    getTransactionHistory,
    getSingleTransaction,
    getAllTransactionsForAdmin,
    getSingleTransactionForAdmin,
    requestPayout,
    acceptPayout,
    rejectPayout,
    createConnectAccount,
    createAccountLink,
    handleStripeReturn,
    handleStripeReauth,
};
