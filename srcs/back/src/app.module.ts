import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './config/database.module';
import { StatusGateway } from './users/status.gateway';
import { FriendRequestsGateway } from './users/friend-request.gateway';
import { ChannelModule } from './channels/channel.module';
import { MessageModule } from './messages/message.module';
import { ChannelMutedUserModule } from './channels/channel_muted_users/channel_muted_user.module';
import { ChannelBannedUserModule } from './channels/channel_banned_users/channel_banned_user.module';
import { AppGateway } from './channels/channel.gateway';
import configuration from './config/configuration_env';

@Module({
  imports: [GameModule, 
        AuthModule, 
        UsersModule, 
        HttpModule, 
        ConfigModule.forRoot({
			load: [configuration],
		}), 
        DatabaseModule, 
        ChannelModule,
		MessageModule,
		ChannelMutedUserModule,
		ChannelBannedUserModule,
	],
  providers: [StatusGateway, FriendRequestsGateway],
})
export class AppModule {}
