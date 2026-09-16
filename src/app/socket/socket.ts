import { Server, Socket } from "socket.io";
import http from "http";
import { contactServices } from "../modules/contact/contact.services";
import { UserModel } from "../modules/auth/auth.model";
import { GroupModel } from "../modules/group/group.model";
import { SellerGroupModel } from "../modules/sellerGroup/sellerGroup.model";

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

                        // Send initial unread count only to SUPER_ADMINs
                        const unreadCount = await contactServices.getUnreadCount();
                        socket.emit("contact:unreadCount", unreadCount);
                    } else if (user.role === "SELLER") {
                        const sellerGroupJoin = await SellerGroupModel.findOne({ sellerId: user._id, isDeleted: false });
                        if (sellerGroupJoin) {
                            socket.join(`group_${sellerGroupJoin.groupId.toString()}`);
                            console.log(`User ${userId} joined group room: group_${sellerGroupJoin.groupId}`);
                        }
                    } else if (user.role === "ADMIN") {
                        const group = await GroupModel.findOne({ createdBy: user._id, isDeleted: false });
                        if (group) {
                            socket.join(`group_${group._id.toString()}`);
                            console.log(`Admin ${userId} joined group room: group_${group._id}`);
                        }
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
