import mongoose, { Schema } from "mongoose";
import { IBooking } from "./booking.interface";

const BookingSchema = new Schema<IBooking>(
    {
        bookingId: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User (customer) is required"],
        },
        host: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Host is required"],
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: [true, "Listing is required"],
        },
        date: {
            type: Date,
            required: [true, "Booking date is required"],
        },
        time: {
            type: String,
            required: [true, "Booking time is required"],
        },
        durationMinutes: {
            type: Number,
            required: [true, "Duration in minutes is required"],
            min: [1, "Duration must be at least 1 minute"],
        },
        price: {
            type: Number,
            required: [true, "Booking price is required"],
            min: [0, "Price cannot be negative"],
        },
        currency: {
            type: String,
            default: "GBP",
        },
        status: {
            type: String,
            enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        stripePaymentIntentId: {
            type: String,
        },
        cancelledBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        cancelReason: {
            type: String,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Auto-generate booking ID (e.g. OP-24851) before validation
BookingSchema.pre("validate", async function () {
    if (!this.bookingId) {
        let isUnique = false;
        let candidateId = "";

        while (!isUnique) {
            const count = await mongoose.model("Booking").countDocuments();
            const randomOffset = Math.floor(Math.random() * 90000) + 10000;
            candidateId = `OP-${randomOffset}`;

            const existingDoc = await mongoose.model("Booking").findOne({ bookingId: candidateId });
            if (!existingDoc) {
                isUnique = true;
            }
        }
        this.bookingId = candidateId;
    }
});

BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ host: 1, createdAt: -1 });
BookingSchema.index({ listing: 1, date: 1 });
BookingSchema.index({ status: 1, createdAt: -1 });

export const BookingModel = mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
