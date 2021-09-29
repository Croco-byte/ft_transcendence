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
exports.InvitationLink = void 0;
const typeorm_1 = require("typeorm");
const channel_entity_1 = require("../channel.entity");
let InvitationLink = class InvitationLink extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], InvitationLink.prototype, "id", void 0);
__decorate([
    typeorm_1.ManyToOne(() => channel_entity_1.Channel, c => c.invitation_links),
    __metadata("design:type", channel_entity_1.Channel)
], InvitationLink.prototype, "channel", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], InvitationLink.prototype, "path", void 0);
InvitationLink = __decorate([
    typeorm_1.Entity()
], InvitationLink);
exports.InvitationLink = InvitationLink;
//# sourceMappingURL=invitation_link.entity.js.map