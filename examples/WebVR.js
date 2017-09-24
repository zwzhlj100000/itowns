/* global itowns, document, renderer, Promise */
// # Simple Globe viewer

// Define initial camera position
var positionOnGlobe = { longitude: 3.36, latitude: 51.22, altitude: 480000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe, { renderer: renderer });

var promises = [];

var orthoLayer;
var osmLayer;
var splitSlider;
var splitPosition;
var xD;



/**
 * @author mrdoob / http://mrdoob.com
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Based on @tojiro's vr-samples-utils.js
 */

var WEBVR = {

    isAvailable: function () {

        console.warn( 'WEBVR: isAvailable() is being deprecated. Use .checkAvailability() instead.' );
        return navigator.getVRDisplays !== undefined;

    },

    checkAvailability: function () {

        return new Promise( function( resolve, reject ) {

            if ( navigator.getVRDisplays !== undefined ) {

                navigator.getVRDisplays().then( function ( displays ) {

                    if ( displays.length === 0 ) {

                        reject( 'WebVR supported, but no VRDisplays found.' );

                    } else {

                        resolve();

                    }

                } );

            } else {

                reject( 'Your browser does not support WebVR. See <a href="https://webvr.info">webvr.info</a> for assistance.' );

            }

        } );

    },

    getVRDisplay: function ( onDisplay ) {

        if ( 'getVRDisplays' in navigator ) {

            navigator.getVRDisplays()
                .then( function ( displays ) {
                    onDisplay( displays[ 0 ] );
                } );

        }

    },

    getMessage: function () {

        console.warn( 'WEBVR: getMessage() is being deprecated. Use .getMessageContainer( message ) instead.' );

        var message;

        if ( navigator.getVRDisplays ) {

            navigator.getVRDisplays().then( function ( displays ) {

                if ( displays.length === 0 ) message = 'WebVR supported, but no VRDisplays found.';

            } );

        } else {

            message = 'Your browser does not support WebVR. See <a href="http://webvr.info">webvr.info</a> for assistance.';

        }

        if ( message !== undefined ) {

            var container = document.createElement( 'div' );
            container.style.position = 'absolute';
            container.style.left = '0';
            container.style.top = '0';
            container.style.right = '0';
            container.style.zIndex = '999';
            container.align = 'center';

            var error = document.createElement( 'div' );
            error.style.fontFamily = 'sans-serif';
            error.style.fontSize = '16px';
            error.style.fontStyle = 'normal';
            error.style.lineHeight = '26px';
            error.style.backgroundColor = '#fff';
            error.style.color = '#000';
            error.style.padding = '10px 20px';
            error.style.margin = '50px';
            error.style.display = 'inline-block';
            error.innerHTML = message;
            container.appendChild( error );

            return container;

        }

    },

    getMessageContainer: function ( message ) {

        var container = document.createElement( 'div' );
        container.style.position = 'absolute';
        container.style.left = '0';
        container.style.top = '0';
        container.style.right = '0';
        container.style.zIndex = '999';
        container.align = 'center';

        var error = document.createElement( 'div' );
        error.style.fontFamily = 'sans-serif';
        error.style.fontSize = '16px';
        error.style.fontStyle = 'normal';
        error.style.lineHeight = '26px';
        error.style.backgroundColor = '#fff';
        error.style.color = '#000';
        error.style.padding = '10px 20px';
        error.style.margin = '50px';
        error.style.display = 'inline-block';
        error.innerHTML = message;
        container.appendChild( error );

        return container;

    },

    getButton: function ( display, canvas ) {

        if ( 'VREffect' in THREE && display instanceof THREE.VREffect ) {

            console.error( 'WebVR.getButton() now expects a VRDisplay.' );
            return document.createElement( 'button' );

        }

        var button = document.createElement( 'button' );
        button.style.position = 'absolute';
        button.style.left = 'calc(50% - 50px)';
        button.style.bottom = '20px';
        button.style.width = '100px';
        button.style.border = '0';
        button.style.padding = '8px';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = '#000';
        button.style.color = '#fff';
        button.style.fontFamily = 'sans-serif';
        button.style.fontSize = '13px';
        button.style.fontStyle = 'normal';
        button.style.textAlign = 'center';
        button.style.zIndex = '999';

        if ( display ) {

            button.textContent = 'ENTER VR';
            button.onclick = function () {

                display.isPresenting ? display.exitPresent() : display.requestPresent( [ { source: canvas } ] );

            };

            window.addEventListener( 'vrdisplaypresentchange', function () {

                button.textContent = display.isPresenting ? 'EXIT VR' : 'ENTER VR';

            }, false );

        } else {

            button.textContent = 'NO VR DISPLAY';

        }

        return button;

    }

};

WEBVR.checkAvailability().catch( function( message ) {

       document.body.appendChild( WEBVR.getMessageContainer( message ) );

} );



function addLayerCb(layer) {
    return globeView.addLayer(layer);
}
// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb).then(function _(l) { orthoLayer = l; }));
//promises.push(itowns.Fetcher.json('./layers/JSONLayers/ScanEX.json').then(addLayerCb).then(function _(l) { osmLayer = l; }));

// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb);
itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb);

// Slide handling
splitPosition = 0.5 * window.innerWidth;
xD = 0;

var g = globeView.mainLoop.gfxEngine;
var r = g.renderer;

r.vr.enabled = true;

WEBVR.getVRDisplay( function ( display ) {

    renderer.vr.setDevice( display );

    document.body.appendChild( WEBVR.getButton( display, renderer.domElement ) );

} );



function renderInStereo(){

   // effect.render( globeView.scene, globeView.camera.camera3D);

}

// Override default rendering method when color layers are ready
//Promise.all(promises).then(function _() { globeView.render = renderInStereo; });

exports.view = globeView;
exports.initialPosition = positionOnGlobe;
