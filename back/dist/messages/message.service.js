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
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const channel_entity_1 = require("../channels/channel.entity");
const message_repository_1 = require("./message.repository");
const users_entity_1 = require("../users/users.entity");
const message_entity_1 = require("./message.entity");
let MessageService = class MessageService {
    constructor(repository) {
        this.repository = repository;
    }
    async add(channel, user, content) {
        let message = new message_entity_1.Message;
        message.channel = channel;
        message.user = user;
        message.content = content;
        return await this.insert(message);
    }
    async insert(message) {
        return this.repository.save(message);
    }
    async findAll() {
        return (await this.repository.find({ order: { id: "ASC" } }));
    }
    async findOne(id) {
        return this.repository.findOne(id);
    }
    async findByChannel(channel) {
        return await this.repository.find({ relations: ["user", "channel"], where: [{ channel: channel }], order: { id: "ASC" } });
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async save(message) {
        await this.repository.save(message);
    }
};
MessageService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(message_repository_1.default)),
    __metadata("design:paramtypes", [Object])
], MessageService);
exports.default = MessageService;
//# sourceMappingURL=message.service.js.map