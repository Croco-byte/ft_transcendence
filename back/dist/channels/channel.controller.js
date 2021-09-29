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
var ChannelController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelController = void 0;
const common_1 = require("@nestjs/common");
const channel_entity_1 = require("./channel.entity");
const channel_service_1 = require("./channel.service");
const string_1 = require("../utils/string");
const users_service_1 = require("../users/users.service");
const channel_gateway_1 = require("./channel.gateway");
const jwt_two_factor_auth_guard_1 = require("../auth/jwt-two-factor-auth.guard");
const users_entity_1 = require("../users/users.entity");
const message_service_1 = require("../messages/message.service");
const channel_dto_1 = require("./dto/channel.dto");
let ChannelController = ChannelController_1 = class ChannelController {
    constructor(channelService, userService, messageService, websocketGateway) {
        this.channelService = channelService;
        this.userService = userService;
        this.messageService = messageService;
        this.websocketGateway = websocketGateway;
        this.logger = new common_1.Logger(ChannelController_1.name);
    }
    async test(req) {
        let user = await this.userService.findByUsername("yel-alou");
        return await this.userService.getBiDirectionalBlockedUsers(user);
    }
    async createChannel(req, body) {
        let channel;
        channel = new channel_entity_1.Channel;
        let user = await this.userService.findById(req.user.id);
        channel.type = 'public';
        channel.name = body.name;
        const invalidChars = /^[a-zA-Z0-9-_]+$/;
        if (channel.name.search(invalidChars) === -1 || channel.name.length > 15)
            throw new common_1.ForbiddenException("Invalid characters in username or username too long");
        channel.requirePassword = false;
        channel.password = '';
        channel.creationDate = new Date();
        channel.isDirect = body.isDirect;
        channel.modifiedDate = new Date();
        channel.lastMessage = null;
        channel.users = [user];
        channel.administrators = [];
        channel.owner = user;
        if (channel.isDirect) {
            let to = await this.userService.findByUsername(body.to_user);
            if (!to)
                throw new common_1.NotFoundException("User " + body.to_user + " not found !");
            channel.type = "private";
            channel.users.push(to);
            channel.administrators = channel.users;
            channel.name = user.username + '_' + to.username;
            let exists = await this.channelService.directExists(user, to);
            console.log("blocked => ", to.blocked, user.blocked);
            if (exists)
                return { id: exists.id };
        }
        channel = await this.channelService.insert(channel);
        this.websocketGateway.joinChannel(channel, user);
        if (channel.type == "public")
            this.websocketGateway.createChannel();
        else if (channel.type == "private" && channel.isDirect)
            this.websocketGateway.joinChannel(channel, channel.users[1]);
        this.logger.log("Create new channel named '" + body.name + "'");
        return { message: "Channel " + body.name + " successfully created", id: channel.id };
    }
    async getChannels(req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException("You are not authorized to perform this action.");
        let ret;
        let channels = await this.channelService.findAll();
        ret = new Array();
        for (let i = 0; i < channels.length; i++) {
            let channel = {
                id: channels[i].id,
                name: channels[i].name,
                type: channels[i].type,
                lastMessage: channels[i].lastMessage,
                modifiedDate: channels[i].modifiedDate.toLocaleString().replace(',', ''),
                creationDate: channels[i].creationDate.toLocaleDateString().replace(',', ''),
                userRole: this.channelService.getUserRole(channels[i], user),
                isJoined: this.channelService.isInChannel(channels[i], user),
                requirePassword: channels[i].requirePassword,
                owner: (channels[i].owner ? channels[i].owner.toPublic() : null),
                members: [],
                administrators: [],
            };
            Object.assign(channel.members, await Promise.all(channels[i].users.map(async (user) => {
                let ret = user.toPublic();
                ret["isMuted"] = await this.channelService.isMuted(channels[i], user);
                ret["isBanned"] = await this.channelService.isBanned(channels[i], user);
                ret["isAdmin"] = this.channelService.isAdmin(channels[i], user);
                return (ret);
            })));
            Object.assign(channel.administrators, await Promise.all(channels[i].administrators.map(async (user) => {
                let ret = user.toPublic();
                ret["isMuted"] = await this.channelService.isMuted(channels[i], user);
                ret["isBanned"] = await this.channelService.isBanned(channels[i], user);
                return (ret);
            })));
            ret.push(channel);
        }
        return { channels: ret };
    }
    async getPublicChannels(req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException("You are not authorized to perform this action.");
        let ret;
        let channels = await this.channelService.findAllPublicChannels();
        ret = new Array();
        for (let i = 0; i < channels.length; i++) {
            ret.push({
                id: channels[i].id,
                name: channels[i].name,
                lastMessage: channels[i].lastMessage,
                modifiedDate: channels[i].modifiedDate.toLocaleString().replace(',', ''),
                userRole: this.channelService.getUserRole(channels[i], user),
                isJoined: this.channelService.isInChannel(channels[i], user),
                requirePassword: channels[i].requirePassword,
                isDirect: false
            });
        }
        return ret;
    }
    async getJoinedChannels(req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException("You are not authorized to perform this action.");
        let ret;
        let channels = await this.channelService.findAllJoinedChannels(user);
        ret = new Array();
        for (let i = 0; i < channels.length; i++) {
            ret.push({
                id: channels[i].id,
                name: channels[i].name,
                lastMessage: channels[i].lastMessage,
                modifiedDate: channels[i].modifiedDate.toLocaleString().replace(',', ''),
                userRole: this.channelService.getUserRole(channels[i], user),
                isJoined: true,
                requirePassword: channels[i].requirePassword,
                isDirect: false
            });
        }
        return ret;
    }
    async getDirects(req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException("You are not authorized to perform this action.");
        let ret;
        let channels = await this.channelService.findAllDirectChannels(user);
        ret = new Array();
        for (let i = 0; i < channels.length; i++) {
            let isBlocked = false;
            let u1 = channels[i].users[0];
            let u2 = channels[i].users[1];
            if (u1.blocked.findIndex(b => b.id == u2.id) != -1)
                isBlocked = true;
            if (u2.blocked.findIndex(b => b.id == u1.id) != -1)
                isBlocked = true;
            if (isBlocked)
                continue;
            let second_user = channels[i].users.filter(u => u.id != user.id)[0];
            ret.push({
                id: channels[i].id,
                name: second_user.username,
                lastMessage: channels[i].lastMessage,
                modifiedDate: channels[i].modifiedDate.toLocaleString().replace(',', ''),
                userRole: this.channelService.getUserRole(channels[i], user),
                isJoined: true,
                requirePassword: false,
                isDirect: true
            });
        }
        return ret;
    }
    async deleteChannel(channelID, req) {
        let user = await this.userService.findOne(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException("User not found");
        let channel = await this.channelService.findOne(channelID);
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        if (user.is_admin !== 'owner' && user.is_admin !== 'moderator')
            throw new common_1.ForbiddenException("You must be the website admin to perform this action");
        channel = await this.channelService.clean(channel);
        await this.channelService.delete(channelID).then(() => {
            this.websocketGateway.destroyChannel(channelID, channel.users, channel.name);
            return { message: "Channel deleted successfully" };
        });
    }
    async getInfo(channelID, req) {
        let user = await this.userService.findOne(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException("You are not authorized to perform this action.");
        return await this.channelService.findOne(channelID).then(async (c) => {
            if (!c)
                throw new common_1.NotFoundException("Channel not found");
            if (c.pending_users.findIndex(tmp_user => tmp_user.id == user.id) != -1)
                throw new common_1.UnauthorizedException("You must authenticate to access to this channel !");
            let channel = Object.assign({}, c);
            delete channel.pending_users;
            Object.assign(channel.users, await Promise.all(c.users.map(async (user) => {
                let ret = user.toPublic();
                ret["isMuted"] = await this.channelService.isMuted(c, user);
                ret["isBanned"] = await this.channelService.isBanned(c, user);
                ret["isAdmin"] = this.channelService.isAdmin(c, user);
                ret["displayname"] = user.displayname;
                return (ret);
            })));
            Object.assign(channel.administrators, await Promise.all(c.administrators.map(async (user) => {
                let ret = user.toPublic();
                ret["isMuted"] = await this.channelService.isMuted(c, user);
                ret["isBanned"] = await this.channelService.isBanned(c, user);
                return (ret);
            })));
            return channel;
        });
    }
    async addMember(channelID, body, req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.NotFoundException("User not found");
        let channel = await this.channelService.findOne(channelID);
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        if (channel.requirePassword && !body.password)
            throw new common_1.BadRequestException("A password is required to join this channel");
        if (channel.requirePassword && !(await this.channelService.check_password(channel, body.password)))
            throw new common_1.UnauthorizedException("Invalid Password for channel '" + channel.name + "'");
        this.channelService.addUser(channel, user, false);
        this.websocketGateway.joinChannel(channel, user);
        this.websocketGateway.addMember("channel_" + channel.id, user.username + " join this channel !", channel);
    }
    async getMembers(channelID, req) {
        return await this.channelService.findOne(channelID).then(async (channel) => {
            return channel.users.map((user) => user.toPublic());
        });
    }
    async getAdmin(channelID, req) {
        return await this.channelService.findOne(channelID).then(async (channel) => {
            return channel.administrators.map((admin) => admin.toPublic());
        });
    }
    async addAdmin(channelID, body, req) {
        let user;
        user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.NotFoundException("User not found");
        let channel = await this.channelService.findOne(channelID);
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        let username = body.username;
        if ((!channel.owner || channel.owner.id != user.id)
            && !(user.is_admin == "owner" || user.is_admin == "moderator"))
            throw new common_1.UnauthorizedException("You must be the owner to perform this action");
        return await this.userService.findByUsername(username).then((admin) => {
            if (!this.channelService.isInChannel(channel, admin))
                throw new common_1.NotFoundException("Member " + admin.username + " not found in this channel");
            this.channelService.addAdmin(channel, admin);
            this.logger.log("New admin (user : '" + admin.username + "') in channel " + channel.name);
            return { message: "Administrator '" + admin.username + "' added successfully" };
        });
    }
    async muteUser(channelID, username, req) {
        let curr_user;
        curr_user = await this.userService.findById(req.user.id);
        await this.userService.findByUsername(username).then(async (user) => {
            await this.channelService.findOne(channelID).then(async (channel) => {
                if (!this.channelService.isAdmin(channel, curr_user)
                    && !this.channelService.isOwner(channel, curr_user)
                    && !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
                    throw new common_1.UnauthorizedException("You must be an administrator to perform this action.");
                if (this.channelService.isAdmin(channel, user)
                    && !this.channelService.isOwner(channel, curr_user)
                    && !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
                    throw new common_1.UnauthorizedException("You must be the owner of this channel to mute Admin");
                if ((await this.channelService.isMuted(channel, user)) == false)
                    this.channelService.muteUser(channel, user);
            });
        });
        this.logger.log("Mute user '" + username + "' to this channel");
        return { message: "User " + username + " muted successfully" };
    }
    async unmuteUser(channelID, username, req) {
        let curr_user;
        curr_user = await this.userService.findById(req.user.id);
        await this.userService.findByUsername(username).then(async (user) => {
            await this.channelService.findOne(channelID).then(async (channel) => {
                if (!this.channelService.isAdmin(channel, curr_user)
                    && !this.channelService.isOwner(channel, curr_user)
                    && !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
                    throw new common_1.UnauthorizedException("You must be an administrator to perform this action.");
                if (this.channelService.isAdmin(channel, user)
                    && !this.channelService.isOwner(channel, curr_user)
                    && !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
                    throw new common_1.UnauthorizedException("You must be the owner of this channel to unmute Admin");
                this.channelService.unmuteUser(channel, user);
            });
        });
        this.logger.log("Unmute user '" + username + "' to this channel");
        return { message: "User " + username + " unmuted successfully" };
    }
    async banUser(channelID, username, req) {
        let curr_user;
        curr_user = await this.userService.findById(req.user.id);
        await this.userService.findByUsername(username).then(async (user) => {
            await this.channelService.findOne(channelID).then(async (channel) => {
                if (!this.channelService.isAdmin(channel, curr_user)
                    && !this.channelService.isOwner(channel, curr_user)
                    && !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
                    throw new common_1.UnauthorizedException("You must be an administrator to perform this action.");
                if (this.channelService.isAdmin(channel, user)
                    && !this.channelService.isOwner(channel, curr_user)
                    && !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
                    throw new common_1.UnauthorizedException("You must be the owner of this channel to ban Admin");
                if ((await this.channelService.isBanned(channel, user)) == false)
                    this.channelService.banUser(channel, user);
                await this.websocketGateway.leaveChannel(channel, user);
            });
        });
        this.logger.log("Ban user '" + username + "' to this channel");
        return { message: "User " + username + " banned successfully" };
    }
    async unbanUser(channelID, username, req) {
        let curr_user;
        curr_user = await this.userService.findById(req.user.id);
        await this.userService.findByUsername(username).then(async (user) => {
            await this.channelService.findOne(channelID).then(async (channel) => {
                if (!this.channelService.isAdmin(channel, curr_user)
                    && !this.channelService.isOwner(channel, curr_user)
                    && !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
                    throw new common_1.UnauthorizedException("You must be an administrator to perform this action.");
                if (this.channelService.isAdmin(channel, user)
                    && !this.channelService.isOwner(channel, curr_user)
                    && !(curr_user.is_admin == "owner" || curr_user.is_admin == "moderator"))
                    throw new common_1.UnauthorizedException("You must be the owner of this channel to unban Admin");
                if (await this.channelService.isBanned(channel, user)) {
                    this.channelService.unbanUser(channel, user);
                    await this.websocketGateway.joinChannel(channel, user);
                }
            });
        });
        this.logger.log("Unban user '" + username + "' to this channel");
        return { message: "User " + username + " unbanned successfully" };
    }
    async sendMessage(channelID, data, req) {
        let channel;
        channel = await this.channelService.findOne(data.channel);
        let user = await this.userService.findById(req.user.id);
        if (!channel)
            throw new common_1.NotFoundException("Channel not found !");
        if (!user)
            throw new common_1.NotFoundException("User not found !");
        if (!this.channelService.isInChannel(channel, user))
            throw new common_1.UnauthorizedException("You must join this channel to perform this action !");
        if (await this.channelService.isMuted(channel, user)
            || await this.channelService.isBanned(channel, user)
            || this.channelService.isPendingUser(channel, user))
            throw new common_1.UnauthorizedException("User cannot send message in this channel");
        if (channel.isDirect) {
            let isBlocked = false;
            let u1 = channel.users[0];
            let u2 = channel.users[1];
            if (u1.blocked.findIndex(b => b.id == u2.id) != -1)
                isBlocked = true;
            if (u2.blocked.findIndex(b => b.id == u1.id) != -1)
                isBlocked = true;
            if (isBlocked)
                throw new common_1.ForbiddenException("You can't send message to this user.");
        }
        await this.messageService.add(channel, user, data.content).then(async (message) => {
            await this.channelService.updateModifiedDate(channel);
            this.websocketGateway.sendNewMessage('channel_' + data.channel, { id: message.id, channel: data.channel, user: user.displayname, content: message.content, user_id: user.id }, user, channel);
        });
    }
    async getChannel(channelID, req) {
        let user = await this.userService.findById(req.user.id);
        let channel = await this.channelService.findOne(channelID);
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        if (!this.channelService.isInChannel(channel, user))
            throw new common_1.NotFoundException("You must join this channel !");
        if (await this.channelService.isBanned(channel, user))
            throw new common_1.UnauthorizedException("You are not authorized to perform this action.");
        if (this.channelService.isPendingUser(channel, user))
            throw new common_1.UnauthorizedException({ message: "You must authenticate to access to this channel !", authentify_in_channel: true });
        let messages = await this.channelService.getMessages(channel);
        let blockedUsers = await this.userService.getBiDirectionalBlockedUsers(user);
        messages = messages.filter(msg => (blockedUsers.findIndex(u => u.id == msg.user.id) == -1));
        for (let i = 0; i < messages.length; i++) {
            messages[i].user_id = messages[i].user.id;
            messages[i].user = messages[i].user.displayname;
            delete messages[i].channel;
        }
        let role;
        if (this.channelService.isOwner(channel, user))
            role = "OWNER";
        else if (this.channelService.isAdmin(channel, user))
            role = "ADMIN";
        else
            role = "MEMBER";
        return { messages: messages, user_role: role };
    }
    async changeName(channelID, body, req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException("You must be an administrator to perform this action");
        let newName = body.new_name;
        let channel = await this.channelService.findOne(channelID);
        if (!this.channelService.isAdmin(channel, user))
            throw new common_1.UnauthorizedException("You must be an administrator to perform this action");
        channel.name = newName;
        await this.channelService.save(channel);
        this.logger.log("Channel " + channelID + " renamed '" + newName + "'");
        return { message: "Channel " + channelID + " renamed '" + newName + "'" };
    }
    async changePassword(channelID, body, req) {
        let password = body.password;
        let channel = await this.channelService.findOne(channelID);
        let user = await this.userService.findById(req.user.id);
        if (!channel.owner || channel.owner.id != user.id)
            throw new common_1.UnauthorizedException("You must be the owner of this channel to perform this action");
        this.channelService.addPassword(channel, password);
        this.logger.log("Set password of this channel to '" + password + "'");
        this.websocketGateway.activePassword(channel);
        return { message: "Password changed successfully to '" + password + "'" };
    }
    async removePassword(channelID, body, req) {
        let channel = await this.channelService.findOne(channelID);
        let user = await this.userService.findById(req.user.id);
        if (!channel.owner || channel.owner.id != user.id)
            throw new common_1.UnauthorizedException("You must be the owner of this channel to perform this action");
        await this.channelService.removePassword(channel);
        this.websocketGateway.deletePassword(channel);
        this.logger.log("Password removed for this channel");
        return { message: "Password removed successfully" };
    }
    async checkPassword(channelID, body, req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException("You are not authorized to perform this action.");
        let channel = await this.channelService.findOne(channelID);
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        if (this.channelService.check_password(channel, body.channel))
            await this.channelService.removePendingUser(channel, user);
        else
            throw new common_1.UnauthorizedException("Invalid password");
    }
    async leaveChannel(channelID, req) {
        let user = await this.userService.findById(req.user.id);
        let channel = await this.channelService.findOne(channelID);
        if (!user)
            throw new common_1.UnauthorizedException();
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        if (!this.channelService.isInChannel(channel, user))
            throw new common_1.NotFoundException("User not in this channel");
        await this.channelService.removeUser(channel, user);
        this.websocketGateway.leaveChannel(channel, user);
        this.websocketGateway.notifChannel("channel_" + channel.id, "member_leave", user.username + " leave channel " + channel.name, channel);
    }
    async kickMember(channelID, username, req) {
        let user = await this.userService.findById(req.user.id);
        let channel = await this.channelService.findOne(channelID);
        if (!user)
            throw new common_1.UnauthorizedException();
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        if (!this.channelService.isAdmin(channel, user) && !this.channelService.isOwner(channel, user))
            throw new common_1.UnauthorizedException("You must be an administrator to perform this action.");
        let kicked_user = await this.userService.findByUsername(username);
        if (!kicked_user)
            throw new common_1.NotFoundException("User not found");
        if (!this.channelService.isInChannel(channel, kicked_user))
            throw new common_1.NotFoundException("User not in this channel");
        if (this.channelService.isAdmin(channel, kicked_user) && !this.channelService.isOwner(channel, user))
            throw new common_1.UnauthorizedException("You must be the owner to perform this action");
        if (channel.owner && channel.owner.id == kicked_user.id)
            throw new common_1.UnauthorizedException("You cannot kick owner of a channel !");
        await this.channelService.removeUser(channel, kicked_user);
        this.websocketGateway.kickMember(kicked_user, channel);
        this.websocketGateway.leaveChannel(channel, kicked_user);
        this.websocketGateway.notifChannel("channel_" + channel.id, "member_leave", kicked_user.username + " leave channel " + channel.name, channel);
    }
    async deleteAdmin(channelID, username, req) {
        let user = await this.userService.findUserById(req.user.id);
        let channel = await this.channelService.findOne(channelID);
        if (!user)
            throw new common_1.UnauthorizedException("User not found");
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        if (!this.channelService.isOwner(channel, user)
            && !(user.is_admin == "owner" || user.is_admin == "moderator"))
            throw new common_1.UnauthorizedException("You must be the owner of this channel to perform this action.");
        let ex_admin = await this.userService.findByUsername(username);
        if (!ex_admin || !this.channelService.isInChannel(channel, ex_admin))
            throw new common_1.NotFoundException("User not found");
        this.channelService.removeAdmin(channel, ex_admin);
    }
    async generateLink(channelID, req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.NotFoundException("User not found");
        let channel = await this.channelService.findOne(channelID);
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        if (!this.channelService.isInChannel(channel, user))
            throw new common_1.UnauthorizedException("User not in this channel");
        let link = await this.channelService.generateInvitation(channel, user);
        return { link: "/invitations/" + link };
    }
    async editType(channelID, body, req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.NotFoundException("User not found");
        let channel = await this.channelService.findOne(channelID);
        if (!channel)
            throw new common_1.NotFoundException("Channel not found");
        if (!this.channelService.isOwner(channel, user))
            throw new common_1.UnauthorizedException("You must be the owner of this channel to perform this action");
        await this.channelService.setChannelType(channel, body.type);
        this.websocketGateway.changeType(channel);
    }
};
__decorate([
    common_1.Get("/test"),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "test", null);
__decorate([
    common_1.Post(),
    __param(0, common_1.Request()),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, channel_dto_1.CreateChannelDto]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "createChannel", null);
__decorate([
    common_1.Get(),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getChannels", null);
__decorate([
    common_1.Get("public"),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getPublicChannels", null);
__decorate([
    common_1.Get("joined"),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getJoinedChannels", null);
__decorate([
    common_1.Get("direct"),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getDirects", null);
__decorate([
    common_1.Delete(":channelID"),
    __param(0, common_1.Param("channelID")),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "deleteChannel", null);
__decorate([
    common_1.Get(":channelID/info"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getInfo", null);
__decorate([
    common_1.Post(":channelID/members"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Body()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "addMember", null);
__decorate([
    common_1.Get(":channelID/members"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getMembers", null);
__decorate([
    common_1.Get(":channelID/admin"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getAdmin", null);
__decorate([
    common_1.Post(":channelID/admin"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Body()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "addAdmin", null);
__decorate([
    common_1.Post(":channelID/members/:username/mute"),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Param('username')),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "muteUser", null);
__decorate([
    common_1.Delete(":channelID/members/:username/unmute"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Param('username')),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "unmuteUser", null);
__decorate([
    common_1.Post(":channelID/members/:username/ban"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Param('username')),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "banUser", null);
__decorate([
    common_1.Delete(":channelID/members/:username/unban"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Param('username')),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "unbanUser", null);
__decorate([
    common_1.Post(":channelID/messages"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Body()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "sendMessage", null);
__decorate([
    common_1.Get(":channelID"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getChannel", null);
__decorate([
    common_1.Patch(":channelID/name"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Body()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "changeName", null);
__decorate([
    common_1.Patch(":channelID/password"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Body()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "changePassword", null);
__decorate([
    common_1.Delete(":channelID/password"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Body()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "removePassword", null);
__decorate([
    common_1.Post(":channelID/check_password"),
    __param(0, common_1.Param('channelID')),
    __param(1, common_1.Body()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "checkPassword", null);
__decorate([
    common_1.Delete("/:channelID/members"),
    __param(0, common_1.Param("channelID")),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "leaveChannel", null);
__decorate([
    common_1.Delete("/:channelID/members/:username"),
    __param(0, common_1.Param("channelID")),
    __param(1, common_1.Param("username")),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "kickMember", null);
__decorate([
    common_1.Delete("/:channelID/admin/:username"),
    __param(0, common_1.Param("channelID")),
    __param(1, common_1.Param("username")),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "deleteAdmin", null);
__decorate([
    common_1.Get("/:channelID/invitation"),
    __param(0, common_1.Param("channelID")),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "generateLink", null);
__decorate([
    common_1.Patch(":channelID/type"),
    __param(0, common_1.Param("channelID")),
    __param(1, common_1.Body()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, channel_dto_1.EditTypeDto, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "editType", null);
ChannelController = ChannelController_1 = __decorate([
    common_1.Controller('channels'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __metadata("design:paramtypes", [channel_service_1.default,
        users_service_1.UsersService,
        message_service_1.default,
        channel_gateway_1.AppGateway])
], ChannelController);
exports.ChannelController = ChannelController;
//# sourceMappingURL=channel.controller.js.map