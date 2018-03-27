/* global itowns, document */
// # Planar (EPSG:3946) viewer

// Define projection that we will use (taken from https://epsg.io/3946, Proj4js section)
itowns.proj4.defs('EPSG:3946',
    '+proj=lcc +lat_1=45.25 +lat_2=46.75 +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// Define geographic extent: CRS, min/max X, min/max Y
var extent = new itowns.Extent(
    'EPSG:3946',
    1837816.94334, 1847692.32501,
    5170036.4587, 5178412.82698);

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate PlanarView*
var view = new itowns.PlanarView(viewerDiv, extent);
view.tileLayer.disableSkirt = true;

var menuPlanar = new GuiTools('menuDiv', view, 300);

// Add an WMS imagery layer (see WMS_Provider* for valid options)
view.addLayer({
    url: 'https://download.data.grandlyon.com/wms/grandlyon',
    networkOptions: { crossOrigin: 'anonymous' },
    type: 'color',
    protocol: 'wms',
    version: '1.3.0',
    id: 'wms_imagery',
    name: 'Ortho2009_vue_ensemble_16cm_CC46',
    projection: 'EPSG:3946',
    format: 'image/jpeg',
    updateStrategy: {
        type: itowns.STRATEGY_DICHOTOMY,
        options: {},
    },
});

// Add an WMS elevation layer (see WMS_Provider* for valid options)
view.addLayer({
    url: 'https://download.data.grandlyon.com/wms/grandlyon',
    type: 'elevation',
    protocol: 'wms',
    networkOptions: { crossOrigin: 'anonymous' },
    id: 'wms_elevation',
    name: 'MNT2012_Altitude_10m_CC46',
    projection: 'EPSG:3946',
    heightMapWidth: 256,
    format: 'image/jpeg',
});

// Since the elevation layer use color textures, specify min/max z which is in
// gray scale. Normally a multiplicative factor should allow to get the data at
// the right scale but it is not done by the Open Data Grand Lyon
 view.tileLayer.materialOptions = {
  useColorTextureElevation: true,
  colorTextureElevationMinZ: 0,
  colorTextureElevationMaxZ: 255,
};

var preUpdateGeo = itowns.pre3dTilesUpdate;

// Create a temporal 3d-tiles Layer
// This layer gets its data from citydb_temporal on rict server
var container = new itowns.THREE.Group();
const $3dtiles = new itowns.GeometryLayer('3d-tiles-discrete-lod', container);
$3dtiles.preUpdate = preUpdateGeo;
$3dtiles.update = itowns.process3dTilesNode(
   itowns.$3dTilesCulling,
   itowns.$3dTilesSubdivisionControl
);
$3dtiles.name = 'Lyon1';
$3dtiles.url = 'http://localhost:8003/tilesets/Hotel/1.json';
$3dtiles.protocol = '3d-tiles';
// This layer contains data which have temporal information. Setting this value
// to true will create a special material (TemporalMaterial) and use appropriate
// shaders
$3dtiles.type = 'geometry';
$3dtiles.visible = true
$3dtiles.overrideMaterials = false;

//  for picking example.
itowns.View.prototype.addLayer.call(view, $3dtiles).then(
    function _() {
        window.addEventListener('mousemove', picking, false);
    })

view.scene.add(container)

// Since PlanarView doesn't create default controls, we manipulate directly three.js camera
// Position the camera at south-west corner
var c = new itowns.Coordinates('EPSG:3946', extent.west(), extent.south(), 2000);
view.camera.camera3D.position.copy(c.xyz());
// Then look at extent's center
view.camera.camera3D.lookAt(extent.center().xyz());

// instanciate controls
// eslint-disable-next-line no-new
new itowns.PlanarControls(view, {});

// Add the UI Debug
var d = new debug.Debug(view, menuPlanar.gui);
debug.createTileDebugUI(menuPlanar.gui, view, view.tileLayer, d);
debug.create3dTilesDebugUI(menuPlanar.gui, view, $3dtiles, d);

// Request redraw
view.notifyChange(true);

// Picking example - - - - - - - - - - -- - - - -- - - - -- - - - -- - - - -- - - - -- - - - -
// Reffer to the doc here: https://github.com/MEPP-team/RICT/blob/master/Doc/iTowns/Doc.md#itowns-internal-organisation-of-3d-tiles-data
// to understand why this is needed.
function findBatchTableParent(object, i) {
    if (object.batchTable) {
        return object.batchTable;
    }
    else if (object.parent) {
        return findBatchTableParent(object.parent, ++i);
    } else {
        return undefined;
    }
}

function recurseBatchTableHierarchy(htmlInfo, batchTable, batchID) {
    // Get class Id of object
    var classId = batchTable.HIERARCHY.classIds[batchID];

    // Print Class of object
    htmlInfo.innerHTML +='<li><b> Class: </b>'+ batchTable.HIERARCHY.classes[classId] +'</li>';

    // Compute position in class from number of occurences of
    // this class in classIds
    var classPos = 0;
    for (var i = 0; i < batchID; i++)
    {
        if(batchTable.HIERARCHY.classIds[i] === classId) {
            classPos++;
        }
    }

    // Display attributes of object
    for (let instance of batchTable.HIERARCHY.classes[classId].instances) {
        htmlInfo.innerHTML +='<li><b> ' + instance[0] +
         ': </b>'+ instance [0][classPos] +'</li>';
    }

    //// Parents
    // Get parent count
    var parentCount = batchTable.HIERARCHY.parentCounts[batchID];

    if(parentCount === 0) {
        return;
    }

    // else get parent ids start position
    var parentIdsPosStart = 0;
    for (var i = 0; i < batchID; i++) {
        parentIdsPosStart += batchTable.HIERARCHY.parentCounts[i];
    }

    // recurse for each parent
    for (var i = 0 ; i < parentCount ; i++) {
        htmlInfo.innerHTML += ""
        recurseBatchTableHierarchy(htmlInfo, batchTable, batchTable.HIERARCHY.parentIds[parentIdsPosStart]);
        ++parentIdsPosStart;
    }
}

function picking(event) {
    var htmlInfo = document.getElementById('info');
    htmlInfo.innerHTML = ' ';

    const intersects = view.pickObjectsAt(
        event,
        $3dtiles);

    for (var i = 0; i < intersects.length; i++) {
        var interAttributes = intersects[i].object.geometry.attributes;
        if (interAttributes) {
            if (interAttributes._BATCHID) {
                var face = intersects[i].face.a;

                var batchID = interAttributes._BATCHID.array[face];
                // Print Batch id in an ui element
                htmlInfo.innerHTML +='<li><b> Batch id: </b>'+ batchID +'</li>';

                // Read batch table
                var batchTable = findBatchTableParent(intersects[i].object,0);

                // Hierachical batch Table
                // For now only JSON body is implemented (binary body is not managed)
                if (batchTable.HIERARCHY) {
                    recurseBatchTableHierarchy(htmlInfo, batchTable, batchID);
                }
                else { // Print attributes into an ui element
                    Object.keys(batchTable).map(function(objectKey) {
                        var value = batchTable[objectKey][batchID];
                        if (value) {
                            htmlInfo.innerHTML +='<li><b>' + objectKey.toString() + ': </b>'+ value.toString() +'</li>';
                        }
                        return true;
                    });
                }
                return;
            }
        }
    }
}
