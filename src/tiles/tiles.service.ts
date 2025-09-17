import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TilesService {
  private readonly logger = new Logger(TilesService.name);
  private readonly blankTile = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAAAAAB5Gfe6AAAAVElEQVR42u3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAEPAAEccgnDAAAAAElFTkSuQmCC',
    'base64',
  );

  constructor(private readonly dataSource: DataSource) {}

  async renderTile(z: number, x: number, y: number): Promise<Buffer> {
    this.validateTileCoords(z, x, y);
    const bounds = this.tileBounds(z, x, y);

    try {
      const rows = await this.dataSource.query<
        { tile: Buffer | string | null }[]
      >(
        `
          WITH bounds AS (
            SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS geom
          ),
          canvas AS (
            SELECT ST_AddBand(
              ST_MakeEmptyRaster(
                256,
                256,
                $1,
                $4,
                ($3 - $1) / 256,
                ($2 - $4) / 256,
                0,
                0,
                4326
              ),
              '32BF'::text,
              -9999::double precision,
              -9999::double precision
            ) AS rast
          ),
          heatmap AS (
            SELECT COALESCE(
              (
                SELECT ST_Union(
                  ST_AsRaster(
                    sample.geom,
                    c.rast,
                    '32BF'::text,
                    LEAST(GREATEST(sample.heat_value, 0), 1)::double precision,
                    -9999::double precision
                  )
                )
                FROM (
                  SELECT
                    ST_Intersection(t.geom, b.geom) AS geom,
                    (
                      (('x' || substr(md5(t.id::text), 1, 8))::bit(32)::bigint)::double precision
                      / 4294967295.0
                    ) AS heat_value
                  FROM talhoes t
                  WHERE ST_Intersects(t.geom, b.geom)
                ) AS sample
              ),
              c.rast
            ) AS rast
            FROM bounds b
            CROSS JOIN canvas c
          )
          SELECT ST_AsPNG(
            ST_ColorMap(
              rast,
              1,
              '-9999 0 0 0 0;\n               0 33 102 172 180;\n               0.5 253 174 97 220;\n               1 178 24 43 255',
              'INTERPOLATE=TRUE'
            )
          ) AS tile
          FROM heatmap;
        `,
        [bounds.west, bounds.south, bounds.east, bounds.north],
      );

      const rawTile = rows[0]?.tile ?? null;
      if (!rawTile) {
        return this.blankTile;
      }

      return this.normalizeTile(rawTile);
    } catch (error) {
      const wrappedError =
        error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to render tile from PostGIS: ${wrappedError.message}`,
        wrappedError.stack,
        'TilesService',
      );
      return this.blankTile;
    }
  }

  private validateTileCoords(z: number, x: number, y: number): void {
    if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
      throw new BadRequestException('Tile coordinates must be integers');
    }

    if (z < 0) {
      throw new BadRequestException('Zoom level must be positive');
    }

    const maxIndex = 2 ** z;
    if (x < 0 || x >= maxIndex || y < 0 || y >= maxIndex) {
      throw new BadRequestException(
        'Tile coordinates out of range for zoom level',
      );
    }
  }

  private tileBounds(
    z: number,
    x: number,
    y: number,
  ): {
    west: number;
    south: number;
    east: number;
    north: number;
  } {
    const west = this.tile2lon(x, z);
    const east = this.tile2lon(x + 1, z);
    const north = this.tile2lat(y, z);
    const south = this.tile2lat(y + 1, z);

    return { west, south, east, north };
  }

  private tile2lon(x: number, z: number): number {
    return (x / 2 ** z) * 360 - 180;
  }

  private tile2lat(y: number, z: number): number {
    const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
    return (180 / Math.PI) * Math.atan(Math.sinh(n));
  }

  private normalizeTile(tile: unknown): Buffer {
    if (Buffer.isBuffer(tile)) {
      return tile;
    }

    if (typeof tile === 'string') {
      const sanitized = tile.startsWith('\\x') ? tile.slice(2) : tile;
      return Buffer.from(sanitized, 'hex');
    }

    this.logger.warn('Unexpected tile format returned by PostGIS');
    return this.blankTile;
  }
}
