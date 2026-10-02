import { initializeApp, cert, getApps } from "firebase-admin/app";
import path from "path";
import fs from "fs";

// Path to the service account file
const serviceAccountPath = path.join(process.cwd(), "config", "djarna-b212e-firebase-adminsdk-fbsvc-ed19886f3e.json");

let isFirebaseInitialized = false;

if (getApps().length === 0) {
    try {
        if (fs.existsSync(serviceAccountPath)) {
            initializeApp({
                credential: cert(serviceAccountPath),
            });
            isFirebaseInitialized = true;
            console.log("Firebase Admin SDK initialized successfully");
        } else {
            console.warn(`Firebase service account file not found at: ${serviceAccountPath}`);
        }
    } catch (error) {
        console.error("Firebase Admin SDK initialization failed:", error);
    }
} else {
    isFirebaseInitialized = true;
}

export { isFirebaseInitialized };
