import { Response } from "express";

type TResponse<T> = {
    statusCode: number;
    success: boolean;
    message?: string;
    data: T;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
    stats?: any;
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
    res.status(data?.statusCode).json({
        success: data.success,
        message: data.message,
        data: data.data,
        meta: data.meta,
        ...(data.stats !== undefined && { stats: data.stats }),
    });
};

export default sendResponse;
