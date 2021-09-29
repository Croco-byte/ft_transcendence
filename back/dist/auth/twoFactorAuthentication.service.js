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
exports.TwoFactorAuthenticationService = void 0;
const common_1 = require("@nestjs/common");
const otplib_1 = require("otplib");
const qrcode_1 = require("qrcode");
const users_service_1 = require("../users/users.service");
const config_1 = require("@nestjs/config");
const users_entity_1 = require("../users/users.entity");
let TwoFactorAuthenticationService = class TwoFactorAuthenticationService {
    constructor(usersService, configService) {
        this.usersService = usersService;
        this.configService = configService;
    }
    async generateTwoFactorAuthenticationSecret(user) {
        let secret;
        const existingUser = await users_entity_1.User.findOne({ where: { id: user.id } });
        if (existingUser && existingUser.twoFactorAuthenticationSecret) {
            console.log("Using existing secret");
            secret = existingUser.twoFactorAuthenticationSecret;
        }
        else {
            console.log("Generating a new secret");
            secret = otplib_1.authenticator.generateSecret();
            await this.usersService.setTwoFactorAuthenticationSecret(secret, user.id);
        }
        const otpauthUrl = otplib_1.authenticator.keyuri(user.username, this.configService.get('TWO_FACTOR_AUTHENTICATION_APP_NAME'), secret);
        return { secret, otpauthUrl };
    }
    async pipeQrCodeStream(stream, otpauthUrl) {
        return qrcode_1.toFileStream(stream, otpauthUrl);
    }
    async isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode, id) {
        const user = await users_entity_1.User.findOne({ where: { id: id } });
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        const result = otplib_1.authenticator.verify({ token: twoFactorAuthenticationCode, secret: user.twoFactorAuthenticationSecret });
        if (!result) {
            console.log("Verify function returned 'false' for code " + twoFactorAuthenticationCode + " and secret " + user.twoFactorAuthenticationSecret);
            throw new common_1.ForbiddenException();
        }
        return (result);
    }
};
TwoFactorAuthenticationService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [users_service_1.UsersService, config_1.ConfigService])
], TwoFactorAuthenticationService);
exports.TwoFactorAuthenticationService = TwoFactorAuthenticationService;
//# sourceMappingURL=twoFactorAuthentication.service.js.map