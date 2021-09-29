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
exports.ChannelModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const channel_muted_user_repository_1 = require("./channel_muted_users/channel_muted_user.repository");
const message_module_1 = require("../messages/message.module");
const message_repository_1 = require("../messages/message.repository");
const message_service_1 = require("../messages/message.service");
const users_service_1 = require("../users/users.service");
const users_module_1 = require("../users/users.module");
const typeorm_2 = require("typeorm");
const channel_controller_1 = require("./channel.controller");
const channel_service_1 = require("./channel.service");
const channel_muted_user_module_1 = require("./channel_muted_users/channel_muted_user.module");
const channel_muted_user_service_1 = require("./channel_muted_users/channel_muted_user.service");
const channel_banned_user_service_1 = require("./channel_banned_users/channel_banned_user.service");
const channel_banned_user_repository_1 = require("./channel_banned_users/channel_banned_user.repository");
const channel_banned_user_module_1 = require("./channel_banned_users/channel_banned_user.module");
const channel_gateway_1 = require("./channel.gateway");
const auth_module_1 = require("../auth/auth.module");
const user_repository_1 = require("../users/user.repository");
const users_entity_1 = require("../users/users.entity");
const friends_request_entity_1 = require("../users/friends-request.entity");
const channel_entity_1 = require("./channel.entity");
const invitation_link_entity_1 = require("./invitation_links/invitation_link.entity");
const invitation_service_1 = require("./invitation_links/invitation.service");
const invitation_controller_1 = require("./invitation_links/invitation.controller");
let ChannelModule = class ChannelModule {
    constructor(connection) {
        this.connection = connection;
    }
};
ChannelModule = __decorate([
    common_1.Module({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([channel_entity_1.Channel, message_repository_1.default, channel_muted_user_repository_1.default, channel_banned_user_repository_1.default, users_entity_1.User, friends_request_entity_1.FriendRequestEntity, invitation_link_entity_1.InvitationLink]),
            message_module_1.MessageModule,
            channel_muted_user_module_1.ChannelMutedUserModule,
            channel_banned_user_module_1.ChannelBannedUserModule,
            auth_module_1.AuthModule,
            common_1.HttpModule,
        ],
        exports: [channel_service_1.default, channel_banned_user_service_1.default, channel_muted_user_service_1.default],
        providers: [channel_gateway_1.AppGateway, channel_service_1.default, users_service_1.UsersService, message_service_1.default, channel_muted_user_service_1.default, channel_banned_user_service_1.default, invitation_service_1.InvitationService],
        controllers: [channel_controller_1.ChannelController, invitation_controller_1.InvitationController],
    }),
    __metadata("design:paramtypes", [typeorm_2.Connection])
], ChannelModule);
exports.ChannelModule = ChannelModule;
//# sourceMappingURL=channel.module.js.map