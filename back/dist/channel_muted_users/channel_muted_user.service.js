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
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const channel_entity_1 = require("../channels/channel.entity");
const users_entity_1 = require("../users/users.entity");
const channel_muted_user_entity_1 = require("./channel_muted_user.entity");
const channel_muted_user_repository_1 = require("./channel_muted_user.repository");
let ChannelMutedUserService = class ChannelMutedUserService {
    constructor(repository) {
        this.repository = repository;
    }
    async isMuted(channel, user) {
        let ret = await this.repository.find({ relations: ["channel", "user"], select: ["id", "to"], where: [
                {
                    user: user,
                    channel: channel
                }
            ] });
        return (ret[0] !== undefined);
    }
    async insert(channel, user, to) {
        let muted_item = new channel_muted_user_entity_1.Channel_muted_user;
        muted_item.channel = channel;
        muted_item.user = user;
        muted_item.to = to;
        await this.repository.save(muted_item);
    }
    async delete(channel, user) {
        let tmp = await this.repository.find({ relations: ["channel", "user"], where: { channel: channel, user: user } });
        return await this.repository.remove(tmp);
    }
};
ChannelMutedUserService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(channel_muted_user_repository_1.default)),
    __metadata("design:paramtypes", [Object])
], ChannelMutedUserService);
exports.default = ChannelMutedUserService;
//# sourceMappingURL=channel_muted_user.service.js.map