import { MigrationInterface, QueryRunner } from "typeorm";

export class DbUpdateNdvi1758128266709 implements MigrationInterface {
    name = 'DbUpdateNdvi1758128266709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "talhoes" ADD "ndvi" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "talhoes" DROP COLUMN "ndvi"`);
    }

}
