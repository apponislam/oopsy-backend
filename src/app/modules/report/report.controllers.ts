import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { reportServices } from "./report.services";

const createReport = catchAsync(async (req: Request, res: Response) => {
    const reporterId = (req.user as any)._id;
    const result = await reportServices.createReport(reporterId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Report submitted successfully",
        data: result,
    });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
    const result = await reportServices.getAllReports(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reports retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getSingleReport = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await reportServices.getSingleReport(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Report details retrieved successfully",
        data: result,
    });
});

const updateReportStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await reportServices.updateReportStatus(id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Report status updated successfully",
        data: result,
    });
});

export const reportControllers = {
    createReport,
    getAllReports,
    getSingleReport,
    updateReportStatus,
};
