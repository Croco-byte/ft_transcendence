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
const channel_banned_user_service_1 = require("./channel_banned_users/channel_banned_user.service");
const channel_muted_user_repository_1 = require("./channel_muted_users/channel_muted_user.repository");
const channel_muted_user_service_1 = require("./channel_muted_users/channel_muted_user.service");
const message_entity_1 = require("../messages/message.entity");
const message_repository_1 = require("../messages/message.repository");
const message_service_1 = require("../messages/message.service");
const users_entity_1 = require("../users/users.entity");
const typeorm_2 = require("typeorm");
const channel_entity_1 = require("./channel.entity");
const invitation_service_1 = require("./invitation_links/invitation.service");
const bcrypt = require("bcrypt");
let ChannelService = class ChannelService {
    constructor(repository, channelMutedUserService, channelBannedUserService, messageService, invitationService) {
        this.repository = repository;
        this.channelMutedUserService = channelMutedUserService;
        this.channelBannedUserService = channelBannedUserService;
        this.messageService = messageService;
        this.invitationService = invitationService;
        this.relations = ["users", "users.blocked", "administrators", "owner", "pending_users", "invitation_links"];
    }
    async insert(channel) {
        return await this.repository.save(channel);
    }
    async findAllPublicChannels() {
        return await this.repository.find({ relations: this.relations, where: { type: "public" } });
    }
    async findAllJoinedChannels(user) {
        return user.channels.filter(channel => !channel.isDirect);
    }
    async findAllDirectChannels(user) {
        let channels = user.channels.filter(channel => channel.isDirect);
        let ids = new Array();
        let ret = new Array();
        for (let channel of channels) {
            let c = await this.repository.find({ relations: this.relations, where: { id: channel.id } });
            ret.push(c[0]);
        }
        return ret;
    }
    async findAll() {
        return await this.repository.find({ relations: this.relations, where: [{ isDirect: false }] });
    }
    async findOne(id) {
        return await this.repository.findOne({ relations: this.relations, where: [{ id: id }] });
    }
    async directExists(user_1, user_2) {
        let name = user_1.username + "_" + user_2.username;
        let name_2 = user_2.username + "_" + user_1.username;
        let channel = await this.repository.createQueryBuilder("channel")
            .where("name = :name or name = :name_2", { name: name, name_2: name_2 })
            .getOne();
        return channel;
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async save(channel) {
        return await this.repository.save(channel);
    }
    async addUser(channel, user, enable_pending = true) {
        if (channel.users == null) {
            console.log("channel.user = null, intialize...", channel.users);
            channel.users = new Array();
        }
        if (channel.requirePassword && enable_pending) {
            if (!channel.pending_users)
                channel.pending_users = new Array();
            channel.pending_users.push(user);
        }
        channel.users.push(user);
        user.channels.push(channel);
        this.repository.save(channel);
    }
    async addPassword(channel, password) {
        bcrypt.hash(password, 10, (err, hash) => {
            channel.requirePassword = true;
            channel.password = hash;
            this.repository.save(channel);
        });
    }
    async check_password(channel, password) {
        return await bcrypt.compare(password, channel.password);
    }
    async removePassword(channel) {
        channel.requirePassword = false;
        channel.pending_users = [];
        this.repository.save(channel);
    }
    async addAdmin(channel, user) {
        if (channel.administrators == null)
            channel.administrators = new Array();
        channel.administrators.push(user);
        this.repository.save(channel);
    }
    async removeAdmin(channel, user) {
        let index = channel.administrators.findIndex(admin => admin.id == user.id);
        if (index != -1)
            channel.administrators.splice(index, 1);
        this.repository.save(channel);
    }
    async addMessage(channel, user, content) {
        let message = new message_entity_1.Message();
        message.channel = channel;
        message.user = user;
        message.content = content;
        await this.messageService.save(message);
    }
    async getMessages(channel) {
        let messages = await this.messageService.findByChannel(channel);
        return messages;
    }
    async muteUser(channel, user) {
        this.channelMutedUserService.insert(channel, user, "2021-07-28 13:09:11.038+00");
    }
    async unmuteUser(channel, user) {
        this.channelMutedUserService.delete(channel, user);
    }
    async isMuted(channel, user) {
        return (await this.channelMutedUserService.isMuted(channel, user));
    }
    async banUser(channel, user) {
        this.channelBannedUserService.insert(channel, user, "2021-07-28 13:09:11.038+00");
    }
    async unbanUser(channel, user) {
        this.channelBannedUserService.delete(channel, user);
    }
    async isBanned(channel, user) {
        return (await this.channelBannedUserService.isBanned(channel, user));
    }
    async updateModifiedDate(channel) {
        channel.modifiedDate = new Date();
        this.repository.save(channel);
    }
    isOwner(channel, user) {
        if (channel.owner && channel.owner.id == user.id)
            return true;
        return false;
    }
    isAdmin(channel, user) {
        if (channel.owner && channel.owner.id == user.id)
            return true;
        if (!channel.administrators)
            return false;
        for (let admin of channel.administrators) {
            if (admin.id == user.id)
                return true;
        }
        return false;
    }
    isInChannel(channel, user) {
        if (channel.owner && channel.owner.id == user.id)
            return true;
        if (this.isAdmin(channel, user))
            return true;
        if (user.channels.findIndex(c => c.id == channel.id) != -1)
            return true;
        return false;
    }
    async removeUser(channel, user) {
        if (channel.owner && channel.owner.id == user.id)
            channel.owner = null;
        if (this.isAdmin(channel, user)) {
            let index = channel.administrators.findIndex((admin) => admin.id == user.id);
            if (index != -1)
                channel.administrators.splice(index, 1);
        }
        let index = channel.users.findIndex((u) => u.id == user.id);
        if (index != -1)
            channel.users.splice(index, 1);
        await this.repository.save(channel);
    }
    isPendingUser(channel, user) {
        if (channel.pending_users.findIndex(tmp_user => tmp_user.id == user.id) == -1)
            return false;
        return true;
    }
    async removePendingUser(channel, user) {
        let index = channel.pending_users.findIndex((tmp_user) => tmp_user.id == user.id);
        channel.pending_users.splice(index, 1);
        this.save(channel);
    }
    getUserRole(channel, user) {
        if (this.isAdmin(channel, user))
            return 'ADMIN';
        if (channel.owner && channel.owner.id == user.id)
            return 'OWNER';
        else
            return 'MEMBER';
    }
    async setChannelType(channel, type) {
        channel.type = type;
        await this.repository.save(channel);
    }
    async generateInvitation(channel, user) {
        let hash = user.id + "-" + (Math.random() + 1).toString(36).substring(2, 10);
        let link = await this.invitationService.insertLink(channel, hash);
        channel.invitation_links.push(link);
        await this.repository.save(channel);
        return link.path;
    }
    async removeMessages(channel) {
        channel.messages = [];
        return await this.repository.save(channel);
    }
    async removeInvitations(channel) {
        channel.invitation_links = [];
        return await this.repository.save(channel);
    }
    async removeMutedUsers(channel) {
        channel.mutedUsers = [];
        return await this.repository.save(channel);
    }
    async removeBannedUsers(channel) {
        return await this.channelBannedUserService.removeAllFromChannel(channel);
    }
    async clean(channel) {
        channel = await this.removeMessages(channel);
        channel = await this.removeInvitations(channel);
        channel = await this.removeInvitations(channel);
        channel = await this.removeMutedUsers(channel);
        await this.removeBannedUsers(channel);
        return channel;
    }
};
ChannelService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(channel_entity_1.Channel)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        channel_muted_user_service_1.default,
        channel_banned_user_service_1.default,
        message_service_1.default,
        invitation_service_1.InvitationService])
], ChannelService);
exports.default = ChannelService;
//# sourceMappingURL=channel.service.js.map