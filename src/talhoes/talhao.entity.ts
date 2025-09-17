import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'talhoes' })
export class TalhaoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'geometry',
    srid: 4326,
    spatialFeatureType: 'Geometry',
  })
  geom!: string;
}
