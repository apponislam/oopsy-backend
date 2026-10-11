import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { BookingModel } from "../booking/booking.model";
import { Payment } from "../payment/payment.model";
import { DisputeReasonEnum, DisputeStatusEnum, IDispute, IDisputeFilterOptions } from "./dispute.interface";
import { DisputeModel } from "./dispute.model";
import { notificationServices } from "../notification/notification.services";
import { StripeService } from "../stripe/stripe.services";

const createDispute = async (
    userId: string,
    payload: {
        bookingId: string;
        reason: DisputeReasonEnum;
        description: string;
        images?: string[];
        refundRequested?: boolean;
        refundAmount?: number;
    },
) => {
    const { bookingId, reason, description, images = [], refundRequested = false, refundAmount } = payload;

    // 1. Find booking
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
    }

    const isCustomer = booking.user.toString() === userId;
    const isHost = booking.host.toString() === userId;

    if (!isCustomer && !isHost) {
        throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to raise a dispute for this booking");
    }

    // Check if an active dispute already exists for this booking by this user
    const existingDispute = await DisputeModel.findOne({
        booking: booking._id,
        initiator: userId,
        status: { $in: [DisputeStatusEnum.PENDING, DisputeStatusEnum.UNDER_REVIEW] },
    });

    if (existingDispute) {
        throw new ApiError(httpStatus.CONFLICT, "You already have an active dispute for this booking");
    }

    // Determine defendant
    const defendantId = isCustomer ? booking.host : booking.user;

    // Find linked payment if exists
    const payment = await Payment.findOne({ booking: booking._id });

    // Validate refund amount if requested
    const requestedRefund = refundRequested ? (refundAmount ?? booking.price) : 0;
    if (refundRequested && requestedRefund > booking.price) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Requested refund amount (${requestedRefund}) cannot exceed the booking total (${booking.price})`,
        );
    }

    const dispute = await DisputeModel.create({
        booking: booking._id,
        listing: booking.listing,
        payment: payment?._id,
        initiator: userId,
        defendant: defendantId,
        reason,
        description,
        images,
        refundRequested,
        refundAmount: requestedRefund,
        status: DisputeStatusEnum.PENDING,
    });

    const populated = await dispute.populate([
        { path: "initiator", select: "name email profileImage role" },
        { path: "defendant", select: "name email profileImage role" },
        { path: "booking", select: "bookingId date time price status" },
        { path: "listing", select: "title images address" },
    ]);

    // Send notification to defendant
    try {
        await notificationServices.sendNotification({
            receiver: defendantId.toString(),
            sender: userId,
            title: "Dispute Opened",
            message: `A dispute has been submitted for booking #${booking.bookingId}: ${reason}`,
            type: "DISPUTE",
            data: { disputeId: dispute._id, bookingId: booking._id },
        });
    } catch {
        // Continue even if notification delivery fails
    }

    return populated;
};

