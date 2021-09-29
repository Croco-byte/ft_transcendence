"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModule = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
const game_gateway_1 = require("./game.gateway");
const auth_module_1 = require("../auth/auth.module");
const users_module_1 = require("../users/users.module");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const match_history_entity_1 = require("../users/match-history.entity");
const users_entity_1 = require("../users/users.entity");
const game_controller_1 = require("./game.controller");
let GameModule = class GameModule {
};
GameModule = __decorate([
    common_1.Module({
        imports: [
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([match_history_entity_1.MatchHistoryEntity, users_entity_1.User])
        ],
        controllers: [game_controller_1.GameController],
        providers: [
            game_gateway_1.GameGateway,
            game_service_1.GameService
        ],
    })
], GameModule);
exports.GameModule = GameModule;
//# sourceMappingURL=game.module.js.map