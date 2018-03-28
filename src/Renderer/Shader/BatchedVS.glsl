precision highp float;
precision highp int;

#include <logdepthbuf_pars_vertex>
#define EPSILON 1e-6

uniform vec3 colors[GEOMETRY_COUNT];
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

attribute vec4 batch_id;
attribute vec3 position;
attribute vec3 normal;

varying vec3 vColor;

void main() {

    vPosition = vec4(position, 1.0);
    vNormal = normal;
    for(int i = 0; i < GEOMETRY_COUNT; i++) {
        if(i == int(floor(idx + 0.5))) {
            vColor = colors[i];
        }
    }

    gl_Position = projectionMatrix * modelViewMatrix * vPosition;

    #include <logdepthbuf_vertex>
}
