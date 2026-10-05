import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { IReport, ReportStatusEnum } from "./report.interface";
import { ReportModel } from "./report.model";

const createReport = async (reporterId: string, payload: Partial<IReport>) => {
    const report = await ReportModel.create({
        ...payload,
        reporter: reporterId,
    });
    return report;
};

const getAllReports = async (query: any) => {
    const { status, reportType, page = 1, limit = 10 } = query;

    const filter: any = {};

    if (status) {
        filter.status = status;
    }

    if (reportType) {
        filter.reportType = reportType;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const reports = await ReportModel.find(filter)
        .populate("reporter", "name email profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await ReportModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNumber);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: reports,
    };
};

const getSingleReport = async (id: string) => {
    const report = await ReportModel.findById(id).populate("reporter", "name email profileImage");
    if (!report) {
        throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
    }
    return report;
};

const updateReportStatus = async (id: string, payload: { status: ReportStatusEnum; adminNotes?: string }) => {
    const report = await ReportModel.findById(id);
    if (!report) {
        throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
    }

    const updatedReport = await ReportModel.findByIdAndUpdate(
        id,
        { $set: payload },
        { returnDocument: "after", runValidators: true },
    ).populate("reporter", "name email profileImage");

    return updatedReport;
};

export const reportServices = {
    createReport,
    getAllReports,
    getSingleReport,
    updateReportStatus,
};
