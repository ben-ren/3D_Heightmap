"use strict";

//!Initial code obtained from week 10 Practicals!

class Grid {

    constructor(gl, nSlices) {
        this.position = [0,0,0];
        this.rotation = [0,0,0];
        this.scale = [1,1,1];
        this.colour = [0.5, 0.5, 0.5, 0.5];    // grey
        this.matrix = glMatrix.mat4.create();
		this.normalMatrix = glMatrix.mat3.create();

        let lines = [];
		
		let colours = [];

        for (let i = 0; i <= nSlices; i++) {
            let d = i / nSlices - 0.5;

            // line in the z direction
            lines.push(d, 0, -0.5);
            lines.push(d, 0, 0.5);

            // line in the x direction 
            lines.push(-0.5, 0, d);
            lines.push(0.5, 0, d);
			
			colours.push(1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1);
        }

        this.nPoints = lines.length / 3;
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);   

		this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
		
		this.colourBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);		
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
		
        // set the colour
        gl.uniform4fv(shader["u_colour"], new Float32Array(this.colour));

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
		
        gl.drawArrays(gl.LINES, 0, this.nPoints);   

    }
}