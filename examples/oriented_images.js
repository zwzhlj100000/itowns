/* global itowns, document, renderer, orientedImageGUI, menuGlobe  */
// # Simple Globe viewer

// Define initial camera position
var positionOnGlobe = {
    longitude: 2.423814,
    latitude: 48.844882,
    altitude: 100 };

var promises = [];

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe, {
    renderer: renderer,
    handleCollision: false,
    sseSubdivisionThreshold: 6,
    noControls: true,
});

// globeView.controls.minDistance = 0;

function addLayerCb(layer) {
    return globeView.addLayer(layer);
}

// Define projection that we will use (taken from https://epsg.io/3946, Proj4js section)
itowns.proj4.defs('EPSG:3946',
    '+proj=lcc +lat_1=45.25 +lat_2=46.75 +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb));

// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promises.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));

var pictureInfos = {
    panoramic: {
        latitude: 45.9228208442959,
        height: 4680.55588294683,
        longitude: 6.83256920100156,
        azimuth: 526.3900321920207,
        roll: 2.1876227239518276,
        tilt: -11.668910605126001,
        azimuth_: 0,
        roll_: 0,
        tilt_: 0,
        image: './orientedImages/MontBlanc.jpg',
    },
    camera: {
        size: [6490, 4408],
        focale: 1879.564256099287 * 4.4,
        ppaX: 3245,
        ppaY: 2204,
        // Define the referential : Aircarft orientation
        // from basic orientation ( Y (green) to the north, X (red) to east, Z (blue) is the vertical)
        // here we are creating the classic aircraft axises
        // first we look at the north, (north is on the Y axis in basic orientation), so Z axis will point to the north
        lookAt: { x: 0, y: 1, z: 0 },
        // then set the up vector to look to the ground, (the ground is oppisition of Z in basic orientation), so Y axis will point to the ground
        up: { x: 0, y: 0, z: -1 },
        // after that, X axis will naturally point the east.
    },
    distance: 4000,
    opacity: 0.8,
}


function parseAircraftConventionOrientationToMatrix(panoramic) {
    var euler = new itowns.THREE.Euler(
        itowns.THREE.Math.degToRad(panoramic.tilt),
        itowns.THREE.Math.degToRad(panoramic.azimuth),
        itowns.THREE.Math.degToRad(panoramic.roll),
        'ZYX');

    return new itowns.THREE.Matrix4().makeRotationFromEuler(euler);
};

function toCoordGeographic(panoramic) {
    return new itowns.Coordinates('EPSG:4326', panoramic.longitude, panoramic.latitude, panoramic.height);
};

var coord = toCoordGeographic(pictureInfos.panoramic);
var rotationMatrix = parseAircraftConventionOrientationToMatrix(pictureInfos.panoramic);

var plane = itowns.OrientedImageHelper.initPicture(globeView, pictureInfos.panoramic.image, coord, pictureInfos.camera.up, pictureInfos.camera.lookAt, rotationMatrix, pictureInfos.distance, pictureInfos.camera.size[0], pictureInfos.camera.size[1], pictureInfos.camera.focale);

new itowns.FirstPersonControls(globeView);

exports.view = globeView;
exports.initialPosition = positionOnGlobe;
