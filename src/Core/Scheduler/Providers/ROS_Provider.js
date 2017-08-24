/*eslint-disable */

import * as THREE from 'three';
import Fetcher from './Fetcher';
import PointCloudProcessing from '../../../Process/PointCloudProcessing';
import PotreeBinLoader from './PotreeBinLoader';
import PotreeCinLoader from './PotreeCinLoader';

/*
import EventEmitter2 from 'eventemitter2'
window.EventEmitter2 = EventEmitter2.EventEmitter2;

import ROSLIB from 'roslib/src/RosLib';
*/
function loadPoints() {
    var points;
    console.log("loadPoints");
    var particles = 500000;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array( particles * 3 );
    var colors = new Float32Array( particles * 3 );
    var color = new THREE.Color();
    var n = 1000, n2 = n / 2; // particles spread in the cube
    for ( var i = 0; i < positions.length; i += 3 ) {
        // positions
        var x = Math.random() * n - n2;
        var y = Math.random() * n - n2;
        var z = Math.random() * n - n2;
        positions[ i ]     = x;
        positions[ i + 1 ] = y;
        positions[ i + 2 ] = z;
        // colors
        var vx = ( x / n ) + 0.5;
        var vy = ( y / n ) + 0.5;
        var vz = ( z / n ) + 0.5;
        color.setRGB( vx, vy, vz );
        colors[ i ]     = color.r;
        colors[ i + 1 ] = color.g;
        colors[ i + 2 ] = color.b;
    }
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
    geometry.computeBoundingSphere();
    //
    var material = new THREE.PointsMaterial( { size: 15, vertexColors: THREE.VertexColors } );
    points = new THREE.Points( geometry, material );
    //scene.add( points );
    context.view.scene.add(points);
    return points;
}


/*
function loadPointFile(layer, url) {
    return fetch(url, layer.fetchOptions).then(foo => foo.arrayBuffer()).then((ab) => {
        if (layer.metadata.customBinFormat) {
            return addPickingAttribute(PotreeCinLoader.parse(ab));
        } else {
            return addPickingAttribute(PotreeBinLoader.parse(ab));
        }
    });
}
*/

export default {

    preprocessDataLayer(layer) {
        if (!layer.file) {
            layer.file = 'cloud.js';
        }
        // default options
        layer.fetchOptions = layer.fetchOptions || {};
        layer.octreeDepthLimit = layer.octreeDepthLimit || -1;
        layer.pointBudget = layer.pointBudget || 15000000;
        layer.pointSize = layer.pointSize || 4;
        layer.overdraw = layer.overdraw || 2;
        layer.type = 'geometry';

        // default update methods
        layer.preUpdate = PointCloudProcessing.preUpdate;
        layer.update = PointCloudProcessing.update;
        layer.postUpdate = PointCloudProcessing.postUpdate;

      //  loadPoints();

        // new THREE.Box3(min, max)
        return layer;



    },

    executeCommand(command) {
    //   var points = loadPoints();
        const layer = command.layer;
        const node = command.requester;

        // Query HRC if we don't have children metadata yet.
        if (node.childrenBitField && node.children.length === 0) {
            console.log("executeCommand");
            //parseOctree(layer, layer.metadata.hierarchyStepSize, node).then(() => command.view.notifyChange(false));
        }

        const extension = layer.metadata.customBinFormat ? 'cin' : 'bin';

        // `isLeaf` is for lopocs and allows the pointcloud server to consider that the current
        // node is the last one, even if we could subdivide even further.
        // It's necessary because lopocs doens't know about the hierarchy (it generates it on the fly
        // when we request .hrc files)
        const url = `${node.baseurl}/r${node.name}.${extension}?isleaf=${command.isLeaf ? 1 : 0}`;
/*
        return loadPointFile(layer, url).then((points) => {
            points.position.copy(node.bbox.min);
            points.scale.set(layer.metadata.scale, layer.metadata.scale, layer.metadata.scale);
            points.tightbbox.min.x *= layer.metadata.scale;
            points.tightbbox.min.y *= layer.metadata.scale;
            points.tightbbox.min.z *= layer.metadata.scale;
            points.tightbbox.max.x *= layer.metadata.scale;
            points.tightbbox.max.y *= layer.metadata.scale;
            points.tightbbox.max.z *= layer.metadata.scale;
            points.tightbbox.translate(node.bbox.min);
            points.updateMatrix();
            points.updateMatrixWorld(true);
            points.layers.set(layer.threejsLayer);
            return points;
        });
*/
    },
};
/*eslint-enable */
