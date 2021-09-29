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
exports.InvitationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const invitation_link_entity_1 = require("./invitation_link.entity");
let InvitationService = class InvitationService {
    constructor(repository) {
        this.repository = repository;
    }
    async getLink(id) {
        return await this.repository.findOne({ relations: ["channel", "channel.users"], where: { path: id } });
    }
    async removeLink(link) {
        await this.repository.remove([link]);
    }
    async insertLink(channel, hash) {
        let link = new invitation_link_entity_1.InvitationLink();
        link.channel = channel;
        link.path = hash;
        this.repository.save(link);
        return link;
    }
};
InvitationService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(invitation_link_entity_1.InvitationLink)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InvitationService);
exports.InvitationService = InvitationService;
//# sourceMappingURL=invitation.service.js.map