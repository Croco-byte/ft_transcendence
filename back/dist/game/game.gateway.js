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
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const game_service_1 = require("./game.service");
const users_service_1 = require("../users/users.service");
const auth_service_1 = require("../auth/auth.service");
const users_entity_1 = require("../users/users.entity");
let GameGateway = class GameGateway {
    constructor(gameService, authService, usersService) {
        this.gameService = gameService;
        this.authService = authService;
        this.usersService = usersService;
        this.logger = new common_1.Logger('GameGateway');
    }
    ;
    afterInit(server) {
        this.logger.log('Init done');
    }
    async handleConnection(client) {
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
            client.data = { userDbId: user.id, userStatus: user.status, roomId: user.roomId };
            console.log("[Game Gateway] Client connected to gateway : " + client.id);
        }
        catch (e) {
            this.logger.log('Unauthorized client trying to connect');
            client.disconnect();
        }
        if (client.data.userStatus === 'spectating') {
            const room = await this.gameService.attributeRoom(client.data.userDbId, client.id);
            client.join(room.name);
            client.emit('launchSpectate');
            this.logger.log(`launching spectate mode for user ${client.data.userDbId}, room name : ${room.name}`);
        }
        else if (client.data.roomId === 'none') {
            client.emit('renderOption');
        }
        else {
            client.emit('waitInPrivateQueue');
        }
    }
    async handleDisconnect(client) {
        console.log("[Game Gateway] Client disconnected from gateway : " + client.id);
        let room = this.gameService.findRoomByPlayerId(client.id);
        if (room && room.game.isStarted) {
            clearInterval(room.intervalId);
            this.gameService.updateScores(client, this.wss, room, client.id);
        }
        else if (room && room.player2Id != '') {
            this.wss.to(room.name).emit('resetMatchmaking');
            this.gameService.removeRoom(this.wss, room);
        }
        else if (room) {
            this.gameService.removeRoom(this.wss, room);
        }
        else {
            this.usersService.updateRoomId(client.data.userDbId, 'none');
        }
    }
    async handleSetupChosen(client, setupChosen) {
        let room = await this.gameService.attributeRoom(client.data.userDbId, client.id, setupChosen);
        client.join(room.name);
        if (room.player2Id === '')
            client.emit('waitingForPlayer');
        else if (room.player2Id != '') {
            this.wss.to(room.name).emit('startingGame', false);
            await new Promise(resolve => setTimeout(resolve, this.gameService.TIME_MATCH_START));
            if (this.gameService.findRoomByPlayerId(client.id)) {
                room.game.isStarted = true;
                this.wss.to(room.name).emit('startingGame', true);
            }
        }
    }
    async handleWaitInPrivateQueue(client) {
        const user = await this.usersService.findUserById(client.data.userDbId);
        client.data.roomId = user.roomId;
        client.emit('waitInPrivateQueue');
    }
    async handlePrivateGame(client) {
        let room = this.gameService.attributePrivateRoom(client.data.userDbId, client.id, client.data.roomId);
        client.join(room.name);
        if (room.player2Id != '') {
            this.wss.to(room.name).emit('startingGame', false);
            await new Promise(resolve => setTimeout(resolve, this.gameService.TIME_MATCH_START));
            if (this.gameService.findRoomByPlayerId(client.id)) {
                room.game.isStarted = true;
                this.wss.to(room.name).emit('startingGame', true);
            }
        }
    }
    async handleLaunchGame(client) {
        const room = this.gameService.findRoomByPlayerId(client.id);
        if (room && client.id === room.player1Id) {
            this.usersService.updateRoomId(room.user1DbId, room.name);
            this.usersService.updateRoomId(room.user2DbId, room.name);
            room.intervalId = setInterval(async () => {
                this.wss.to(room.name).emit('actualizeGameScreen', room);
                if (this.gameService.updateGame(room)) {
                    clearInterval(room.intervalId);
                    this.gameService.updateScores(client, this.wss, room);
                }
            }, this.gameService.FRAMERATE);
        }
    }
    handlePongEvent(client, playerPosY) {
        this.gameService.updatePlayerPos(client.id, playerPosY);
    }
    handleDisconnectClient(client) {
        client.disconnect();
    }
    handlePrivateCancelled(client) {
        const room = this.gameService.findRoomByPlayerId(client.id);
        this.gameService.removeRoom(this.wss, room);
        client.data.roomId = 'none';
    }
};
__decorate([
    websockets_1.WebSocketServer(),
    __metadata("design:type", socket_io_1.Socket)
], GameGateway.prototype, "wss", void 0);
__decorate([
    __param(0, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleConnection", null);
__decorate([
    __param(0, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleDisconnect", null);
__decorate([
    websockets_1.SubscribeMessage('setupChosen'),
    __param(0, websockets_1.ConnectedSocket()),
    __param(1, websockets_1.MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleSetupChosen", null);
__decorate([
    websockets_1.SubscribeMessage('waitInPrivateQueue'),
    __param(0, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleWaitInPrivateQueue", null);
__decorate([
    websockets_1.SubscribeMessage('privateGame'),
    __param(0, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handlePrivateGame", null);
__decorate([
    websockets_1.SubscribeMessage('launchGame'),
    __param(0, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleLaunchGame", null);
__decorate([
    websockets_1.SubscribeMessage('pongEvent'),
    __param(0, websockets_1.ConnectedSocket()),
    __param(1, websockets_1.MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handlePongEvent", null);
__decorate([
    websockets_1.SubscribeMessage('disconnectClient'),
    __param(0, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleDisconnectClient", null);
__decorate([
    websockets_1.SubscribeMessage('privateCancelled'),
    __param(0, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handlePrivateCancelled", null);
GameGateway = __decorate([
    websockets_1.WebSocketGateway({ cors: true, namespace: 'game' }),
    __metadata("design:paramtypes", [game_service_1.GameService,
        auth_service_1.AuthService,
        users_service_1.UsersService])
], GameGateway);
exports.GameGateway = GameGateway;
;
//# sourceMappingURL=game.gateway.js.map