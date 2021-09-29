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
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const users_service_1 = require("../users/users.service");
const config_1 = require("@nestjs/config");
const match_history_entity_1 = require("../users/match-history.entity");
const typeorm_2 = require("typeorm");
let GameService = class GameService {
    constructor(matchHistoryRepository, usersService, configService) {
        this.matchHistoryRepository = matchHistoryRepository;
        this.usersService = usersService;
        this.configService = configService;
        this.rooms = [];
        this.logger = new common_2.Logger('GameService');
        this.EASY = 1;
        this.MEDIUM = 2;
        this.HARD = 3;
        this.GAME_WIDTH = this.configService.get('game_width');
        this.GAME_HEIGHT = this.configService.get('game_height');
        this.BASE_SPEED = this.configService.get('base_speed');
        this.BASE_VEL = this.configService.get('base_vel');
        this.BALL_RADIUS = this.configService.get('ball_radius');
        this.PADDLE_HEIGHT = this.configService.get('paddle_height_screen_percentage_easy') * this.GAME_HEIGHT;
        this.PADDLE_WIDTH = this.configService.get('paddle_width_screen_percentage') * this.GAME_WIDTH;
        this.PADDLE_BORDER = this.configService.get('paddle_border_width_screen_percentage') * this.GAME_WIDTH;
        this.MAX_BALL_SPEED = this.configService.get('max_ball_speed');
        this.INCREASE_SPEED_PERCENTAGE = this.configService.get('increase_speed_percentage_easy');
        this.MAX_ANGLE = Math.PI / 4;
        this.FRAMERATE = 1000 / this.configService.get('framerate');
        this.TIME_MATCH_START = this.configService.get('time_match_start');
    }
    generateRoomId() {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    }
    findRoomByPlayerId(playerId) {
        return this.rooms.find(el => el.player1Id === playerId || el.player2Id === playerId);
    }
    async attributeRoom(userDbId, playerId, setupChosen) {
        const user = await this.usersService.findUserById(userDbId);
        if (!user)
            this.logger.log("[DEBUG] Couldn't find user ID when trying to attribute room to user with ID : " + userDbId);
        if (user.roomId != 'none' && user.status === 'spectating')
            return this.rooms.find(el => el.name === user.roomId);
        const roomToFill = this.rooms.find(el => el.player2Id === '' &&
            this.checkIfSameSetup(el.game.p1Left.setup, setupChosen));
        if (roomToFill)
            return this.playerJoinRoom(roomToFill, setupChosen, userDbId, playerId);
        else
            return this.createNewRoom(setupChosen, userDbId, playerId, playerId);
    }
    attributePrivateRoom(userDbId, playerId, privateRoomId) {
        const roomToFill = this.rooms.find(el => el.name === privateRoomId);
        if (roomToFill)
            return this.playerJoinRoom(roomToFill, this.resetSetup(), userDbId, playerId);
        else
            return this.createNewRoom(this.resetSetup(), userDbId, privateRoomId, playerId);
    }
    playerJoinRoom(roomToFill, setupChosen, userDbId, playerId) {
        roomToFill.user2DbId = userDbId;
        roomToFill.player2Id = playerId;
        roomToFill.game.p2Right.setup = setupChosen;
        this.logger.log("[DEBUG] The user2DbId of the user that just joined is " + userDbId);
        return roomToFill;
    }
    createNewRoom(setupChosen, userDbId, roomName, playerId) {
        this.rooms.push({
            intervalId: undefined,
            name: roomName,
            user1DbId: userDbId,
            user2DbId: 0,
            player1Id: playerId,
            player2Id: '',
            game: this.resetGame(setupChosen)
        });
        this.logger.log(`Room created (room id: ${this.rooms[this.rooms.length - 1].name})`);
        this.logger.log("[DEBUG] The user1DbId of the first player of the newly created room is : " + userDbId);
        return this.rooms[this.rooms.length - 1];
    }
    async removeRoom(wss, room) {
        await this.usersService.resetRoomId(room.name);
        wss.in(room.name).socketsLeave(room.name);
        this.logger.log(`Room closed (room id: ${room.name})`);
        this.rooms = this.rooms.filter((el) => el.name != room.name);
    }
    checkIfSameSetup(setup1, setup2) {
        if (setup1.level === setup2.level
            && setup1.score === setup2.score)
            return true;
        return false;
    }
    updateGame(room) {
        if ((room.game.ball.x - room.game.ball.radius) < 0) {
            room.game.p2Score++;
            room.game.ball = this.resetBall(1);
        }
        else if ((room.game.ball.x + room.game.ball.radius) > room.game.width) {
            room.game.p1Score++;
            room.game.ball = this.resetBall(-1);
        }
        else {
            room.game.ball.x += room.game.ball.velX;
            room.game.ball.y += room.game.ball.velY;
            this.detectCollision(room);
        }
        if (room.game.p1Score >= room.game.p1Left.setup.score ||
            room.game.p2Score >= room.game.p1Left.setup.score) {
            return true;
        }
        return false;
    }
    async updateScores(client, wss, room, clientId) {
        client.data.roomId = 'none';
        this.logger.log(`Game won (room id: ${room.name})`);
        const endGameInfo = await this.resetEndGameInfo(room, clientId);
        !endGameInfo.clientId ? wss.to(room.name).emit('gameEnded', endGameInfo) :
            wss.to(room.name).emit('opponentLeft', endGameInfo);
        !clientId ? await this.addToMatchHistory(room) :
            await this.addToMatchHistoryAfterDisconnexion(room, clientId);
        !clientId ? await this.updateScoresDueToWin(room) :
            await this.updateScoresDueDisconnexion(room, clientId);
        await this.removeRoom(wss, room);
        return true;
    }
    async updateScoresDueDisconnexion(room, clientId) {
        if (clientId === room.player1Id) {
            await this.usersService.incUserLoses(room.user1DbId);
            await this.usersService.incUserWins(room.user2DbId);
        }
        else {
            await this.usersService.incUserLoses(room.user2DbId);
            await this.usersService.incUserWins(room.user1DbId);
        }
    }
    async updateScoresDueToWin(room) {
        room.game.p1Score >= room.game.p1Left.setup.score ? await this.usersService.incUserWins(room.user1DbId) :
            await this.usersService.incUserLoses(room.user1DbId);
        room.game.p2Score >= room.game.p1Left.setup.score ? await this.usersService.incUserWins(room.user2DbId) :
            await this.usersService.incUserLoses(room.user2DbId);
    }
    async addToMatchHistory(room) {
        if (room.game.p1Score >= room.game.p1Left.setup.score) {
            const winner = await this.usersService.findUserById(room.user1DbId);
            const looser = await this.usersService.findUserById(room.user2DbId);
            const winnerScore = room.game.p1Score;
            const looserScore = room.game.p2Score;
            const gameOptions = '{ "level": ' + room.game.p1Left.setup.level + ', "score": ' + room.game.p1Left.setup.score + ' }';
            const looserdisconnected = false;
            const record = {
                winner,
                looser,
                winnerScore,
                looserScore,
                gameOptions,
                looserdisconnected
            };
            await this.matchHistoryRepository.save(record);
        }
        else {
            const winner = await this.usersService.findUserById(room.user2DbId);
            const looser = await this.usersService.findUserById(room.user1DbId);
            const winnerScore = room.game.p2Score;
            const looserScore = room.game.p1Score;
            const gameOptions = '{ "level": ' + room.game.p1Left.setup.level + ', "score": ' + room.game.p1Left.setup.score + ' }';
            const looserdisconnected = false;
            const record = {
                winner,
                looser,
                winnerScore,
                looserScore,
                gameOptions,
                looserdisconnected
            };
            await this.matchHistoryRepository.save(record);
        }
    }
    async addToMatchHistoryAfterDisconnexion(room, clientId) {
        if (clientId === room.player1Id) {
            const winner = await this.usersService.findUserById(room.user2DbId);
            const looser = await this.usersService.findUserById(room.user1DbId);
            const winnerScore = room.game.p2Score;
            const looserScore = room.game.p1Score;
            const gameOptions = '{ "level": ' + room.game.p1Left.setup.level + ', "score": ' + room.game.p1Left.setup.score + ' }';
            const looserdisconnected = true;
            const record = {
                winner,
                looser,
                winnerScore,
                looserScore,
                gameOptions,
                looserdisconnected
            };
            await this.matchHistoryRepository.save(record);
        }
        else {
            const winner = await this.usersService.findUserById(room.user1DbId);
            const looser = await this.usersService.findUserById(room.user2DbId);
            const winnerScore = room.game.p1Score;
            const looserScore = room.game.p2Score;
            const gameOptions = '{ "level": ' + room.game.p1Left.setup.level + ', "score": ' + room.game.p1Left.setup.score + ' }';
            const looserdisconnected = true;
            const record = {
                winner,
                looser,
                winnerScore,
                looserScore,
                gameOptions,
                looserdisconnected
            };
            await this.matchHistoryRepository.save(record);
        }
    }
    detectCollision(room) {
        const ball = room.game.ball;
        const p1Left = room.game.p1Left;
        const p2Right = room.game.p2Right;
        const paddle = room.game.paddle;
        if (ball.x + ball.radius > room.game.width - paddle.width - paddle.border
            && ball.y + ball.radius > p2Right.y - paddle.height / 2
            && ball.y - ball.radius < p2Right.y + paddle.height / 2)
            this.playerTwoIntersectBall(room);
        else if (ball.x - ball.radius < paddle.border + paddle.width
            && ball.y > p1Left.y - paddle.height / 2 && ball.y < p1Left.y + paddle.height / 2)
            this.playerOneIntersectBall(room);
        else if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= room.game.height)
            room.game.ball.velY = room.game.ball.velY * -1;
    }
    playerOneIntersectBall(room) {
        const ball = room.game.ball;
        const paddle = room.game.paddle;
        const percentIntersect = (ball.y - room.game.p1Left.y) / (paddle.height / 2);
        const angleRad = percentIntersect < 0 ? -percentIntersect * this.MAX_ANGLE :
            percentIntersect * this.MAX_ANGLE;
        ball.velX = ball.speed * Math.cos(angleRad);
        ball.velY = percentIntersect < 0 ? ball.speed * -Math.sin(angleRad) :
            ball.speed * Math.sin(angleRad);
        if (ball.x - ball.radius < paddle.border + paddle.width)
            ball.x = paddle.border + paddle.width + ball.radius;
        if (ball.speed < this.MAX_BALL_SPEED)
            ball.speed *= this.INCREASE_SPEED_PERCENTAGE;
    }
    playerTwoIntersectBall(room) {
        const ball = room.game.ball;
        const paddle = room.game.paddle;
        const percentIntersect = (ball.y - room.game.p2Right.y) / (paddle.height / 2);
        const angleRad = percentIntersect < 0 ? -percentIntersect * this.MAX_ANGLE :
            percentIntersect * this.MAX_ANGLE;
        ball.velX = ball.speed * -Math.cos(angleRad);
        ball.velY = percentIntersect < 0 ? ball.speed * -Math.sin(angleRad) :
            ball.speed * Math.sin(angleRad);
        if (ball.x + ball.radius > room.game.width - paddle.border - paddle.width)
            ball.x = room.game.width - paddle.border - paddle.width - ball.radius;
        if (ball.speed < this.MAX_BALL_SPEED)
            ball.speed *= this.INCREASE_SPEED_PERCENTAGE;
    }
    updatePlayerPos(playerId, playerPosY) {
        const room = this.rooms.find(el => el.player1Id === playerId ||
            el.player2Id === playerId);
        if (room && room.player1Id === playerId)
            playerPosY > room.game.p1Left.y ? this.userMoveDown(room, room.game.p1Left, playerPosY) :
                this.userMoveUp(room, room.game.p1Left, playerPosY);
        else if (room)
            playerPosY > room.game.p2Right.y ? this.userMoveDown(room, room.game.p2Right, playerPosY) :
                this.userMoveUp(room, room.game.p2Right, playerPosY);
    }
    userMoveUp(room, player, playerPosY) {
        player.y -= (player.y - playerPosY > player.velY) ? player.velY : player.y - playerPosY;
        (player.y < room.game.paddle.height / 2) ? player.y = room.game.paddle.height / 2 : 0;
    }
    userMoveDown(room, player, playerPosY) {
        player.y += (playerPosY - player.y > player.velY) ? player.velY : playerPosY - player.y;
        (player.y > this.GAME_HEIGHT - room.game.paddle.height / 2) ?
            player.y = this.GAME_HEIGHT - room.game.paddle.height / 2 : 0;
    }
    setOptions(level) {
        this.PADDLE_HEIGHT = this.configService.get('paddle_height_screen_percentage_' + level)
            * this.GAME_HEIGHT;
        this.INCREASE_SPEED_PERCENTAGE =
            this.configService.get('increase_speed_percentage_' + level);
    }
    async resetEndGameInfo(_room, _clientId) {
        if (_room.player2Id != '') {
            return {
                clientId: _clientId,
                p1DbInfo: await this.resetPlayerDbInfo(_room.user1DbId),
                p2DbInfo: await this.resetPlayerDbInfo(_room.user2DbId),
                room: _room,
            };
        }
        else {
            return {
                clientId: _clientId,
                p1DbInfo: await this.resetPlayerDbInfo(_room.user1DbId),
                p2DbInfo: { username: '', displayname: '', avatar: '' },
                room: _room,
            };
        }
    }
    async resetPlayerDbInfo(userDbId) {
        try {
            const user = await this.usersService.updateRoomId(userDbId, 'none');
            return {
                username: user.username,
                displayname: user.displayname,
                avatar: user.avatar,
            };
        }
        catch (_a) {
            this.logger.log('Could\'t find user required in order to update room ID');
        }
    }
    resetGame(setup, dir = 1, _p1score = 0, _p2score = 0) {
        if (setup.level === this.EASY)
            this.setOptions('easy');
        else if (setup.level === this.MEDIUM)
            this.setOptions('medium');
        else
            this.setOptions('hard');
        return {
            isStarted: false,
            width: this.GAME_WIDTH,
            height: this.GAME_HEIGHT,
            p1Score: _p1score,
            p2Score: _p2score,
            ball: this.resetBall(dir),
            paddle: this.resetPaddle(),
            p1Left: this.resetPlayer(setup, true),
            p2Right: this.resetPlayer(setup, false),
        };
    }
    resetBall(dir) {
        return {
            radius: this.BALL_RADIUS,
            dir: -dir,
            x: this.GAME_WIDTH * 0.5,
            y: this.GAME_HEIGHT * 0.5,
            speed: this.BASE_SPEED,
            velX: dir * this.BASE_SPEED,
            velY: 0,
        };
    }
    resetPlayer(setupChosen, left) {
        if (left)
            return {
                x: this.PADDLE_BORDER,
                y: this.GAME_HEIGHT * 0.5,
                velX: this.BASE_VEL,
                velY: this.BASE_VEL,
                setup: this.resetSetup(setupChosen),
            };
        else
            return {
                x: this.GAME_WIDTH - this.PADDLE_BORDER - this.PADDLE_WIDTH,
                y: this.GAME_HEIGHT * 0.5,
                velX: this.BASE_VEL,
                velY: this.BASE_VEL,
                setup: this.resetSetup(setupChosen),
            };
    }
    resetSetup(setupChosen) {
        if (setupChosen) {
            return {
                level: setupChosen.level,
                score: setupChosen.score,
                paddleColor: setupChosen.paddleColor,
            };
        }
        return {
            level: 1,
            score: 5,
            paddleColor: 'white',
        };
    }
    resetPaddle() {
        return {
            width: this.PADDLE_WIDTH,
            height: this.PADDLE_HEIGHT,
            border: this.PADDLE_BORDER,
        };
    }
};
GameService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(match_history_entity_1.MatchHistoryEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        config_1.ConfigService])
], GameService);
exports.GameService = GameService;
//# sourceMappingURL=game.service.js.map