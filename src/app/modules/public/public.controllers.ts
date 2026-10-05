import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { publicServices } from "./public.services";
import { PolicyTypeEnum } from "./public.interface";

const upsertPolicy = catchAsync(async (req: Request, res: Response) => {
    const { type, title, content } = req.body;
    const result = await publicServices.upsertPolicy(type, title, content);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Policy saved successfully",
        data: result,
    });
});

const getPolicyByType = catchAsync(async (req: Request, res: Response) => {
    const type = req.params.type as PolicyTypeEnum;
    const result = await publicServices.getPolicyByType(type);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Policy retrieved successfully",
        data: result,
    });
});

export const publicControllers = {
    upsertPolicy,
    getPolicyByType,
};
