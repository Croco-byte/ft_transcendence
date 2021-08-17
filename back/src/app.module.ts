import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { StatusGateway } from './users/status.gateway';
import { FriendRequestsGateway } from './users/friend-request.gateway';

@Module({
  imports: [GameModule, AuthModule, UsersModule, HttpModule, ConfigModule.forRoot(), DatabaseModule],
  controllers: [],
  providers: [StatusGateway, FriendRequestsGateway],
})
export class AppModule {}
