import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt-strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';


@Module({
	imports: [HttpModule, JwtModule.register({ secret: 'sup3r_secret_JWT_s3cret_strIng' }), ConfigModule, PassportModule],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
