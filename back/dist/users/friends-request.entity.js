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
exports.FriendRequestEntity = void 0;
const typeorm_1 = require("typeorm");
const users_entity_1 = require("./users.entity");
let FriendRequestEntity = class FriendRequestEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], FriendRequestEntity.prototype, "id", void 0);
__decorate([
    typeorm_1.ManyToOne(() => users_entity_1.User, (userEntity) => userEntity.sentFriendRequests),
    __metadata("design:type", users_entity_1.User)
], FriendRequestEntity.prototype, "creator", void 0);
__decorate([
    typeorm_1.ManyToOne(() => users_entity_1.User, (userEntity) => userEntity.receivedFriendRequests),
    __metadata("design:type", users_entity_1.User)
], FriendRequestEntity.prototype, "receiver", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], FriendRequestEntity.prototype, "status", void 0);
FriendRequestEntity = __decorate([
    typeorm_1.Entity('friendrequest')
], FriendRequestEntity);
exports.FriendRequestEntity = FriendRequestEntity;
//# sourceMappingURL=friends-request.entity.js.map