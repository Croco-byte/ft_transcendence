import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import ChannelMutedUserRepository from 'src/channels/channel_muted_users/channel_muted_user.repository';
import { MessageModule } from 'src/messages/message.module';
import MessageRepository from 'src/messages/message.repository';
import MessageService from 'src/messages/message.service';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { Connection } from 'typeorm';
import { ChannelController } from './channel.controller';
import ChannelRepository from './channel.repository';
import ChannelService from './channel.service';
import { ChannelMutedUserModule } from 'src/channels/channel_muted_users/channel_muted_user.module';
import ChannelMutedUserService from 'src/channels/channel_muted_users/channel_muted_user.service';
import ChannelBannedUserService from './channel_banned_users/channel_banned_user.service';
import ChannelBannedUserRepository from './channel_banned_users/channel_banned_user.repository';
import { ChannelBannedUserModule } from './channel_banned_users/channel_banned_user.module';
import { AppGateway } from 'src/channels/channel.gateway';
import { AuthModule } from 'src/auth/auth.module';
import UserRepository from 'src/users/user.repository';
import { User } from 'src/users/users.entity';
import { FriendRequestEntity } from 'src/users/friends-request.entity';
import { Channel } from './channel.entity';
import { InvitationLink } from './invitation_links/invitation_link.entity';
import { InvitationService } from './invitation_links/invitation.service';
import { InvitationController } from './invitation_links/invitation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel, MessageRepository, ChannelMutedUserRepository, ChannelBannedUserRepository, User, FriendRequestEntity, InvitationLink]),
    MessageModule,
    ChannelMutedUserModule,
    ChannelBannedUserModule,
    AuthModule,
    HttpModule,
  ],
  exports: [ChannelService, ChannelBannedUserService, ChannelMutedUserService],
  providers: [AppGateway, ChannelService, UsersService, MessageService, ChannelMutedUserService, ChannelBannedUserService, InvitationService],
  controllers: [ChannelController, InvitationController],
})

export class ChannelModule
{
  constructor (private connection: Connection) {}
}