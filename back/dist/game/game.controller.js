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
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_two_factor_auth_guard_1 = require("../auth/jwt-two-factor-auth.guard");
const game_service_1 = require("./game.service");
let GameController = class GameController {
    constructor(userService, gameService) {
        this.userService = userService;
        this.gameService = gameService;
    }
    async privateGame(userId) {
        const newRoomId = await this.gameService.generateRoomId();
        await this.userService.updateRoomId(userId, newRoomId);
        return newRoomId;
    }
    async joinPrivateGame(friendId, body) {
        await this.userService.updateRoomId(friendId, body.newRoomId.data);
        return body.newRoomId.data;
    }
};
__decorate([
    common_1.Post('challenge/:userId'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "privateGame", null);
__decorate([
    common_1.Post('joinChallenge/:friendId'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param('friendId')),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "joinPrivateGame", null);
GameController = __decorate([
    common_1.Controller('/game'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        game_service_1.GameService])
], GameController);
exports.GameController = GameController;
//# sourceMappingURL=game.controller.js.map