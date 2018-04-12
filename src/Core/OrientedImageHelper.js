import * as THREE from 'three';
import Coordinates from './Geographic/Coordinates';
import materialUV_VS from '../Renderer/Shader/debugUV_VS.glsl';
import materialUV_FS from '../Renderer/Shader/debugUV_FS.glsl';

const materialUV = new THREE.ShaderMaterial({
    uniforms: {},
    side: THREE.BackSide,
    vertexShader: materialUV_VS,
    fragmentShader: materialUV_FS,
});

export default {

    setPicturePositionAndScale(object, distance, sizeX, sizeY, focale, ppaX, ppaY) {
        // compute picture size
        var Xreel = (sizeX * distance) / focale;
        var Yreel = (sizeY * distance) / focale;

        // compute ppa
        var ppaXReel = ((ppaX - sizeX / 2) * distance) / focale;
        var ppaYReel = (-(ppaY - sizeY / 2) * distance) / focale;

        // set position and scale
        object.scale.set(Xreel, Yreel, 1);
        object.position.set(ppaXReel, ppaYReel, distance);
        object.updateMatrixWorld();
    },

    // set object position to the coordinate
    // set object basic orientation: Z (blue) look to the sky, Y (green) to the north, X (red) to the east.
    initPositionAndOrientation(obj, coord) {
    // set axis position to the coordinate
        obj.position.copy(coord.xyz());
        // set orientation, looking at the sky (Z axis), so Y axis look to the north..
        obj.lookAt(coord.geodesicNormal.clone().add(obj.position));
    },

    computeOrientation(object, up, lookAt, quaternion) {
        object.up.set(up.x, up.y, up.z);
        object.lookAt(lookAt.x, lookAt.y, lookAt.z);
        object.quaternion.multiply(quaternion);
        object.updateMatrixWorld();
    },

    createTexturedPlane(textureUrl) {
        const texture = new THREE.TextureLoader().load(textureUrl);
        texture.flipY = false;
        var geometry = new THREE.PlaneGeometry(1, 1, 32);
        var material = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff,
            side: THREE.BackSide,
            transparent: true,
            opacity: 1,
        });
        return new THREE.Mesh(geometry, material);
    },

    setupCamera(camera, coord, objectToLookAt, fov) {
        camera.position.copy(coord.xyz());
        camera.up.copy(coord.geodesicNormal);
        camera.lookAt(objectToLookAt.getWorldPosition());
        camera.fov = fov;
        camera.updateProjectionMatrix();
    },


    initPicture(view, image, coord, up, lookAt, rotationMatrix, distance, sizeX, sizeY, focale) {
        var coordView = new Coordinates(view.referenceCrs, 0, 0, 0);
        coord.as(view.referenceCrs, coordView);

        // create object referential to show basic orientation
        var referential = new THREE.Object3D();
        view.scene.add(referential);

        // set axis basic orientation
        this.initPositionAndOrientation(referential, coordView);

        // add second object: orientation
        var orientation = new THREE.Object3D();
        referential.add(orientation);

        // compute and store the quaternion
        var quaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);

        // compute orientation
        this.computeOrientation(orientation, up, lookAt, quaternion);

        // create a textured plane, representing the picture.
        var plane = this.createTexturedPlane(image);
        orientation.add(plane);

        this.setPicturePositionAndScale(plane, distance, sizeX, sizeY, focale, sizeX / 2, sizeY / 2);

        // update all the hierarchy
        referential.updateMatrixWorld(true);

        this.setupCamera(view.camera.camera3D, coordView, plane, 45);

        return plane;
    },

    setupPictureUI(menu, pictureInfos, plane, updateDistanceCallback, view) {
        var orientedImageGUI_MontBlanc = menu.gui.addFolder('Oriented Image');
        orientedImageGUI_MontBlanc.add(pictureInfos, 'distance', 3000, 15000).name('Distance').onChange((value) => {
            pictureInfos.distance = value;
            updateDistanceCallback(pictureInfos, plane);
            view.notifyChange(true);
        });
        orientedImageGUI_MontBlanc.add(pictureInfos, 'opacity', 0, 1).name('Opacity').onChange((value) => {
            plane.material.opacity = value;
            view.notifyChange(true);
        });
    },

    materialUV,
};
