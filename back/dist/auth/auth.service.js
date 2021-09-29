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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const common_3 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const users_entity_1 = require("../users/users.entity");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(httpService, jwtService, configService) {
        this.httpService = httpService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_3.Logger('AuthService');
    }
    async authenticateUser(code, state) {
        try {
            const url = this.configService.get('OAUTH_URL');
            const postData = { grant_type: 'authorization_code',
                client_id: this.configService.get('CLIENT_ID'),
                client_secret: this.configService.get('CLIENT_SECRET'),
                code: code,
                redirect_uri: this.configService.get('REDIRECT_URI') };
            const result = await this.httpService.post(url, postData).pipe(operators_1.map(resp => resp.data)).toPromise();
            const infos = await this.getInfoFromAPI(result.access_token);
            const existingUser = await users_entity_1.User.findOne({ where: { username: infos.username } });
            if (!existingUser) {
                this.logger.log("We don\'t have the user " + infos.username + ". Creating it in database.");
                const newUser = users_entity_1.User.create();
                newUser.username = infos.username;
                if (infos.username === this.configService.get('WEBSITE_OWNER'))
                    newUser.is_admin = 'owner';
                let displayname = infos.username;
                let tool = 1;
                let displaynameConflict = await users_entity_1.User.findOne({ where: { displayname: displayname } });
                while (displaynameConflict) {
                    tool++;
                    displayname = infos.username + "_" + tool.toString();
                    displaynameConflict = await users_entity_1.User.findOne({ where: { displayname: displayname } });
                }
                newUser.displayname = displayname;
                await users_entity_1.User.save(newUser);
            }
            const user = await users_entity_1.User.findOne({ where: { username: infos.username } });
            let returnObject;
            returnObject = {};
            returnObject.username = infos.username;
            returnObject.accessToken = this.jwtService.sign({ id: user.id, username: user.username, isSecondFactorAuthenticated: false }, { expiresIn: '24h' });
            if (user.isTwoFactorAuthenticationEnabled === true) {
                returnObject.twoFARedirect = true;
            }
            return returnObject;
        }
        catch (e) {
            throw e;
        }
    }
    async getInfoFromAPI(access_token) {
        const headersRequest = { 'Authorization': 'Bearer ' + access_token };
        const info = await this.httpService.get(this.configService.get('42_API'), { headers: headersRequest }).pipe(operators_1.map(resp => resp.data)).toPromise();
        var infos = {};
        infos.username = info.login;
        return infos;
    }
    async validateToken(access_token) {
        try {
            const decoded = await this.jwtService.verify(access_token);
            const user = users_entity_1.User.findOne(decoded.id, { relations: ["channels"] });
            return user;
        }
        catch (_a) {
            throw new common_1.UnauthorizedException();
        }
    }
    async customWsGuard(access_token) {
        try {
            const user = await this.validateToken(access_token);
            return user;
        }
        catch (_a) {
            return null;
        }
    }
    async registerUserBasicAuth(username, password) {
        try {
            console.log(username + " | " + typeof (username));
            if (!username || username.length <= 3)
                throw new common_1.ForbiddenException("Name must be at least 4 characters");
            if (!password || password.length <= 6)
                throw new common_1.ForbiddenException("Password must be at least 7 characters");
            const invalidChars = /^[a-zA-Z0-9-_]+$/;
            if (username.search(invalidChars) === -1 || username.length > 15)
                throw new common_1.ForbiddenException("Invalid characters in username or username too long");
            const existing = await users_entity_1.User.findOne({ where: { displayname: username }
            });
            if (existing)
                throw new common_1.ForbiddenException("Name is already taken.");
            const newUser = users_entity_1.User.create();
            newUser.username = "_" + username;
            newUser.displayname = username;
            newUser.password = await bcrypt.hash(password, 5);
            return await users_entity_1.User.save(newUser);
        }
        catch (e) {
            throw e;
        }
    }
    async authenticateUserBasicAuth(username, password) {
        try {
            if (!username || !password)
                throw new common_1.ForbiddenException("Username or password empty");
            const invalidChars = /^[a-zA-Z0-9-_]+$/;
            if (username.search(invalidChars) === -1 || username.length > 15)
                throw new common_1.ForbiddenException("Invalid characters in username or username too long");
            const existingUser = await users_entity_1.User.findOne({ where: { displayname: username } });
            if (!existingUser)
                throw new common_1.ForbiddenException("No user with such username");
            const passwordMatch = await bcrypt.compare(password, existingUser.password);
            if (!passwordMatch)
                throw new common_1.ForbiddenException("Wrong password for this username");
            let returnObject;
            returnObject = {};
            returnObject.username = existingUser.username;
            returnObject.accessToken = this.jwtService.sign({ id: existingUser.id, username: existingUser.username, isSecondFactorAuthenticated: false }, { expiresIn: '24h' });
            if (existingUser.isTwoFactorAuthenticationEnabled === true) {
                returnObject.twoFARedirect = true;
            }
            return returnObject;
        }
        catch (e) {
            throw e;
        }
    }
};
AuthService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [common_2.HttpService, jwt_1.JwtService, config_1.ConfigService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map