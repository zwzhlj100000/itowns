import * as THREE from 'three';
import debugUV_VS from './shader/debugUV_VS.glsl';
import debugUV_FS from './shader/debugUV_FS.glsl';

const debugUvMaterial = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: debugUV_VS,
    fragmentShader: debugUV_FS,
});

export default {
    debugUvMaterial,
};
