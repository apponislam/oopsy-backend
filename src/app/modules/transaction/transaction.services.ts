import { Transaction } from './transaction.model';
import { ITransaction, ITransactionFilterOptions } from './transaction.interface';
import { Types } from 'mongoose';

// Generate sequential transaction reference (e.g., T-00891)
const generateTransactionId = async (): Promise<string> => {
    const count = await Transaction.countDocuments();
    const nextNum = (count + 1).toString().padStart(5, '0');
    return `T-${nextNum}`;
};

// Create a new Stripe transaction
const createTransaction = async (payload: Partial<ITransaction>): Promise<ITransaction> => {
    const transactionId = payload.transactionId || (await generateTransactionId());

    const newTransaction = await Transaction.create({
        ...payload,
        paymentMethod: 'Stripe',
        transactionId,
    });

    return newTransaction;
};

// Get transaction history with filters (All, Bookings, Payouts, Refunds), search & pagination
const getTransactionHistory = async (userId: string, filters: ITransactionFilterOptions) => {
    const { searchTerm, type, page = 1, limit = 10 } = filters;
    const query: any = { user: new Types.ObjectId(userId) };

    if (type && type !== 'All') {
        if (type === 'Bookings') query.type = 'Booking';
        else if (type === 'Payouts') query.type = 'Payout';
        else if (type === 'Refunds') query.type = 'Refund';
    }

    if (searchTerm) {
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { transactionId: { $regex: searchTerm, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('listing', 'title price images');

    const total = await Transaction.countDocuments(query);

    // Calculate aggregated transaction metrics (Credits, Debits, Net) directly from transactions
    const metricsAggregate = await Transaction.aggregate([
        { $match: { user: new Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalCredits: {
                    $sum: {
                        $cond: [{ $eq: ['$category', 'Credit'] }, '$amount', 0],
                    },
                },
                totalDebits: {
                    $sum: {
                        $cond: [{ $eq: ['$category', 'Debit'] }, '$amount', 0],
                    },
                },
            },
        },
    ]);

    const credits = metricsAggregate[0]?.totalCredits || 0;
    const debits = metricsAggregate[0]?.totalDebits || 0;

    return {
        summary: {
            credits,
            debits,
            net: credits - debits,
        },
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: transactions,
    };
};

export const TransactionService = {
    createTransaction,
    getTransactionHistory,
};
