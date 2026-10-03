import { Server, Socket } from "socket.io";
import http from "http";
import { UserModel } from "../modules/auth/auth.model";

let io: Server;

/*
|--------------------------------------------------------------------------
| Initialize Socket Server
|--------------------------------------------------------------------------
*/

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
    });

    io.on("connection", async (socket: Socket) => {
        // console.log(socket);
        console.log("🔌 Socket connected:", socket.id);

        const userId = socket.handshake.auth?._id;

        if (userId) {
            socket.join(`user_${userId}`);
            console.log("User joined room:", userId);

            // Fetch user to join group room and super_admins
            try {
                const user = await UserModel.findById(userId);
                if (user) {
                    if (user.role === "SUPER_ADMIN") {
                        socket.join("super_admins");
                        console.log("SUPER_ADMIN joined room:", userId);
                    } else if (user.role === "PROVIDER") {
                        socket.join("providers");
                        console.log(`Provider ${userId} joined providers room`);
                    } else if (user.role === "CLIENT") {
                        socket.join("clients");
                        console.log(`Client ${userId} joined clients room`);
                    }
                }
            } catch (error) {
                console.error("Error fetching user for socket:", error);
            }
        }

        /*
        ------------------------------------------------
        Register Global Events Here
        ------------------------------------------------
        */

        socket.on("ping", () => {
            socket.emit("pong", "pong");
        });

        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected:", socket.id);
        });
    });

    return io;
};

/*
|--------------------------------------------------------------------------
| Get Socket Instance Anywhere
|--------------------------------------------------------------------------
*/

export const getSocket = () => {
    if (!io) {
        throw new Error("Socket not initialized");
    }

    return io;
};

/*
|--------------------------------------------------------------------------
| Emit to Multiple Users (Simple Helper)
|--------------------------------------------------------------------------
*/

export const sendToUsers = (userIds: any[], event: string, data: any) => {
    if (!io) return;
    const rooms = userIds.map((id) => `user_${id.toString()}`);
    io.to(rooms).emit(event, data);
};

export const sendToRoom = (roomId: string, event: string, data: any) => {
    if (!io) return;
    io.to(roomId).emit(event, data);
};
