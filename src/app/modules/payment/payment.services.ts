import { Payment } from "./payment.model";
import { IPayment, IPaymentFilterOptions } from "./payment.interface";
import { Types } from "mongoose";

// Create a new payment record
const createPayment = async (payload: Partial<IPayment>): Promise<IPayment> => {
    const newPayment = await Payment.create(payload);
    return newPayment;
};

// Get payment history for a user (as payer or receiver) with filters & search
const getPaymentHistory = async (userId: string, filters: IPaymentFilterOptions) => {
    const { searchTerm, status, page = 1, limit = 10 } = filters;
    const userObjId = new Types.ObjectId(userId);
    const query: any = {
        $or: [{ payer: userObjId }, { receiver: userObjId }],
    };

    if (status && status !== "ALL") {
        query.status = status;
    }

    if (searchTerm) {
        query.$and = [
            {
                $or: [{ title: { $regex: searchTerm, $options: "i" } }, { paymentId: { $regex: searchTerm, $options: "i" } }],
            },
        ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("payer", "name email phone profileImage")
        .populate("receiver", "name email phone profileImage")
        .populate("listing", "title price images");

    const total = await Payment.countDocuments(query);
    const totalPages = Math.ceil(total / limitNumber);

    // Calculate aggregated metrics for user (Received, Paid, Net)
    const metricsAggregate = await Payment.aggregate([
        {
            $match: {
                $or: [{ payer: userObjId }, { receiver: userObjId }],
            },
        },
        {
            $group: {
                _id: null,
                totalPaid: {
                    $sum: {
                        $cond: [{ $eq: ["$payer", userObjId] }, "$amount", 0],
                    },
                },
                totalReceived: {
                    $sum: {
                        $cond: [{ $eq: ["$receiver", userObjId] }, "$amount", 0],
                    },
                },
            },
        },
    ]);

    const totalPaid = metricsAggregate[0]?.totalPaid || 0;
    const totalReceived = metricsAggregate[0]?.totalReceived || 0;

    return {
        summary: {
            totalPaid,
            totalReceived,
            net: totalReceived - totalPaid,
        },
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: payments,
    };
};

// SUPER_ADMIN: Get all payments across the platform
const getAllPaymentsForAdmin = async (filters: IPaymentFilterOptions) => {
    const { searchTerm, status, page = 1, limit = 10 } = filters;
    const query: any = {};

    if (status && status !== "ALL") {
        query.status = status;
    }

    if (searchTerm) {
        query.$or = [{ title: { $regex: searchTerm, $options: "i" } }, { paymentId: { $regex: searchTerm, $options: "i" } }];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("payer", "name email phone profileImage role")
        .populate("receiver", "name email phone profileImage role")
        .populate("listing", "title price images");

    const total = await Payment.countDocuments(query);
    const totalPages = Math.ceil(total / limitNumber);

    // Calculate system-wide aggregated metrics
    const metricsAggregate = await Payment.aggregate([
        {
            $group: {
                _id: null,
                totalPaid: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "PAID"] }, "$amount", 0],
                    },
                },
                totalRefunded: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "REFUNDED"] }, "$amount", 0],
                    },
                },
            },
        },
    ]);

    const totalPaid = metricsAggregate[0]?.totalPaid || 0;
    const totalRefunded = metricsAggregate[0]?.totalRefunded || 0;

    return {
        summary: {
            totalPaid,
            totalRefunded,
            net: totalPaid - totalRefunded,
        },
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: payments,
    };
};

// Get single payment details by ID
const getSinglePayment = async (id: string, userId?: string) => {
    const query: any = { _id: id };
    if (userId) {
        const userObjId = new Types.ObjectId(userId);
        query.$or = [{ payer: userObjId }, { receiver: userObjId }];
    }

    const payment = await Payment.findOne(query)
        .populate("payer", "name email phone profileImage")
        .populate("receiver", "name email phone profileImage")
        .populate("listing", "title price images location");

    return payment;
};

// SUPER_ADMIN: Get single payment details by ID (unrestricted)
const getSinglePaymentForAdmin = async (id: string) => {
    const payment = await Payment.findById(id)
        .populate("payer", "name email phone profileImage role")
        .populate("receiver", "name email phone profileImage role")
        .populate("listing", "title price images location");

    return payment;
};

export const PaymentService = {
    createPayment,
    getPaymentHistory,
    getAllPaymentsForAdmin,
    getSinglePayment,
    getSinglePaymentForAdmin,
};
