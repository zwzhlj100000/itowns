precision highp float;
precision highp int;

#include <logdepthbuf_pars_vertex>
#define EPSILON 1e-6

attribute vec3 position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

uniform float size;
uniform vec2 resolution;

uniform bool pickingMode;
uniform float opacity;
uniform vec4 overlayColor;
attribute vec3 color;
attribute vec4 unique_id;

varying vec4 vColor;

void main() {
    if (pickingMode) {
        vColor = unique_id;
    } else {
        vColor = vec4(mix(color, overlayColor.rgb, overlayColor.a), opacity);
    }

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;

    if (size > 0.) {
        gl_PointSize = size;
    } else {
        // automatic sizing
        float slope = tan(1.0 / 2.0);
        float projFactor =  -0.5 * resolution.y / (slope * mvPosition.z);
        gl_PointSize = max(3.0, min(10.0, 0.05 * projFactor));
    }

    #include <logdepthbuf_vertex>
}
