import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TilesModule } from './tiles/tiles.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
      exclude: ['/api*'],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sslEnabled = configService.get('DB_SSL', 'false') === 'true';

        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: parseInt(configService.get('DB_PORT', '5432'), 10),
          username: configService.get('DB_USER', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_NAME', 'tile_server'),
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: true,
          migrations: ['dist/database/migrations/*.js'],
          ssl: sslEnabled
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
        };
      },
    }),
    TilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
