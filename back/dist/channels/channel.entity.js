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
exports.Channel = void 0;
const users_entity_1 = require("../users/users.entity");
const typeorm_1 = require("typeorm");
const channel_muted_user_entity_1 = require("./channel_muted_users/channel_muted_user.entity");
const message_entity_1 = require("../messages/message.entity");
const invitation_link_entity_1 = require("./invitation_links/invitation_link.entity");
let Channel = class Channel extends typeorm_1.BaseEntity {
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            requirePassword: this.requirePassword,
            password: this.password,
            creationDate: this.creationDate,
            users: [],
            isDirect: this.isDirect
        };
    }
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Channel.prototype, "id", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Channel.prototype, "type", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Channel.prototype, "name", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Boolean)
], Channel.prototype, "requirePassword", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", String)
], Channel.prototype, "password", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", String)
], Channel.prototype, "lastMessage", void 0);
__decorate([
    typeorm_1.Column({ default: "2021-09-08 18:08:11" }),
    __metadata("design:type", Date)
], Channel.prototype, "modifiedDate", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Channel.prototype, "creationDate", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Boolean)
], Channel.prototype, "isDirect", void 0);
__decorate([
    typeorm_1.ManyToMany(() => users_entity_1.User, user => user.channels),
    typeorm_1.JoinTable(),
    __metadata("design:type", Array)
], Channel.prototype, "users", void 0);
__decorate([
    typeorm_1.ManyToMany(() => users_entity_1.User),
    typeorm_1.JoinTable(),
    __metadata("design:type", Array)
], Channel.prototype, "administrators", void 0);
__decorate([
    typeorm_1.ManyToOne(() => users_entity_1.User, (user) => user.own_channels),
    __metadata("design:type", users_entity_1.User)
], Channel.prototype, "owner", void 0);
__decorate([
    typeorm_1.OneToMany(() => message_entity_1.Message, msg => msg.channel),
    __metadata("design:type", Array)
], Channel.prototype, "messages", void 0);
__decorate([
    typeorm_1.OneToMany(() => channel_muted_user_entity_1.Channel_muted_user, muted => muted.channel),
    __metadata("design:type", Array)
], Channel.prototype, "mutedUsers", void 0);
__decorate([
    typeorm_1.ManyToMany(() => users_entity_1.User, user => user.pending_channels),
    typeorm_1.JoinTable({ name: "pending_channels_users" }),
    __metadata("design:type", Array)
], Channel.prototype, "pending_users", void 0);
__decorate([
    typeorm_1.OneToMany(() => invitation_link_entity_1.InvitationLink, link => link.channel),
    __metadata("design:type", Array)
], Channel.prototype, "invitation_links", void 0);
Channel = __decorate([
    typeorm_1.Entity('Channel')
], Channel);
exports.Channel = Channel;
;
//# sourceMappingURL=channel.entity.js.map