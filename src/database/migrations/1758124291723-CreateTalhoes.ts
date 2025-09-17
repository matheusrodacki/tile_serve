import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTalhoes1758124291723 implements MigrationInterface {
  name = 'CreateTalhoes1758124291723';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "talhoes" ("id" SERIAL NOT NULL, "geom" geometry(Geometry,4326) NOT NULL, CONSTRAINT "PK_662708f41bd52ac51cc93b3279b" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "talhoes"`);
  }
}
