import { Global, HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ChannelMutedUserRepository from 'src/channel_muted_users/channel_muted_user.repository';
import { MessageModule } from 'src/messages/message.module';
import MessageRepository from 'src/messages/message.repository';
import MessageService from 'src/messages/message.service';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { Connection } from 'typeorm';
import { ChannelController } from './channel.controller';
import ChannelRepository from './channel.repository';
import ChannelService from './channel.service';
import { ChannelMutedUserModule } from 'src/channel_muted_users/channel_muted_user.module';
import ChannelMutedUserService from 'src/channel_muted_users/channel_muted_user.service';
import ChannelBannedUserService from 'src/channel_banned_users/channel_banned_user.service';
import ChannelBannedUserRepository from 'src/channel_banned_users/channel_banned_user.repository';
import { ChannelBannedUserModule } from 'src/channel_banned_users/channel_banned_user.module';
import { AppGateway } from 'src/app.gateway';
import { AuthModule } from 'src/auth/auth.module';
import UserRepository from 'src/users/user.repository';
import { User } from 'src/users/users.entity';
import { FriendRequestEntity } from 'src/users/friends-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChannelRepository, MessageRepository, ChannelMutedUserRepository, ChannelBannedUserRepository, User, FriendRequestEntity]),
    MessageModule,
    ChannelMutedUserModule,
    ChannelBannedUserModule,
    AuthModule,
    HttpModule,
  ],
  exports: [ChannelService, ChannelBannedUserService, ChannelMutedUserService],
  providers: [AppGateway, ChannelService, UsersService, MessageService, ChannelMutedUserService, ChannelBannedUserService],
  controllers: [ChannelController],
})

export class ChannelModule
{
  constructor (private connection: Connection) {}
}