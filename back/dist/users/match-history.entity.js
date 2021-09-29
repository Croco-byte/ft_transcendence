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
exports.MatchHistoryEntity = void 0;
const users_entity_1 = require("./users.entity");
const typeorm_1 = require("typeorm");
let MatchHistoryEntity = class MatchHistoryEntity extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], MatchHistoryEntity.prototype, "id", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", String)
], MatchHistoryEntity.prototype, "time", void 0);
__decorate([
    typeorm_1.ManyToOne(() => users_entity_1.User, (userEntity) => userEntity.matchesWon),
    __metadata("design:type", users_entity_1.User)
], MatchHistoryEntity.prototype, "winner", void 0);
__decorate([
    typeorm_1.ManyToOne(() => users_entity_1.User, (userEntity) => userEntity.matchesLost),
    __metadata("design:type", users_entity_1.User)
], MatchHistoryEntity.prototype, "looser", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], MatchHistoryEntity.prototype, "winnerScore", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], MatchHistoryEntity.prototype, "looserScore", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", String)
], MatchHistoryEntity.prototype, "gameOptions", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Boolean)
], MatchHistoryEntity.prototype, "looserdisconnected", void 0);
MatchHistoryEntity = __decorate([
    typeorm_1.Entity('matchHistory')
], MatchHistoryEntity);
exports.MatchHistoryEntity = MatchHistoryEntity;
//# sourceMappingURL=match-history.entity.js.map