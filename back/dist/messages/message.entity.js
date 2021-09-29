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
exports.Message = void 0;
const channel_entity_1 = require("../channels/channel.entity");
const users_entity_1 = require("../users/users.entity");
const typeorm_1 = require("typeorm");
let Message = class Message extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Message.prototype, "id", void 0);
__decorate([
    typeorm_1.ManyToOne(() => users_entity_1.User, user => user.messages),
    __metadata("design:type", users_entity_1.User)
], Message.prototype, "user", void 0);
__decorate([
    typeorm_1.ManyToOne(() => channel_entity_1.Channel, chan => chan.messages),
    __metadata("design:type", channel_entity_1.Channel)
], Message.prototype, "channel", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
Message = __decorate([
    typeorm_1.Entity("message")
], Message);
exports.Message = Message;
;
//# sourceMappingURL=message.entity.js.map