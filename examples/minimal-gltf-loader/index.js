'use strict';

var modelInfo = ModelIndex.getCurrentModel();
if (!modelInfo) {
    modelInfo = TutorialModelIndex.getCurrentModel();
}
if (!modelInfo) {
    modelInfo = TutorialPbrModelIndex.getCurrentModel();
}
if (!modelInfo) {
    modelInfo = TutorialFurtherPbrModelIndex.getCurrentModel();
}
if (!modelInfo) {
    modelInfo = TutorialAgiPbrModelIndex.getCurrentModel();
}
if (!modelInfo) {
    document.getElementById('container').innerHTML = 'Please specify a model to load';
    throw new Error('Model not specified or not found in list.');
}

var drawBoundingBox = true;
var boundingBoxType = 'obb';


var canvas = document.getElementById("world");
var gl = canvas.getContext( 'webgl2', { antialias: true } );
resizeCanvas();
window.addEventListener("resize", function(){
    resizeCanvas();
});
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
// Scene object for runtime renderer
var Scene = function(glTFScene, glTF) {
    this.glTFScene = glTFScene;
    // runtime renderer context
    this.rootTransform = mat4.create();
    // @temp, assume every node is in current scene
    this.nodeMatrix = new Array(glTF.nodes.length);
    var i, len;
    for(i = 0, len = this.nodeMatrix.length; i < len; i++) {
        this.nodeMatrix[i] = mat4.create();
    }


    // if (glTF.skins) {
    //     this.inverseSkeletonRootMatrix = new Array(glTF.skins.length);
    //     this.inverseSkeletonRootMatrixReady = new Array(glTF.skins.length);
    //     for(i = 0, len = this.inverseSkeletonRootMatrix.length; i < len; i++) {
    //         if (glTF.skins[i].skeleton) {
    //             this.inverseSkeletonRootMatrix[i] = mat4.create();
    //             this.inverseSkeletonRootMatrixReady[i] = false;
    //         } else {
    //             this.inverseSkeletonRootMatrix[i] = null;
    //         }
    //     }
    // }
};
var BOUNDING_BOX = {
    vertexData: new Float32Array([
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 0.0,
        0.0, 0.0, 1.0,
        0.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        0.0, 1.0, 1.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 1.0,
        0.0, 0.0, 1.0,
        1.0, 1.0, 0.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 1.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 0.0, 1.0,
        0.0, 0.0, 1.0
    ]),

    vertexArray: gl.createVertexArray(),
    vertexBuffer: gl.createBuffer(),

    program: createProgram(gl, getShaderSource('vs-bbox'), getShaderSource('fs-bbox')),
    positionLocation: 0,
    uniformMvpLocation: 0, 

    draw: (function() {
        var MVP = mat4.create();
        return (function(bbox, nodeTransform, V, P) {
            gl.useProgram(this.program);

            mat4.mul(MVP, nodeTransform, bbox.transform);
            mat4.mul(MVP, V, MVP);
            mat4.mul(MVP, P, MVP);

            gl.uniformMatrix4fv(this.uniformMvpLocation, false, MVP);
            gl.bindVertexArray(this.vertexArray);
            gl.drawArrays(gl.LINES, 0, 24);
            gl.bindVertexArray(null);
        });
    })()
};

