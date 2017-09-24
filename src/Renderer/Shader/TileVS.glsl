#include <logdepthbuf_pars_vertex>
#define EPSILON 1e-6

const float PI          = 3.14159265359;
const float INV_TWO_PI  = 1.0 / (2.0*PI);
const float PI4         = 0.78539816339;

const vec4 CFog = vec4( 0.76, 0.85, 1.0, 1.0);
const vec4 CWhite = vec4(1.0,1.0,1.0,1.0);
const vec4 CBlueOcean = vec4( 0.04, 0.23, 0.35, 1.0);
const vec4 COrange = vec4( 1.0, 0.3, 0.0, 1.0);
const vec4 CRed = vec4( 1.0, 0.0, 0.0, 1.0);

//const int   TEX_UNITS   = 15;

attribute float     uv_pm;
attribute vec2      uv_wgs84;
attribute vec3      position;
attribute vec3      normal;

uniform sampler2D   dTextures_00[1];
uniform vec3        offsetScale_L00[1];

/***** TEST ALEX  */

uniform sampler2D   dTextures_01[TEX_UNITS];
uniform vec3        offsetScale_L01[TEX_UNITS];
uniform vec4        paramLayers[8];
uniform bool        visibility[8];

uniform float       distanceFog;
uniform int         colorLayersCount;
uniform vec3        lightPosition;

float height = 0.;

/*********/



uniform int         loadedTexturesCount[8];

uniform mat4        projectionMatrix;
uniform mat4        modelViewMatrix;

varying vec2        vUv_WGS84;
varying float       vUv_PM;
varying vec3        vNormal;
varying vec4        pos;

highp float decode32(highp vec4 rgba) {
    highp float Sign = 1.0 - step(128.0,rgba[0])*2.0;
    highp float Exponent = 2.0 * mod(rgba[0],128.0) + step(128.0,rgba[1]) - 127.0;
    highp float Mantissa = mod(rgba[1],128.0)*65536.0 + rgba[2]*256.0 +rgba[3] + float(0x800000);
    highp float Result =  Sign * exp2(Exponent) * (Mantissa * exp2(-23.0 ));
    return Result;
}

// 4 connex averaging using weighted (distance parameter)
vec4 AverageColor( sampler2D dTextures[TEX_UNITS],vec3 offsetScale[TEX_UNITS],int id, vec2 uv, float dist){

    float distMax = min(dist/50000., 0.02);
    vec4 cc1 = colorAtIdUv(dTextures, offsetScale, id, vec2(clamp(uv.x + distMax,0.,1.), uv.y));
    vec4 cc2 = colorAtIdUv(dTextures, offsetScale, id, vec2(clamp(uv.x - distMax,0.,1.), uv.y));
    vec4 cc3 = colorAtIdUv(dTextures, offsetScale, id, vec2(uv.x, uv.y + clamp(distMax,0.,1.)));
    vec4 cc4 = colorAtIdUv(dTextures, offsetScale, id, vec2(uv.x, uv.y - clamp(distMax,0.,1.)));

    return (cc1 + cc2 + cc3 + cc4)  / 4.;
}

