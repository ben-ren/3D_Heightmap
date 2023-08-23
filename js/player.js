"use strict"

class Player {
	constructor(gl, lvl) {
        this.position = [0,0,0];
        this.rotation = [0,0,0];
        this.scale = [1,1,1];
        this.matrix = glMatrix.mat4.create();
		this.normalMatrix = glMatrix.mat3.create();
		this.speed = 1;

        let tris = [
            //base
			1, 0, 1,
			1, 0, -1,
			-1, 0, 1,
			
			-1, 0, -1,
			-1, 0, 1,
			1, 0, -1,
			
			//x-right
			1, 0, 1,
			-1, 0, 1,
			-1, 1, 1,
			
			1, 0, 1,
			-1, 1, 1,
			1, 1, 1,
			
			//x-left
			-1, 0, -1,
			1, 0, -1,
			-1, 1, -1,
			
			1, 0, -1,
			1, 1, -1,
			-1, 1, -1,
			
			//z-right
			1, 0, -1,
			1, 0, 1,
			1, 1, -1,
			
			1, 0, 1,
			1, 1, 1,
			1, 1, -1,
			
			//z-left
			-1, 0, 1,
			-1, 0, -1,
			-1, 1, 1,
			
			-1, 0, -1,
			-1, 1, -1,
			-1, 1, 1,
			
			//top
			1, 1, 1,
			-1, 1, 1,
			1, 1, -1,
			
			-1, 1, -1,
			1, 1, -1,
			-1, 1, 1, 
        ];
		
		let colours = [];
		
		this.nPoints = tris.length / 3;
		
		for(var i=0; i<this.nPoints; i++){
			colours.push(1,0,0,1);
		}
		
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tris), gl.STATIC_DRAW);
		
		this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tris), gl.STATIC_DRAW);
       
		this.colourBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);
		
		//player instantiation orientation
		var startX = lvl.player.position[0];
		var startZ = lvl.player.position[1];
		var startY = startX + lvl.heightmap.width * startZ;
		this.position = [startX, lvl.heightmap.height[startY], startZ];
		var headMath = Math.atan(lvl.player.heading[1]/lvl.player.heading[0]);
		this.rotation[1] = headMath;
    }

	update(deltaTime, level){
		check(isNumber(deltaTime));
		
		//player control logic
		if (Input.spinLeft) {
			this.rotation[1] += (this.speed * Math.PI)/180;
		}
		if (Input.spinRight) {
			this.rotation[1] -= (this.speed * Math.PI)/180;
		}
		if (Input.moveForward) {
			this.position[0] += 0.05 * Math.sin(this.rotation[1]);
			this.position[2] += 0.05 * Math.cos(this.rotation[1]);
		}
		if (Input.moveBack) {
			this.position[0] -= 0.05 * Math.sin(this.rotation[1]);
			this.position[2] -= 0.05 * Math.cos(this.rotation[1]);
		}
		
		//level bounds logic
		if(this.position[0]<0){
			this.position[0] = 0;
		}
		if(this.position[2]<0){
			this.position[2] = 0;
		}
		if(this.position[0]>level.heightmap.width-1){
			this.position[0] = level.heightmap.width-1;
		}
		if(this.position[2]>level.heightmap.depth-1){
			this.position[2] = level.heightmap.depth-1;
		}
		
		//heightmap calculation logic
		var x = Math.round(this.position[0]);
		var z = Math.round(this.position[2]);
		var y = 0;
		if(x>0 && z>0 && x<level.heightmap.width && z<level.heightmap.depth){
			y = (x+level.heightmap.width*z);
		}else{
			y = 0;
		}
		this.position[1] = level.heightmap.height[y];
	}

    render(gl, shader, texture) {
        // set the world matrix
        glMatrix.mat4.identity(this.matrix);
        glMatrix.mat4.translate(this.matrix, this.matrix, this.position);
        glMatrix.mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);  // heading
        glMatrix.mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);  // pitch
        glMatrix.mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]);  // roll
        glMatrix.mat4.scale(this.matrix, this.matrix, this.scale);
        gl.uniformMatrix4fv(shader["u_worldMatrix"], false, this.matrix);
		
		glMatrix.mat3.normalFromMat4(this.normalMatrix, this.matrix);
		gl.uniformMatrix3fv(shader["u_normalMatrix"], false, this.normalMatrix);

        // draw it
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer);
        gl.vertexAttribPointer(shader["a_colour"], 4, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(shader["a_normal"], 3, gl.FLOAT, false, 0, 0);
		
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shader["a_position"], 3, gl.FLOAT, false, 0, 0);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture.texture);
		gl.uniform1i(shader["u_texture"], 0);
		
        gl.drawArrays(gl.TRIANGLES, 0, this.nPoints);   
    }
}

class Empty {
	constructor(gl) {
        this.position = [0,0,0];
        this.rotation = [0,0,0];
        this.scale = [1,1,1];
        this.matrix = glMatrix.mat4.create();
    }
	
	update(deltaTime, player, camY, offset){
		//this.z = player.x + cos(player.rot) 
		this.position[0] = player.position[0] + Math.sin(player.rotation[1]) * offset;
		this.position[2] = player.position[2] + Math.cos(player.rotation[1]) * offset;
		this.position[1] = player.position[1] + camY;
	}
	
	render(gl, shader){
		// set the world matrix
        glMatrix.mat4.identity(this.matrix);
        glMatrix.mat4.translate(this.matrix, this.matrix, this.position);
        glMatrix.mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);  // heading
        glMatrix.mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);  // pitch
        glMatrix.mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]);  // roll
        glMatrix.mat4.scale(this.matrix, this.matrix, this.scale);
        gl.uniformMatrix4fv(shader["u_worldMatrix"], false, this.matrix);
	}
}