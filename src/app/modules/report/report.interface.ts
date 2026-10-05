import { Types } from "mongoose";

export enum ReportTypeEnum {
    LISTING = "LISTING",
    USER = "USER",
}

export enum ReportStatusEnum {
    PENDING = "PENDING",
    RESOLVED = "RESOLVED",
    DISMISSED = "DISMISSED",
}

export interface IReport {
    _id?: Types.ObjectId;
    reporter: Types.ObjectId;
    reportType: ReportTypeEnum;
    targetId: Types.ObjectId;
    reason: string;
    details?: string;
    status?: ReportStatusEnum;
    adminNotes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
