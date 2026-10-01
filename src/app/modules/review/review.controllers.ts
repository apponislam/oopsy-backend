import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { reviewServices } from "./review.services";

const createReview = catchAsync(async (req: Request, res: Response) => {
    let bodyData = req.body;
    if (req.body.data && typeof req.body.data === "string") {
        try {
            bodyData = JSON.parse(req.body.data);
        } catch (e) {
            // keep req.body as is if parse fails
        }
    }

    const userId = (req as any).user._id;
    const files = req.files as Express.Multer.File[];

    const result = await reviewServices.createReview(userId, bodyData, files);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Review created successfully",
        data: result,
    });
});

const getListingReviews = catchAsync(async (req: Request, res: Response) => {
    const listingId = req.params.listingId as string;
    const result = await reviewServices.getListingReviews(listingId, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Listing reviews retrieved successfully",
        data: result.data,
        meta: result.meta,
        stats: result.stats,
    });
});

const getUserReviews = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await reviewServices.getUserReviews(userId, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User reviews retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getSingleReview = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await reviewServices.getSingleReview(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review details retrieved successfully",
        data: result,
    });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user._id;

    let bodyData = req.body;
    if (req.body.data && typeof req.body.data === "string") {
        try {
            bodyData = JSON.parse(req.body.data);
        } catch (e) {
            // keep req.body as is if parse fails
        }
    }

    const files = req.files as Express.Multer.File[];
    const result = await reviewServices.updateReview(id, userId, bodyData, files);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review updated successfully",
        data: result,
    });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user._id;
    const userRole = (req as any).user?.role;

    const result = await reviewServices.deleteReview(id, userId, userRole);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const addReply = catchAsync(async (req: Request, res: Response) => {
    const reviewId = req.params.id as string;
    const userId = (req as any).user._id;
    const userRole = (req as any).user?.role;
    const { comment } = req.body;

    const result = await reviewServices.addReply(reviewId, userId, comment, userRole);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reply added successfully",
        data: result,
    });
});

const updateReply = catchAsync(async (req: Request, res: Response) => {
    const reviewId = req.params.id as string;
    const userId = (req as any).user._id;
    const userRole = (req as any).user?.role;
    const { comment } = req.body;

    const result = await reviewServices.updateReply(reviewId, userId, comment, userRole);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reply updated successfully",
        data: result,
    });
});

const deleteReply = catchAsync(async (req: Request, res: Response) => {
    const reviewId = req.params.id as string;
    const userId = (req as any).user._id;
    const userRole = (req as any).user?.role;

    const result = await reviewServices.deleteReply(reviewId, userId, userRole);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const getListingReviewStats = catchAsync(async (req: Request, res: Response) => {
    const listingId = req.params.listingId as string;
    const result = await reviewServices.getListingReviewStats(listingId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Listing review statistics retrieved successfully",
        data: result,
    });
});

export const reviewControllers = {
    createReview,
    getListingReviews,
    getUserReviews,
    getSingleReview,
    updateReview,
    deleteReview,
    addReply,
    updateReply,
    deleteReply,
    getListingReviewStats,
};
