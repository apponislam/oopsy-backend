import { Request, Response, NextFunction } from 'express';
import { TransactionService } from './transaction.services';

const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?._id || req.body.user;
        const result = await TransactionService.createTransaction({
            ...req.body,
            user: userId,
            paymentMethod: 'Stripe',
        });

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getTransactionHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?._id || (req.query.userId as string);
        const { searchTerm, type, page, limit } = req.query;

        const result = await TransactionService.getTransactionHistory(userId, {
            searchTerm: searchTerm as string,
            type: type as any,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
        });

        res.status(200).json({
            success: true,
            message: 'Transaction history fetched successfully',
            summary: result.summary,
            meta: result.meta,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

export const TransactionController = {
    createTransaction,
    getTransactionHistory,
};
