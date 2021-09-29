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
exports.InvitationController = void 0;
const common_1 = require("@nestjs/common");
const jwt_two_factor_auth_guard_1 = require("../../auth/jwt-two-factor-auth.guard");
const users_service_1 = require("../../users/users.service");
const channel_service_1 = require("../channel.service");
const invitation_service_1 = require("./invitation.service");
let InvitationController = class InvitationController {
    constructor(service, userService, channelService) {
        this.service = service;
        this.userService = userService;
        this.channelService = channelService;
    }
    async joinChannel(invitation_id, req) {
        let user = await this.userService.findById(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException("You must be logged in to perform this action !");
        let link = await this.service.getLink(invitation_id);
        if (!link)
            throw new common_1.NotFoundException("Invitiation link not found or expired !");
        await this.channelService.addUser(link.channel, user);
        await this.service.removeLink(link);
        return { channel_name: link.channel.name };
    }
};
__decorate([
    common_1.Delete("/:id"),
    __param(0, common_1.Param("id")),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "joinChannel", null);
InvitationController = __decorate([
    common_1.Controller("invitations"),
    common_1.UseGuards(jwt_two_factor_auth_guard_1.default),
    __metadata("design:paramtypes", [invitation_service_1.InvitationService,
        users_service_1.UsersService,
        channel_service_1.default])
], InvitationController);
exports.InvitationController = InvitationController;
//# sourceMappingURL=invitation.controller.js.map