var defaultSampler = gl.createSampler();
gl.samplerParameteri(defaultSampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
gl.samplerParameteri(defaultSampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.samplerParameteri(defaultSampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.samplerParameteri(defaultSampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
// gl.samplerParameteri(defaultSampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
// gl.samplerParameterf(defaultSampler, gl.TEXTURE_MIN_LOD, -1000.0);
// gl.samplerParameterf(defaultSampler, gl.TEXTURE_MAX_LOD, 1000.0);
// gl.samplerParameteri(defaultSampler, gl.TEXTURE_COMPARE_MODE, gl.NONE);
// gl.samplerParameteri(defaultSampler, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);

BOUNDING_BOX.uniformMvpLocation = gl.getUniformLocation(BOUNDING_BOX.program, "u_MVP");

gl.bindVertexArray(BOUNDING_BOX.vertexArray);

gl.bindBuffer(gl.ARRAY_BUFFER, BOUNDING_BOX.vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, BOUNDING_BOX.vertexData, gl.STATIC_DRAW);
gl.vertexAttribPointer(BOUNDING_BOX.positionLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(BOUNDING_BOX.positionLocation);

gl.bindVertexArray(null);



// // -- Initialize program
// var program = createProgram(gl, getShaderSource('vs-normal'), getShaderSource('fs-normal'));
// var uniformMvpLocation = gl.getUniformLocation(program, "u_MVP");
// var uniformMvNormalLocation = gl.getUniformLocation(program, "u_MVNormal");

// var program = createProgram(gl, getShaderSource('vs-normal'), getShaderSource('fs-base-color'));
// var uniformMvpLocation = gl.getUniformLocation(program, "u_MVP");
// var uniformMvNormalLocation = gl.getUniformLocation(program, "u_MVNormal");
// var uniformBaseColorFactorLocation = gl.getUniformLocation(program, "u_baseColorFactor");

var program = createProgram(gl, getShaderSource('vs-normal'), getShaderSource('fs-base-color'));
var programBaseColor = {
    program: program,
    uniformMvpLocation: gl.getUniformLocation(program, "u_MVP"),
    uniformMvNormalLocation: gl.getUniformLocation(program, "u_MVNormal"),
    uniformBaseColorFactorLocation: gl.getUniformLocation(program, "u_baseColorFactor")
};

program = createProgram(gl, getShaderSource('vs-plain'), getShaderSource('fs-plain'));
var programPlain = {
    program: program,
    uniformMvpLocation: gl.getUniformLocation(program, "u_MVP"),
    uniformBaseColorFactorLocation: gl.getUniformLocation(program, "u_baseColorFactor")
};

program = createProgram(gl, getShaderSource('vs-texture'), getShaderSource('fs-texture'));
var programBaseTexture = {
    program: program,
    uniformMvpLocation: gl.getUniformLocation(program, "u_MVP"),
    uniformMvNormalLocation: gl.getUniformLocation(program, "u_MVNormal"),
    uniformBaseColorFactorLocation: gl.getUniformLocation(program, "u_baseColorFactor"),
    uniformBaseColorTextureLocation: gl.getUniformLocation(program, "u_baseColorTexture")
};
// @temp test
program = createProgram(gl, getShaderSource('vs-texture'), getShaderSource('fs-texture-normal-map'));
var programBaseTextureNormalMap = {
    program: program,
    uniformMvpLocation: gl.getUniformLocation(program, "u_MVP"),
    uniformMvNormalLocation: gl.getUniformLocation(program, "u_MVNormal"),
    uniformBaseColorFactorLocation: gl.getUniformLocation(program, "u_baseColorFactor"),
    uniformBaseColorTextureLocation: gl.getUniformLocation(program, "u_baseColorTexture"),
    // uniformNormalTextureScaleLocation: gl.getUniformLocation(program, "u_normalTextureScale"),
    uniformNormalTextureLocation: gl.getUniformLocation(program, "u_normalTexture")
};
program = createProgram(gl, getShaderSource('vs-skin-normal'), getShaderSource('fs-base-color'));
var programSkinBaseColor = {
    program: program,
    uniformMvpLocation: gl.getUniformLocation(program, "u_MVP"),
    uniformMvNormalLocation: gl.getUniformLocation(program, "u_MVNormal"),
    uniformBaseColorFactorLocation: gl.getUniformLocation(program, "u_baseColorFactor"),
    uniformBlockIndexJointMatrix: gl.getUniformBlockIndex(program, "JointMatrix")
};

program = createProgram(gl, getShaderSource('vs-skin-normal-8'), getShaderSource('fs-base-color'));
var programSkinBaseColorVec8 = {
    program: program,
    uniformMvpLocation: gl.getUniformLocation(program, "u_MVP"),
    uniformMvNormalLocation: gl.getUniformLocation(program, "u_MVNormal"),
    uniformBaseColorFactorLocation: gl.getUniformLocation(program, "u_baseColorFactor"),
    uniformBlockIndexJointMatrix: gl.getUniformBlockIndex(program, "JointMatrix")
};

// temp
program = createProgram(gl, getShaderSource('vs-skin-texture'), getShaderSource('fs-texture'));
var programSkinBaseTexture = {
    program: program,
    uniformMvpLocation: gl.getUniformLocation(program, "u_MVP"),
    uniformMvNormalLocation: gl.getUniformLocation(program, "u_MVNormal"),
    uniformBaseColorFactorLocation: gl.getUniformLocation(program, "u_baseColorFactor"),
    uniformBaseColorTextureLocation: gl.getUniformLocation(program, "u_baseColorTexture"),
    uniformBlockIndexJointMatrix: gl.getUniformBlockIndex(program, "JointMatrix")
};
        
program = createProgram(gl, getShaderSource('vs-skin-texture-8'), getShaderSource('fs-texture'));
var programSkinBaseTextureVec8 = {
    program: program,
    uniformMvpLocation: gl.getUniformLocation(program, "u_MVP"),
    uniformMvNormalLocation: gl.getUniformLocation(program, "u_MVNormal"),
    uniformBaseColorFactorLocation: gl.getUniformLocation(program, "u_baseColorFactor"),
    uniformBaseColorTextureLocation: gl.getUniformLocation(program, "u_baseColorTexture"),
    uniformBlockIndexJointMatrix: gl.getUniformBlockIndex(program, "JointMatrix")
};


// -- Mouse Behaviour
var isDisplayRotation = true;
var s = 1;
var eulerX = 0;
var eulerY = 0;
// var s = 1;
// var t = -100;
var translate = vec3.create();
// var t = -5;
var modelMatrix = mat4.create();
var mouseDown = false;
var mouseButtonId = 0;
var lastMouseY = 0;
var lastMouseX = 0;
var identityQ = quat.create();
window.onmousedown = function(event) {
    mouseDown = true;
    mouseButtonId = event.which;
    lastMouseY = event.clientY;
    lastMouseX = event.clientX;
    if (mouseButtonId === 1) {
        isDisplayRotation = false;
    }
};
window.onmouseup = function(event) {
    mouseDown = false;  
    isDisplayRotation = true;
};
window.onmousemove = function(event) {
    if(!mouseDown) {
        return;
    }
    var newY = event.clientY;
    var newX = event.clientX;
    
    var deltaY = newY - lastMouseY;
    var deltaX = newX - lastMouseX;
    
    // s *= (1 + deltaY / 1000);
    switch(mouseButtonId) {
        case 1:
        // left: rotation
    eulerX += -deltaY * 0.01;
        eulerY += deltaX * 0.01;
        break;
        case 3:
        // right
        translate[0] += deltaX * 0.001;
        translate[1] += -deltaY * 0.001;
        break;
    }
    
    
    lastMouseY = newY;
    lastMouseX = newX;
};
window.onwheel = function(event) {
    translate[2] += -event.deltaY * 0.001;
    // translate[2] *= 1 + (-event.deltaY * 0.01);
};
// -- Load glTF then render
//var gltfUrl = "../../sampleModels/" + modelInfo.path;
var gltfUrl = "../../" + modelInfo.category + "/" + modelInfo.path;

var glTFLoader = new MinimalGLTFLoader.glTFLoader(gl);
var glTFModelCount = 1;
var scenes = [];
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
gl.frontFace(gl.CCW);
var isFaceCulling = true;
glTFLoader.loadGLTF(gltfUrl, function(glTF) {

    var curGltfScene = glTF.scenes[glTF.defaultScene];

    // // draw multiple copies of the glTF scene
    // // to build a relative complex scene for octree and occlusion query test
    // var sceneRootTransforms = [mat4.create(), mat4.create()];
    // var sceneDeltaTranslate = vec3.fromValues(curGltfScene.boundingBox.transform[0] * 1.2, 0, 0);
    // mat4.fromTranslation(sceneRootTransforms[1], sceneDeltaTranslate);


    var sceneDeltaTranslate = vec3.fromValues(curGltfScene.boundingBox.transform[0] * 1.2, 0, 0);
    var tmpVec3Translate = vec3.create();
    for (i = 0, len = glTFModelCount; i < len; i++) {
        scenes.push(new Scene(curGltfScene, glTF));
        vec3.scale(tmpVec3Translate, sceneDeltaTranslate, i);
        mat4.fromTranslation(scenes[i].rootTransform, tmpVec3Translate);
    }
    
    // center
    s = 1.0 / Math.max( curGltfScene.boundingBox.transform[0], Math.max(curGltfScene.boundingBox.transform[5], curGltfScene.boundingBox.transform[10]) );
    mat4.getTranslation(translate, curGltfScene.boundingBox.transform);
    vec3.scale(translate, translate, -1);
    translate[0] += - 0.5 * curGltfScene.boundingBox.transform[0];
    translate[1] += - 0.5 * curGltfScene.boundingBox.transform[5];
    translate[2] += - 0.5 * curGltfScene.boundingBox.transform[10];

    s *= 0.5;
    modelMatrix[0] = s;
    modelMatrix[5] = s;
    modelMatrix[10] = s;
    mat4.translate(modelMatrix, modelMatrix, translate);
    vec3.set(translate, 0, 0, -1.5);
    s = 1;
    // -- Initialize vertex array
    var POSITION_LOCATION = 0; // set with GLSL layout qualifier
    var NORMAL_LOCATION = 1; // set with GLSL layout qualifier
    var TEXCOORD_0_LOCATION = 2; // set with GLSL layout qualifier
    var JOINTS_0_LOCATION = 3; // set with GLSL layout qualifier
    var JOINTS_1_LOCATION = 5; // set with GLSL layout qualifier
    var WEIGHTS_0_LOCATION = 4; // set with GLSL layout qualifier
    var WEIGHTS_1_LOCATION = 6; // set with GLSL layout qualifier

    // var vertexArrayMaps = {};
    // var vertexArrayMaps = [];
    // var in loop
    var mesh;
    var primitive;
    var vertexBuffer;
    var indexBuffer;
    var vertexArray;
    var nid, lenNodes;
    var mid, lenMeshes;
    var i, len;
    var attribute;
    var image, texture, sampler;
    var accessor, bufferView;
    var animation, animationSampler, channel;
    var skin;

    var curScene;   // runtime scene object (not gltf scene object)

    program = programBaseColor;
    // // animations typed array
    // for (i = 0, len = glTF.animations.length; i < len; i++) {
    //     animation = glTF.animations[i];
        
        
    // }
    
    


    // create buffers
    for (i = 0, len = glTF.bufferViews.length; i < len; i++) {
        bufferView = glTF.bufferViews[i];
        // bufferView.buffer = gl.createBuffer();
        // if (bufferView.target) {
        //     gl.bindBuffer(bufferView.target, bufferView.buffer);
        //     gl.bufferData(bufferView.target, bufferView.data, gl.STATIC_DRAW);
        //     gl.bindBuffer(bufferView.target, null);
        // }
        bufferView.createBuffer(gl);
        bufferView.bindData(gl);
    }
    
    
    // create textures
    if (this.glTF.textures) {
        for (i = 0, len = glTF.textures.length; i < len; i++) {
            texture = glTF.textures[i];
            // texture.texture = gl.createTexture();
            // gl.bindTexture(gl.TEXTURE_2D, texture.texture);
            // gl.texImage2D(
            //     gl.TEXTURE_2D,  // assumed
            //     0,        // Level of details
            //     gl.RGBA, // Format
            //     gl.RGBA,
            //     gl.UNSIGNED_BYTE, // Size of each channel
            //     texture.source
            // );
            texture.createTexture(i, gl);
        }
    }
    // create samplers
    if (this.glTF.samplers) {
        for (i = 0, len = glTF.samplers.length; i < len; i++) {
            sampler = glTF.samplers[i];
            
            sampler.createSampler(gl);
        }
    }
    if (glTF.skins) {
        // gl.useProgram(programSkinBaseColor.program);
        // gl.uniformBlockBinding(programSkinBaseColor.program, programSkinBaseColor.uniformBlockIndexJointMatrix, 0);
        // gl.useProgram(null);
        for (i = 0, len = glTF.skins.length; i < len; i++) {
            skin = glTF.skins[i];
            
            skin.jointMatrixUniformBuffer = gl.createBuffer();

            gl.bindBufferBase(gl.UNIFORM_BUFFER, i, skin.jointMatrixUniformBuffer);

            gl.bindBuffer(gl.UNIFORM_BUFFER, skin.jointMatrixUniformBuffer);
            gl.bufferData(gl.UNIFORM_BUFFER, skin.jointMatrixUnidormBufferData, gl.DYNAMIC_DRAW);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, skin.jointMatrixUnidormBufferData);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        }
    }
    function setupAttribuite(attrib, location) {
        if (attrib !== undefined) {
            var accessor = glTF.accessors[ attrib ];
            var bufferView = accessor.bufferView;
            if (bufferView.target === null) {
                // console.log('WARNING: the bufferview of this accessor should have a target, or it should represent non buffer data (like animation)');
                gl.bindBuffer(gl.ARRAY_BUFFER, bufferView.buffer);
                gl.bufferData(gl.ARRAY_BUFFER, bufferView.data, gl.STATIC_DRAW);
            } else {
                gl.bindBuffer(bufferView.target, bufferView.buffer);
            }
            accessor.prepareVertexAttrib(location, gl);
        }
    }
    // create vaos
    for (mid = 0, lenMeshes = glTF.meshes.length; mid < lenMeshes; mid++) {
        mesh = glTF.meshes[mid];
        // vertexArrayMaps[mid] = [];
        for (i = 0, len = mesh.primitives.length; i < len; ++i) {
            primitive = mesh.primitives[i];
            // WebGL2: create vertexArray
            primitive.vertexArray = vertexArray = gl.createVertexArray();
            gl.bindVertexArray(vertexArray);
            
            
            setupAttribuite(primitive.attributes.POSITION, POSITION_LOCATION);
            setupAttribuite(primitive.attributes.NORMAL, NORMAL_LOCATION);
            // @tmp, should consider together with material
            setupAttribuite(primitive.attributes.TEXCOORD_0, TEXCOORD_0_LOCATION);
                
            setupAttribuite(primitive.attributes.JOINTS_0, JOINTS_0_LOCATION);
            setupAttribuite(primitive.attributes.WEIGHTS_0, WEIGHTS_0_LOCATION);
            
            setupAttribuite(primitive.attributes.JOINTS_1, JOINTS_1_LOCATION);
            setupAttribuite(primitive.attributes.WEIGHTS_1, WEIGHTS_1_LOCATION);

            

            // indices ( assume use indices )
            if (primitive.indices !== null) {
            accessor = glTF.accessors[ primitive.indices ];
            bufferView = accessor.bufferView;
            if (bufferView.target === null) {
                    // console.log('WARNING: the bufferview of this accessor should have a target, or it should represent non buffer data (like animation)');
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferView.buffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferView.data, gl.STATIC_DRAW);
            } else {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferView.buffer);
            }
            }
            
            
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
        
    }
    
    // -- Render preparation
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    
    var scale = vec3.create();
    
    var r = 0.0;
    var rotationSpeedY= 0.01;
    // var rotationSpeedY= 0.0;
    var perspective = mat4.create();
    mat4.perspective(perspective, 0.785, canvas.width / canvas.height, 0.01, 100);
    var modelView = mat4.create();
    var localMV = mat4.create();
    var localMVP = mat4.create();
    var localMVNormal = mat4.create();
    var VP = mat4.create();
    var hasIndices = true;
    var hasSkin = false;
    var skinID;     // same for uniform block binding id

    // var nodeMatrix = new Array(glTF.nodes.length);
    // for(i = 0, len = nodeMatrix.length; i < len; i++) {
    //     nodeMatrix[i] = mat4.create();
    // }
    var defaultColor = [1.0, 1.0, 1.0, 1.0];
    var defaultMaterial = new MinimalGLTFLoader.Material({});

    var hasNormal = true;

    function drawPrimitive(primitive, matrix) {
        mat4.multiply(localMV, modelView, matrix);
        mat4.multiply(localMVP, perspective, localMV);
        // mat4.multiply(localMVP, VP, matrix);
        mat4.invert(localMVNormal, localMV);
        mat4.transpose(localMVNormal, localMVNormal);

        var material = primitive.material !== null ? primitive.material : defaultMaterial;

        if (material !== null) {
            if (material.doubleSided === isFaceCulling) {
                isFaceCulling = !material.doubleSided;
                if (isFaceCulling) {
                    gl.enable(gl.CULL_FACE);
                } else {
                    gl.disable(gl.CULL_FACE);
                }
            }
        }
        
        

        // @tmp: program choice
        // super ugly code
        var baseColor = defaultColor;

        if (primitive.attributes.NORMAL === undefined)
        {
            if (program != programPlain) {
                gl.useProgram(programPlain.program);
                program = programPlain;
                    }
            hasNormal = false;
        } else {
            hasNormal = true;

                // hasSkin = false;
            if (hasSkin) {
                if (material !== null) {

                    if (material.pbrMetallicRoughness !== null) {
                        

                        if ( material.pbrMetallicRoughness.baseColorTexture ) {

                            if (primitive.attributes.JOINTS_1 === undefined) {
                        if (program != programSkinBaseTexture) {
                            gl.useProgram(programSkinBaseTexture.program);
                            program = programSkinBaseTexture;
                        }
                            } else {
                                if (program != programSkinBaseTextureVec8) {
                                    gl.useProgram(programSkinBaseTextureVec8.program);
                                    program = programSkinBaseTextureVec8;
                                }
                            }

                            gl.uniform1i(program.uniformBaseColorTextureLocation, material.pbrMetallicRoughness.baseColorTexture.index);
                            gl.activeTexture(gl.TEXTURE0 + material.pbrMetallicRoughness.baseColorTexture.index);
                        // gl.activeTexture(gl.TEXTURE1);
                            texture = glTF.textures[ material.pbrMetallicRoughness.baseColorTexture.index ];
                        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
                        if (texture.sampler) {
                            sampler = texture.sampler.sampler;
                        } else {
                            sampler = defaultSampler;
                        }

                            gl.bindSampler(material.pbrMetallicRoughness.baseColorTexture.index, sampler);

                            if (material.pbrMetallicRoughness.baseColorFactor) {
                                baseColor = material.pbrMetallicRoughness.baseColorFactor;
                            }
                        } else if ( material.pbrMetallicRoughness.baseColorFactor ) {
                            baseColor = material.pbrMetallicRoughness.baseColorFactor;

                            if (primitive.attributes.JOINTS_1 === undefined) {
                                if (program != programSkinBaseColor) {
                                    gl.useProgram(programSkinBaseColor.program);
                                    program = programSkinBaseColor;
                                }
                            } else {
                                if (program != programSkinBaseColorVec8) {
                                    gl.useProgram(programSkinBaseColorVec8.program);
                                    program = programSkinBaseColorVec8;
                    }
                }
            }
                    }
                }

                gl.uniformBlockBinding(program.program, program.uniformBlockIndexJointMatrix, skinID);
        } else {

                if (material !== null) {
                    if (material.pbrMetallicRoughness !== null) {
                        if ( material.pbrMetallicRoughness.baseColorFactor ) {
                            baseColor = material.pbrMetallicRoughness.baseColorFactor;
                    if (program != programBaseColor) {
                        gl.useProgram(programBaseColor.program);
                        program = programBaseColor;
                    }
                }

                        if ( material.pbrMetallicRoughness.baseColorTexture ) {
                            if (material.normalTexture) {
                        if (program != programBaseTextureNormalMap) {
                            gl.useProgram(programBaseTextureNormalMap.program);
                            program = programBaseTextureNormalMap;
                        }

                                gl.uniform1i(program.uniformNormalTextureLocation, material.normalTexture.index);

                                gl.activeTexture(gl.TEXTURE0 + material.normalTexture.index);
                                texture = glTF.textures[ material.normalTexture.index ];
                        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
                        if (texture.sampler) {
                            sampler = texture.sampler.sampler;
                        } else {
                            sampler = defaultSampler;
                        }

                                gl.bindSampler(material.normalTexture.index, sampler);
                    } else {
                        if (program != programBaseTexture) {
                            gl.useProgram(programBaseTexture.program);
                            program = programBaseTexture;
                        }
                    }


                            gl.uniform1i(program.uniformBaseColorTextureLocation, material.pbrMetallicRoughness.baseColorTexture.index);
                            gl.activeTexture(gl.TEXTURE0 + material.pbrMetallicRoughness.baseColorTexture.index);
                    // gl.activeTexture(gl.TEXTURE1);
                            texture = glTF.textures[ material.pbrMetallicRoughness.baseColorTexture.index ];
                    gl.bindTexture(gl.TEXTURE_2D, texture.texture);
                    if (texture.sampler) {
                        sampler = texture.sampler.sampler;
                    } else {
                        sampler = defaultSampler;
                    }

                            gl.bindSampler(material.pbrMetallicRoughness.baseColorTexture.index, sampler);
                }
                
                        

            }
        }

            }
        }
        
        

        gl.uniform4fv(program.uniformBaseColorFactorLocation, baseColor);
        gl.uniformMatrix4fv(program.uniformMvpLocation, false, localMVP);
        if (hasNormal) {
        gl.uniformMatrix4fv(program.uniformMvNormalLocation, false, localMVNormal);
        }
        

        gl.bindVertexArray(primitive.vertexArray);
        // TODO: when no indices, do drawArrays
        if (primitive.indices !== null) {
        gl.drawElements(primitive.mode, primitive.indicesLength, primitive.indicesComponentType, primitive.indicesOffset);
        } else {
            gl.drawArrays(primitive.mode, primitive.drawArraysOffset, primitive.drawArraysCount);
        }

        gl.bindVertexArray(null);
    }
    // function drawMesh(mesh, matrix) {
    // }
    var tmpMat4 = mat4.create();
    var inverseTransformMat4 = mat4.create();
    var inverseSkeletonRootMat4 = null;
    
    // @todo: 
    // in a real engine, it is better to simply parse the node tree stucture
    // to compute transform matrices,
    // then sort node array by material and render use a for loop
    // to minimize context switch
    function drawNode(node, nodeID, nodeMatrix, parentModelMatrix) {
        var matrix = nodeMatrix[nodeID];
        
        if (parentModelMatrix !== undefined) {
            mat4.mul(matrix, parentModelMatrix, node.matrix);
        } else {
            // from scene root, parent is identity
            mat4.copy(matrix, node.matrix);
        }
        // mat4.mul(matrix, parentModelMatrix, node.matrix);
        hasSkin = false;
        if (node.skin !== null) {
            // mesh node with skin
            hasSkin = true;
            var skin = node.skin;
            skinID = skin.skinID;
            var joints = node.skin.joints;
            var jointNode;
            mat4.invert(inverseTransformMat4, matrix);
            // if (skin.skeleton !== null) {
            //     // if (curScene.inverseSkeletonRootMatrixReady[skin.skinID] === false) {
            //     //     curScene.inverseSkeletonRootMatrixReady[skin.skinID] = true;
            //     //     mat4.invert(curScene.inverseSkeletonRootMatrix[skin.skinID], nodeMatrix[skin.skeleton.nodeID]);
            //     // }
            //     // inverseSkeletonRootMat4 = curScene.inverseSkeletonRootMatrix[skin.skinID];

            //     mat4.mul(inverseTransformMat4, inverseTransformMat4, nodeMatrix[skin.skeleton.nodeID]);
            // }

            // @tmp: assume joint nodes are always in the front of the scene node list
            // so that their matrices are ready to use
            for (i = 0, len = joints.length; i < len; i++) {
                jointNode = joints[i];
                mat4.mul(tmpMat4, nodeMatrix[jointNode.nodeID], skin.inverseBindMatrix[i]);
                
                mat4.mul(tmpMat4, inverseTransformMat4, tmpMat4);

                // if (skin.skeleton !== null) {
                //     mat4.mul(tmpMat4, inverseSkeletonRootMat4, tmpMat4);
                // }

                skin.jointMatrixUnidormBufferData.set(tmpMat4, i * 16);
            }
            gl.bindBuffer(gl.UNIFORM_BUFFER, skin.jointMatrixUniformBuffer);
            // gl.bufferSubData(gl.UNIFORM_BUFFER, 0, skin.jointMatrixUnidormBufferData);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, skin.jointMatrixUnidormBufferData, 0, skin.jointMatrixUnidormBufferData.length);

            // if (program != programSkinBaseColor) {
            //     gl.useProgram(programSkinBaseColor.program);
            //     program = programSkinBaseColor;

            //     // @todo: uniform bind
            //     gl.uniformBlockBinding(program.program, program.uniformBlockIndexJointMatrix, 0);
            // }
            
        }
        var i, len;
        // draw cur node's mesh
        if (node.mesh !== null) {
            // drawMesh(glTF.meshes[node.mesh], matrix);
            // var mesh = glTF.meshes[node.mesh];
            var mesh = node.mesh;
            for (i = 0, len = mesh.primitives.length; i < len; i++) {
                // draw primitive
                drawPrimitive(mesh.primitives[i], matrix);
            }
            // BOUNDING_BOX.draw(mesh.boundingBox, matrix, modelView, perspective);
            // gl.useProgram(program);
        }
        
        if (node.skin !== null) {
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        }
        
        // draw children
        
        var childNodeID;
        for (i = 0, len = node.children.length; i < len; i++) {
            // childNodeID = node.children[i];
            // drawNode(glTF.nodes[childNodeID], childNodeID, matrix);
            drawNode(node.children[i], node.children[i].nodeID, nodeMatrix, matrix);
        }
    }
    function drawScene(scene) {
        // for (var i = 0, len = scene.nodes.length; i < len; i++) {
        //     drawNode( scene.nodes[i], scene.nodes[i].nodeID, rootTransform );
        // }
        for (var i = 0, len = scene.glTFScene.nodes.length; i < len; i++) {
            drawNode( scene.glTFScene.nodes[i], scene.glTFScene.nodes[i].nodeID, scene.nodeMatrix, scene.rootTransform );
        }
    }
    function drawSceneBBox(glTF, scene, bboxType) {
        var node, mesh, bbox;
        // @temp: assume all nodes are in cur scene
        // @potential fix: can label each node's scene at the setup
        for (i = 0, len = scene.nodeMatrix.length; i < len; i++) {
            node = glTF.nodes[i];
            if (bboxType == 'bvh') {
                // bvh
                mat4.mul(localMVP, scene.rootTransform, node.bvh.transform);
                mat4.mul(localMVP, VP, localMVP);
                gl.uniformMatrix4fv(BOUNDING_BOX.uniformMvpLocation, false, localMVP);
                gl.drawArrays(gl.LINES, 0, 24);
            }
            else if (node.mesh !== null) {
                // mesh = glTF.meshes[node.mesh];
                mesh = node.mesh;
                if (bboxType == 'aabb') {
                    // aabb
                    mat4.mul(localMVP, scene.rootTransform, node.aabb.transform);
                    mat4.mul(localMVP, VP, localMVP);
                } else {
                    // obb (assume object node is static)
                    mat4.mul(localMVP, scene.nodeMatrix[i], mesh.boundingBox.transform);
                    mat4.mul(localMVP, VP, localMVP);
                }
                gl.uniformMatrix4fv(BOUNDING_BOX.uniformMvpLocation, false, localMVP);
                    
                gl.drawArrays(gl.LINES, 0, 24);
            }   
        }
        // scene bounding box
        mat4.mul(localMVP, scene.rootTransform, scene.glTFScene.boundingBox.transform);
        mat4.mul(localMVP, VP, localMVP);
        gl.uniformMatrix4fv(BOUNDING_BOX.uniformMvpLocation, false, localMVP);
        gl.drawArrays(gl.LINES, 0, 24);
    }
    
    var timeParameter = 0;
    // -- Render loop
    (function render() {
        var i, len;
            var j, lenj;
            var node;
        // animation
        if (glTF.animations) {
            for (i = 0, len = glTF.animations.length; i < len; i++) {
                animation = glTF.animations[i];
                for (j = 0, lenj = animation.samplers.length; j < lenj; j++) {
                    animation.samplers[j].getValue(timeParameter);
                }
                for (j = 0, lenj = animation.channels.length; j < lenj; j++) {
                    channel = animation.channels[j];
                    animationSampler = channel.sampler;
                    node = glTF.nodes[channel.target.nodeID];
                    switch (channel.target.path) {
                        case 'rotation':
                        vec4.copy(node.rotation, animationSampler.curValue);
                        break;
                        case 'translation':
                        vec3.copy(node.translation, animationSampler.curValue);
                        break;
                        case 'scale':
                        vec3.copy(node.scale, animationSampler.curValue);
                        break;
                    }
                    // switch (channel.target.path) {
                    //     case 'rotation':
                    //     vec4.copy(node.rotation, animationSampler.curValue);
                    //     break;
                    //     case 'translation':
                    //     vec3.copy(node.translation, animationSampler.curValue);
                    //     break;
                    //     case 'scale':
                    //     vec3.copy(node.scale, animationSampler.curValue);
                    //     break;
                    // }
                    node.updateMatrixFromTRS();
                    
                }
            }
        }
        // // skins
        // if (glTF.skins) {
        //     var skin, joints, M;
        //     for (i = 0, len = glTF.skins.length; i < len; i++) {
        //         skin = glTF.skins[i];
        //         joints = skin.joints;
        //         for (j = 0, lenj = joints.length; j < lenj; j++) {
        //             M = skin.inverseBindMatrix[j];
        //         }
        //     }
        // }
        
        




        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        vec3.set(scale, s, s, s);
        // mat4.identity(modelView);
        // mat4.translate(modelView, modelView, translate);
        // mat4.scale(modelView, modelView, scale);
        // mat4.fromRotationTranslationScale(modelView, identityQ, translate, scale);
        // mat4.mul(modelView, modelView, modelMatrix);
        mat4.identity(modelView);
        mat4.translate(modelView, modelView, translate);
        if (isDisplayRotation) {
        r += rotationSpeedY;
        }
        
        
        mat4.rotateX(modelView, modelView, eulerX);
        mat4.rotateY(modelView, modelView, r);
        
        
        mat4.scale(modelView, modelView, scale);
        mat4.mul(modelView, modelView, modelMatrix);
        
        mat4.rotateY(modelView, modelView, eulerY); 
        
        
        mat4.mul(VP, perspective, modelView);
        gl.useProgram(program.program);
        for (i = 0, len = scenes.length; i < len; i++) {
            curScene = scenes[i];
            drawScene(scenes[i]);
        }

        if (drawBoundingBox) {
            gl.useProgram(BOUNDING_BOX.program);
            gl.bindVertexArray(BOUNDING_BOX.vertexArray);
            for (i = 0, len = scenes.length; i < len; i++) {
                drawSceneBBox(glTF, scenes[i], boundingBoxType);
            }
            gl.bindVertexArray(null);
            gl.useProgram(program.program);
        }
        requestAnimationFrame(render);
        timeParameter += 0.01;
    })();
});