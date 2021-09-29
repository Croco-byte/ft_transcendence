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
exports.Channel_muted_user = void 0;
const channel_entity_1 = require("../channels/channel.entity");
const users_entity_1 = require("../users/users.entity");
const typeorm_1 = require("typeorm");
let Channel_muted_user = class Channel_muted_user extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Channel_muted_user.prototype, "id", void 0);
__decorate([
    typeorm_1.ManyToOne(() => channel_entity_1.Channel),
    typeorm_1.JoinColumn(),
    __metadata("design:type", channel_entity_1.Channel)
], Channel_muted_user.prototype, "channel", void 0);
__decorate([
    typeorm_1.ManyToOne(() => users_entity_1.User),
    typeorm_1.JoinColumn(),
    __metadata("design:type", users_entity_1.User)
], Channel_muted_user.prototype, "user", void 0);
__decorate([
    typeorm_1.Column({ type: 'date' }),
    __metadata("design:type", String)
], Channel_muted_user.prototype, "to", void 0);
Channel_muted_user = __decorate([
    typeorm_1.Entity('Channel_muted_user')
], Channel_muted_user);
exports.Channel_muted_user = Channel_muted_user;
;
//# sourceMappingURL=channel_muted_user.entity.js.map