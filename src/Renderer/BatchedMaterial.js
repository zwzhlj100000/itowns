import { Uniform, Vector3, RawShaderMaterial } from 'three';
import BatchedVS from './Shader/BatchedVS.glsl';
import BatchedFS from './Shader/BatchedFS.glsl';
import Capabilities from '../Core/System/Capabilities';

class BatchedMaterial extends RawShaderMaterial {
    constructor(count = 0) {
        super();
        this.vertexShader = `#define GEOMETRY_COUNT ${count}\n${BatchedVS}`;
        this.fragmentShader = BatchedFS;

        var colors = [];
        for (var i = 0; i < count; i++) {
            colors[i] = new Vector3(1, 1, 1);
        }


        this.uniforms.colors = new Uniform(colors);

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

    /* TODO enablePicking(v) {
        // we don't want pixels to blend over already drawn pixels
        this.blending = v ? NoBlending : NormalBlending;
        this.uniforms.pickingMode.value = v;
    } */

    updateColors(colorArray) {
        this.uniforms.colors.value = colorArray;
    }
}

/* MultiGeometryMaterial.prototype.setSelected = function(selected, index) {
    this.uniforms.selected.value = selected ? index + 1 : 0;
};

MultiGeometryMaterial.prototype.getSelectedIndex = function() {
    return this.uniforms.selected.value ? this.uniforms.selected.value - 1 : null;
}; */

export default BatchedMaterial;
