console.log("app.js loaded");


//These all have to be global
const canvas = document.getElementById('main-canvas');
console.log(canvas) // cool now we have the canvas
let windowloaded = false;

// the "context" is what you actually draw on -- you basically always need it
const ctx = canvas.getContext('2d');
console.log(ctx); // cool, our rendering context is set up

//Apply scaling factor
const scaleX = 2.5;
const scaleY = 3;
applyScalingFactor();

//Done setting up canvas!

//Some more global variables:
const framerate = 30;

//Scrolling variables
//These are relative to the top left corner of the canvas (0, 0)
//These must be added to any relative coordinates for drawing
//For example, if sx = -50, everything will be drawn 50 pixels further to the left
const sx = 0;
const sy = 0;

//Keyhandler var:
const keys = [];

class Player
{
	//NOTE: The canvas needs to already have been created
	//in order for this class to work properly!
	constructor(n, x, y, ns)
	{
		//Name:
		this.name = n;
		//x and y starting position:
		this.x = x;
		this.y = y;

		this.numsprites = ns;
		this.frame = 0;

		//Get image data:
		this.sprites = [];
		let imgData = ctx.getImageData(0, 0, 1, 1); //create an empty imgData object
		let imgid = document.getElementById("plr-img-01") //for now



		for (let i = 0; i < 1; i++)
		{
			//Needed because otherwise getImageData complains about security issues:
			imgid.setAttribute('crossOrigin', 'Anonymous');
			console.log(imgid.height, imgid.width);
			ctx.drawImage(imgid, 0, 0, imgid.width, imgid.height);

			//Handle transparent color:
			imgData = ctx.getImageData(0, 0, imgid.width*scaleX, imgid.height*scaleY);
			for (let j = 0; j < imgData.data.length; j+=4)
			{
				//console.log(imgData[j], imgData[j + 1], imgData[j + 2]);
				//console.log("test");
				if (imgData.data[j] == 192 && imgData.data[j + 1] == 220 && imgData.data[j + 2] == 192)
				{
					//We've found a transparent color so set alpha channel to max:
					imgData.data[j + 3] = 0;
					//console.log("Transparent color found");
				}
			}
			console.log(`${this.name}: Replaced transparent color index with alpha=0`);
			//Put image back on screen with transparent color enabled:
			ctx.putImageData(imgData, 0, 0);


			imgData = ctx.getImageData(0, 0, imgid.width*scaleX, imgid.height*scaleY);
			clearCanvas();
			this.sprites[i] = imgData;
		}
	}

	drawSprite(s, x, y)
	{
		//s is the number of the sprite to draw (starting at 0)
		//x, y is the position to draw at (in pixels, relative, so we must add sx, sy)
		ctx.putImageData(this.sprites[s], (x*scaleX) + sx, (y*scaleY) + sy);
	}

	handleInput()
	{
		if (keys["ArrowLeft"])
		{
			this.x = this.x - 2;
		}
		if (keys["ArrowRight"])
		{
			this.x = this.x + 2;
		}
	}

	draw()
	{
		this.drawSprite(0, this.x, this.y);
	}
}


class Tiles
{
	//This is the tiles class. It should be used to create a layer of tiles;
	//that is, background, midground foreground, etc.
	//It should work universally for any tile layer.
	constructor (n)
	{
		//These coordinates are absolute:
		this.name = n;
		this.x = 0;
		this.y = 0;

		//Get tile image into memory

		let imgData = ctx.getImageData(0, 0, 1, 1); //create an empty imgData object
		let imgid = document.getElementById("til-img") //for now
		imgid.setAttribute('crossOrigin', 'Anonymous');
		ctx.drawImage(imgid, 0, 0, imgid.width, imgid.height);
		
		//Handle transparent color:
		imgData = ctx.getImageData(0, 0, 320*scaleX, 200*scaleY)
		for (let j = 0; j < imgData.data.length; j+=4)
		{
			//console.log(imgData[j], imgData[j + 1], imgData[j + 2]);
			//console.log("test");
			if (imgData.data[j] == 192 && imgData.data[j + 1] == 220 && imgData.data[j + 2] == 192)
			{
				//We've found a transparent color so set alpha channel to max:
				imgData.data[j + 3] = 0;
				//console.log("Transparent color found");
			}
		}
		console.log(`${this.name}: Replaced transparent color index with alpha=0`);
		//Put image back on screen with transparent color enabled:
		ctx.putImageData(imgData, 0, 0);

		//these will be the coordinates of the section of the til-img to copy from
		let tempx = 0;
		let tempy = 0;
		this.tiles = [];
		for (let i = 0; i < 240; i++)
		{
			tempy = 16*(Math.floor(i/20));
			tempx = 16 * (i - ((tempy/16)*20));
			//console.log(i, tempx, tempy);
			imgData = ctx.getImageData(tempx*scaleX, tempy*scaleY, 16*scaleX, 16*scaleY);



			this.tiles[i] = imgData;
		}
		clearCanvas();
	}

	drawTile(t, x, y)
	{
		//t is the tile to draw (an arbitrary integer)
		//x, y are the coordinates (relative, so must add sx, sy)
		//This function must take the variable t and
		//perform an operation on it to extract the coordinates
		//in the tile image of the tile we're trying to get
		ctx.putImageData(this.tiles[t], x*scaleX, y*scaleY);
	}
}

function clearCanvas()
{
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function startKeyHandler()
{
	$('html').keydown(function(event)
	{
		keys[event.key] = true;
	});
	$('html').keyup(function(event)
	{
		keys[event.key] = false;
	});
}

function handleKeyEvents()
{
	player1.handleInput();
}

function drawAll()
{
	clearCanvas();
	player1.draw();
	backtiles.drawTile(0, 0, 144);
	backtiles.drawTile(1, 16, 144);
	backtiles.drawTile(2, 32, 144);
	backtiles.drawTile(3, 48, 144);
	backtiles.drawTile(4, 64, 144);

	backtiles.drawTile(20, 0, 160);
	backtiles.drawTile(21, 16, 160);
	backtiles.drawTile(22, 32, 160);
	backtiles.drawTile(23, 48, 160);
	backtiles.drawTile(24, 64, 160);

	backtiles.drawTile(60, 0, 176);
	backtiles.drawTile(61, 16, 176);
	backtiles.drawTile(62, 32, 176);
	backtiles.drawTile(63, 48, 176);
	backtiles.drawTile(64, 64, 176);

}

function applyScalingFactor()
{
	ctx.scale(scaleX, scaleY);
	ctx.imageSmoothingEnabled = false;
}

window.onload = function()
{
	windowloaded = true;
}

function isLoaded()
{
  return document.readyState == "complete";
}

setInterval(function()
{
	handleKeyEvents();
	drawAll();
}, 1000/framerate);


//while (!isLoaded()) {}

const player1 = new Player("Player 1", 0, 0, 1);
const backtiles = new Tiles("Background tiles");
//applyScalingFactor();
startKeyHandler();
//applyScalingFactor();
//ctx.scale(scaleX, scaleY);
//ctx.imageSmoothingEnabled = false;
//player1.drawSprite(0, 50, 50);




