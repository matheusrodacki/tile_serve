# Tile Serve (Nest + PostGIS)

API NestJS mínima para validar o conceito de transformar geometrias vetoriais salvas no PostGIS em tiles raster (`z/x/y.png`) consumíveis pelo Google Maps.

## Requisitos

- Node.js 20+
- PostgreSQL 14+ com extensão PostGIS
- GDAL opcional (para cargas de dados ou geração offline)

## Banco de dados

1. Crie o banco com PostGIS habilitado:

   ```sql
   CREATE DATABASE tile_server;
   \c tile_server
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. Estrutura base dos talhões:

   ```sql
   CREATE TABLE IF NOT EXISTS talhoes (
     id SERIAL PRIMARY KEY,
     nome TEXT,
     geom GEOMETRY(MultiPolygon, 4326) NOT NULL
   );
   ```

3. Exemplo de importação usando `shp2pgsql` (opcional):

   ```bash
   shp2pgsql -s 4326 talhoes.shp public.talhoes | psql -d tile_server
   ```

   > Garanta que as geometrias estejam em WGS84 (EPSG:4326).

## Configuração da API

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente (opcional – valores padrão já apontam para `localhost/postgres`):

   ```bash
   cp .env.example .env
   # ajuste credenciais se necessário
   ```

3. Inicie a aplicação:

   ```bash
   npm run start:dev
   ```

   A API sobe em `http://localhost:3000`.

## Migrações

Use as migrações do TypeORM para criar/atualizar o schema sem depender do `synchronize`.

```bash
# criar o schema local
npm run migration:run

# gerar uma nova migração
npm run migration:generate -- src/database/migrations/<NomeDaMigration>

# desfazer a última migração
npm run migration:revert
```

## Heatmap

Os tiles retornam um mapa de calor sintético. Cada talhão recebe uma intensidade pseudoaleatória (fixa por `id`) que é convertida em um gradiente interpolado (azul → amarelo → vermelho). Isso ajuda a testar o overlay antes de definir uma métrica real (NDVI, produtividade, etc.).

## Endpoint de tiles

`GET /maps/:z/:x/:y.png`

- **z**: nível de zoom (0+)
- **x / y**: índices do tile no esquema Slippy Map (mesmo do Google Maps)
- Retorna um PNG 256x256 com os talhões rasterizados dentro do tile.

### Como funciona

Para cada requisição o serviço:

1. Converte `z/x/y` em `bbox` WGS84.
2. Cria um raster temporário de 256x256 pixels alinhado ao tile.
3. Intersecta os talhões (`geom`) que caem na área e converte para raster (`ST_AsRaster`).
4. Une as partes rasterizadas e devolve o resultado como PNG (`ST_AsPNG`).

Se nada intersectar o tile, um PNG vazio é retornado (transparente).

## Visualizando no Google Maps

```js
const overlay = new google.maps.ImageMapType({
  getTileUrl: ({ x, y }, zoom) =>
    `http://localhost:3000/maps/${zoom}/${x}/${y}.png`,
  tileSize: new google.maps.Size(256, 256),
  opacity: 0.6,
});

map.overlayMapTypes.push(overlay);
```

## Próximos passos sugeridos

1. Adicionar cache (Redis, disco ou MBTiles) para tiles estáticos.
2. Oferecer estilos diferentes de raster (color map) conforme metadados.
3. Criar pipeline de ETL (GDAL/PostGIS) para atualização das geometrias.
4. Expor endpoints para listar talhões e depuração.

---

Qualquer dúvida ou melhoria que queira explorar, é só avisar. 🚜
