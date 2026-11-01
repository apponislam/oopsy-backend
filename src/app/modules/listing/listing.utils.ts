/**
 * Safely parses multipart/form-data listing fields (which arrive as strings)
 * into proper objects, arrays, numbers, and booleans for Mongoose.
 */
export const parseListingBody = (body: any): Record<string, any> => {
    let payload = body || {};

    // 1. If payload was wrapped in a `data` field (common with FormData JSON payload)
    if (payload.data && typeof payload.data === "string") {
        try {
            payload = JSON.parse(payload.data);
        } catch (e) {
            // Keep payload as is
        }
    }

    payload = { ...payload };

    // 2. Parse JSON-stringified objects & arrays
    const jsonFields = [
        "location",
        "pricingTiers",
        "availableDays",
        "amenities",
        "customTags",
        "photos",
        "removePhotos",
    ];

    for (const field of jsonFields) {
        if (typeof payload[field] === "string") {
            const trimmed = payload[field].trim();
            if (
                (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                (trimmed.startsWith("[") && trimmed.endsWith("]"))
            ) {
                try {
                    payload[field] = JSON.parse(trimmed);
                } catch (e) {
                    // Ignore parsing error, keep as string
                }
            } else if (field === "amenities" || field === "customTags") {
                // If sent as comma-separated string, e.g. "WiFi, Parking, AC"
                if (trimmed.includes(",")) {
                    payload[field] = trimmed
                        .split(",")
                        .map((item: string) => item.trim())
                        .filter(Boolean);
                } else if (trimmed) {
                    payload[field] = [trimmed];
                }
            }
        }
    }

    // 3. Parse numeric fields from strings
    const numberFields = ["capacity"];
    for (const field of numberFields) {
        if (payload[field] !== undefined && payload[field] !== null && payload[field] !== "") {
            if (typeof payload[field] === "string") {
                const parsed = Number(payload[field]);
                if (!isNaN(parsed)) {
                    payload[field] = parsed;
                }
            }
        }
    }

    // 4. Parse boolean fields from strings
    const booleanFields = ["isActive", "isApproved", "isDeleted"];
    for (const field of booleanFields) {
        if (typeof payload[field] === "string") {
            const lower = payload[field].toLowerCase().trim();
            if (lower === "true") payload[field] = true;
            if (lower === "false") payload[field] = false;
        }
    }

    return payload;
};
