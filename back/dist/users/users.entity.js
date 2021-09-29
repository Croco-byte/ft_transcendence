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
var User_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const channel_entity_1 = require("../channels/channel.entity");
const message_entity_1 = require("../messages/message.entity");
const friends_request_entity_1 = require("./friends-request.entity");
const typeorm_1 = require("typeorm");
const match_history_entity_1 = require("./match-history.entity");
let User = User_1 = class User extends typeorm_1.BaseEntity {
    toPublic() {
        return {
            id: this.id,
            username: this.username,
            avatar: this.avatar,
            score: this.score,
            status: this.status
        };
    }
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    typeorm_1.Column({ default: "regular" }),
    __metadata("design:type", String)
], User.prototype, "is_admin", void 0);
__decorate([
    typeorm_1.Column({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "is_blocked", void 0);
__decorate([
    typeorm_1.Column({ default: "default" }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    typeorm_1.Column({ type: "integer", nullable: true, default: 500 }),
    __metadata("design:type", Number)
], User.prototype, "score", void 0);
__decorate([
    typeorm_1.Column({ default: 'offline' }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    typeorm_1.OneToMany(() => message_entity_1.Message, msg => msg.user),
    __metadata("design:type", Array)
], User.prototype, "messages", void 0);
__decorate([
    typeorm_1.ManyToMany(() => User_1, (user) => user.blocked),
    typeorm_1.JoinTable({ name: "blocked_users" }),
    __metadata("design:type", Array)
], User.prototype, "blocked", void 0);
__decorate([
    typeorm_1.ManyToMany(() => channel_entity_1.Channel, channel => channel.users),
    __metadata("design:type", Array)
], User.prototype, "channels", void 0);
__decorate([
    typeorm_1.OneToMany(() => channel_entity_1.Channel, channel => channel.owner),
    __metadata("design:type", Array)
], User.prototype, "own_channels", void 0);
__decorate([
    typeorm_1.Column({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isTwoFactorAuthenticationEnabled", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "twoFactorAuthenticationSecret", void 0);
__decorate([
    typeorm_1.Column({ default: "filler" }),
    __metadata("design:type", String)
], User.prototype, "displayname", void 0);
__decorate([
    typeorm_1.OneToMany(() => friends_request_entity_1.FriendRequestEntity, (friendRequestentity) => friendRequestentity.creator),
    __metadata("design:type", Array)
], User.prototype, "sentFriendRequests", void 0);
__decorate([
    typeorm_1.OneToMany(() => friends_request_entity_1.FriendRequestEntity, (friendRequestentity) => friendRequestentity.receiver),
    __metadata("design:type", Array)
], User.prototype, "receivedFriendRequests", void 0);
__decorate([
    typeorm_1.OneToMany(() => match_history_entity_1.MatchHistoryEntity, (matchHistoryEntity) => matchHistoryEntity.winner),
    __metadata("design:type", Array)
], User.prototype, "matchesWon", void 0);
__decorate([
    typeorm_1.OneToMany(() => match_history_entity_1.MatchHistoryEntity, (matchHistoryEntity) => matchHistoryEntity.looser),
    __metadata("design:type", Array)
], User.prototype, "matchesLost", void 0);
__decorate([
    typeorm_1.Column({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "wins", void 0);
__decorate([
    typeorm_1.Column({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "loses", void 0);
__decorate([
    typeorm_1.Column({ default: 'none' }),
    __metadata("design:type", String)
], User.prototype, "roomId", void 0);
__decorate([
    typeorm_1.ManyToMany(() => channel_entity_1.Channel, channel => channel.pending_users),
    __metadata("design:type", Array)
], User.prototype, "pending_channels", void 0);
User = User_1 = __decorate([
    typeorm_1.Entity()
], User);
exports.User = User;
;
//# sourceMappingURL=users.entity.js.map