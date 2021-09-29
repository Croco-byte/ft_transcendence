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
    async sendNewMessage(room, msg, user, channel) {
        let unauthorizedUsers = [];
        let blockedUsers = await this.userService.getBiDirectionalBlockedUsers(user);
        unauthorizedUsers = unauthorizedUsers.concat(blockedUsers);
        unauthorizedUsers = unauthorizedUsers.concat(channel.pending_users);
        for (let unauthorized of unauthorizedUsers) {
            let socket = this.getSocketByUser(unauthorized);
            if (socket)
                socket.leave(room);
        }
        this.server.to(room).emit('message', msg);
        for (let unauthorized of unauthorizedUsers) {
            let socket = this.getSocketByUser(unauthorized);
            if (socket)
                socket.join(room);
        }
    }
    async kickMember(user, channel) {
        let socket = this.getSocketByUser(user);
        if (socket)
            socket.emit("kicked", { channel_id: channel.id, msg: "You have been kicked from channel '" + channel.name + "'" });
        else
            this.logger.debug("User " + user.username + " not found in clients gateway. socket=" + socket);
    }
    async addMember(room, msg, channel) {
        let unauthorizedUsers = channel.pending_users;
        for (let unauthorized of unauthorizedUsers) {
            let socket = this.getSocketByUser(unauthorized);
            if (socket)
                socket.leave(room);
        }
        this.server.to(room).emit('new_member', msg);
        for (let unauthorized of unauthorizedUsers) {
            let socket = this.getSocketByUser(unauthorized);
            if (socket)
                socket.join(room);
        }
    }
    async notifChannel(room, notif, msg, channel) {
        let unauthorizedUsers = channel.pending_users;
        for (let unauthorized of unauthorizedUsers) {
            let socket = this.getSocketByUser(unauthorized);
            if (socket)
                socket.leave(room);
        }
        this.server.to(room).emit(notif, msg);
        for (let unauthorized of unauthorizedUsers) {
            let socket = this.getSocketByUser(unauthorized);
            if (socket)
                socket.join(room);
        }
    }
    afterInit(server) {
        this.logger.log('Init');
    }
    handleDisconnect(client) {
        let user = this.clients[client.id];
        console.log("[Chat Gateway] User disconnected from chat gateway : " + client.id);
        delete this.clients[client.id];
    }
    async handleConnection(client, ...args) {
        const user = await this.authService.customWsGuard(client.handshake.query.token);
        if (!user) {
            client.emit('unauthorized', { message: "Session expired !" });
            return;
        }
        if (user.is_blocked) {
            client.emit('unauthorized', { message: "User is blocked from website" });
            return;
        }
        this.clients[client.id] = [user, client];
        for (let i = 0; i < user.channels.length; i++) {
            let channel = user.channels[i];
            client.join("channel_" + channel.id);
        }
        console.log("[Chat Gateway] " + user.username + " connected to chat gateway : " + client.id + "Total clients connected : " + Object.keys(this.clients).length);
    }
    async leaveChannel(channel, user) {
        let sockID = null;
        let socket = null;
        for (let key in this.clients) {
            if (this.clients[key][0].username == user.username) {
                sockID = key;
                socket = this.clients[key][1];
                break;
            }
        }
        if (socket)
            socket.leave("channel_" + channel.id);
    }
    async joinChannel(channel, user) {
        let sockID = null;
        let socket = null;
        for (let key in this.clients) {
            if (this.clients[key][0].username == user.username) {
                sockID = key;
                socket = this.clients[key][1];
                break;
            }
        }
        if (socket)
            socket.join("channel_" + channel.id);
    }
    getSocketByUser(search) {
        let keys = Object.keys(this.clients);
        for (let key of keys) {
            let val = this.clients[key];
            let user = val[0];
            if (user.id == search.id)
                return val[1];
        }
        return null;
    }
};
__decorate([
    websockets_1.WebSocketServer(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
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
//# sourceMappingURL=channel.gateway.js.map