"use strict";
/*	Name:	Benjamin rendell
	Number:	44655010 */

const vertexShaderSource = `
attribute vec4 a_position;
attribute vec4 a_colour;
attribute vec3 a_normal;
attribute vec2 a_uv;

varying vec4 v_colour;
varying vec3 v_normal;
varying vec2 v_texcoords;

uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;

void main() {
	v_colour = a_colour;
	v_texcoords = a_uv;
	v_normal = u_normalMatrix * a_normal;
	
    // convert to world coordiantes
    vec4 position = u_worldMatrix * a_position;

    // convert to camera coordiantes
    position = u_viewMatrix * position;

    // convert to NDC
    position = u_projectionMatrix * position;

    gl_Position = position;

	//implement per vertex z-buffering
	gl_Position.z = gl_Position.z / gl_Position.w;			//code modified from: https://stackoverflow.com/questions/43564246/how-does-webgl-set-values-in-the-depth-buffer
}
`;

const fragmentShaderSource = `
precision mediump float;
//uniform vec4 u_colour;
varying vec4 v_colour;
varying vec3 v_normal;
varying vec2 v_texcoords;

uniform sampler2D u_texture;

uniform vec3 u_ambient;
uniform vec3 u_reflection;

uniform vec3 u_intensity;
uniform vec3 u_source;

void main() {
	vec3 normal = normalize(v_normal);
	vec3 source = normalize(u_source);
	
	vec3 diffuse = u_intensity * u_reflection * max(0.0, dot(normal, source));
	
    // set colours & textures
	//gl_FragColor = v_colour + vec4(u_ambient+diffuse, 1) + texture2D(u_texture, vec2(0.0)); 
	gl_FragColor = v_colour + vec4(u_ambient+diffuse, 1) + texture2D(u_texture, v_texcoords);
}
`;

