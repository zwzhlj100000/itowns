/* global itowns, debug, dat */

// eslint-disable-next-line no-unused-vars
function showPointcloud(serverUrl, fileName, lopocsTable) {
    var pointcloud;
    var oldPostUpdate;
    var viewerDiv;
    var debugGui;
    var view;
    var controls;

    viewerDiv = document.getElementById('viewerDiv');
    viewerDiv.style.display = 'block';

    itowns.THREE.Object3D.DefaultUp.set(0, 0, 1);

    itowns.proj4.defs('EPSG:3946',
    '+proj=lcc +lat_1=45.25 +lat_2=46.75 +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

    debugGui = new dat.GUI({ width: 400 });

    var positionOnGlobe = { longitude: 4.6314, latitude: 43.6756, altitude: 1000 };

    // TODO: do we really need to disable logarithmicDepthBuffer ?
    // view = new itowns.View('EPSG:3946', viewerDiv, { renderer: { logarithmicDepthBuffer: true } });
    view = new itowns.GlobeView(viewerDiv, positionOnGlobe, { renderer: renderer, handleCollision: false });
    view.controls.minDistance = 0;

    function addLayerCb(layer) {
        return view.addLayer(layer);
    }
    var promises = [];
    promises.push(itowns.Fetcher.json('layers/JSONLayers/Ortho.json').then(addLayerCb));
    promises.push(itowns.Fetcher.json('layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
    promises.push(itowns.Fetcher.json('layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));


    view.mainLoop.gfxEngine.renderer.setClearColor(0xcccccc);

    // Configure Point Cloud layer
    pointcloud = new itowns.GeometryLayer('pointcloud', new itowns.THREE.Group());
    pointcloud.type = 'geometry';
    pointcloud.file = fileName || 'infos/sources';
    pointcloud.protocol = 'potreeconverter';
    pointcloud.url = serverUrl;
    pointcloud.table = lopocsTable;

    // point selection on double-click
    function dblClickHandler(event) {
        var pick;
        var mouse = {
            x: event.offsetX,
            y: (event.currentTarget.height || event.currentTarget.offsetHeight) - event.offsetY,
        };

        pick = itowns.PointCloudProcessing.selectAt(view, pointcloud, mouse);

        if (pick) {
            console.log('Selected point #' + pick.index + ' in Points "' + pick.points.owner.name + '"');
        }
    }
    view.mainLoop.gfxEngine.renderer.domElement.addEventListener('dblclick', dblClickHandler);


    // add pointcloud to scene
    function onLayerReady() {
        debug.PointCloudDebug.initTools(view, pointcloud, debugGui);

        // update stats window
        oldPostUpdate = pointcloud.postUpdate;
        pointcloud.postUpdate = function postUpdate() {
            var info = document.getElementById('info');
            oldPostUpdate.apply(pointcloud, arguments);
            info.textContent = 'Nb points: ' +
                pointcloud.counters.displayedCount.toLocaleString() + ' (' +
                Math.floor(100 * pointcloud.counters.displayedCount / pointcloud.counters.pointCount) + '%) (' +
                view.mainLoop.gfxEngine.renderer.info.memory.geometries + ')';
        };
    }

    itowns.View.prototype.addLayer.call(view, pointcloud).then(onLayerReady);
}
