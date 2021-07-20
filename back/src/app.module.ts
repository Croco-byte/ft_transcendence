import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChannelController } from './channels/channel.controller';
import { AppGateway } from './app.gateway';
import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ProfileModule } from './profile/profile.module';

@Module(
{
	imports: [ HttpModule, AuthModule, UsersModule, DatabaseModule, ConfigModule.forRoot(), ProfileModule ],
	controllers: [AppController, ChannelController],
	providers: [AppService, AppGateway],
})

export class AppModule {}
