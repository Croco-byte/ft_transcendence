"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    game_width: parseInt(process.env.GAME_WIDTH, 10) || 600,
    game_height: parseInt(process.env.GAME_HEIGHT, 10) || 400,
    base_speed: parseInt(process.env.BASE_SPEED, 10) || 6,
    base_vel: parseInt(process.env.BASE_VEL, 10) || 30,
    ball_radius: parseInt(process.env.BALL_RADIUS, 10) || 15,
    paddle_height_screen_percentage_easy: parseFloat(process.env.PADDLE_HEIGHT_SCREEN_PERCENTAGE_EASY) || 0.3,
    paddle_height_screen_percentage_medium: parseFloat(process.env.PADDLE_HEIGHT_SCREEN_PERCENTAGE_MEDIUM) || 0.2,
    paddle_height_screen_percentage_hard: parseFloat(process.env.PADDLE_HEIGHT_SCREEN_PERCENTAGE_HARD) || 0.1,
    paddle_width_screen_percentage: parseFloat(process.env.PADDLE_WIDTH_SCREEN_PERCENTAGE) || 0.033,
    paddle_border_width_screen_percentage: parseFloat(process.env.PADDLE_BORDER_WIDTH_SCREEN_PERCENTAGE) || 0.01,
    max_ball_speed: parseInt(process.env.MAX_BALL_SPEED, 10) || 12,
    increase_speed_percentage_easy: parseFloat(process.env.INCREASE_SPEED_PERCENTAGE_EASY) || 1.05,
    increase_speed_percentage_medium: parseFloat(process.env.INCREASE_SPEED_PERCENTAGE_MEDIUM) || 1.10,
    increase_speed_percentage_hard: parseFloat(process.env.INCREASE_SPEED_PERCENTAGE_HARD) || 1.15,
    framerate: parseInt(process.env.FRAMERATE, 10) || 60,
    time_match_start: parseInt(process.env.TIME_MATCH_START, 10) || 10000,
});
//# sourceMappingURL=configuration_env.js.map