"use strict";

/*	Name:	Benjamin rendell
	Number:	44655010 */

const InputClass = function() {			//!code modified from comp330_assignment_1 input.js file!
    const input = this;

    input.spinLeft = false;
    input.spinRight = false;
    input.moveForward = false;
    input.moveBack = false;
	input.mouseWheelUp = false;
	input.mouseWheelDown = false;

	//checks for key press down
    input.onKeyDown = function(event) {
        switch (event.key) {
            case "ArrowLeft": 
			case 'a': 
                input.spinLeft = true;
                break;

            case "ArrowRight": 
			case "d": 
                input.spinRight = true;
                break;

            case "ArrowDown":
			case "s": 
                input.moveBack = true;
                break;

            case "ArrowUp":
			case "w": 
                input.moveForward = true;
                break;
        }
    }

	//checks for when key goes up
    input.onKeyUp = function(event) {
        switch (event.key) {
            case "ArrowLeft": 
			case "a": 
                input.spinLeft = false;
                break;

            case "ArrowRight": 
			case "d": 
                input.spinRight = false;
                break;

            case "ArrowDown":
			case "s": 
                input.moveBack = false;
                break;

            case "ArrowUp":
			case "w": 
                input.moveForward = false;
                break;
        }
    }
	
	/*check for mousewheel 
	https://stackoverflow.com/questions/33921445/get-direction-for-mousewheel-jquery-event-handler
	https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onwheel	
	*/
	input.onwheel = function(event){
		//detect mousewheel direction
		if(event.wheelDelta > 0 || event.detail < 0){		//scroll up
			input.mouseWheelUp = true;
			input.mouseWheelDown = false;
		}else if(event.wheelDelta > 0 || event.detail > 0){		//scroll down
			input.mouseWheelUp = false;
			input.mouseWheelDown = true;
		}		
	}

    document.addEventListener("keydown", input.onKeyDown);
    document.addEventListener("keyup", input.onKeyUp);
	document.addEventListener("DOMMouseScroll", input.onwheel);
}

// global inputManager variable
const Input = new InputClass();