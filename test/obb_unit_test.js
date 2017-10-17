/* global describe, it */
import * as THREE from 'three';
import proj4 from 'proj4';
import assert from 'assert';
import Coordinates, { UNIT } from '../src/Core/Geographic/Coordinates';
import Extent from '../src/Core/Geographic/Extent';
import BuilderEllipsoidTile from '../src/Core/Prefab/Globe/BuilderEllipsoidTile';
import TileGeometry from '../src/Core/TileGeometry';
import { globeSchemeTileWMTS } from '../src/Process/GlobeTileProcessing';

// Define projection that we will use (taken from https://epsg.io/3946, Proj4js section)
proj4.defs('EPSG:3946', '+proj=lcc +lat_1=45.25 +lat_2=46.75 +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');


function assertVerticesAreInOBB(builder, extent) {
    const params = {
        extent,
        disableSkirt: true,
    };

    const geom = new TileGeometry(params, builder);

    // 1cm tolerance
    geom.OBB.box3D.expandByScalar(0.01);

    console.log('matrix', geom.OBB.matrix);
    const inverse = new THREE.Matrix4().getInverse(geom.OBB.matrix);

    const failed = [];
    const vec = new THREE.Vector3();
    for (let i = 0; i < geom.attributes.position.count; i++) {
        vec.fromArray(geom.attributes.position.array, 3 * i);
        const woo = vec.clone();
        vec.applyMatrix4(inverse);
        if (!geom.OBB.box3D.containsPoint(vec)) {
            failed.push({index: i, value: vec.clone(), original: woo });
        }
    }
    assert.equal(geom.attributes.position.count - failed.length, geom.attributes.position.count, `All points should be inside OBB`);
}

describe('Ellipsoid tiles OBB computation', function () {
    const builder = new BuilderEllipsoidTile();

    it('should compute globe-level 0 OBB correctly', function () {
        for (const extent of globeSchemeTileWMTS(1)) {
            assertVerticesAreInOBB(builder, extent);
        }
    });

    it('should compute globe-level 2 OBB correctly', function () {
       const extent = new Extent('EPSG:4326', 0, 0.7853981633974483, -0.7853981633974483, 0);
       extent._internalStorageUnit = 0;
       assertVerticesAreInOBB(builder, extent);
    });
});
