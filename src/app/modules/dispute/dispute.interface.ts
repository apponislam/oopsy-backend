import { Types } from "mongoose";

export enum DisputeStatusEnum {
    PENDING = "PENDING",
    UNDER_REVIEW = "UNDER_REVIEW",
    RESOLVED_REFUNDED = "RESOLVED_REFUNDED",
    RESOLVED_REJECTED = "RESOLVED_REJECTED",
    CANCELLED = "CANCELLED",
}

export enum DisputeReasonEnum {
    SERVICE_NOT_PROVIDED = "SERVICE_NOT_PROVIDED",
    POOR_SERVICE_QUALITY = "POOR_SERVICE_QUALITY",
    FACILITY_MISMATCH = "FACILITY_MISMATCH",
    HOST_ABSENT = "HOST_ABSENT",
    CUSTOMER_NO_SHOW = "CUSTOMER_NO_SHOW",
    SAFETY_OR_HYGIENE_ISSUE = "SAFETY_OR_HYGIENE_ISSUE",
    PAYMENT_DISCREPANCY = "PAYMENT_DISCREPANCY",
    OTHER = "OTHER",
}

export interface IDispute {
    _id?: Types.ObjectId;
    disputeId: string; // e.g. DSP-12345
    booking: Types.ObjectId;
    listing?: Types.ObjectId;
    payment?: Types.ObjectId;
    initiator: Types.ObjectId; // User or Host who opened the dispute
    defendant: Types.ObjectId; // The opposite party (Host or User)
    reason: DisputeReasonEnum | string;
    description: string;
    images?: string[]; // Evidence images/documents
    refundRequested?: boolean;
    refundAmount?: number;
    status: DisputeStatusEnum;
    resolutionNotes?: string;
    stripeRefundId?: string;
    resolvedBy?: Types.ObjectId; // Super Admin ID
    resolvedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IDisputeFilterOptions {
    searchTerm?: string;
    status?: DisputeStatusEnum | "ALL";
    bookingId?: string;
    initiatorId?: string;
    defendantId?: string;
    page?: number;
    limit?: number;
}
