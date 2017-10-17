import * as THREE from 'three';
import Fetcher from './Fetcher';
import CacheRessource from './CacheRessource';
import IoDriver_XBIL from './IoDriver_XBIL';
import Projection from '../../Geographic/Projection';
import { UNIT } from '../../Geographic/Coordinates';
import Extent from '../../Geographic/Extent';
import MathExt from '../../Math/MathExtended';

export const SIZE_TEXTURE_TILE = 256;

// CacheRessource is necessary for neighboring PM textures
// The PM textures overlap several tiles WGS84, it is to avoid net requests
// Info : THREE.js have cache image https://github.com/mrdoob/three.js/blob/master/src/loaders/ImageLoader.js#L25
const cache = CacheRessource();
const cachePending = new Map();
const ioDXBIL = new IoDriver_XBIL();
const projection = new Projection();

const getTextureFloat = function getTextureFloat(buffer) {
    const texture = new THREE.DataTexture(buffer, SIZE_TEXTURE_TILE, SIZE_TEXTURE_TILE, THREE.AlphaFormat, THREE.FloatType);
    texture.needsUpdate = true;
    return texture;
};

export default {
    ioDXBIL,
    getColorTextureByUrl(url, networkOptions) {
        const cachedTexture = cache.getRessource(url);

        if (cachedTexture) {
            return Promise.resolve(cachedTexture);
        }

        const { texture, promise } = (cachePending.has(url)) ?
            cachePending.get(url) :
            Fetcher.texture(url, networkOptions);

        texture.generateMipmaps = false;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.anisotropy = 16;


        cachePending.set(url, { texture, promise });

        return promise.then(() => {
            if (!cache.getRessource(url)) {
                cache.addRessource(url, texture);
            }
            cachePending.delete(url);
            return texture;
        });
    },
    getXBilTextureByUrl(url, networkOptions) {
        const textureCache = cache.getRessource(url);

        if (textureCache !== undefined) {
            return Promise.resolve(textureCache);
        }

        const pending = cachePending.get(url);
        if (pending) {
            return pending;
        }

        const promiseXBil = ioDXBIL.read(url, networkOptions).then((result) => {
            // TODO  RGBA is needed for navigator with no support in texture float
            // In RGBA elevation texture LinearFilter give some errors with nodata value.
            // need to rewrite sample function in shader

            // loading concurrence
            const textureConcurrence = cache.getRessource(url);
            if (textureConcurrence) {
                cachePending.delete(url);
                return textureConcurrence;
            }

            const texture = getTextureFloat(result.floatArray);
            texture.generateMipmaps = false;
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearFilter;
            cache.addRessource(url, texture);
            cachePending.delete(url);

            return texture;
        });

        cachePending.set(url, promiseXBil);

        return promiseXBil;
    },
    computeTileMatrixSetCoordinates(tile, tileMatrixSet) {
        // Are WMTS coordinates ready?
        if (!tile.wmtsCoords) {
            tile.wmtsCoords = {};
        }

        tileMatrixSet = tileMatrixSet || 'WGS84G';
        if (!(tileMatrixSet in tile.wmtsCoords)) {
            const tileCoord = projection.WGS84toWMTS(tile.extent);

            tile.wmtsCoords[tileMatrixSet] =
                projection.getCoordWMTS_WGS84(tileCoord, tile.extent, tileMatrixSet);
        }
    },
/*
    alignOnTMSGrid(tmsCoord, grid) {
        const e = tmsCoord;

        const tileCount = Math.pow(2, e.zoom);
        const size = grid.dimensions();
        size.x /= tileCount;
        size.y /= tileCount;
        this._values[0] = grid.west() + e.col * size.x;
        this._values[1] = grid.west() + (e.col + 1) * size.x;
        this._values[2] = grid.north() - (e.row + 1) * size.y;
        this._values[3] = grid.north() - e.row * size.y;

        const t = itowns.OGCHelper.computeTMSCoordinates(tile, grid)[0];
        console.log(e, t);
    }
*/

    computeTMSCoordinates(tile, extent) {
        const e = tile.extent.as(extent.crs());
        const layerDimension = extent.dimensions();

        // Each level has 2^n * 2^n tiles...
        // ... so we count how many tiles of the same width as tile we can fit in the layer
        let tileCount = THREE.Math.nearestPowerOfTwo(Math.round(layerDimension.x / e.dimensions().x));
        // ... 2^zoom = tilecount => zoom = log2(tilecount)
        // let zoom = tile.level + 1;
        let zoom = Math.floor(Math.log2(tileCount));
        tileCount = Math.pow(2, zoom);

        const c = e.center();
        const x = (c.x() - extent.west()) / layerDimension.x;

        const result = [];
        // hack for now
        if (tile.extent.crs() === extent.crs()) {
            // Now that we have computed zoom, we can deduce x and y (or row / column)
            const y = (extent.north() - c.y()) / layerDimension.y;
            result.push(new Extent('TMS', zoom, Math.floor(y * tileCount), Math.floor(x * tileCount)));
        } else if (tile.extent.crs() == 'EPSG:4326') {
            // Code from Projection.js
            function WGS84LatitudeClamp(latitude) {
                var min = -86 / 180 * Math.PI;
                var max = 84 / 180 * Math.PI;

                latitude = Math.max(min, latitude);
                latitude = Math.min(max, latitude);

                return latitude;
            }

            function WGS84ToY(latitude) {
                return 0.5 - Math.log(Math.tan(MathExt.PI_OV_FOUR + latitude * 0.5)) * MathExt.INV_TWO_PI;
            }

            const tileCount = Math.pow(2, zoom);
            let y1 = Math.floor(WGS84ToY(WGS84LatitudeClamp(tile.extent.north(UNIT.RADIAN))) * tileCount);
            let y2 = Math.ceil(WGS84ToY(WGS84LatitudeClamp(tile.extent.south(UNIT.RADIAN))) * tileCount) - 1;
            y2 = Math.min(tileCount - 1, y2);

            for (let y = y2; y >= y1; y--) {
                result.push(new Extent('TMS', zoom, Math.max(0, y), Math.floor(x * tileCount)));
            }
        } else {
            throw new Error(`Can't display a TMS layer using ${extent.crs()} crs on a geometry using ${tile.extent.crs()} crs`);
        }
        return result;
    },
    WMTS_WGS84Parent(cWMTS, levelParent, pitch) {
        const diffLevel = cWMTS.zoom - levelParent;
        const diff = Math.pow(2, diffLevel);
        const invDiff = 1 / diff;

        const r = (cWMTS.row - (cWMTS.row % diff)) * invDiff;
        const c = (cWMTS.col - (cWMTS.col % diff)) * invDiff;

        if (pitch) {
            pitch.x = cWMTS.col * invDiff - c;
            pitch.y = cWMTS.row * invDiff - r;
            pitch.z = invDiff;
        }

        return new Extent(cWMTS.crs(), levelParent, r, c);
    },
};
