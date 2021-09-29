"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMutedUserModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const channel_muted_user_repository_1 = require("./channel_muted_user.repository");
const channel_muted_user_service_1 = require("./channel_muted_user.service");
let ChannelMutedUserModule = class ChannelMutedUserModule {
};
ChannelMutedUserModule = __decorate([
    common_1.Module({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([channel_muted_user_repository_1.default])
        ],
        controllers: [],
        providers: [channel_muted_user_service_1.default],
    })
], ChannelMutedUserModule);
exports.ChannelMutedUserModule = ChannelMutedUserModule;
;
//# sourceMappingURL=channel_muted_user.module.js.map