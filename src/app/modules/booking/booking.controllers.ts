import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { bookingServices } from "./booking.services";

const createBooking = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await bookingServices.createBooking(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Booking created successfully",
        data: result,
    });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await bookingServices.getMyBookings(userId, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bookings retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const id = req.params.id as string;
    const result = await bookingServices.getSingleBooking(id, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Booking details retrieved successfully",
        data: result,
    });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const id = req.params.id as string;
    const { reason } = req.body;
    const result = await bookingServices.cancelBooking(id, userId, reason);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Booking cancelled successfully",
        data: result,
    });
});

export const bookingControllers = {
    createBooking,
    getMyBookings,
    getSingleBooking,
    cancelBooking,
};
