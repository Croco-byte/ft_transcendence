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
exports.TwoFactorAuthenticationController = void 0;
const common_1 = require("@nestjs/common");
const twoFactorAuthentication_service_1 = require("./twoFactorAuthentication.service");
const users_service_1 = require("../users/users.service");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const jwt_two_factor_auth_guard_1 = require("./jwt-two-factor-auth.guard");
const jwt_1 = require("@nestjs/jwt");
let TwoFactorAuthenticationController = class TwoFactorAuthenticationController {
    constructor(twoFactorAuthenticationService, usersService, jwtService) {
        this.twoFactorAuthenticationService = twoFactorAuthenticationService;
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async register(response, req) {
        const { otpauthUrl } = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(req.user);
        return this.twoFactorAuthenticationService.pipeQrCodeStream(response, otpauthUrl);
    }
    async turnOnTwoFactorAuthentication(twoFactorAuthenticationCode, req) {
        try {
            await this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode, req.user.id);
        }
        catch (_a) {
            throw new common_1.ForbiddenException("Wrong authentication code to turn on 2FA");
        }
        await this.usersService.turnOnTwoFactorAuthentication(req.user.id);
        var returnObject = {};
        returnObject.username = req.user.username;
        returnObject.accessToken = this.jwtService.sign({ id: req.user.id, username: req.user.username, isSecondFactorAuthenticated: true }, { expiresIn: '24h' });
        return (returnObject);
    }
    async turnOffTwoFactorAuthentication(req) {
        await this.usersService.turnOffTwoFactorAuthentication(req.user.id);
    }
    async authenticate(twoFactorAuthenticationCode, req) {
        try {
            await this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode, req.user.id);
        }
        catch (_a) {
            throw new common_1.ForbiddenException("Wrong authentication code to logging with 2FA");
        }
        var returnObject = {};
        returnObject.username = req.user.username;
        returnObject.accessToken = this.jwtService.sign({ id: req.user.id, username: req.user.username, isSecondFactorAuthenticated: true }, { expiresIn: '24h' });
        return (returnObject);
    }
};
__decorate([
    common_1.Post('generate'),
    common_1.UseGuards(jwt_auth_guard_1.default),
    __param(0, common_1.Res()),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TwoFactorAuthenticationController.prototype, "register", null);
__decorate([
    common_1.Post('turn-on'),
    common_1.HttpCode(200),
    common_1.UseGuards(jwt_auth_guard_1.default),
    __param(0, common_1.Body('twoFactorAuthenticationCode')),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TwoFactorAuthenticationController.prototype, "turnOnTwoFactorAuthentication", null);
__decorate([
    common_1.Post('turn-off'),
    common_1.HttpCode(200),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TwoFactorAuthenticationController.prototype, "turnOffTwoFactorAuthentication", null);
__decorate([
    common_1.Post('authenticate'),
    common_1.HttpCode(200),
    common_1.UseGuards(jwt_auth_guard_1.default),
    __param(0, common_1.Body('twoFactorAuthenticationCode')),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TwoFactorAuthenticationController.prototype, "authenticate", null);
TwoFactorAuthenticationController = __decorate([
    common_1.Controller('2fa'),
    __metadata("design:paramtypes", [twoFactorAuthentication_service_1.TwoFactorAuthenticationService, users_service_1.UsersService, jwt_1.JwtService])
], TwoFactorAuthenticationController);
exports.TwoFactorAuthenticationController = TwoFactorAuthenticationController;
//# sourceMappingURL=twoFactorAuthentication.controller.js.map