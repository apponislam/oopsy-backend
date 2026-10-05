import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { StripeService } from "../stripe/stripe.services";

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

export const WithdrawController = {
    createConnectAccount,
    createAccountLink,
    handleStripeReturn,
    handleStripeReauth,
};
