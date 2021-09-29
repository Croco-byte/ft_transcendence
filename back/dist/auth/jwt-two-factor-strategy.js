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
exports.JwtTwoFactorStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const users_entity_1 = require("../users/users.entity");
let JwtTwoFactorStrategy = class JwtTwoFactorStrategy extends passport_1.PassportStrategy(passport_jwt_1.Strategy, 'jwt-two-factor') {
    constructor() {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'sup3r_secret_JWT_s3cret_strIng',
        });
    }
    async validate(payload) {
        const user = await users_entity_1.User.findOne({ where: { id: payload.id } });
        if (user && user.is_blocked)
            throw new common_1.HttpException("You are blocked from the website", 444);
        if (user && !user.isTwoFactorAuthenticationEnabled) {
            return { id: user.id, username: user.username, is_admin: user.is_admin };
        }
        if (payload && payload.isSecondFactorAuthenticated) {
            return { id: user.id, username: user.username, is_admin: user.is_admin };
        }
        console.log("Token expired, or 2FA enabled, but the user isn't logged in via 2FA. Bouncing him !");
    }
};
JwtTwoFactorStrategy = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [])
], JwtTwoFactorStrategy);
exports.JwtTwoFactorStrategy = JwtTwoFactorStrategy;
//# sourceMappingURL=jwt-two-factor-strategy.js.map