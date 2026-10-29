export const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "Oopsy Backend Engine API",
        version: "1.0.0",
        description:
            "Complete OpenAPI 3.0 specification for the **Oopsy** facility booking & marketplace platform. Supports multi-role authentication (Client, Provider, Super Admin), geospatial 2dsphere map discovery, booking schedules, Stripe payments & Stripe Connect transfers, multi-dimensional reviews, dispute workflows, and administrative controls.",
        contact: {
            name: "Appon Islam",
            url: "https://github.com/apponislam",
            email: "apponislamdev@gmail.com",
        },
        license: {
            name: "ISC",
            url: "https://opensource.org/licenses/ISC",
        },
    },
    servers: [
        {
            url: "/api/v1",
            description: "API v1 Base Endpoint",
        },
        {
            url: "http://localhost:5000/api/v1",
            description: "Local Development Server",
        },
        {
            url: "https://oopsyapi.apponislam.top/api/v1",
            description: "Production Server",
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Input your JWT token in the format: `Bearer <token>`",
            },
        },
        schemas: {
            StandardResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Operation executed successfully" },
                    data: { type: "object" },
                    meta: {
                        type: "object",
                        properties: {
                            page: { type: "number", example: 1 },
                            limit: { type: "number", example: 10 },
                            total: { type: "number", example: 25 },
                            totalPages: { type: "number", example: 3 },
                            hasNext: { type: "boolean", example: true },
                            hasPrev: { type: "boolean", example: false },
                        },
                    },
                },
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Validation Error" },
                    errorSources: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                path: { type: "string", example: "email" },
                                message: { type: "string", example: "Invalid email format" },
                            },
                        },
                    },
                    stack: { type: "string", nullable: true },
                },
            },
            User: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "6ac334635df71ac11fb07f78" },
                    name: { type: "string", example: "John Doe" },
                    email: { type: "string", format: "email", example: "johndoe@example.com" },
                    role: { type: "string", enum: ["CLIENT", "PROVIDER", "SUPER_ADMIN"], example: "PROVIDER" },
                    phone: { type: "string", example: "+1234567890" },
                    profileImage: { type: "string", example: "/uploads/profile-images/profile-12345.webp" },
                    website: { type: "string", example: "https://johndoe.com" },
                    balance: { type: "number", example: 150.0 },
                    isActive: { type: "boolean", example: true },
                    isEmailVerified: { type: "boolean", example: true },
                    isApproved: { type: "boolean", example: true },
                    referralCode: { type: "string", example: "PIT67FU9" },
                    averageRating: { type: "number", example: 4.8 },
                    totalReviews: { type: "number", example: 12 },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            Category: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66f42b3c7d1e8a0012345678" },
                    name: { type: "string", example: "Music Studio" },
                    slug: { type: "string", example: "music-studio" },
                    image: { type: "string", example: "/uploads/category-icons/category-123.webp" },
                    isActive: { type: "boolean", example: true },
                },
            },
            PricingTier: {
                type: "object",
                required: ["durationMinutes", "price"],
                properties: {
                    durationMinutes: { type: "number", example: 30 },
                    price: { type: "number", example: 15.0 },
                },
            },
            AvailabilitySlot: {
                type: "object",
                required: ["day", "isAvailable"],
                properties: {
                    day: {
                        type: "string",
                        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        example: "Monday",
                    },
                    startTime: { type: "string", example: "09:00" },
                    endTime: { type: "string", example: "18:00" },
                    isAvailable: { type: "boolean", example: true },
                },
            },
            Listing: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66f42b3c7d1e8a0098765432" },
                    name: { type: "string", example: "Modern Downtown Podcast Studio" },
                    description: { type: "string", example: "Acoustically treated studio equipped with Shure SM7B mics." },
                    facilityType: { type: "string", example: "66f42b3c7d1e8a0012345678" },
                    host: { type: "string", example: "6ac334635df71ac11fb07f78" },
                    capacity: { type: "number", example: 4 },
                    smokingPolicy: { type: "string", example: "Non-smoking" },
                    amenities: { type: "array", items: { type: "string" }, example: ["WiFi", "Air Conditioning", "Microphones"] },
                    customTags: { type: "array", items: { type: "string" }, example: ["Podcast", "Voiceover"] },
                    location: {
                        type: "object",
                        properties: {
                            address: { type: "string", example: "123 Main St, New York, NY" },
                            floorUnit: { type: "string", example: "Suite 4B" },
                            accessInstructions: { type: "string", example: "Buzz 402 on entry" },
                            location: {
                                type: "object",
                                properties: {
                                    type: { type: "string", example: "Point" },
                                    coordinates: {
                                        type: "array",
                                        items: { type: "number" },
                                        example: [-73.935242, 40.73061],
                                        description: "[longitude, latitude]",
                                    },
                                },
                            },
                        },
                    },
                    photos: { type: "array", items: { type: "string" }, example: ["/uploads/listing-photos/photo-1.webp"] },
                    pricingTiers: { type: "array", items: { $ref: "#/components/schemas/PricingTier" } },
                    availableDays: { type: "array", items: { $ref: "#/components/schemas/AvailabilitySlot" } },
                    averageRating: { type: "number", example: 4.9 },
                    totalReviews: { type: "number", example: 28 },
                    isActive: { type: "boolean", example: true },
                    isApproved: { type: "boolean", example: true },
                },
            },
            Booking: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66f42b3c7d1e8a0055555555" },
                    bookingId: { type: "string", example: "OP-48291" },
                    user: { type: "string", example: "6ac334635df71ac11fb07f78" },
                    host: { type: "string", example: "6ac334635df71ac11fb07f99" },
                    listing: { type: "string", example: "66f42b3c7d1e8a0098765432" },
                    date: { type: "string", format: "date-time", example: "2026-11-20T00:00:00.000Z" },
                    time: { type: "string", example: "14:00" },
                    durationMinutes: { type: "number", example: 60 },
                    price: { type: "number", example: 30.0 },
                    currency: { type: "string", example: "GBP" },
                    status: { type: "string", enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], example: "CONFIRMED" },
                    isPaid: { type: "boolean", example: true },
                    isReviewed: { type: "boolean", example: false },
                },
            },
            Payment: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66f42b3c7d1e8a0033333333" },
                    paymentId: { type: "string", example: "PAY-12847" },
                    payer: { type: "string", example: "6ac334635df71ac11fb07f78" },
                    receiver: { type: "string", example: "6ac334635df71ac11fb07f99" },
                    booking: { type: "string", example: "66f42b3c7d1e8a0055555555" },
                    amount: { type: "number", example: 30.0 },
                    currency: { type: "string", example: "GBP" },
                    status: { type: "string", enum: ["PAID", "PENDING", "REFUNDED", "FAILED", "DISPUTED"], example: "PAID" },
                    platformFeePercentage: { type: "number", example: 10 },
                    platformFeeAmount: { type: "number", example: 3.0 },
                    isFeeSettled: { type: "boolean", example: true },
                },
            },
            Withdraw: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66f42b3c7d1e8a0044444444" },
                    withdrawId: { type: "string", example: "WTH-91823" },
                    user: { type: "string", example: "6ac334635df71ac11fb07f99" },
                    amount: { type: "number", example: 120.0 },
                    currency: { type: "string", example: "GBP" },
                    status: { type: "string", enum: ["PENDING", "PAID", "REJECTED"], example: "PENDING" },
                    stripeAccountId: { type: "string", example: "acct_1PvShzBAT7h26Lyd" },
                    stripeTransferId: { type: "string", example: "tr_1PvABC..." },
                    rejectionReason: { type: "string", nullable: true },
                },
            },
            RatingCategories: {
                type: "object",
                required: ["cleanliness", "safety", "facilities", "privacy", "serviceQuality"],
                properties: {
                    cleanliness: { type: "number", minimum: 1, maximum: 5, example: 5 },
                    safety: { type: "number", minimum: 1, maximum: 5, example: 5 },
                    facilities: { type: "number", minimum: 1, maximum: 5, example: 4 },
                    privacy: { type: "number", minimum: 1, maximum: 5, example: 5 },
                    serviceQuality: { type: "number", minimum: 1, maximum: 5, example: 5 },
                },
            },
            Review: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66f42b3c7d1e8a0077777777" },
                    user: { type: "string", example: "6ac334635df71ac11fb07f78" },
                    listing: { type: "string", example: "66f42b3c7d1e8a0098765432" },
                    booking: { type: "string", example: "66f42b3c7d1e8a0055555555" },
                    rating: { type: "number", example: 4.8 },
                    categories: { $ref: "#/components/schemas/RatingCategories" },
                    comment: { type: "string", example: "Brilliant facility, pristine and ready on time!" },
                    photos: { type: "array", items: { type: "string" }, example: ["/uploads/review-photos/rev-1.webp"] },
                    reply: {
                        type: "object",
                        properties: {
                            user: { type: "string", example: "6ac334635df71ac11fb07f99" },
                            comment: { type: "string", example: "Thanks for the feedback John, glad you enjoyed your session!" },
                            createdAt: { type: "string", format: "date-time" },
                        },
                    },
                },
            },
            Dispute: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66f42b3c7d1e8a0066666666" },
                    disputeId: { type: "string", example: "DSP-39482" },
                    booking: { type: "string", example: "66f42b3c7d1e8a0055555555" },
                    initiator: { type: "string", example: "6ac334635df71ac11fb07f78" },
                    defendant: { type: "string", example: "6ac334635df71ac11fb07f99" },
                    reason: {
                        type: "string",
                        enum: [
                            "SERVICE_NOT_PROVIDED",
                            "POOR_SERVICE_QUALITY",
                            "FACILITY_MISMATCH",
                            "HOST_ABSENT",
                            "CUSTOMER_NO_SHOW",
                            "SAFETY_OR_HYGIENE_ISSUE",
                            "PAYMENT_DISCREPANCY",
                            "OTHER",
                        ],
                        example: "HOST_ABSENT",
                    },
                    description: { type: "string", example: "Host was unreachable and studio door was locked." },
                    refundRequested: { type: "boolean", example: true },
                    refundAmount: { type: "number", example: 30.0 },
                    status: {
                        type: "string",
                        enum: ["PENDING", "UNDER_REVIEW", "RESOLVED_REFUNDED", "RESOLVED_REJECTED", "CANCELLED"],
                        example: "PENDING",
                    },
                    resolutionNotes: { type: "string", nullable: true },
                },
            },
            PlatformSettings: {
                type: "object",
                properties: {
                    supportEmail: { type: "string", example: "support@oopsy.com" },
                    defaultCommissionPercentage: { type: "number", example: 10 },
                    maxAdvanceBookingDays: { type: "number", example: 60 },
                    emailNotifications: { type: "boolean", example: true },
                    pushNotifications: { type: "boolean", example: true },
                    allowNewRegistrations: { type: "boolean", example: true },
                    autoApproveReviews: { type: "boolean", example: true },
                    maintenanceMode: { type: "boolean", example: false },
                },
            },
        },
        responses: {
            "400BadRequest": {
                description: "Bad Request / Validation Error",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                    },
                },
            },
            "401Unauthorized": {
                description: "Unauthorized - Authentication required",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                    },
                },
            },
            "404NotFound": {
                description: "Resource Not Found",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                    },
                },
            },
        },
    },
    paths: {
        "/status": {
            get: {
                tags: ["System Health"],
                summary: "Check Backend Engine Status",
                description: "Returns server uptime, operational environment, and current timestamp.",
                responses: {
                    200: {
                        description: "Engine status information",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "object",
                                            properties: {
                                                environment: { type: "string", example: "development" },
                                                port: { type: "number", example: 5000 },
                                                uptime: { type: "number", example: 124.5 },
                                                timestamp: { type: "string", example: "2026-10-29T12:00:00.000Z" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register new user (Client or Provider)",
                description: "Registers a new user account. Supports file uploads for profileImage, businessDocument, and governmentIssuedId.",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["name", "email", "password", "role"],
                                properties: {
                                    name: { type: "string", example: "John Doe" },
                                    email: { type: "string", format: "email", example: "john@example.com" },
                                    password: { type: "string", format: "password", example: "SecurePass123!" },
                                    role: { type: "string", enum: ["CLIENT", "PROVIDER"], example: "PROVIDER" },
                                    phone: { type: "string", example: "+1234567890" },
                                    website: { type: "string", example: "https://johndoe.com" },
                                    referralCode: { type: "string", example: "PIT67FU9" },
                                    address: {
                                        type: "string",
                                        description: "JSON stringified address object with street, city, state, zipCode, country, location.",
                                        example: "{\"street\":\"123 Main St\",\"city\":\"New York\",\"state\":\"NY\",\"zipCode\":\"10001\",\"country\":\"USA\",\"location\":{\"type\":\"Point\",\"coordinates\":[-73.935242,40.73061]}}",
                                    },
                                    businessDetails: {
                                        type: "string",
                                        description: "JSON stringified business details (businessName, businessType, companyRegistrationNumber, vatNumber).",
                                        example: "{\"businessName\":\"Doe Enterprises\",\"businessType\":\"Services\",\"companyRegistrationNumber\":\"REG-12345\",\"vatNumber\":\"VAT-98765\"}",
                                    },
                                    profileImage: { type: "string", format: "binary" },
                                    businessDocument: { type: "string", format: "binary" },
                                    governmentIssuedId: { type: "string", format: "binary" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Registration successful. Verification email dispatched.",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/StandardResponse" },
                            },
                        },
                    },
                    400: {
                        description: "Bad Request or Validation Error",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "User Login",
                description: "Authenticates user via email and password. Returns JWT access token and sets refresh token in HTTP-only cookie.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: { type: "string", format: "email", example: "john@example.com" },
                                    password: { type: "string", format: "password", example: "SecurePass123!" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Login successful",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "Login successful" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                user: { $ref: "#/components/schemas/User" },
                                                accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Invalid credentials" },
                },
            },
        },
        "/auth/verify-email": {
            get: {
                tags: ["Auth"],
                summary: "Verify Email Address",
                description: "Validates the verification token sent via email.",
                parameters: [
                    {
                        name: "token",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                        description: "Email verification token",
                    },
                ],
                responses: {
                    200: { description: "Email successfully verified" },
                    400: { description: "Invalid or expired verification token" },
                },
            },
        },
        "/auth/resend-verification": {
            post: {
                tags: ["Auth"],
                summary: "Resend Email Verification",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email"],
                                properties: {
                                    email: { type: "string", format: "email", example: "john@example.com" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Verification email resent" },
                },
            },
        },
        "/auth/refresh-token": {
            post: {
                tags: ["Auth"],
                summary: "Refresh Access Token",
                description: "Exchanges valid refresh token (from cookie or payload) for a newly minted access token.",
                responses: {
                    200: {
                        description: "New access token generated",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "object",
                                            properties: {
                                                accessToken: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Refresh token missing or invalid" },
                },
            },
        },
        "/auth/forgot-password": {
            post: {
                tags: ["Auth"],
                summary: "Request Password Reset OTP",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email"],
                                properties: {
                                    email: { type: "string", format: "email", example: "john@example.com" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "OTP sent to registered email" },
                },
            },
        },
        "/auth/verify-otp": {
            post: {
                tags: ["Auth"],
                summary: "Verify Password Reset OTP",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "otp"],
                                properties: {
                                    email: { type: "string", format: "email", example: "john@example.com" },
                                    otp: { type: "string", example: "529177" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "OTP verified. Returns temporary password reset token.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "object",
                                            properties: {
                                                resetToken: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired OTP" },
                },
            },
        },
        "/auth/reset-password": {
            post: {
                tags: ["Auth"],
                summary: "Reset Password with Token",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["token", "newPassword"],
                                properties: {
                                    token: { type: "string" },
                                    newPassword: { type: "string", format: "password", example: "NewStrongPassword123!" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Password reset successful" },
                },
            },
        },
        "/auth/me": {
            get: {
                tags: ["Auth"],
                summary: "Get Authenticated User Profile",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: "Profile information",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: { $ref: "#/components/schemas/User" },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/auth/logout": {
            post: {
                tags: ["Auth"],
                summary: "Logout Current User",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Successfully logged out" },
                },
            },
        },
        "/auth/profile": {
            patch: {
                tags: ["Auth"],
                summary: "Update User Profile",
                security: [{ BearerAuth: [] }],
                description: "Update personal profile, address, or upload new avatar (`profileImage`).",
                requestBody: {
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    phone: { type: "string" },
                                    website: { type: "string" },
                                    address: { type: "string" },
                                    businessDetails: { type: "string" },
                                    profileImage: { type: "string", format: "binary" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Profile updated successfully" },
                },
            },
        },
        "/auth/change-password": {
            post: {
                tags: ["Auth"],
                summary: "Change Password",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["oldPassword", "newPassword"],
                                properties: {
                                    oldPassword: { type: "string", format: "password" },
                                    newPassword: { type: "string", format: "password" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Password changed successfully" },
                    400: { description: "Incorrect old password" },
                },
            },
        },
        "/auth/delete-account": {
            delete: {
                tags: ["Auth"],
                summary: "Soft Delete Account",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Account deactivated/deleted" },
                },
            },
        },
        "/auth/users/{userId}": {
            get: {
                tags: ["Auth"],
                summary: "Get User By ID (Admin Only)",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "User details returned" },
                },
            },
            patch: {
                tags: ["Auth"],
                summary: "Update User by Super Admin",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    isApproved: { type: "boolean" },
                                    isActive: { type: "boolean" },
                                    isEmailVerified: { type: "boolean" },
                                    role: { type: "string", enum: ["CLIENT", "PROVIDER", "SUPER_ADMIN"] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "User updated by admin" },
                },
            },
        },
        "/categories": {
            get: {
                tags: ["Categories"],
                summary: "Get All Active Categories",
                responses: {
                    200: {
                        description: "List of active facility categories",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Category" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Categories"],
                summary: "Create New Category (Super Admin)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string", example: "Conference Rooms" },
                                    image: { type: "string", format: "binary" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Category created" },
                },
            },
        },
        "/categories/admin": {
            get: {
                tags: ["Categories"],
                summary: "Get All Categories (Admin View)",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "List of all categories including inactive" },
                },
            },
        },
        "/categories/{id}": {
            get: {
                tags: ["Categories"],
                summary: "Get Single Category",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Category details" },
                },
            },
            patch: {
                tags: ["Categories"],
                summary: "Update Category (Super Admin)",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    image: { type: "string", format: "binary" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Category updated" },
                },
            },
            delete: {
                tags: ["Categories"],
                summary: "Delete Category (Super Admin)",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Category deleted" },
                },
            },
        },
        "/categories/{id}/status": {
            patch: {
                tags: ["Categories"],
                summary: "Toggle Category Status (Super Admin)",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Category status toggled" },
                },
            },
        },
        "/listings/map": {
            get: {
                tags: ["Listings"],
                summary: "Spatial Bounding-Box Map Listings",
                description: "Discovers active listings within geographic bounding coordinates using MongoDB 2dsphere index.",
                parameters: [
                    { name: "minLat", in: "query", required: true, schema: { type: "number" }, example: 40.7 },
                    { name: "maxLat", in: "query", required: true, schema: { type: "number" }, example: 40.85 },
                    { name: "minLng", in: "query", required: true, schema: { type: "number" }, example: -74.05 },
                    { name: "maxLng", in: "query", required: true, schema: { type: "number" }, example: -73.85 },
                    { name: "limit", in: "query", schema: { type: "number", default: 50 } },
                ],
                responses: {
                    200: {
                        description: "Listings found within boundary",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: { type: "array", items: { $ref: "#/components/schemas/Listing" } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/listings": {
            get: {
                tags: ["Listings"],
                summary: "Get All Listings (Search & Filters)",
                parameters: [
                    { name: "searchTerm", in: "query", schema: { type: "string" } },
                    { name: "category", in: "query", schema: { type: "string" } },
                    { name: "minPrice", in: "query", schema: { type: "number" } },
                    { name: "maxPrice", in: "query", schema: { type: "number" } },
                    { name: "rating", in: "query", schema: { type: "number" } },
                    { name: "page", in: "query", schema: { type: "number", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "number", default: 10 } },
                ],
                responses: {
                    200: {
                        description: "Paginated listing collection",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: { type: "array", items: { $ref: "#/components/schemas/Listing" } },
                                        meta: { $ref: "#/components/schemas/StandardResponse/properties/meta" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Listings"],
                summary: "Create New Listing (Host Only)",
                security: [{ BearerAuth: [] }],
                description: "Create space/facility listing with pricing tiers, operating days, and up to 10 photos converted to WebP.",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["name", "facilityType", "description", "capacity", "location", "pricingTiers"],
                                properties: {
                                    name: { type: "string", example: "Urban Music Rehearsal Studio" },
                                    facilityType: { type: "string", example: "66f42b3c7d1e8a0012345678" },
                                    description: { type: "string", example: "Soundproof studio with full drum kit and PA." },
                                    capacity: { type: "number", example: 5 },
                                    smokingPolicy: { type: "string", example: "Strictly No Smoking" },
                                    amenities: {
                                        type: "string",
                                        description: "JSON stringified array of amenities",
                                        example: "[\"WiFi\",\"Air Conditioning\",\"Amplifiers\"]",
                                    },
                                    customTags: {
                                        type: "string",
                                        example: "[\"Rehearsal\",\"Music\"]",
                                    },
                                    location: {
                                        type: "string",
                                        description: "JSON stringified IListingLocation",
                                        example: "{\"address\":\"100 Broadway, NY\",\"floorUnit\":\"Basement A\",\"accessInstructions\":\"Code: 4921\",\"location\":{\"type\":\"Point\",\"coordinates\":[-73.98,40.75]}}",
                                    },
                                    pricingTiers: {
                                        type: "string",
                                        description: "JSON stringified array of IPricingTier",
                                        example: "[{\"durationMinutes\":30,\"price\":20},{\"durationMinutes\":60,\"price\":35}]",
                                    },
                                    availableDays: {
                                        type: "string",
                                        description: "JSON stringified array of IAvailabilitySlot",
                                        example: "[{\"day\":\"Monday\",\"startTime\":\"09:00\",\"endTime\":\"21:00\",\"isAvailable\":true}]",
                                    },
                                    photos: {
                                        type: "array",
                                        items: { type: "string", format: "binary" },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Listing created successfully" },
                },
            },
        },
        "/listings/admin": {
            get: {
                tags: ["Listings"],
                summary: "Get All Listings (Admin View)",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Full list of listings across platform" },
                },
            },
        },
        "/listings/my/listings": {
            get: {
                tags: ["Listings"],
                summary: "Get Current Host Listings",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Listings owned by logged in provider" },
                },
            },
        },
        "/listings/{id}": {
            get: {
                tags: ["Listings"],
                summary: "Get Single Listing Details",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Listing details with host and pricing" },
                },
            },
            patch: {
                tags: ["Listings"],
                summary: "Update Listing (Host)",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    description: { type: "string" },
                                    pricingTiers: { type: "string" },
                                    availableDays: { type: "string" },
                                    photos: { type: "array", items: { type: "string", format: "binary" } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Listing updated" },
                },
            },
            delete: {
                tags: ["Listings"],
                summary: "Delete Listing (Host)",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Listing soft-deleted" },
                },
            },
        },
        "/listings/{id}/status": {
            patch: {
                tags: ["Listings"],
                summary: "Toggle Listing Active Status (Host)",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Listing status updated" },
                },
            },
        },
        "/bookings": {
            post: {
                tags: ["Bookings"],
                summary: "Create New Booking (Client)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["listing", "date", "time", "durationMinutes", "price"],
                                properties: {
                                    listing: { type: "string", example: "66f42b3c7d1e8a0098765432" },
                                    date: { type: "string", format: "date-time", example: "2026-11-20T00:00:00.000Z" },
                                    time: { type: "string", example: "14:00" },
                                    durationMinutes: { type: "number", example: 60 },
                                    price: { type: "number", example: 35.0 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Booking created with generated bookingId (e.g. OP-48291)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: { $ref: "#/components/schemas/Booking" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/bookings/my-bookings": {
            get: {
                tags: ["Bookings"],
                summary: "Get User / Host Bookings",
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: "status", in: "query", schema: { type: "string", enum: ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] } },
                    { name: "searchTerm", in: "query", schema: { type: "string" } },
                    { name: "page", in: "query", schema: { type: "number", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "number", default: 10 } },
                ],
                responses: {
                    200: { description: "Paginated bookings" },
                },
            },
        },
        "/bookings/{id}": {
            get: {
                tags: ["Bookings"],
                summary: "Get Single Booking Details",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Booking details with populated user and listing" },
                },
            },
        },
        "/bookings/{id}/cancel": {
            patch: {
                tags: ["Bookings"],
                summary: "Cancel Booking",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    cancelReason: { type: "string", example: "Schedule conflict" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Booking marked as CANCELLED" },
                },
            },
        },
        "/payments/webhook": {
            post: {
                tags: ["Payments"],
                summary: "Stripe Webhook Listener",
                description: "Receives raw Stripe webhook events verified via `stripe-signature` header.",
                responses: {
                    200: { description: "Webhook event processed" },
                    400: { description: "Webhook signature verification failed" },
                },
            },
        },
        "/payments/create-payment-intent": {
            post: {
                tags: ["Payments"],
                summary: "Create Stripe PaymentIntent",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["bookingId", "amount"],
                                properties: {
                                    bookingId: { type: "string", example: "66f42b3c7d1e8a0055555555" },
                                    amount: { type: "number", example: 35.0 },
                                    currency: { type: "string", default: "gbp" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "PaymentIntent initialized with client_secret",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "object",
                                            properties: {
                                                clientSecret: { type: "string" },
                                                paymentIntentId: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/payments/create": {
            post: {
                tags: ["Payments"],
                summary: "Record Direct Payment Confirmation",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["booking", "amount", "stripePaymentIntentId"],
                                properties: {
                                    booking: { type: "string" },
                                    amount: { type: "number" },
                                    stripePaymentIntentId: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Payment recorded successfully" },
                },
            },
        },
        "/payments/history": {
            get: {
                tags: ["Payments"],
                summary: "Get User Payment History",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "List of payment transactions" },
                },
            },
        },
        "/payments/{id}": {
            get: {
                tags: ["Payments"],
                summary: "Get Single Payment",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Payment record" },
                },
            },
        },
        "/payments/admin": {
            get: {
                tags: ["Payments"],
                summary: "Get Platform Payments (Super Admin)",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "All platform payments and fee settlements" },
                },
            },
        },
        "/payments/refund": {
            post: {
                tags: ["Payments"],
                summary: "Execute Stripe Refund (Super Admin)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["paymentId"],
                                properties: {
                                    paymentId: { type: "string" },
                                    amount: { type: "number", description: "Optional partial refund amount" },
                                    reason: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Refund processed successfully" },
                },
            },
        },
        "/withdraw/connect-account": {
            post: {
                tags: ["Host Payouts & Stripe Connect"],
                summary: "Create Stripe Express Connected Account",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Stripe account ID generated and attached to host profile" },
                },
            },
        },
        "/withdraw/connect-onboarding": {
            post: {
                tags: ["Host Payouts & Stripe Connect"],
                summary: "Generate Stripe Connect Onboarding Link",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: "Stripe onboarding redirect URL generated",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "object",
                                            properties: {
                                                url: { type: "string", example: "https://connect.stripe.com/setup/s/..." },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/withdraw/request": {
            post: {
                tags: ["Host Payouts & Stripe Connect"],
                summary: "Request Earnings Withdrawal (Host)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["amount"],
                                properties: {
                                    amount: { type: "number", example: 150.0 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Withdrawal request submitted with balance deduction" },
                },
            },
        },
        "/withdraw/history": {
            get: {
                tags: ["Host Payouts & Stripe Connect"],
                summary: "Get Host Withdrawal History",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Withdrawal history" },
                },
            },
        },
        "/withdraw/admin": {
            get: {
                tags: ["Host Payouts & Stripe Connect"],
                summary: "Get All Withdrawals (Super Admin)",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Platform withdrawal ledger" },
                },
            },
        },
        "/withdraw/{id}/accept": {
            patch: {
                tags: ["Host Payouts & Stripe Connect"],
                summary: "Approve Payout Request (Super Admin)",
                security: [{ BearerAuth: [] }],
                description: "Triggers Stripe Transfer directly to the host's connected bank account.",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Payout approved and funds transferred" },
                },
            },
        },
        "/withdraw/{id}/reject": {
            patch: {
                tags: ["Host Payouts & Stripe Connect"],
                summary: "Reject Payout Request (Super Admin)",
                security: [{ BearerAuth: [] }],
                description: "Rejects request and refunds the withdrawal amount back to host balance.",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["rejectionReason"],
                                properties: {
                                    rejectionReason: { type: "string", example: "Invalid bank account details" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Payout rejected and balance restored" },
                },
            },
        },
        "/reviews/listing/{listingId}": {
            get: {
                tags: ["Reviews"],
                summary: "Get Reviews for Listing",
                parameters: [{ name: "listingId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Paginated listing reviews" },
                },
            },
        },
        "/reviews/listing/{listingId}/stats": {
            get: {
                tags: ["Reviews"],
                summary: "Get Review Statistics & Category Averages",
                parameters: [{ name: "listingId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: {
                        description: "Overall score, rating distribution (1-5), and category averages",
                    },
                },
            },
        },
        "/reviews": {
            post: {
                tags: ["Reviews"],
                summary: "Submit 5-Axis Review (Client)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["booking", "listing", "rating", "categories", "comment"],
                                properties: {
                                    booking: { type: "string" },
                                    listing: { type: "string" },
                                    rating: { type: "number", example: 5 },
                                    categories: {
                                        type: "string",
                                        description: "JSON stringified IRatingCategories",
                                        example: "{\"cleanliness\":5,\"safety\":5,\"facilities\":4,\"privacy\":5,\"serviceQuality\":5}",
                                    },
                                    comment: { type: "string", example: "Superb facility, highly recommended!" },
                                    photos: { type: "array", items: { type: "string", format: "binary" } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Review submitted" },
                },
            },
        },
        "/reviews/my-reviews": {
            get: {
                tags: ["Reviews"],
                summary: "Get Reviews Authored by Logged-In User",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "User reviews list" },
                },
            },
        },
        "/reviews/{id}/reply": {
            post: {
                tags: ["Reviews"],
                summary: "Host Reply to Review",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["comment"],
                                properties: {
                                    comment: { type: "string", example: "Thank you for the review!" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Reply added to review" },
                },
            },
        },
        "/disputes": {
            post: {
                tags: ["Disputes"],
                summary: "Open a Booking Dispute",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["booking", "reason", "description"],
                                properties: {
                                    booking: { type: "string" },
                                    reason: {
                                        type: "string",
                                        enum: [
                                            "SERVICE_NOT_PROVIDED",
                                            "POOR_SERVICE_QUALITY",
                                            "FACILITY_MISMATCH",
                                            "HOST_ABSENT",
                                            "CUSTOMER_NO_SHOW",
                                            "SAFETY_OR_HYGIENE_ISSUE",
                                            "PAYMENT_DISCREPANCY",
                                            "OTHER",
                                        ],
                                    },
                                    description: { type: "string" },
                                    refundRequested: { type: "boolean", default: false },
                                    refundAmount: { type: "number" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Dispute opened and notified to admins" },
                },
            },
            get: {
                tags: ["Disputes"],
                summary: "Get All Disputes (Super Admin)",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "List of all platform disputes" },
                },
            },
        },
        "/disputes/my-disputes": {
            get: {
                tags: ["Disputes"],
                summary: "Get Current User Disputes",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Disputes initiated by or filed against current user" },
                },
            },
        },
        "/disputes/{id}/resolve": {
            patch: {
                tags: ["Disputes"],
                summary: "Resolve Dispute (Super Admin)",
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["status"],
                                properties: {
                                    status: { type: "string", enum: ["RESOLVED_REFUNDED", "RESOLVED_REJECTED"] },
                                    resolutionNotes: { type: "string" },
                                    refundAmount: { type: "number" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Dispute resolved and refund triggered if applicable" },
                },
            },
        },
        "/favorites/toggle": {
            post: {
                tags: ["Favorites"],
                summary: "Toggle Favorite Listing Bookmark",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["listingId"],
                                properties: {
                                    listingId: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Bookmark status toggled" },
                },
            },
        },
        "/favorites": {
            get: {
                tags: ["Favorites"],
                summary: "Get User Favorite Listings",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "List of bookmarked listings" },
                },
            },
        },
        "/notifications": {
            get: {
                tags: ["Notifications"],
                summary: "Get User Notifications",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Notifications with unread count" },
                },
            },
        },
        "/notifications/mark-all-read": {
            patch: {
                tags: ["Notifications"],
                summary: "Mark All Notifications as Read",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "All notifications marked as read" },
                },
            },
        },
        "/notifications/admin/send": {
            post: {
                tags: ["Notifications"],
                summary: "Broadcast Admin Notification",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title", "message"],
                                properties: {
                                    title: { type: "string" },
                                    message: { type: "string" },
                                    targetRole: { type: "string", enum: ["ALL", "CLIENT", "PROVIDER"] },
                                    userIds: { type: "array", items: { type: "string" } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Broadcast dispatched via Socket and database" },
                },
            },
        },
        "/reports": {
            post: {
                tags: ["Reports"],
                summary: "Submit Report Against User or Listing",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["reportType", "targetId", "reason"],
                                properties: {
                                    reportType: { type: "string", enum: ["LISTING", "USER"] },
                                    targetId: { type: "string" },
                                    reason: { type: "string" },
                                    details: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Report recorded for admin review" },
                },
            },
            get: {
                tags: ["Reports"],
                summary: "Get All Reports (Super Admin)",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "List of reports" },
                },
            },
        },
        "/settings": {
            get: {
                tags: ["Settings"],
                summary: "Get Platform Settings",
                responses: {
                    200: {
                        description: "Platform settings",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: { $ref: "#/components/schemas/PlatformSettings" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            patch: {
                tags: ["Settings"],
                summary: "Update Platform Settings (Super Admin)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PlatformSettings" },
                        },
                    },
                },
                responses: {
                    200: { description: "Settings updated" },
                },
            },
        },
        "/public/{type}": {
            get: {
                tags: ["Public Policies"],
                summary: "Get Legal Policy by Type",
                parameters: [
                    {
                        name: "type",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                            enum: ["terms-and-conditions", "privacy-policy", "refund-policy"],
                        },
                    },
                ],
                responses: {
                    200: { description: "Policy content" },
                },
            },
        },
        "/public": {
            post: {
                tags: ["Public Policies"],
                summary: "Upsert Legal Policy (Super Admin)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["type", "title", "content"],
                                properties: {
                                    type: { type: "string", enum: ["terms-and-conditions", "privacy-policy", "refund-policy"] },
                                    title: { type: "string" },
                                    content: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Policy saved" },
                },
            },
        },
        "/faqs": {
            get: {
                tags: ["FAQs"],
                summary: "Get All Public FAQs",
                responses: {
                    200: { description: "List of FAQs" },
                },
            },
            post: {
                tags: ["FAQs"],
                summary: "Create FAQ (Super Admin)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["question", "answer"],
                                properties: {
                                    question: { type: "string" },
                                    answer: { type: "string" },
                                    category: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "FAQ created" },
                },
            },
        },
    },
};
