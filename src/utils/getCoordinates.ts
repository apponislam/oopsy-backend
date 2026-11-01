import config from "../app/config";

/**
 * Gets [longitude, latitude] coordinates from an address using Google Maps Geocoding API.
 *
 * @param address - Street address string (e.g. "100 Broadway, NY")
 * @returns [longitude, latitude] or null
 */
export const getCoordinatesFromAddress = async (
    address: string,
): Promise<[number, number] | null> => {
    try {
        if (!address || typeof address !== "string") return null;

        const apiKey = config.maps_api_key;
        if (!apiKey) {
            console.error("MAPS_API_KEY is missing in environment variables.");
            return null;
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address.trim(),
        )}&key=${apiKey}`;

        const res = await fetch(url);
        const data: any = await res.json();

        if (data.status === "OK" && data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return [lng, lat]; // [longitude, latitude] for GeoJSON
        }

        if (data.status !== "OK") {
            console.warn(`[Google Geocoding] Status: ${data.status} ${data.error_message || ""}`);
        }

        return null;
    } catch (error) {
        console.error("Failed to get coordinates from address:", error);
        return null;
    }
};

export default getCoordinatesFromAddress;
