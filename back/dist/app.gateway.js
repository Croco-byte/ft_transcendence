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
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const channel_service_1 = require("./channels/channel.service");
const users_service_1 = require("./users/users.service");
const message_service_1 = require("./messages/message.service");
const auth_service_1 = require("./auth/auth.service");
const ws_jwt_strategy_1 = require("./auth/ws-jwt-strategy");
let AppGateway = class AppGateway {
    constructor(channelService, authService, userService, messageService) {
        this.channelService = channelService;
        this.authService = authService;
        this.userService = userService;
        this.messageService = messageService;
        this.logger = new common_1.Logger('AppGateway');
        this.clients = new Array();
    }
    async handleMessage(client, data) {
        this.logger.log("Receive : " + JSON.stringify(data));
    }
    async sendNewMessage(room, msg) {
        this.server.to(room).emit('message', msg);
    }
    afterInit(server) {
        this.logger.log('Init');
    }
    test(arg) {
        this.logger.log(this.clients);
    }
    handleDisconnect(client) {
        let user = this.clients[client.id];
        delete this.clients[client.id];
    }
    async handleConnection(client, ...args) {
        try {
            const user = await this.authService.validateToken(client.handshake.query.token);
            client.data = { userId: user.id, username: user.username };
            this.logger.log(`Client connected to Status Gateway. User ID: ${client.data.userId}`);
        }
        catch (e) {
            client.disconnect();
            this.logger.log("Unauthorized client trying to connect to the websocket. Bouncing him.");
            throw new common_1.UnauthorizedException();
        }
        let user = await this.userService.findById(client.data.userId);
        this.clients[client.id] = user;
        for (let i = 0; i < user.channels.length; i++) {
            let channel = user.channels[i];
            client.join("channel_" + channel.id);
        }
        this.logger.log(`Client connected: ${user.username} - ${client.id} -  ${Object.keys(this.clients).length} clients connected`);
    }
    async leaveChannel(channel, user) {
        let sockID = null;
        for (let key in this.clients) {
            if (this.clients[key].username == user.username) {
                sockID = key;
                break;
            }
        }
        delete this.server.sockets.adapter.rooms["channel_" + channel.id].sockets[sockID];
    }
    async joinChannel(channel, user) {
        let sockID = null;
        for (let key in this.clients) {
            if (this.clients[key].username == user.username) {
                sockID = key;
                break;
            }
        }
        this.server.sockets.adapter.rooms["channel_" + channel.id].sockets[sockID] = true;
    }
};
__decorate([
    websockets_1.WebSocketServer(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    websockets_1.SubscribeMessage('message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleMessage", null);
AppGateway = __decorate([
    common_1.Injectable(),
    websockets_1.WebSocketGateway({ cors: true, namespace: 'chat' }),
    common_1.UseGuards(ws_jwt_strategy_1.WsJwtGuard),
    __metadata("design:paramtypes", [channel_service_1.default,
        auth_service_1.AuthService,
        users_service_1.UsersService,
        message_service_1.default])
], AppGateway);
exports.AppGateway = AppGateway;
//# sourceMappingURL=app.gateway.js.map