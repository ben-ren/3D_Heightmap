"use strict"

class Terrain {
	constructor(gl, lvl) {
        this.position = [0,0,0];
        this.rotation = [0,0,0];
        this.scale = [1,1,1];
        this.matrix = glMatrix.mat4.create();
		this.normalMatrix = glMatrix.mat3.create();
		
		let tris = [];
		let uvs = [];
		/*  1, 0, 0,	square from 2 triangles
			0, 0, 1,
			0, 0, 0,
			
			1, 0, 0,
			1, 0, 1,
			0, 0, 1,

			o-----o		Z
			| \ b |		|
			| a \ |		+--X
			o-----o
		*/
		
		//nested loop to implement vertices for depth by width
		for(var z=0; z<lvl.heightmap.depth-1; z++){	
			for(var x=0; x<lvl.heightmap.width-1; x++){
				var y = x+lvl.heightmap.width*z;				//x+width*z: calculates a 2D array position from a 1D array.
				//square from triangles
				tris.push(
					//a
					x+1, lvl.heightmap.height[y+1], z+0,						//y+1
					x+0, lvl.heightmap.height[y+lvl.heightmap.width], z+1,		//y+width
					x+0, lvl.heightmap.height[y], z+0,							//y
					//b
					x+1, lvl.heightmap.height[y+1], z+0,						//y+1
					x+1, lvl.heightmap.height[y+lvl.heightmap.width+1], z+1,	//y+width+1
					x+0, lvl.heightmap.height[y+lvl.heightmap.width], z+1,		//y+width
				);
				uvs.push(
					//a
					1, 0,
					0, 1,
					0, 0,
					//b
					1, 0,
					1, 1,
					0, 1
				);
			}
		}

        this.nPoints = tris.length / 3;
		
		let colours = [];
		for(var i=0; i<this.nPoints; i++){
			colours.push(0.1,0.1,0.1, 1);		// light-grey
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
		
		this.uvBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
	}
	
	render(gl, shader, texture) {
		// set the world matrix
		glMatrix.mat4.identity(this.matrix);
		glMatrix.mat4.translate(this.matrix, this.matrix, this.position);
		glMatrix.mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);		// heading
		glMatrix.mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);		// pitch
		glMatrix.mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]);		// roll
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
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.vertexAttribPointer(shader["a_uv"], 2, gl.FLOAT, false, 0, 0);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture.texture);
		gl.uniform1i(shader["u_texture"], 0);
		
		gl.drawArrays(gl.TRIANGLES, 0, this.nPoints);
    }
}