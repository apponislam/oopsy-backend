import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { IFaq } from "./faq.interface";
import { FaqModel } from "./faq.model";

const createFaq = async (payload: Partial<IFaq>) => {
    const faq = await FaqModel.create(payload);
    return faq;
};

const getAllFaqs = async (query: any) => {
    const { searchTerm, category, page = 1, limit = 10, isPublic } = query;

    const filter: any = { isDeleted: false };

    if (isPublic === "true" || isPublic === true) {
        filter.isActive = true;
    }

    if (category) {
        filter.category = { $regex: category, $options: "i" };
    }

    if (searchTerm) {
        filter.$or = [
            { question: { $regex: searchTerm, $options: "i" } },
            { answer: { $regex: searchTerm, $options: "i" } },
        ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const faqs = await FaqModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await FaqModel.countDocuments(filter);
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
        data: faqs,
    };
};

const getSingleFaq = async (id: string) => {
    const faq = await FaqModel.findOne({ _id: id, isDeleted: false });
    if (!faq) {
        throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
    }
    return faq;
};

const updateFaq = async (id: string, payload: Partial<IFaq>) => {
    const faq = await FaqModel.findOne({ _id: id, isDeleted: false });
    if (!faq) {
        throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
    }

    const updatedFaq = await FaqModel.findByIdAndUpdate(
        id,
        { $set: payload },
        { returnDocument: "after", runValidators: true },
    );

    return updatedFaq;
};

const deleteFaq = async (id: string) => {
    const faq = await FaqModel.findOne({ _id: id, isDeleted: false });
    if (!faq) {
        throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
    }

    faq.isDeleted = true;
    await faq.save();

    return { message: "FAQ deleted successfully" };
};

export const faqServices = {
    createFaq,
    getAllFaqs,
    getSingleFaq,
    updateFaq,
    deleteFaq,
};
