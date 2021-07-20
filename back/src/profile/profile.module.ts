import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/users.entity';



@Module({
	imports: [TypeOrmModule.forFeature([User])],
	controllers: [ProfileController],
	providers: [ProfileService],
})
export class ProfileModule {}
