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
exports.WsJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const auth_service_1 = require("./auth.service");
const users_entity_1 = require("../users/users.entity");
let WsJwtGuard = class WsJwtGuard {
    constructor(authService) {
        this.authService = authService;
    }
    async canActivate(context) {
        try {
            const client = context.switchToWs().getClient();
            const access_token = client.handshake.query.token;
            const user = await this.authService.validateToken(access_token);
            context.switchToWs().getData().user = user;
            return Boolean(user);
        }
        catch (err) {
            console.log("Encountered an error : " + err.message);
            throw new websockets_1.WsException(err.message);
        }
    }
};
WsJwtGuard = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], WsJwtGuard);
exports.WsJwtGuard = WsJwtGuard;
//# sourceMappingURL=ws-jwt-strategy.js.map