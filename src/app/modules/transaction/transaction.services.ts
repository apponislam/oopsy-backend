import { Transaction } from './transaction.model';
import { ITransaction, ITransactionFilterOptions } from './transaction.interface';
import { Types } from 'mongoose';

// Create a new transaction manually
const createTransaction = async (payload: Partial<ITransaction>): Promise<ITransaction> => {
    const newTransaction = await Transaction.create(payload);
    return newTransaction;
};

// Get transaction history for a user (as payer or receiver) with filters & search
const getTransactionHistory = async (userId: string, filters: ITransactionFilterOptions) => {
    const { searchTerm, type, page = 1, limit = 10 } = filters;
    const userObjId = new Types.ObjectId(userId);
    const query: any = {
        $or: [{ payer: userObjId }, { receiver: userObjId }, { user: userObjId }],
    };

    if (type && type !== 'ALL') {
        if (type === 'BOOKINGS') query.type = 'BOOKING';
        else if (type === 'PAYOUTS') query.type = 'PAYOUT';
        else if (type === 'REFUNDS') query.type = 'REFUND';
    }

    if (searchTerm) {
        query.$and = [
            {
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { transactionId: { $regex: searchTerm, $options: 'i' } },
                ],
            },
        ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate('payer', 'name email phone profileImage')
        .populate('receiver', 'name email phone profileImage')
        .populate('listing', 'title price images');

    const total = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(total / limitNumber);

    // Calculate aggregated transaction metrics for user (Received, Paid, Net)
    const metricsAggregate = await Transaction.aggregate([
        {
            $match: {
                $or: [{ payer: userObjId }, { receiver: userObjId }, { user: userObjId }],
            },
        },
        {
            $group: {
                _id: null,
                totalPaid: {
                    $sum: {
                        $cond: [{ $eq: ['$payer', userObjId] }, '$amount', 0],
                    },
                },
                totalReceived: {
                    $sum: {
                        $cond: [{ $eq: ['$receiver', userObjId] }, '$amount', 0],
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
        data: transactions,
    };
};

// SUPER_ADMIN: Get all transactions across the platform
const getAllTransactionsForAdmin = async (filters: ITransactionFilterOptions) => {
    const { searchTerm, type, page = 1, limit = 10 } = filters;
    const query: any = {};

    if (type && type !== 'ALL') {
        if (type === 'BOOKINGS') query.type = 'BOOKING';
        else if (type === 'PAYOUTS') query.type = 'PAYOUT';
        else if (type === 'REFUNDS') query.type = 'REFUND';
    }

    if (searchTerm) {
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { transactionId: { $regex: searchTerm, $options: 'i' } },
        ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate('payer', 'name email phone profileImage role')
        .populate('receiver', 'name email phone profileImage role')
        .populate('listing', 'title price images');

    const total = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(total / limitNumber);

    // Calculate system-wide aggregated metrics
    const metricsAggregate = await Transaction.aggregate([
        {
            $group: {
                _id: null,
                totalPaid: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'BOOKING'] }, '$amount', 0],
                    },
                },
                totalRefunded: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'REFUND'] }, '$amount', 0],
                    },
                },
                totalPayouts: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'PAYOUT'] }, '$amount', 0],
                    },
                },
            },
        },
    ]);

    const totalPaid = metricsAggregate[0]?.totalPaid || 0;
    const totalRefunded = metricsAggregate[0]?.totalRefunded || 0;
    const totalPayouts = metricsAggregate[0]?.totalPayouts || 0;

    return {
        summary: {
            totalPaid,
            totalRefunded,
            totalPayouts,
            net: totalPaid - totalRefunded - totalPayouts,
        },
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: transactions,
    };
};

// Get single transaction details by ID
const getSingleTransaction = async (id: string, userId?: string) => {
    const query: any = { _id: id };
    if (userId) {
        const userObjId = new Types.ObjectId(userId);
        query.$or = [{ payer: userObjId }, { receiver: userObjId }, { user: userObjId }];
    }

    const transaction = await Transaction.findOne(query)
        .populate('payer', 'name email phone profileImage')
        .populate('receiver', 'name email phone profileImage')
        .populate('listing', 'title price images location');

    return transaction;
};

// SUPER_ADMIN: Get single transaction details by ID (unrestricted)
const getSingleTransactionForAdmin = async (id: string) => {
    const transaction = await Transaction.findById(id)
        .populate('payer', 'name email phone profileImage role')
        .populate('receiver', 'name email phone profileImage role')
        .populate('listing', 'title price images location');

    return transaction;
};

export const TransactionService = {
    createTransaction,
    getTransactionHistory,
    getAllTransactionsForAdmin,
    getSingleTransaction,
    getSingleTransactionForAdmin,
};
