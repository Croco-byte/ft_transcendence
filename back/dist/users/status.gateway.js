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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusGateway = void 0;
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const websockets_1 = require("@nestjs/websockets");
const auth_service_1 = require("../auth/auth.service");
const users_service_1 = require("./users.service");
const users_entity_1 = require("./users.entity");
const typeorm_1 = require("typeorm");
let StatusGateway = class StatusGateway {
    constructor(authService, userService) {
        this.authService = authService;
        this.userService = userService;
        this.logger = new common_1.Logger('StatusGateway');
    }
    async onModuleInit() {
        await typeorm_1.getConnection()
            .createQueryBuilder()
            .update(users_entity_1.User)
            .set({ status: "offline" })
            .execute();
    }
    async onModuleDestroy() {
        await typeorm_1.getConnection()
            .createQueryBuilder()
            .update(users_entity_1.User)
            .set({ status: "offline" })
            .execute();
        this.wss.emit('serverDown', {});
    }
    afterInit(server) {
        this.logger.log("The Status Gatway is initialized");
    }
    async handleDisconnect(client) {
        if (client.data && client.data.userId) {
            console.log("[Status Gateway] Client disconnected from gateway : " + client.data.userId);
            await this.userService.changeUserStatus(client.data.userId, 'offline');
            this.wss.emit('statusChange', { userId: client.data.userId, status: 'offline' });
        }
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
        try {
            console.log("[Status Gateway] Client connected to gateway : " + user.id);
            client.data = { userId: user.id, username: user.username };
            if (user.status !== "offline") {
                console.log("User wasn't offline, so we're kicking him");
                await this.userService.changeUserStatus(user.id, "offline");
                this.wss.emit('multipleConnectionsOnSameUser', { userId: user.id });
            }
            else {
                await this.userService.changeUserStatus(client.data.userId, 'online');
                this.wss.emit('statusChange', { userId: client.data.userId, status: 'online' });
            }
        }
        catch (e) {
            this.logger.log(e.message);
            throw new websockets_1.WsException(e.message);
        }
    }
    async handleOnline(client, data) {
        const user = await this.authService.customWsGuard(client.handshake.query.token);
        if (!user) {
            client.emit('unauthorized', { message: "Session expired !" });
            return;
        }
        if (user.is_blocked) {
            client.emit('unauthorized', { message: "User is blocked from website" });
            return;
        }
        try {
            await this.userService.changeUserStatus(client.data.userId, 'online');
            this.wss.emit('statusChange', { userId: client.data.userId, status: 'online' });
        }
        catch (e) {
            this.logger.log(e.message);
            throw new websockets_1.WsException(e.message);
        }
    }
    async handleOffline(client, data) {
        const user = await this.authService.customWsGuard(client.handshake.query.token);
        if (!user) {
            client.emit('unauthorized', { message: "Session expired !" });
            return;
        }
        if (user.is_blocked) {
            client.emit('unauthorized', { message: "User is blocked from website" });
            return;
        }
        try {
            await this.userService.changeUserStatus(client.data.userId, 'offline');
            this.wss.emit('statusChange', { userId: client.data.userId, status: 'offline' });
        }
        catch (e) {
            this.logger.log(e.message);
            throw new websockets_1.WsException(e.message);
        }
    }
    async handleInGame(client, data) {
        try {
            await this.userService.changeUserStatus(client.data.userId, 'in-game');
            this.wss.emit('statusChange', { userId: client.data.userId, status: 'in-game' });
            this.logger.log('status changed to ingame');
        }
        catch (e) {
            this.logger.log(e.message);
            throw new websockets_1.WsException(e.message);
        }
    }
    async handleInQueue(client, data) {
        try {
            await this.userService.changeUserStatus(client.data.userId, 'in-queue');
            this.wss.emit('statusChange', { userId: client.data.userId, status: 'in-queue' });
            this.logger.log('status changed to in-queue');
        }
        catch (e) {
            this.logger.log(e.message);
            throw new websockets_1.WsException(e.message);
        }
    }
    async handleSpectating(client, dbIds) {
        const user = await this.authService.customWsGuard(client.handshake.query.token);
        if (!user) {
            client.emit('unauthorized', { message: "Session expired !" });
            return;
        }
        if (user.is_blocked) {
            client.emit('unauthorized', { message: "User is blocked from website" });
            return;
        }
        try {
            const user = await this.userService.findUserById(dbIds.friendId);
            await this.userService.updateRoomId(dbIds.userId, user.roomId);
            await this.userService.changeUserStatus(client.data.userId, 'spectating');
            client.emit('goToSpectateView');
            this.wss.emit('statusChange', { userId: client.data.userId, status: 'spectating' });
            this.logger.log('status changed to spectating');
        }
        catch (e) {
            this.logger.log(e.message);
            throw new websockets_1.WsException(e.message);
        }
    }
    async handleChallengeSomebody(client, obj) {
        this.logger.log('STATUS GATEWAY CHALLENGESOMEBODY');
        const user = await this.userService.findUserById(obj.userId);
        obj.username = user.displayname;
        this.wss.emit('acceptChallenge', obj);
    }
    async handleDeclinedChallenge(client, userId) {
        this.logger.log('STATUS GATEWAY CHALLENGEDECLINED');
        this.userService.updateRoomId(userId, 'none');
        this.wss.emit('cancelPrivateGame', userId);
    }
    async verifyAccountUnicity(client, data) {
        if (client.data.userId && data.currUserId && data.currUserId !== client.data.userId) {
            console.log("Detected a change in the JWT of the user (the user ID of the JWT isn't the same as the one the user connected to the gataway with). Bouncing new user.");
            await this.userService.changeUserStatus(data.currUserId, "offline");
            await this.userService.changeUserStatus(client.data.userId, "offline");
            this.wss.emit('multipleConnectionsOnSameUser', { userId: data.currUserId });
            client.disconnect();
        }
    }
};
__decorate([
    websockets_1.WebSocketServer(),
    __metadata("design:type", socket_io_1.Server)
], StatusGateway.prototype, "wss", void 0);
__decorate([
    websockets_1.SubscribeMessage('getOnline'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], StatusGateway.prototype, "handleOnline", null);
__decorate([
    websockets_1.SubscribeMessage('getOffline'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], StatusGateway.prototype, "handleOffline", null);
__decorate([
    websockets_1.SubscribeMessage('getInGame'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], StatusGateway.prototype, "handleInGame", null);
__decorate([
    websockets_1.SubscribeMessage('getInQueue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], StatusGateway.prototype, "handleInQueue", null);
__decorate([
    websockets_1.SubscribeMessage('getSpectating'),
    __param(0, websockets_1.ConnectedSocket()),
    __param(1, websockets_1.MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], StatusGateway.prototype, "handleSpectating", null);
__decorate([
    websockets_1.SubscribeMessage('challengeSomebody'),
    __param(0, websockets_1.ConnectedSocket()),
    __param(1, websockets_1.MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], StatusGateway.prototype, "handleChallengeSomebody", null);
__decorate([
    websockets_1.SubscribeMessage('challengeDeclined'),
    __param(0, websockets_1.ConnectedSocket()),
    __param(1, websockets_1.MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", Promise)
], StatusGateway.prototype, "handleDeclinedChallenge", null);
__decorate([
    websockets_1.SubscribeMessage('checkForJWTChanges'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], StatusGateway.prototype, "verifyAccountUnicity", null);
StatusGateway = __decorate([
    websockets_1.WebSocketGateway({ cors: true, namespace: '/connectionStatus' }),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        users_service_1.UsersService])
], StatusGateway);
exports.StatusGateway = StatusGateway;
//# sourceMappingURL=status.gateway.js.map