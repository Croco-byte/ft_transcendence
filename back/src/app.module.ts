import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { StatusGateway } from './users/status.gateway';
import { FriendRequestsGateway } from './users/friend-request.gateway';
import { ChannelModule } from './channels/channel.module';
import { MessageModule } from './messages/message.module';
import { ChannelMutedUserModule } from './channel_muted_users/channel_muted_user.module';
import { ChannelBannedUserModule } from './channel_banned_users/channel_banned_user.module';
import { AppGateway } from './app.gateway';

@Module({
  imports: [GameModule, AuthModule, UsersModule, HttpModule, ConfigModule.forRoot(), DatabaseModule, ChannelModule,
		MessageModule,
		ChannelMutedUserModule,
		ChannelBannedUserModule,
	],
  controllers: [],
  providers: [StatusGateway, FriendRequestsGateway, AppGateway],
})
export class AppModule {}