void main() {

        vUv_WGS84 = uv_wgs84;
        vUv_PM = uv_pm;
        vec2 uvPM ;
        uvPM.x  = vUv_WGS84.x;
        vec4 vPosition;

        vNormal = normal;

         /* imagery texture work   */
        float y            = vUv_PM;
        int pmSubTextureIndex = int(floor(y));
        uvPM.y             = y - float(pmSubTextureIndex);


/* Texture IMAGERY TEST ********************************************/

if(true){

        vec4 diffuseColor = vec4(0.,0.,0.,1.);
        bool validTexture = false;
        vec4 cc = vec4(0.,0.,0.,1.);
        float dist1 = 0.05;
        vec4 featureColor = vec4(0.,0.,0.,1.);
        float featureTree = 0.;

        for (int layer = 0; layer < 8; layer++) {
             
                     if(true /*visibility[layer] */) {
                        vec4 paramsA = paramLayers[layer];
                        if(paramsA.w > 0.0) {
                            bool projWGS84 = paramsA.y == 0.0;
                            int textureIndex = int(paramsA.x) + (projWGS84 ? 0 : pmSubTextureIndex);

                            vec4 layerColor = AverageColor(
                                    dTextures_01,
                                    offsetScale_L01,
                                    textureIndex,
                                    projWGS84 ? vUv_WGS84 : uvPM,
                                    dist1);
                            featureColor = layerColor; 
                            
                            if (layerColor.a > 0.0 ) {
                                validTexture = true;
                                float lum = 1.0;

                                if( paramsA.z > 0.0  ) {
                                    float a = max(0.05,1.0 - length(layerColor.xyz-CWhite.xyz));
                                    if(paramsA.z > 2.0) {
                                        a = (layerColor.r + layerColor.g + layerColor.b)*0.333333333;
                                        layerColor*= layerColor*layerColor;
                                    }
                                    lum = 1.0-pow(abs(a),paramsA.z);
                                }
                                if(layer == 2) {
                                    cc = layerColor;
                                    cc.a = 0.;
                                    
                                    // for buildings
                                    if(featureColor.a>0.1)
                                        height = 4. + featureColor.r * 5. + featureColor.b * 5.;

                                    //    cc.a = 10. + (featureColor.r + featureColor.g + featureColor.b) * 4.;
                                   // if(featureColor.r >= 0.95 && featureColor.g >= 0.40 && featureColor.g <= 0.55 && featureColor.b >= 0.3  && featureColor.b <= 0.7) cc.a = 14.;   
             
                                }

                                /*
                                 if(layer == 2) {
                                    cc = layerColor;
                                    cc.a = 0.;
                                    // for trees
                                    if(featureColor.r >= 0.1 || featureColor.g >= 0.1 || featureColor.b >= 0.1) featureTree = 9. + diffuseColor.r*10. + mod(timing * diffuseColor.g * 100.,5.);   
             
                                }
                                */
                                diffuseColor = mix( diffuseColor,layerColor, lum*paramsA.w * layerColor.a);
                            }

                        }
                    }
                }
}

/********************************************/




        
        if(loadedTexturesCount[0] > 0) {
            vec2    vVv = vec2(
                vUv_WGS84.x * offsetScale_L00[0].z + offsetScale_L00[0].x,
                (1.0 - vUv_WGS84.y) * offsetScale_L00[0].z + offsetScale_L00[0].y);

            #if defined(RGBA_TEXTURE_ELEVATION)
                vec4 rgba = texture2D( dTextures_00[0], vVv ) * 255.0;

                rgba.rgba = rgba.abgr;

                float dv = max(decode32(rgba),0.0);

                // TODO In RGBA elevation texture LinearFilter give some errors with nodata value.
                // need to rewrite sample function in shader
                // simple solution
                if(dv>5000.0) {
                    dv = 0.0;
                }

            #elif defined(DATA_TEXTURE_ELEVATION)
                float   dv  = max(texture2D( dTextures_00[0], vVv ).w, 0.);
            #elif defined(COLOR_TEXTURE_ELEVATION)
                float   dv  = max(texture2D( dTextures_00[0], vVv ).r, 0.);
                dv = _minElevation + dv * (_maxElevation - _minElevation);
            #else

            #error Must define either RGBA_TEXTURE_ELEVATION, DATA_TEXTURE_ELEVATION or COLOR_TEXTURE_ELEVATION
            #endif

            vPosition = vec4( position +  vNormal  * (dv + height) ,1.0 );
        } else {
            vPosition = vec4( position +  vNormal  * height ,1.0 );
        }

        gl_Position = projectionMatrix * modelViewMatrix * vPosition;
        #include <logdepthbuf_vertex>
}
