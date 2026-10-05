import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { favoriteServices } from "./favorite.services";

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { listingId } = req.body;

    if (!listingId) {
        res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "Listing ID is required",
        });
        return;
    }

    const result = await favoriteServices.toggleFavorite(userId, listingId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const getMyFavorites = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await favoriteServices.getMyFavorites(userId, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Favorites retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

export const favoriteControllers = {
    toggleFavorite,
    getMyFavorites,
};
