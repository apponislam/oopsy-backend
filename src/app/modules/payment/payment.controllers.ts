import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { PaymentService } from "./payment.services";
import { StripeService } from "../stripe/stripe.services";
import { StripeWebhookService } from "../stripe/stripe.webhook";

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

const createPayment = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await PaymentService.createPayment({
        payer: userId,
        ...req.body,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Payment created successfully",
        data: result,
    });
});

const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { searchTerm, type, page, limit } = req.query;

    const result = await PaymentService.getPaymentHistory(userId, {
        searchTerm: searchTerm as string,
        type: type as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment history fetched successfully",
        stats: result.summary,
        meta: result.meta,
        data: result.data,
    });
});

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user._id;

    const result = await PaymentService.getSinglePayment(id, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment details fetched successfully",
        data: result,
    });
});

// SUPER_ADMIN: Get all platform payments
const getAllPaymentsForAdmin = catchAsync(async (req: Request, res: Response) => {
    const { searchTerm, type, page, limit } = req.query;

    const result = await PaymentService.getAllPaymentsForAdmin({
        searchTerm: searchTerm as string,
        type: type as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin all payments fetched successfully",
        stats: result.summary,
        meta: result.meta,
        data: result.data,
    });
});

// SUPER_ADMIN: Get single payment details
const getSinglePaymentForAdmin = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const result = await PaymentService.getSinglePaymentForAdmin(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin payment details fetched successfully",
        data: result,
    });
});

export const PaymentController = {
    createPaymentIntent,
    processRefund,
    handleStripeWebhook,
    createPayment,
    getPaymentHistory,
    getSinglePayment,
    getAllPaymentsForAdmin,
    getSinglePaymentForAdmin,
};
