"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const jwt_strategy_1 = require("./jwt-strategy");
const jwt_two_factor_strategy_1 = require("./jwt-two-factor-strategy");
const ws_jwt_strategy_1 = require("./ws-jwt-strategy");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const twoFactorAuthentication_controller_1 = require("./twoFactorAuthentication.controller");
const twoFactorAuthentication_service_1 = require("./twoFactorAuthentication.service");
const users_module_1 = require("../users/users.module");
const jwt_two_factor_admin_strategy_1 = require("./jwt-two-factor-admin-strategy");
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    common_1.Module({
        imports: [common_2.HttpModule, jwt_1.JwtModule.register({ secret: 'sup3r_secret_JWT_s3cret_strIng' }), config_1.ConfigModule, passport_1.PassportModule, users_module_1.UsersModule],
        exports: [auth_service_1.AuthService],
        controllers: [auth_controller_1.AuthController, twoFactorAuthentication_controller_1.TwoFactorAuthenticationController],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy, jwt_two_factor_strategy_1.JwtTwoFactorStrategy, jwt_two_factor_admin_strategy_1.JwtTwoFactorAdminStrategy, ws_jwt_strategy_1.WsJwtGuard, twoFactorAuthentication_service_1.TwoFactorAuthenticationService],
    })
], AuthModule);
exports.AuthModule = AuthModule;
//# sourceMappingURL=auth.module.js.map