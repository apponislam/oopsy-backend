import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { PolicyTypeEnum } from "./public.interface";
import { PolicyModel } from "./public.model";

const upsertPolicy = async (type: PolicyTypeEnum, title: string, content: string) => {
    const policy = await PolicyModel.findOneAndUpdate(
        { type },
        { $set: { title, content, publishedAt: new Date(), isDeleted: false } },
        { returnDocument: "after", upsert: true, runValidators: true },
    );
    return policy;
};

const getPolicyByType = async (type: PolicyTypeEnum) => {
    const policy = await PolicyModel.findOne({ type, isDeleted: false });
    if (!policy) throw new ApiError(httpStatus.NOT_FOUND, `Policy of type "${type}" was not found or has been deleted.`);
    return policy;
};

export const publicServices = {
    upsertPolicy,
    getPolicyByType,
};
