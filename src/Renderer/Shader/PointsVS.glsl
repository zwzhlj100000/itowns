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
uniform bool useCustomColor;
uniform float opacity;
uniform vec3 customColor;
attribute vec3 color;
attribute vec4 unique_id;

varying vec4 vColor;

void main() {
    if (pickingMode) {
        vColor = unique_id;
    } else if (useCustomColor) {
        vColor = vec4(mix(color, customColor, 0.5), opacity);
    } else {
        vColor = vec4(color, opacity);
    }

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;

    if (size > 0.) {
        gl_PointSize = size;
    } else {
        // automatic sizing
        float pointSize = 1.0;
        float slope = tan(1.0 / 2.0);
        float projFactor =  -0.5 * resolution.y / (slope * mvPosition.z);

        float z = min(0.5 * -gl_Position.z / gl_Position.w, 1.0);
        gl_PointSize = max(3.0, min(10.0, 0.05 * projFactor));
    }

    #include <logdepthbuf_vertex>
}
