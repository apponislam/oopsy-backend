import mongoose, { Schema } from "mongoose";
import { IReport, ReportTypeEnum, ReportStatusEnum } from "./report.interface";

const ReportSchema = new Schema<IReport>(
    {
        reporter: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportType: {
            type: String,
            enum: Object.values(ReportTypeEnum),
            required: [true, "Report type is required"],
        },
        targetId: {
            type: Schema.Types.ObjectId,
            required: [true, "Target ID is required"],
        },
        reason: {
            type: String,
            required: [true, "Reason is required"],
            trim: true,
        },
        details: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: Object.values(ReportStatusEnum),
            default: ReportStatusEnum.PENDING,
        },
        adminNotes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

ReportSchema.index({ reporter: 1, targetId: 1, reportType: 1 });
ReportSchema.index({ status: 1 });

export const ReportModel = mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);
