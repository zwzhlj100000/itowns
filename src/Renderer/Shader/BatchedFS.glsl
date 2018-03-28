precision highp float;
precision highp int;

#include <logdepthbuf_pars_fragment>

varying vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1.0);

    #include <logdepthbuf_fragment>
}
