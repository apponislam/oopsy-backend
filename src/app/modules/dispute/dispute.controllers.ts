import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { disputeServices } from "./dispute.services";

const createDispute = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any)._id;
    const result = await disputeServices.createDispute(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Dispute submitted successfully",
        data: result,
    });
});

const getMyDisputes = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any)._id;
    const result = await disputeServices.getMyDisputes(userId, req.query as any);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your disputes retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getAllDisputes = catchAsync(async (req: Request, res: Response) => {
    const result = await disputeServices.getAllDisputes(req.query as any);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Disputes retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getSingleDispute = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = req.user as any;
    const result = await disputeServices.getSingleDispute(id, user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dispute details retrieved successfully",
        data: result,
    });
});

const cancelDispute = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req.user as any)._id;
    const result = await disputeServices.cancelDispute(id, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dispute cancelled successfully",
        data: result,
    });
});

const resolveDisputeByAdmin = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const adminId = (req.user as any)._id;
    const result = await disputeServices.resolveDisputeByAdmin(adminId, id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dispute updated/resolved successfully",
        data: result,
    });
});

export const disputeControllers = {
    createDispute,
    getMyDisputes,
    getAllDisputes,
    getSingleDispute,
    cancelDispute,
    resolveDisputeByAdmin,
};