const getMyDisputes = async (userId: string, query: IDisputeFilterOptions) => {
    const { status, page = 1, limit = 10 } = query;

    const filter: any = {
        $or: [{ initiator: new Types.ObjectId(userId) }, { defendant: new Types.ObjectId(userId) }],
    };

    if (status && status !== "ALL") {
        filter.status = status;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const disputes = await DisputeModel.find(filter)
        .populate("initiator", "name email profileImage role")
        .populate("defendant", "name email profileImage role")
        .populate("booking", "bookingId date time price status")
        .populate("listing", "title images address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await DisputeModel.countDocuments(filter);
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
        data: disputes,
    };
};

const getAllDisputes = async (query: IDisputeFilterOptions) => {
    const { status, searchTerm, page = 1, limit = 10 } = query;

    const filter: any = {};

    if (status && status !== "ALL") {
        filter.status = status;
    }

    if (searchTerm) {
        filter.$or = [
            { disputeId: { $regex: searchTerm, $options: "i" } },
            { reason: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
        ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const disputes = await DisputeModel.find(filter)
        .populate("initiator", "name email profileImage role")
        .populate("defendant", "name email profileImage role")
        .populate("booking", "bookingId date time price status")
        .populate("listing", "title images address")
        .populate("resolvedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await DisputeModel.countDocuments(filter);
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
        data: disputes,
    };
};

const getSingleDispute = async (id: string, user: { _id: string; role: string }) => {
    const dispute = await DisputeModel.findById(id)
        .populate("initiator", "name email profileImage role")
        .populate("defendant", "name email profileImage role")
        .populate("booking")
        .populate("listing", "title images address")
        .populate("payment")
        .populate("resolvedBy", "name email");

    if (!dispute) {
        throw new ApiError(httpStatus.NOT_FOUND, "Dispute not found");
    }

    // Allow Super Admin, initiator, or defendant to view
    const isAuthorized =
        user.role === "SUPER_ADMIN" ||
        dispute.initiator?._id?.toString() === user._id.toString() ||
        dispute.defendant?._id?.toString() === user._id.toString();

    if (!isAuthorized) {
        throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to view this dispute");
    }

    return dispute;
};

const cancelDispute = async (id: string, userId: string) => {
    const dispute = await DisputeModel.findById(id);
    if (!dispute) {
        throw new ApiError(httpStatus.NOT_FOUND, "Dispute not found");
    }

    if (dispute.initiator.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Only the user who raised the dispute can cancel it");
    }

    if (dispute.status !== DisputeStatusEnum.PENDING) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot cancel a dispute that is already under review or resolved");
    }

    dispute.status = DisputeStatusEnum.CANCELLED;
    dispute.resolutionNotes = "Cancelled by initiator";
    dispute.resolvedAt = new Date();
    await dispute.save();

    return dispute;
};

const resolveDisputeByAdmin = async (
    adminId: string,
    id: string,
    payload: {
        status: DisputeStatusEnum.RESOLVED_REFUNDED | DisputeStatusEnum.RESOLVED_REJECTED | DisputeStatusEnum.UNDER_REVIEW;
        resolutionNotes?: string;
    },
) => {
    const { status, resolutionNotes } = payload;

    const dispute = await DisputeModel.findById(id);
    if (!dispute) {
        throw new ApiError(httpStatus.NOT_FOUND, "Dispute not found");
    }

    if ([DisputeStatusEnum.RESOLVED_REFUNDED, DisputeStatusEnum.RESOLVED_REJECTED, DisputeStatusEnum.CANCELLED].includes(dispute.status)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "This dispute has already been concluded");
    }

    // If admin is granting a refund, process it via Stripe
    if (status === DisputeStatusEnum.RESOLVED_REFUNDED) {
        // Find payment associated with this dispute/booking
        const payment =
            (dispute.payment ? await Payment.findById(dispute.payment) : null) ||
            (await Payment.findOne({ booking: dispute.booking, status: "PAID" }));

        if (!payment) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Cannot issue refund: No completed payment found for this disputed booking",
            );
        }

        const refundAmount = dispute.refundAmount && dispute.refundAmount > 0 ? dispute.refundAmount : undefined;

        // Process refund through Stripe service
        const refundResult = await StripeService.processRefund({
            transactionId: payment._id.toString(),
            amount: refundAmount,
            reason: resolutionNotes || `Dispute resolution #${dispute.disputeId}`,
        });

        if (refundResult?.refund?.id) {
            dispute.stripeRefundId = refundResult.refund.id;
        }

        // Update dispute audit fields on original payment record
        await Payment.findByIdAndUpdate(payment._id, {
            $set: {
                isDisputed: true,
                disputeResolvedAt: new Date(),
                disputeResolutionNotes: resolutionNotes || `Refund issued via Dispute #${dispute.disputeId}`,
            },
        });

        // Update booking status and refund status if appropriate
        await BookingModel.findByIdAndUpdate(dispute.booking, {
            $set: {
                status: "CANCELLED",
                cancelReason: `Refunded via Dispute #${dispute.disputeId}`,
            },
        });
    }

    dispute.status = status;
    dispute.resolutionNotes = resolutionNotes || dispute.resolutionNotes;
    if (status !== DisputeStatusEnum.UNDER_REVIEW) {
        dispute.resolvedBy = new Types.ObjectId(adminId);
        dispute.resolvedAt = new Date();
    }

    await dispute.save();

    const populated = await dispute.populate([
        { path: "initiator", select: "name email profileImage role" },
        { path: "defendant", select: "name email profileImage role" },
        { path: "booking", select: "bookingId date time price status" },
        { path: "resolvedBy", select: "name email" },
    ]);

    // Send notifications to initiator and defendant
    const message =
        status === DisputeStatusEnum.RESOLVED_REFUNDED
            ? `Your dispute #${dispute.disputeId} has been resolved with a refund decision.`
            : status === DisputeStatusEnum.RESOLVED_REJECTED
            ? `Your dispute #${dispute.disputeId} has been reviewed and rejected.`
            : `Your dispute #${dispute.disputeId} status is now under review.`;

    try {
        await Promise.all([
            notificationServices.sendNotification({
                receiver: dispute.initiator.toString(),
                sender: adminId,
                title: "Dispute Status Updated",
                message,
                type: "DISPUTE",
                data: { disputeId: dispute._id, status },
            }),
            notificationServices.sendNotification({
                receiver: dispute.defendant.toString(),
                sender: adminId,
                title: "Dispute Status Updated",
                message,
                type: "DISPUTE",
                data: { disputeId: dispute._id, status },
            }),
        ]);
    } catch {
        // Notification failure is non-blocking
    }

    return populated;
};

export const disputeServices = {
    createDispute,
    getMyDisputes,
    getAllDisputes,
    getSingleDispute,
    cancelDispute,
    resolveDisputeByAdmin,
};