function createShader(gl, type, source) {		//!Shader code obtained from week 10 Practicals!
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {		//!Program code obtained from week 10 Practicals!
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function resize(canvas) {										//!Resize code obtained from week 10 Practicals!
    const resolution = window.devicePixelRatio || 1.0;

    const displayWidth = Math.floor(canvas.clientWidth * resolution);
    const displayHeight = Math.floor(canvas.clientHeight * resolution);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        return true;
    }
    else {
        return false;
    }    
}


function run(level) {
    // Get the canvas element & gl rendering context				!Initial code modified from week 10 Practicals!
    const canvas = document.getElementById("c");
    const gl = canvas.getContext("webgl");
    if (gl === null) {
        window.alert("WebGL not supported!");
        return;
    }
	
    // Compile the shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program =  createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Initialise the shader attributes & uniforms
    const shader = {
        program: program
    };

    const nAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < nAttributes; i++) {
        const name = gl.getActiveAttrib(program, i).name;
        shader[name] = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(shader[name]);
    }

    const nUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nUniforms; i++) {
        const name = gl.getActiveUniform(program, i).name;
        shader[name] = gl.getUniformLocation(program, name);
    }
    
    // Initialise the shaders
	gl.uniform3fv(shader["u_ambient"], new Float32Array([0.3, 0.3, 0.3]));				//bounced light
	gl.uniform3fv(shader["u_reflection"], new Float32Array([0.1, 0.1, 0.1]));					//object colour
	gl.uniform3fv(shader["u_intensity"], new Float32Array([1, 1, 1]));			//light colour/strength
	gl.uniform3fv(shader["u_source"], new Float32Array([-1, 5, 0]));						//light position
	
    // Construct the objects
	const grass = new Texture(gl, "textures/grass-lush.png");
	const blank = new Texture(gl, "");

	let grid = new Grid(gl, 20);
    grid.scale = [10,10,10];
	grid.position = [0, -0.004, 0];		//fix z-fighting
	
	let terrain = new Terrain(gl, level);
	
	let player = new Player(gl, level);
	player.scale = [0.2, 0.4, 0.2];
	
	let pines = [];
	for(var i=0; i<level.trees.length; i++){
		pines.push(new Tree(gl));
	}
	
	let empty = new Empty(gl);
	
	for(var j=0; j<pines.length; j++){
		var x = level.trees[j][0]
		var z = level.trees[j][1]
		var y = x+level.heightmap.width*z;		//var y = x+lvl.heightmap.width*z: calculates a 2D array position from a 1D array.
		pines[j].position = [x, level.heightmap.height[y], z];
	}
	
	// === Per Frame Operations				!Initial code obtained from week 10 Practicals!
    // animation loop
    let oldTime = 0;
    let animate = function(time) {
        time = time / 1000;
        let deltaTime = time - oldTime;
        oldTime = time;
        resize(canvas);
        update(deltaTime);
        render();

        requestAnimationFrame(animate);
    };
	
	let cameraDist = 0.0;			//camera z value
    let cameraAngle = 0;			//Radians
    let cameraHeight = 1;			//camera y value
    let cameraPos = [0, 0, 0];		//empty array for camera position variables
	let emptyOffset = 2;			//moves empty object, increasing zoom distance. This value must be greater than or equal to 1.
    // update objects in the scene
    let update = function(deltaTime) {
		//sets camera rotation to follow player
		cameraAngle = player.rotation[1];
		//sets camera position to follow player
        cameraPos = [player.position[0] + cameraDist * Math.sin(cameraAngle), player.position[1] + cameraHeight * Math.cos(0), player.position[2] + cameraDist * Math.cos(cameraAngle)];
		//update object render
		player.update(deltaTime, level);
		empty.update(deltaTime, player, cameraHeight, emptyOffset);
		if(Input.mouseWheelUp && cameraDist < (0.8*emptyOffset)){
			cameraDist += 0.3;
			Input.mouseWheelUp = false;
		}else if(Input.mouseWheelDown && cameraDist > 0.1){
			cameraDist -= 0.3;
			Input.mouseWheelDown = false;
		}
    };

    // create the matrices once, to avoid garbage collection
    const projectionMatrix = glMatrix.mat4.create();
    const viewMatrix = glMatrix.mat4.create();

    // redraw the scene
    let render = function() {
        // clear the screen
        gl.viewport(0, 0, canvas.width, canvas.height);        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.FRONT);
		gl.enable(gl.DEPTH_TEST);
		
        // calculate the projection matrix		!code obtained from week 10 Practical!
        {
            const aspect = canvas.width / canvas.height;
            const fovy = glMatrix.glMatrix.toRadian(60);
            const near = 0.1;
            const far = 0;

            glMatrix.mat4.perspective(projectionMatrix, fovy, aspect, near, far);
            gl.uniformMatrix4fv(shader["u_projectionMatrix"], false, projectionMatrix);
        }
		
        // calculate the view matrix		!code modified from week 10 Practical!
        {
            const eye = cameraPos;
            const center = empty.position;
            const up = [0, 1, 0];

            glMatrix.mat4.lookAt(viewMatrix, eye, center, up);
            gl.uniformMatrix4fv(shader["u_viewMatrix"], false, viewMatrix);
        }

		// render the grid
        grid.render(gl, shader, blank);

		//render the objects
		terrain.render(gl, shader, grass);
		player.render(gl, shader, blank);
		
		for (var i=0; i<pines.length; i++) {
			pines[i].render(gl, shader, blank);
        }
    };
    
    // start it going
    animate(0);
}

/**
 * Load the selected level file and run it.
 * @param {*} e 
 */
function onFileSelect(e) {
    let files = e.target.files; 

    if (files.length > 0) {
        let reader = new FileReader();

        reader.onload = function(e) {
            let level = JSON.parse(e.target.result);
            run(level);
        };
        
        reader.readAsText(files[0]);
    }
}

function main() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        document.getElementById('files').addEventListener('change', onFileSelect, false);
    } else {
        alert('The File APIs are not fully supported in this browser.');
        return;
    }

}
