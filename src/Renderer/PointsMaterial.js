import { Vector4, Uniform, Vector2, NoBlending, NormalBlending, RawShaderMaterial } from 'three';
import PointsVS from './Shader/PointsVS.glsl';
import PointsFS from './Shader/PointsFS.glsl';
import Capabilities from '../Core/System/Capabilities';

class PointsMaterial extends RawShaderMaterial {
    constructor(size = 0) {
        super();
        this.vertexShader = PointsVS;
        this.fragmentShader = PointsFS;

        this.uniforms.size = new Uniform(size);
        this.uniforms.resolution = new Uniform(new Vector2(window.innerWidth, window.innerHeight));
        this.uniforms.pickingMode = new Uniform(false);
        this.uniforms.opacity = new Uniform(1.0);
        this.uniforms.rgba = new Uniform(new Vector4(0, 0, 0, 0));

        if (Capabilities.isLogDepthBufferSupported()) {
            this.defines = {
                USE_LOGDEPTHBUF: 1,
                USE_LOGDEPTHBUF_EXT: 1,
            };
        }

        if (__DEBUG__) {
            this.defines.DEBUG = 1;
        }
    }

    enablePicking(v) {
        // we don't want pixels to blend over already drawn pixels
        this.blending = v ? NoBlending : NormalBlending;
        this.uniforms.pickingMode.value = v;
    }
}

export default PointsMaterial;
