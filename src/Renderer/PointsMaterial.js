import { Color, Uniform, Vector2, NoBlending, NormalBlending, RawShaderMaterial } from 'three';
import PointsVS from './Shader/PointsVS.glsl';
import PointsFS from './Shader/PointsFS.glsl';
import Capabilities from '../Core/System/Capabilities';

class PointsMaterial extends RawShaderMaterial {
    constructor(size = 0) {
        super();
        this.vertexShader = PointsVS;
        this.fragmentShader = PointsFS;
        this.size = size;

        this.uniforms.size = new Uniform(this.size);
        this.uniforms.resolution = new Uniform(new Vector2(window.innerWidth, window.innerHeight));
        this.uniforms.pickingMode = new Uniform(false);
        this.uniforms.opacity = new Uniform(1.0);
        this.uniforms.useCustomColor = new Uniform(false);
        this.uniforms.customColor = new Uniform(new Color());

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

    refreshUniforms(/* renderer, scene, camera, geometry, material, group */) {
        this.uniforms.size.value = this.size;
        this.uniforms.opacity.value = this.opacity;
    }
}

export default PointsMaterial;
