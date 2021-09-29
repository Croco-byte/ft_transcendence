"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const game_module_1 = require("./game/game.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const common_2 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./config/database.module");
const status_gateway_1 = require("./users/status.gateway");
const friend_request_gateway_1 = require("./users/friend-request.gateway");
const channel_module_1 = require("./channels/channel.module");
const message_module_1 = require("./messages/message.module");
const channel_muted_user_module_1 = require("./channels/channel_muted_users/channel_muted_user.module");
const channel_banned_user_module_1 = require("./channels/channel_banned_users/channel_banned_user.module");
const configuration_env_1 = require("./config/configuration_env");
const ranking_controller_1 = require("./ranking/ranking.controller");
let AppModule = class AppModule {
};
AppModule = __decorate([
    common_1.Module({
        imports: [game_module_1.GameModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            common_2.HttpModule,
            config_1.ConfigModule.forRoot({
                load: [configuration_env_1.default],
            }),
            database_module_1.DatabaseModule,
            channel_module_1.ChannelModule,
            message_module_1.MessageModule,
            channel_muted_user_module_1.ChannelMutedUserModule,
            channel_banned_user_module_1.ChannelBannedUserModule,
        ],
        controllers: [ranking_controller_1.RankingController],
        providers: [status_gateway_1.StatusGateway, friend_request_gateway_1.FriendRequestsGateway],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map