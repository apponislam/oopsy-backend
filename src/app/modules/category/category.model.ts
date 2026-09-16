import mongoose, { Schema } from "mongoose";
import { ICategory } from "./category.interface";

// Helper to generate a unique slug and auto-increment if duplicate exists
const generateUniqueSlug = async (name: string, currentId?: any): Promise<string> => {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    let slug = baseSlug;
    let count = 1;

    const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

    while (true) {
        const query: any = { slug, isDeleted: false };
        if (currentId) {
            query._id = { $ne: currentId };
        }

        const existing = await Category.findOne(query);
        if (!existing) {
            break;
        }

        slug = `${baseSlug}-${count}`;
        count++;
    }

    return slug;
};

const CategorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
        },
        slug: {
            type: String,
            required: false,
            lowercase: true,
            trim: true,
        },
        image: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Pre-save hook to generate unique slug automatically from name
CategorySchema.pre("save", async function () {
    if (this.isModified("name") || !this.slug) {
        this.slug = await generateUniqueSlug(this.name, this._id);
    }
});

// Pre-update hook to auto-generate unique slug on update if name changed
CategorySchema.pre("findOneAndUpdate", async function () {
    const update: any = this.getUpdate();
    const docToUpdate = await this.model.findOne(this.getQuery());
    const currentId = docToUpdate?._id;

    if (update && update.$set && update.$set.name) {
        update.$set.slug = await generateUniqueSlug(update.$set.name, currentId);
    } else if (update && update.name) {
        update.slug = await generateUniqueSlug(update.name, currentId);
    }
});

/*
|--------------------------------------------------------------------------
| In-Depth Indexing Strategy
|--------------------------------------------------------------------------
*/
CategorySchema.index({ slug: 1, isDeleted: 1 });
CategorySchema.index({ isActive: 1, isDeleted: 1 });
CategorySchema.index({ createdAt: -1, isDeleted: 1 });
CategorySchema.index({ name: 1, isDeleted: 1 });
CategorySchema.index({ name: "text" });

export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
