import bcrypt from "bcrypt";
import { UserModel } from "./auth.model";
import config from "../../config";

export const seedSuperAdmin = async () => {
    try {
        const { email, password, name, phone } = config.initialAdmin || {};

        if (!name) {
            console.log("⚠️ INITIAL_ADMIN_NAME is not provided in env, skipping super admin seeding.");
            return;
        }
        if (!email) {
            console.log("⚠️ INITIAL_ADMIN_EMAIL is not provided in env, skipping super admin seeding.");
            return;
        }
        if (!password) {
            console.log("⚠️ INITIAL_ADMIN_PASSWORD is not provided in env, skipping super admin seeding.");
            return;
        }
        if (!phone) {
            console.log("⚠️ INITIAL_ADMIN_PHONE is not provided in env, skipping super admin seeding.");
            return;
        }

        const adminExists = await UserModel.findOne({
            role: "SUPER_ADMIN",
        });

        if (!adminExists) {
            console.log("📝 No super admin found, creating one...");

            const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

            const superAdmin = {
                name: name,
                email: email,
                password: hashedPassword,
                role: "SUPER_ADMIN" as const,
                phone: phone,
                isActive: true,
                isEmailVerified: true,
                isApproved: true,
            };

            await UserModel.create(superAdmin);

            console.log("✅ Super admin created:", email);
        } else {
            console.log("✅ Super admin already exists, skipping creation");
        }
    } catch (error) {
        console.error("❌ Error seeding super admin:", error);
    }
};
