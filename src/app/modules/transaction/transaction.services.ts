import { Transaction } from './transaction.model';
import { ITransaction, ITransactionFilterOptions } from './transaction.interface';
import { Types } from 'mongoose';

// Create a new transaction manually
const createTransaction = async (payload: Partial<ITransaction>): Promise<ITransaction> => {
    const newTransaction = await Transaction.create(payload);
    return newTransaction;
};

// Get transaction history with filters & search
const getTransactionHistory = async (userId: string, filters: ITransactionFilterOptions) => {
    const { searchTerm, type, page = 1, limit = 10 } = filters;
    const query: any = { user: new Types.ObjectId(userId) };

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
        .populate('listing', 'title price images');

    const total = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(total / limitNumber);

    // Calculate aggregated transaction metrics
    const metricsAggregate = await Transaction.aggregate([
        { $match: { user: new Types.ObjectId(userId) } },
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

export const TransactionService = {
    createTransaction,
    getTransactionHistory,
};
