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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_typeorm_paginate_1 = require("nestjs-typeorm-paginate");
const rxjs_1 = require("rxjs");
const jwt_two_factor_auth_guard_1 = require("../auth/jwt-two-factor-auth.guard");
const jwt_two_factor_admin_auth_guard_1 = require("../auth/jwt-two-factor-admin-auth-guard");
const users_entity_1 = require("./users.entity");
const users_service_1 = require("./users.service");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const match_history_entity_1 = require("./match-history.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let UserController = class UserController {
    constructor(userService, matchHistoryRepository) {
        this.userService = userService;
        this.matchHistoryRepository = matchHistoryRepository;
    }
    findCurrentUserId(req) {
        return { id: req.user.id };
    }
    getCurrUserStatus(req) {
        return this.userService.getCurrUserStatus(req.user);
    }
    async getCurrentUserAvatar(req, res) {
        const user = await users_entity_1.User.findOne(({ where: { id: req.user.id } }));
        res.sendFile(user.avatar, { root: 'images' });
    }
    async getCurrUserInfo(req) {
        try {
            const user = await users_entity_1.User.findOne({ where: { id: req.user.id } });
            if (!user) {
                throw new common_1.NotFoundException();
            }
            delete user.twoFactorAuthenticationSecret;
            return user;
        }
        catch (e) {
            throw e;
        }
    }
    getCurrUserHistory(limit = 10, page = 1, username, req) {
        return rxjs_1.from(nestjs_typeorm_paginate_1.paginate(this.matchHistoryRepository, { page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/history/me' }, {
            where: [{ winner: req.user }, { looser: req.user }],
            relations: ['winner', 'looser'],
            order: { time: 'DESC' },
            select: ['id', 'winner', 'looser', 'winnerScore', 'looserScore', 'time', 'gameOptions', 'looserdisconnected']
        })).pipe(rxjs_1.map((matchHistoryPageable) => {
            var items = [];
            matchHistoryPageable.items.forEach(function (element) {
                delete element.winner.twoFactorAuthenticationSecret;
                delete element.winner.isTwoFactorAuthenticationEnabled;
                delete element.looser.twoFactorAuthenticationSecret;
                delete element.looser.isTwoFactorAuthenticationEnabled;
                items.push(element);
            });
            var historyPageable = {
                items: items,
                links: matchHistoryPageable.links,
                meta: matchHistoryPageable.meta
            };
            return historyPageable;
        }));
    }
    changeUserdisplayname(newdisplayname, req) {
        try {
            return this.userService.changeUserdisplayname(req.user.id, newdisplayname);
        }
        catch (e) {
            throw e;
        }
    }
    async saveAvatar(req, file) {
        try {
            await this.userService.updateAvatar(req.user.id, file.filename);
        }
        catch (e) {
            throw e;
        }
    }
    paginatedUsers(limit = 10, page = 1, username) {
        limit = limit > 100 ? 100 : limit;
        if (username == null) {
            return this.userService.paginateUsers({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/users' });
        }
        else {
            return this.userService.paginateUsersFilterBydisplayname({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/users' }, username);
        }
    }
    paginateUsersOrderByScore(limit = 10, page = 1) {
        limit = limit > 100 ? 100 : limit;
        return this.userService.paginateUsersOrderByScore({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/users/leaderboard' });
    }
    async findUserById(userStringId, req) {
        try {
            const userId = parseInt(userStringId);
            if (!userId)
                throw new common_1.BadRequestException();
            let ret = await this.userService.findUserById(userId);
            let user = await this.userService.findUserById(req.user.id);
            if (ret.blocked.findIndex(u => u.id == user.id) != -1
                || user.blocked.findIndex(u => u.id == ret.id) != -1)
                ret["isBlocked"] = true;
            return (ret);
        }
        catch (e) {
            throw (e);
        }
    }
    getUserAvatarFromPath(pathInfo, res) {
        try {
            res.sendFile(pathInfo.path, { root: 'images' });
        }
        catch (_a) {
            console.log("Couldn't find user avatar with path " + pathInfo.path);
            return new common_1.NotFoundException();
        }
    }
    getUserStatus(userStringId) {
        const userId = parseInt(userStringId);
        if (!userId)
            throw new common_1.BadRequestException();
        return this.userService.getUserStatus(userId);
    }
    changeUserStatus(userStringId, targetStatus) {
        try {
            const userId = parseInt(userStringId);
            if (!userId)
                throw new common_1.BadRequestException();
            this.userService.changeUserStatus(userId, targetStatus);
        }
        catch (e) {
            throw e;
        }
    }
    blockUser(blocked_id, req) {
        try {
            return this.userService.blockUser(req.user.id, blocked_id);
        }
        catch (e) {
            throw new common_1.ForbiddenException(e.message);
        }
    }
    unBlockUser(blocked_id, req) {
        try {
            return this.userService.unBlockUser(req.user.id, blocked_id);
        }
        catch (e) {
            throw new common_1.ForbiddenException(e.message);
        }
    }
    paginatedFriends(limit = 10, page = 1, req) {
        limit = limit > 100 ? 100 : limit;
        return this.userService.paginateFriends({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/friend-request/me/friends' }, req.user);
    }
    paginatedFriendRequestsFromRecipients(limit = 10, page = 1, req) {
        return this.userService.paginateFriendRequestsFromRecipients({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/friend-request/me/received-requests' }, req.user);
    }
    paginatedFriendRequestsToRecipients(limit = 10, page = 1, req) {
        return this.userService.paginateFriendRequestsToRecipients({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/friend-request/me/sent-requests' }, req.user);
    }
    sendFriendRequest(receiverStringId, req) {
        const receiverId = parseInt(receiverStringId);
        return this.userService.sendFriendRequest(receiverId, req.user);
    }
    getFriendRequestStatus(receiverStringId, req) {
        const receiverId = parseInt(receiverStringId);
        if (!receiverId)
            throw new common_1.BadRequestException();
        return this.userService.getFriendRequestStatus(receiverId, req.user);
    }
    respondToFriendRequest(friendRequestStringId, responseStatus) {
        const friendRequestId = parseInt(friendRequestStringId);
        if (!friendRequestId)
            throw new common_1.BadRequestException();
        return this.userService.respondToFriendRequest(friendRequestId, responseStatus.status);
    }
    async getWebsiteBlockedUsers(limit = 10, page = 1) {
        return this.userService.getWebsiteBlockedUsersPaginated({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/administration/blocked_users' });
    }
    async blockWebsiteUser(data, req) {
        const user = await this.userService.findUserById(data.targetUserId);
        if (user.is_admin !== "owner" && data.targetUserId !== req.user.id)
            return this.userService.blockWebsiteUser(data.targetUserId);
        else if (data.targetUserId === req.user.id)
            throw new common_1.ForbiddenException("You can't block yourself !");
        else
            throw new common_1.ForbiddenException("You can't block the website owner !");
    }
    async unblockWebsiteUser(data, req) {
        return this.userService.unblockWebsiteUser(data.targetUserId);
    }
    async getWebsiteOwner() {
        return await this.userService.getWebsiteOwner();
    }
    getWebsiteModerators(limit = 10, page = 1) {
        return this.userService.getWebsiteModerators({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/administration/moderators' });
    }
    async makeWebsiteModerator(data, req) {
        const user = await this.userService.findUserById(data.targetUserId);
        if (user.is_admin !== "owner")
            return this.userService.makeUserModerator(data.targetUserId);
        else
            throw new common_1.ForbiddenException("You can't make the website owner a moderator");
    }
    async makeuserRegular(data, req) {
        const user = await this.userService.findUserById(data.targetUserId);
        if (user.is_admin !== "owner")
            return this.userService.makeUserRegular(data.targetUserId);
        else
            throw new common_1.ForbiddenException("You can't make the website owner a regular user");
    }
};
__decorate([
    common_1.Get(),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "findCurrentUserId", null);
__decorate([
    common_1.Get('status/me'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], UserController.prototype, "getCurrUserStatus", null);
__decorate([
    common_1.Get('avatar/me'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getCurrentUserAvatar", null);
__decorate([
    common_1.Get('info/me'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getCurrUserInfo", null);
__decorate([
    common_1.Get('history/me'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Query('limit')),
    __param(1, common_1.Query('page')),
    __param(2, common_1.Query('username')),
    __param(3, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], UserController.prototype, "getCurrUserHistory", null);
__decorate([
    common_1.Post('displayname'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Body('displayname')),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "changeUserdisplayname", null);
__decorate([
    common_1.Post('avatar/update'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    common_1.UseInterceptors(platform_express_1.FileInterceptor('avatar', {
        limits: {
            fileSize: 5 * 10 * 10 * 10 * 10 * 10 * 10 * 10
        },
        storage: multer_1.diskStorage({
            destination: './images',
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new common_1.ForbiddenException('Only image files are allowed'), false);
            }
            return cb(null, true);
        }
    })),
    __param(0, common_1.Req()),
    __param(1, common_1.UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "saveAvatar", null);
__decorate([
    common_1.Get('users'),
    __param(0, common_1.Query('limit')),
    __param(1, common_1.Query('page')),
    __param(2, common_1.Query('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Object)
], UserController.prototype, "paginatedUsers", null);
__decorate([
    common_1.Get('users/leaderboard'),
    __param(0, common_1.Query('limit')),
    __param(1, common_1.Query('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "paginateUsersOrderByScore", null);
__decorate([
    common_1.Get(':userId'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param('userId')),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findUserById", null);
__decorate([
    common_1.Post('/avatar'),
    __param(0, common_1.Body()),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "getUserAvatarFromPath", null);
__decorate([
    common_1.Get('status/:userid'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param('userid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", rxjs_1.Observable)
], UserController.prototype, "getUserStatus", null);
__decorate([
    common_1.Post('change-status/:userid'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param('userid')),
    __param(1, common_1.Body('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "changeUserStatus", null);
__decorate([
    common_1.Post('/:id/block'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param("id")),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "blockUser", null);
__decorate([
    common_1.Post('/:id/unblock'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param("id")),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "unBlockUser", null);
__decorate([
    common_1.Get('/friend-request/me/friends'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Query('limit')),
    __param(1, common_1.Query('page')),
    __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], UserController.prototype, "paginatedFriends", null);
__decorate([
    common_1.Get('/friend-request/me/received-requests'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Query('limit')),
    __param(1, common_1.Query('page')),
    __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], UserController.prototype, "paginatedFriendRequestsFromRecipients", null);
__decorate([
    common_1.Get('/friend-request/me/sent-requests'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Query('limit')),
    __param(1, common_1.Query('page')),
    __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], UserController.prototype, "paginatedFriendRequestsToRecipients", null);
__decorate([
    common_1.Post('friend-request/send/:receiverId'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param('receiverId')),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "sendFriendRequest", null);
__decorate([
    common_1.Get('/friend-request/status/:receiverId'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param('receiverId')),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getFriendRequestStatus", null);
__decorate([
    common_1.Put('/friend-request/response/:friendRequestId'),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __param(0, common_1.Param('friendRequestId')),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "respondToFriendRequest", null);
__decorate([
    common_1.Get('/administration/blocked_users'),
    common_1.UseGuards(jwt_two_factor_admin_auth_guard_1.default),
    __param(0, common_1.Query('limit')),
    __param(1, common_1.Query('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getWebsiteBlockedUsers", null);
__decorate([
    common_1.Post('/administration/block_user'),
    common_1.UseGuards(jwt_two_factor_admin_auth_guard_1.default),
    __param(0, common_1.Body()),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "blockWebsiteUser", null);
__decorate([
    common_1.Post('/administration/unblock_user'),
    common_1.UseGuards(jwt_two_factor_admin_auth_guard_1.default),
    __param(0, common_1.Body()),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "unblockWebsiteUser", null);
__decorate([
    common_1.Get('/administration/owner'),
    common_1.UseGuards(jwt_two_factor_admin_auth_guard_1.default),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getWebsiteOwner", null);
__decorate([
    common_1.Get('/administration/moderators'),
    common_1.UseGuards(jwt_two_factor_admin_auth_guard_1.default),
    __param(0, common_1.Query('limit')),
    __param(1, common_1.Query('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getWebsiteModerators", null);
__decorate([
    common_1.Post('/administration/make_moderator'),
    common_1.UseGuards(jwt_two_factor_admin_auth_guard_1.default),
    __param(0, common_1.Body()),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "makeWebsiteModerator", null);
__decorate([
    common_1.Post('/administration/make_regular'),
    common_1.UseGuards(jwt_two_factor_admin_auth_guard_1.default),
    __param(0, common_1.Body()),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "makeuserRegular", null);
UserController = __decorate([
    common_1.Controller('/user'),
    __param(1, typeorm_1.InjectRepository(match_history_entity_1.MatchHistoryEntity)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        typeorm_2.Repository])
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=users.controller.js.map