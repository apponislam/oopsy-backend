import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { WithdrawService } from "./withdraw.services";

const createConnectAccount = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const email = (req as any).user.email;

    const result = await WithdrawService.createConnectAccount(userId, email);

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

    const result = await WithdrawService.createAccountLink(userId, returnUrl, refreshUrl);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stripe Connect onboarding link generated successfully",
        data: result,
    });
});

const requestPayout = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { amount, remarks } = req.body;

    const result = await WithdrawService.requestPayout(userId, Number(amount), remarks);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payout request submitted successfully. Waiting for admin approval.",
        data: result,
    });
});

const acceptPayout = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await WithdrawService.acceptPayout(id as string);

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

    const result = await WithdrawService.rejectPayout(id as string, reason);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payout request rejected and amount refunded to user balance",
        data: result,
    });
});

const getUserWithdrawals = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { searchTerm, status, page, limit } = req.query;

    const result = await WithdrawService.getUserWithdrawals(userId, {
        searchTerm: searchTerm as string,
        status: status as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User withdrawals fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getAllWithdrawalsForAdmin = catchAsync(async (req: Request, res: Response) => {
    const { searchTerm, status, page, limit } = req.query;

    const result = await WithdrawService.getAllWithdrawalsForAdmin({
        searchTerm: searchTerm as string,
        status: status as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin withdrawals fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getSingleWithdrawal = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user._id;

    const result = await WithdrawService.getSingleWithdrawal(id as string, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Withdrawal details fetched successfully",
        data: result,
    });
});

const handleStripeReturn = catchAsync(async (req: Request, res: Response) => {
    res.redirect("oopsy://withdraw/onboarding-complete");
});

const handleStripeReauth = catchAsync(async (req: Request, res: Response) => {
    res.redirect("oopsy://withdraw/onboarding-reauth");
});

export const WithdrawController = {
    createConnectAccount,
    createAccountLink,
    requestPayout,
    acceptPayout,
    rejectPayout,
    getUserWithdrawals,
    getAllWithdrawalsForAdmin,
    getSingleWithdrawal,
    handleStripeReturn,
    handleStripeReauth,
};
