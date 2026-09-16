import { ISetting } from "./setting.interface";
import { SettingModel } from "./setting.model";

// Service to retrieve global settings (creates default setting record if none exists)
const getSettings = async () => {
    let settings = await SettingModel.findOne();
    if (!settings) {
        settings = await SettingModel.create({});
    }
    return settings;
};

// Service to update global settings
const updateSettings = async (payload: Partial<ISetting>) => {
    let settings = await SettingModel.findOne();

    if (!settings) {
        settings = await SettingModel.create(payload);
    } else {
        settings = await SettingModel.findByIdAndUpdate(
            settings._id,
            { $set: payload },
            { returnDocument: "after", runValidators: true },
        );
    }

    return settings;
};

export const settingServices = {
    getSettings,
    updateSettings,
};
