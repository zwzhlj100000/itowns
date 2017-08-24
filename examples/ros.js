/* global itowns, debug, dat */

// eslint-disable-next-line no-unused-vars


function loadPoints() {
    var points;
    console.log("loadPoints");
    var particles = 500000;
    var geometry = new itowns.THREE.BufferGeometry();
    var positions = new Float32Array( particles * 3 );
    var colors = new Float32Array( particles * 3 );
    var color = new itowns.THREE.Color();
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
    geometry.addAttribute( 'position', new itowns.THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new itowns.THREE.BufferAttribute( colors, 3 ) );
    geometry.computeBoundingSphere();
    //
    var material = new itowns.THREE.PointsMaterial( { size: 15, vertexColors: itowns.THREE.VertexColors } );
    points = new itowns.THREE.Points( geometry, material );
    //scene.add( points );
   // context.view.scene.add(points);
    return points;
}

function showRosData(serverUrl, fileName, lopocsTable) {

    console.log("showRosData");
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
        '+proj=lcc +lat_1=45.25 +lat_2=46.75 +lat_0=46 +lon_0=3 +x_0=1700000 ' +
        '+y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

    debugGui = new dat.GUI();

    // TODO: do we really need to disable logarithmicDepthBuffer ?
    view = new itowns.View('EPSG:3946', viewerDiv, { renderer: { logarithmicDepthBuffer: true } });
    view.mainLoop.gfxEngine.renderer.setClearColor(0x555555);
    // view.mainLoop.gfxEngine.renderer.render(view.scene, view.camera.camera3D);

    // Configure Point Cloud layer
    pointcloud = new itowns.GeometryLayer('pointcloud', view.scene);
    pointcloud.file = fileName || 'infos/sources';
    pointcloud.protocol = 'ros';
    pointcloud.url = serverUrl;
    pointcloud.table = lopocsTable;

    var p = loadPoints();
   // view.scene.add(p);
    // console.log(view);
    controls = new itowns.FirstPersonControls(view, { focusOnClick: true });
    // console.log(ROSLIB.Ros);

    var ros = new ROSLIB.Ros({
              url : 'wss://172.16.2.3:9090'
            });

    ros.on('connection', function() {
                console.log('Connected to websocket server.');
            });
            
            ros.on('error', function(error) {
                console.log('Error connecting to websocket server: ', error);
            });
            
            ros.on('close', function() {
                console.log('Connection to websocket server closed.');
            });

            listener = new ROSLIB.Topic({
                ros : ros,
                name : '/xlba_window_points_computed',
                messageType : 'sensor_msgs/PointCloud2'
            });


            listener.subscribe(function(message) {
                console.log('Received message on ' + listener.name + ': ' + message.fields);

                d = message.data;
                atobs = window.atob(d);

                var ptSize = message.point_step;
                var rowSize = message.row_step;
                var numPoints = message.height;

                var buf = new ArrayBuffer(numPoints * rowSize);
                var bigEndian = message.is_bigendian;

                var bufView = new DataView(buf);
                for (var i=0, strLen=numPoints * rowSize; i < strLen; i++) {
                    bufView.setUint8(i, atobs.charCodeAt(i), !bigEndian);
                }

                var float32view   = new Float32Array(buf);
                var uint32View    = new Uint32Array(buf);

                var geometry = new itowns.THREE.BufferGeometry();
                var positions = new Float32Array( numPoints * 3 );
                var colors =    new Float32Array( numPoints * 3 );

                for (var i=0; i<numPoints; i++) {
                    var pIdx = i * 3;
                    var rIdx = i * 4;

                    positions[pIdx+0] = float32view[rIdx+1];
                    positions[pIdx+1] = float32view[rIdx+2];
                    positions[pIdx+2] = float32view[rIdx+3];
                    colors[pIdx+0] = 1.0;
                    colors[pIdx+1] = 1.0;
                    colors[pIdx+2] = 1.0;
                }
                geometry.addAttribute( 'position', new itowns.THREE.BufferAttribute( positions, 3 ) );
                geometry.addAttribute( 'color', new itowns.THREE.BufferAttribute( colors, 3 ) );
                geometry.computeBoundingSphere();
                //
                var material = new itowns.THREE.PointsMaterial( { size: 0.01, vertexColors: itowns.THREE.VertexColors } );
                points = new itowns.THREE.Points( geometry, material );
                //scene.add( points );
                view.scene.add(points);

            });

            

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


    function placeCamera(position, lookAt) {
        view.camera.camera3D.position.set(position.x, position.y, position.z);
        view.camera.camera3D.lookAt(lookAt);
        // create controls
        controls = new itowns.FirstPersonControls(view, { focusOnClick: true });
        debugGui.add(controls, 'moveSpeed', 1, 100).name('Movement speed');

        view.notifyChange(true);
    }

    // add pointcloud to scene
    function onLayerReady() {
      
    }

    view.addLayer(pointcloud).then(onLayerReady);
}
