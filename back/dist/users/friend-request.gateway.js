"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestsGateway = void 0;
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const websockets_1 = require("@nestjs/websockets");
const auth_service_1 = require("../auth/auth.service");
const users_service_1 = require("./users.service");
let FriendRequestsGateway = class FriendRequestsGateway {
    constructor(authService, userService) {
        this.authService = authService;
        this.userService = userService;
        this.logger = new common_1.Logger('FriendRequestsGateway');
    }
    afterInit(server) {
        this.logger.log("The FriendRequests Gatway is initialized");
    }
    handleDisconnect(client) {
        console.log("[FriendRequest Gateway] Client disconnected from gateway : " + client.id);
    }
    async handleConnection(client, args) {
        const user = await this.authService.customWsGuard(client.handshake.query.token);
        if (!user) {
            client.emit('unauthorized', { message: "Session expired !" });
            return;
        }
        if (user.is_blocked) {
            client.emit('unauthorized', { message: "User is blocked from website" });
            return;
        }
        console.log("[FriendRequest Gateway] Client connected to gateway : " + client.id);
    }
    async handleAcceptFriendRequest(client, data) {
        try {
            const user = await this.authService.customWsGuard(client.handshake.query.token);
            if (!user) {
                client.emit('unauthorized', { message: "Session expired !" });
                return;
            }
            if (user.is_blocked) {
                client.emit('unauthorized', { message: "User is blocked from website" });
                return;
            }
            const result = await this.userService.respondToFriendRequest(data.friendRequestId, "accepted");
            this.wss.emit('friendStatusChanged', { creatorId: result.creator.id, receiverId: result.receiver.id });
            client.emit('friendRequestConfirmation', { type: "accept", message: "Friend request successfully accepted" });
        }
        catch (e) {
            client.emit('friendRequestError', { type: "accept", message: "Something wrong happened while accepting request. Please try again later" });
        }
    }
    async handleDeclineFriendRequest(client, data) {
        try {
            const user = await this.authService.customWsGuard(client.handshake.query.token);
            if (!user) {
                client.emit('unauthorized', { message: "Session expired !" });
                return;
            }
            if (user.is_blocked) {
                client.emit('unauthorized', { message: "User is blocked from website" });
                return;
            }
            const result = await this.userService.respondToFriendRequest(data.friendRequestId, "declined");
            this.wss.emit('friendStatusChanged', { creatorId: result.creator.id, receiverId: result.receiver.id });
            client.emit('friendRequestConfirmation', { type: "decline", message: "Friend request successfully declined" });
        }
        catch (e) {
            client.emit('friendRequestError', { type: "decline", message: "Something wrong happened while declining request. Please try again later" });
        }
    }
    async handleSendFriendRequest(client, data) {
        try {
            const user = await this.authService.customWsGuard(client.handshake.query.token);
            if (!user) {
                client.emit('unauthorized', { message: "Session expired !" });
                return;
            }
            if (user.is_blocked) {
                client.emit('unauthorized', { message: "User is blocked from website" });
                return;
            }
            const result = await this.userService.sendFriendRequest(data.receiverId, user.id);
            this.wss.emit('friendStatusChanged', { creatorId: result.creator.id, receiverId: result.receiver.id });
            client.emit('friendRequestConfirmation', { type: "send", message: "Friend request successfully sent" });
        }
        catch (e) {
            client.emit('friendRequestError', { type: "send", message: e.message });
        }
    }
    async handleUnfriendUser(client, data) {
        try {
            const user = await this.authService.customWsGuard(client.handshake.query.token);
            if (!user) {
                client.emit('unauthorized', { message: "Session expired !" });
                return;
            }
            if (user.is_blocked) {
                client.emit('unauthorized', { message: "User is blocked from website" });
                return;
            }
            const result = await this.userService.unfriendUser(user.id, data.friendId);
            this.wss.emit('friendStatusChanged', result);
            client.emit('friendRequestConfirmation', { type: "unfriend", message: "User successfully unfriended" });
        }
        catch (e) {
            client.emit('friendRequestError', { type: "unfriend", message: "Something wrong happened while unfriending. Please try again later" });
        }
    }
    async handleCancelFriendRequest(client, data) {
        try {
            const user = await this.authService.customWsGuard(client.handshake.query.token);
            if (!user) {
                client.emit('unauthorized', { message: "Session expired !" });
                return;
            }
            if (user.is_blocked) {
                client.emit('unauthorized', { message: "User is blocked from website" });
                return;
            }
            const result = await this.userService.cancelFriendRequest(user.id, data.receiverId);
            this.wss.emit('friendStatusChanged', result);
            client.emit('friendRequestConfirmation', { type: "cancel", message: "Friend request successfully canceled" });
        }
        catch (e) {
            console.log(e.message);
            client.emit('friendRequestError', { type: "cancel", message: "Something wrong happened while canceling friend request. Please try again later" });
        }
    }
};
__decorate([
    websockets_1.WebSocketServer(),
    __metadata("design:type", socket_io_1.Server)
], FriendRequestsGateway.prototype, "wss", void 0);
__decorate([
    websockets_1.SubscribeMessage('acceptFriendRequest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], FriendRequestsGateway.prototype, "handleAcceptFriendRequest", null);
__decorate([
    websockets_1.SubscribeMessage('declineFriendRequest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], FriendRequestsGateway.prototype, "handleDeclineFriendRequest", null);
__decorate([
    websockets_1.SubscribeMessage('sendFriendRequest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], FriendRequestsGateway.prototype, "handleSendFriendRequest", null);
__decorate([
    websockets_1.SubscribeMessage('unfriendUser'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], FriendRequestsGateway.prototype, "handleUnfriendUser", null);
__decorate([
    websockets_1.SubscribeMessage('cancelFriendRequest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], FriendRequestsGateway.prototype, "handleCancelFriendRequest", null);
FriendRequestsGateway = __decorate([
    websockets_1.WebSocketGateway({ cors: true, namespace: '/friendRequests' }),
    __metadata("design:paramtypes", [auth_service_1.AuthService, users_service_1.UsersService])
], FriendRequestsGateway);
exports.FriendRequestsGateway = FriendRequestsGateway;
//# sourceMappingURL=friend-request.gateway.js.map