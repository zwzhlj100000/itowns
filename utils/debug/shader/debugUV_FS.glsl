#include <logdepthbuf_pars_fragment>

varying vec2 vUv;

void main()  {
    #include <logdepthbuf_fragment>
    
    // graylevel output black at the origin (0, 0)
    // gl_FragColor = vec4(vUv.x * vUv.y, vUv.x * vUv.y, vUv.x * vUv.y, 1.0);
    
    // colored output
    gl_FragColor = vec4(vUv, 0.5, 1.0);
}
