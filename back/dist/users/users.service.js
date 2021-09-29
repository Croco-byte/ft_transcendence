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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const rxjs_1 = require("rxjs");
const typeorm_2 = require("typeorm");
const friends_request_entity_1 = require("./friends-request.entity");
const users_entity_1 = require("./users.entity");
const nestjs_typeorm_paginate_1 = require("nestjs-typeorm-paginate");
const fs_1 = require("fs");
const common_2 = require("@nestjs/common");
const channel_service_1 = require("../channels/channel.service");
let UsersService = class UsersService {
    constructor(usersRepository, friendRequestRepository) {
        this.usersRepository = usersRepository;
        this.friendRequestRepository = friendRequestRepository;
        this.logger = new common_2.Logger('UsersService');
    }
    async setTwoFactorAuthenticationSecret(secret, id) {
        return this.usersRepository.update(id, { twoFactorAuthenticationSecret: secret });
    }
    async turnOnTwoFactorAuthentication(id) {
        return this.usersRepository.update(id, { isTwoFactorAuthenticationEnabled: true });
    }
    async turnOffTwoFactorAuthentication(id) {
        return this.usersRepository.update(id, { isTwoFactorAuthenticationEnabled: false });
    }
    async findUserById(id) {
        const user = await this.usersRepository.findOne({ where: { id: id }, relations: ["blocked"] });
        if (!user) {
            throw new common_1.NotFoundException();
        }
        delete user.isTwoFactorAuthenticationEnabled;
        delete user.twoFactorAuthenticationSecret;
        return user;
    }
    async getUserRank(id) {
        const user = await this.usersRepository.findOne({ where: { id: id } });
        const allBetterScores = await this.usersRepository.createQueryBuilder()
            .select('DISTINCT score')
            .where("score > :userScore", { userScore: user.score })
            .execute();
        return (allBetterScores.length + 1);
    }
    getCurrUserStatus(currUser) {
        return rxjs_1.from(this.usersRepository.findOne(currUser.id)).pipe(rxjs_1.map((user) => {
            return { status: user.status };
        }));
    }
    getUserStatus(userId) {
        return rxjs_1.from(this.usersRepository.findOne(userId)).pipe(rxjs_1.map((user) => {
            return { status: user.status };
        }));
    }
    async changeUserdisplayname(id, newdisplayname) {
        const invalidChars = /^[a-zA-Z0-9-_]+$/;
        if (newdisplayname.search(invalidChars) === -1 || newdisplayname.length > 15) {
            throw new common_1.ForbiddenException();
        }
        const duplicate = await this.usersRepository.findOne({ where: { displayname: newdisplayname } });
        if (duplicate) {
            throw new common_1.BadRequestException();
        }
        const user = await this.usersRepository.findOne({ where: { id: id } });
        user.displayname = newdisplayname;
        this.usersRepository.save(user);
        return user.displayname;
    }
    async updateAvatar(id, filename) {
        try {
            const user = await users_entity_1.User.findOne({ where: { id: id } });
            if (user.avatar === "default") {
                this.usersRepository.update(id, { avatar: filename });
            }
            else {
                fs_1.unlink("./images/" + user.avatar, () => { console.log("Successfully deleted previous avatar with path ./images/" + user.avatar); });
                this.usersRepository.update(id, { avatar: filename });
            }
        }
        catch (e) {
            console.log(e.message);
            throw new common_1.BadRequestException();
        }
    }
    async changeUserStatus(userId, targetStatus) {
        try {
            await typeorm_2.getConnection().createQueryBuilder()
                .update(users_entity_1.User)
                .set({
                status: targetStatus,
            })
                .where("id = :id", { id: userId })
                .execute();
        }
        catch (_a) {
            throw new common_1.NotFoundException();
        }
    }
    async isUserAlreadyBlocked(currUser, blockedUser) {
        for (const user of currUser.blocked) {
            if (user.id === blockedUser.id)
                return "blocked-by-me";
        }
        for (const user of blockedUser.blocked) {
            if (user.id === currUser.id)
                return "blocked-by-other-user";
        }
        return "not-blocked";
    }
    async blockUser(currUserId, blockedUserId) {
        if (currUserId === blockedUserId)
            throw new common_1.ForbiddenException("You can't block yourself !");
        const currUser = await this.usersRepository.findOne({
            relations: ['blocked'],
            where: { id: currUserId }
        });
        const blockedUser = await this.usersRepository.findOne({
            relations: ['blocked'],
            where: { id: blockedUserId }
        });
        let userAlreadyBlocked = await this.isUserAlreadyBlocked(currUser, blockedUser);
        if (userAlreadyBlocked === "not-blocked") {
            return await typeorm_2.getConnection()
                .createQueryBuilder()
                .relation(users_entity_1.User, "blocked")
                .of(currUser)
                .add(blockedUser);
        }
        else {
            throw new common_1.ForbiddenException("You already blocked this user, or this user already blocked you");
        }
    }
    async unBlockUser(currUserId, blockedUserId) {
        if (currUserId === blockedUserId)
            throw new common_1.ForbiddenException("You can't unblock yourself !");
        const currUser = await this.usersRepository.findOne({
            relations: ['blocked'],
            where: { id: currUserId }
        });
        const blockedUser = await this.usersRepository.findOne({
            relations: ['blocked'],
            where: { id: blockedUserId }
        });
        let userAlreadyBlocked = await this.isUserAlreadyBlocked(currUser, blockedUser);
        if (userAlreadyBlocked === "blocked-by-me") {
            return await typeorm_2.getConnection()
                .createQueryBuilder()
                .relation(users_entity_1.User, "blocked")
                .of(currUser)
                .remove(blockedUser);
        }
        else {
            throw new common_1.ForbiddenException("This user isn't blocked, or he is the one that blocked you");
        }
    }
    async getFriendRequestById(friendRequestId) {
        const friendRequest = await this.friendRequestRepository.findOne({ where: [{ id: friendRequestId }],
            relations: ['creator', 'receiver']
        });
        return friendRequest;
    }
    async sendFriendRequest(receiverId, creatorId) {
        if (receiverId === creatorId) {
            throw new Error("You can't send a friend request to yourself !");
        }
        const receiver = await this.findUserById(receiverId);
        const creator = await this.findUserById(creatorId);
        const hasFriendRequestBeenSentOrReceived = await this.hasFriendRequestBeenSentOrReceived(creator, receiver);
        if (hasFriendRequestBeenSentOrReceived === "true")
            throw new Error("Can't send friend request. Possible reasons are : 1. You're already friends 2. A request already exists from or to this user 3. The user has already declined a request coming from you, and only him can send you one now ");
        if (hasFriendRequestBeenSentOrReceived === "allow-resend")
            return this.reSendFriendRequest(creator, receiver);
        let friendRequest = {
            creator,
            receiver,
            status: 'pending'
        };
        return this.friendRequestRepository.save(friendRequest);
    }
    async reSendFriendRequest(creator, receiver) {
        const friendRequest = await this.friendRequestRepository.findOne({ where: [{ creator, receiver }, { creator: receiver, receiver: creator }],
            relations: ['creator', 'receiver'] });
        friendRequest.creator = creator;
        friendRequest.receiver = receiver;
        friendRequest.status = "pending";
        return this.friendRequestRepository.save(friendRequest);
    }
    async respondToFriendRequest(friendRequestId, responseStatus) {
        const friendRequest = await this.getFriendRequestById(friendRequestId);
        return this.friendRequestRepository.save(Object.assign(Object.assign({}, friendRequest), { status: responseStatus }));
    }
    async hasFriendRequestBeenSentOrReceived(creator, receiver) {
        const friendRequest = await this.friendRequestRepository.findOne({ where: [{ creator, receiver }, { creator: receiver, receiver: creator }],
            relations: ['creator', 'receiver'] });
        if (!friendRequest)
            return ("false");
        if (friendRequest.status === "declined" && friendRequest.receiver.id == creator.id)
            return ("allow-resend");
        return ("true");
    }
    async getFriendRequestStatus(receiverId, currentUser) {
        const receiver = await this.findUserById(receiverId);
        const friendRequest = await this.friendRequestRepository.findOne({ where: [
                { creator: currentUser, receiver: receiver },
                { creator: receiver, receiver: currentUser }
            ],
            relations: ['creator', 'receiver'] });
        if ((friendRequest === null || friendRequest === void 0 ? void 0 : friendRequest.receiver.id) === currentUser.id && (friendRequest === null || friendRequest === void 0 ? void 0 : friendRequest.status) !== "accepted" && (friendRequest === null || friendRequest === void 0 ? void 0 : friendRequest.status) !== "declined") {
            return ({ status: 'waiting-for-current-user-response' });
        }
        if ((friendRequest === null || friendRequest === void 0 ? void 0 : friendRequest.receiver.id) == currentUser.id && (friendRequest === null || friendRequest === void 0 ? void 0 : friendRequest.status) === "declined") {
            return ({ status: 'declined-by-me' });
        }
        return { status: (friendRequest === null || friendRequest === void 0 ? void 0 : friendRequest.status) || 'not-sent' };
    }
    async unfriendUser(currUserId, friendId) {
        try {
            let friend = await this.findUserById(friendId);
            let currentUser = await this.findUserById(currUserId);
            let friendRequest = await this.friendRequestRepository.findOne({
                where: [
                    { creator: currentUser, receiver: friend, status: 'accepted' },
                    { creator: friend, receiver: currentUser, status: 'accepted' }
                ],
                relations: ['creator', 'receiver']
            });
            this.friendRequestRepository.delete(friendRequest.id);
            return { creatorId: friendRequest.creator.id, receiverId: friendRequest.receiver.id };
        }
        catch (_a) {
            throw new common_1.NotFoundException();
        }
    }
    async cancelFriendRequest(currUserId, receiverId) {
        try {
            let currUser = await this.findUserById(currUserId);
            let receiver = await this.findUserById(receiverId);
            let friendRequest = await this.friendRequestRepository.findOne({
                where: [
                    { creator: currUser, receiver: receiver, status: 'pending' }
                ],
            });
            this.friendRequestRepository.delete(friendRequest.id);
            return { creatorId: currUserId, receiverId: receiverId };
        }
        catch (e) {
            console.log(e.message);
            throw new common_1.NotFoundException();
        }
    }
    async paginateUsers(options) {
        let ref = this;
        const queryBuilder = this.usersRepository.createQueryBuilder('c');
        queryBuilder.select(["c.id", "c.displayname", "c.avatar", "c.score", "c.wins", "c.loses", "c.is_admin", "c.is_blocked"]);
        queryBuilder.orderBy('c.displayname', 'ASC');
        return await nestjs_typeorm_paginate_1.paginate(queryBuilder, options);
    }
    async paginateUsersOrderByScore(options) {
        let ref = this;
        const queryBuilder = this.usersRepository.createQueryBuilder('c');
        queryBuilder.select(["c.id", "c.displayname", "c.avatar", "c.score", "c.wins", "c.loses"]);
        queryBuilder.orderBy('c.score', 'DESC');
        const result = await nestjs_typeorm_paginate_1.paginate(queryBuilder, options);
        let items = [];
        for (const element of result.items) {
            var rank = await ref.getUserRank(element.id);
            var userWithRank = { user: element, rank: rank };
            items.push(userWithRank);
        }
        ;
        let usersWithRankPageable = {
            items: items,
            links: result.links,
            meta: result.meta
        };
        return usersWithRankPageable;
    }
    paginateUsersFilterBydisplayname(options, displayname) {
        return rxjs_1.from(this.usersRepository.findAndCount({
            skip: (options.page - 1) * options.limit || 0,
            take: options.limit || 10,
            order: { displayname: 'ASC' },
            select: ['id', 'username', 'displayname', 'status', 'avatar', 'score'],
            where: { displayname: typeorm_2.Raw(alias => `LOWER(${alias}) Like ('%${displayname.toLowerCase()}%')`) }
        })).pipe(rxjs_1.map(([users, totalUsers]) => {
            const usersPageable = {
                items: users,
                links: {
                    first: options.route + `?limit=${options.limit}&username=${displayname}`,
                    previous: options.route + `?limit=${options.limit}&?page=${options.page > 0 ? options.page - 1 : 0}&username=${displayname}`,
                    next: options.route + `?limit=${options.limit}&?page=${options.page < Math.ceil(totalUsers / options.limit) ? options.page + 1 : options.page}&username=${displayname}`,
                    last: options.route + `?limit=${options.limit}&page=${Math.ceil(totalUsers / options.limit)}&username=${displayname}`
                },
                meta: {
                    currentPage: options.page,
                    itemCount: users.length,
                    itemsPerPage: options.limit,
                    totalItems: totalUsers,
                    totalPages: Math.ceil(totalUsers / options.limit)
                }
            };
            return usersPageable;
        }));
    }
    paginateFriends(options, currentUser) {
        return rxjs_1.from(nestjs_typeorm_paginate_1.paginate(this.friendRequestRepository, options, {
            where: [{ creator: currentUser, status: "accepted" }, { receiver: currentUser, status: "accepted" }],
            relations: ['receiver', 'creator'],
            select: ['id', 'receiver', 'creator']
        })).pipe(rxjs_1.map((friendRequestPageable) => {
            var items = [];
            friendRequestPageable.items.forEach(function (element) {
                if (element.creator.id != currentUser.id) {
                    delete element.creator.twoFactorAuthenticationSecret;
                    delete element.creator.isTwoFactorAuthenticationEnabled;
                    items.push(element.creator);
                }
                else {
                    delete element.receiver.twoFactorAuthenticationSecret;
                    delete element.receiver.isTwoFactorAuthenticationEnabled;
                    items.push(element.receiver);
                }
            });
            var usersPageable = {
                items: items,
                links: friendRequestPageable.links,
                meta: friendRequestPageable.meta
            };
            return usersPageable;
        }));
    }
    paginateFriendRequestsFromRecipients(options, currentUser) {
        return rxjs_1.from(nestjs_typeorm_paginate_1.paginate(this.friendRequestRepository, options, {
            where: { receiver: currentUser, status: "pending" },
            relations: ['creator', 'receiver']
        })).pipe(rxjs_1.map((friendRequestPageable) => {
            friendRequestPageable.items.forEach(function (element) {
                delete element.creator.twoFactorAuthenticationSecret;
                delete element.receiver.twoFactorAuthenticationSecret;
                delete element.creator.isTwoFactorAuthenticationEnabled;
                delete element.receiver.isTwoFactorAuthenticationEnabled;
            });
            return friendRequestPageable;
        }));
    }
    paginateFriendRequestsToRecipients(options, currentUser) {
        return rxjs_1.from(nestjs_typeorm_paginate_1.paginate(this.friendRequestRepository, options, {
            where: { creator: currentUser, status: "pending" },
            relations: ['creator', 'receiver']
        })).pipe(rxjs_1.map((friendRequests) => {
            friendRequests.items.forEach(element => {
                delete element.creator.twoFactorAuthenticationSecret;
                delete element.receiver.twoFactorAuthenticationSecret;
                delete element.creator.isTwoFactorAuthenticationEnabled;
                delete element.receiver.isTwoFactorAuthenticationEnabled;
            });
            return friendRequests;
        }));
    }
    async getWebsiteOwner() {
        return await this.usersRepository.createQueryBuilder("user")
            .select([
            "user.id",
            "user.username",
            "user.displayname",
            "user.avatar"
        ])
            .where("user.is_admin = 'owner'")
            .getOne();
    }
    async getWebsiteModerators(options) {
        const queryBuilder = this.usersRepository.createQueryBuilder("c");
        queryBuilder.select(["c.id", "c.username", "c.displayname", "c.avatar"]);
        queryBuilder.where("is_admin = 'moderator'");
        return await nestjs_typeorm_paginate_1.paginate(queryBuilder, options);
    }
    async getWebsiteBlockedUsersPaginated(options) {
        const queryBuilder = this.usersRepository.createQueryBuilder("c");
        queryBuilder.select(["c.id", "c.username", "c.displayname", "c.avatar"]);
        queryBuilder.where("is_blocked = true");
        return await nestjs_typeorm_paginate_1.paginate(queryBuilder, options);
    }
    async makeUserModerator(userId) {
        await this.usersRepository.createQueryBuilder()
            .update(users_entity_1.User)
            .set({ is_admin: "moderator" })
            .where("id = :id", { id: userId })
            .execute();
    }
    async makeUserRegular(userId) {
        await this.usersRepository.createQueryBuilder()
            .update(users_entity_1.User)
            .set({ is_admin: "regular" })
            .where("id = :id", { id: userId })
            .execute();
    }
    async blockWebsiteUser(userId) {
        await this.usersRepository.createQueryBuilder()
            .update(users_entity_1.User)
            .set({ is_blocked: true })
            .where("id = :id", { id: userId })
            .execute();
    }
    async unblockWebsiteUser(userId) {
        await this.usersRepository.createQueryBuilder()
            .update(users_entity_1.User)
            .set({ is_blocked: false })
            .where("id = :id", { id: userId })
            .execute();
    }
    async insert(user) {
        return this.usersRepository.save(user);
    }
    async findAll() {
        return (await this.usersRepository.find());
    }
    async findOne(id) {
        return this.usersRepository.findOne(id);
    }
    async findByUsername(name) {
        return this.usersRepository.findOne({ relations: ["channels", "blocked"], where: [{ username: name }] });
    }
    async findById(id) {
        return await this.usersRepository.findOne({ relations: ["channels", "blocked", "pending_channels"], where: [{ id: id }] });
    }
    async delete(id) {
        await this.usersRepository.delete(id);
    }
    async save(user) {
        await this.usersRepository.save(user);
    }
    async incUserWins(userDbId) {
        try {
            await typeorm_2.getConnection().createQueryBuilder()
                .update(users_entity_1.User)
                .set({
                wins: () => "wins + 1",
                score: () => "score + 50"
            })
                .where("id = :id", { id: userDbId })
                .execute();
        }
        catch (e) {
            this.logger.log('Couldn\'t find user required in order to increment wins');
        }
    }
    async incUserLoses(userDbId) {
        try {
            await typeorm_2.getConnection().createQueryBuilder()
                .update(users_entity_1.User)
                .set({
                loses: () => "loses + 1",
                score: () => "score - 30"
            })
                .where("id = :id", { id: userDbId })
                .execute();
        }
        catch (e) {
            this.logger.log('Couldn\'t find user required in order to increment loses');
        }
    }
    async updateRoomId(userDbId, newRoomId) {
        try {
            await typeorm_2.getConnection().createQueryBuilder()
                .update(users_entity_1.User)
                .set({
                roomId: newRoomId
            })
                .where("id = :id", { id: userDbId })
                .execute();
            return await typeorm_2.getConnection()
                .getRepository(users_entity_1.User)
                .createQueryBuilder("user")
                .where("user.id = :id", { id: userDbId })
                .getOne();
        }
        catch (e) {
            this.logger.log('Could\'t find user required in order to update room ID');
        }
    }
    async resetRoomId(roomToReset) {
        try {
            await typeorm_2.getConnection().createQueryBuilder()
                .update(users_entity_1.User)
                .set({
                roomId: 'none'
            })
                .where("roomId = :roomId", { roomId: roomToReset })
                .execute();
        }
        catch (e) {
            this.logger.log('Could\'t find room required in order to reset it');
        }
    }
    async rankUsers() {
        return await this.usersRepository.find({
            order: {
                "score": "DESC"
            }
        });
    }
    async getBiDirectionalBlockedUsers(user) {
        let res = user.blocked ? user.blocked : [];
        let users = await this.usersRepository.find({
            relations: ["blocked"]
        });
        for (let tmp_user of users) {
            if (tmp_user.blocked.findIndex((tmp) => tmp.id == user.id) != -1)
                res.push(tmp_user);
        }
        return res;
    }
};
UsersService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(users_entity_1.User)),
    __param(1, typeorm_1.InjectRepository(friends_request_entity_1.FriendRequestEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map