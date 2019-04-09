console.log("app.js loaded test");


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
//applyScalingFactor();
ctx.imageSmoothingEnabled = false;

//Done setting up canvas!

//Some more global variables:
const framerate = 30;
let counter = 1; //This counter will go from 1 to 12 and then reset, for easy factors

//Scrolling variables
//These are relative to the top left corner of the canvas (0, 0)
//These must be added to any relative coordinates for drawing
//For example, if sx = -50, everything will be drawn 50 pixels further to the left
let sx = 0;
let sy = 0;

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
		this.width = 24;
		this.height = 32;

		//Physics vars:
		this.gravity = 1;
		this.termvel = 8;
		this.walkspeed = 4;
		this.jumpspeed = -12;
		this.yv = 0;
		this.ya = 0;
		this.dir = 1; //Default direction: right

		this.numsprites = ns;
		this.frame = 0;

		//Get image data:
		this.sprites = [];
		let imgData = ctx.getImageData(0, 0, 1, 1); //create an empty imgData object
		let imgid = undefined;   //document.getElementById("plr-img-01") //for now



		for (let i = 0; i < 4; i++)
		{
			//Needed because otherwise getImageData complains about security issues:
			imgid = document.getElementById(`plr-img-0${i+1}`);
			imgid.setAttribute('crossOrigin', 'Anonymous');
			console.log(imgid.height, imgid.width);
			ctx.drawImage(imgid, 0, 0, imgid.width*scaleX, imgid.height*scaleY);

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
			//ctx.putImageData(imgData, 0, 0);


			//imgData = ctx.getImageData(0, 0, imgid.width*scaleX, imgid.height*scaleY);
			clearCanvas();
			this.sprites[i] = imgData;
		}
	}

	drawSprite(s, x, y)
	{
		//s is the number of the sprite to draw (starting at 0)
		//x, y is the position to draw at (in pixels, relative, so we must add sx, sy)
		
		//Create an intermediary canvas to draw our sprite on so transparency works:
		const overlayCanvas = document.createElement("canvas");
		overlayCanvas.width = this.width*scaleX;
		overlayCanvas.height = this.height*scaleY;
		overlayCanvas.getContext("2d").putImageData(this.sprites[s], 0, 0);
		ctx.drawImage(overlayCanvas, (x + sx)*scaleX, (y + sy)*scaleY);
		//ctx.putImageData(this.sprites[s], (x*scaleX) + sx, (y*scaleY) + sy);
	}

	handleInput()
	{
		if (keys["ArrowLeft"])
		{
			this.x = this.x - this.walkspeed;
			this.dir = -1;
			this.animateWalk();
		}
		if (keys["ArrowRight"])
		{
			this.x = this.x + this.walkspeed;
			this.dir = 1;
			this.animateWalk();
		}
		if (keys["Control"] && this.allowjump)
		{
			this.jump();
		}
	}

	draw()
	{
		this.drawSprite(this.frame, this.x, this.y);
	}

	increment()
	{
		this.ya = this.gravity;
		this.yv = this.yv + this.ya;
		if (this.yv > this.termvel) {this.yv = this.termvel;}
		this.y = this.y + this.yv;
	}

	animateWalk()
	{
		if (!!(counter % 3)) {return false;}
		if (this.dir == 1)
		{
			if (this.frame == 0) {this.frame = 2;}
			else if (this.frame == 2) {this.frame = 0;}
			else {this.frame = 0;}
		}
		if (this.dir == -1)
		{
			if (this.frame == 1) {this.frame = 3;}
			else if (this.frame == 3) {this.frame = 1;}
			else {this.frame = 1;}
		}
	}

	jump()
	{
		this.yv = this.jumpspeed;
		this.increment();
		this.allowjump = false;
		//console.log("JUMP");
	}
}

class Tile
{
	constructor(d, t)
	{
		this.data = d;
		this.type = t;
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
		
		ctx.drawImage(imgid, 0, 0, imgid.width*scaleX, imgid.height*scaleY);
		

		//console.log(`${this.name}: Replaced transparent color index with alpha=0`);
		//Put image back on screen with transparent color enabled:
		//ctx.putImageData(imgData, 0, 0);

		//these will be the coordinates of the section of the til-img to copy from
		let tempx = 0;
		let tempy = 0;
		let numtr = 0; //counter for number of transparent tiles replaced
		// let blanktile = {
		// 	data: undefined,
		// 	type: undefined,
		// };
		this.tiles = [];
		for (let i = 0; i < 240; i++)
		{
			tempy = 16*(Math.floor(i/20));
			tempx = 16 * (i - ((tempy/16)*20));
			//console.log(i, tempx, tempy);
			imgData = ctx.getImageData(tempx*scaleX, tempy*scaleY, 16*scaleX, 16*scaleY);

			//Handle transparent color:
			//imgData = ctx.getImageData(0, 0, 320*scaleX, 200*scaleY)
			for (let j = 0; j < imgData.data.length; j+=4)
			{
				//console.log(imgData[j], imgData[j + 1], imgData[j + 2]);
				//console.log("test");
				if (imgData.data[j] == 192 && imgData.data[j + 1] == 220 && imgData.data[j + 2] == 192)
				{
					//We've found a transparent color so set alpha channel to max:
					//imgData.data[j] = 0;
					//imgData.data[j + 1] = 0;
					//imgData.data[j + 2] = 0;
					imgData.data[j + 3] = 0;
					//console.log("Transparent color found");
					numtr++;
				}
			}
			//blanktile.data = imgData;
			//blanktile.type = 0;
			this.tiles[i] = new Tile(imgData, 0);
			if (i > 20 && i < 30) {this.tiles[i].type = 1;}
			//this.tiles[i].data = imgData;
			//this.tiles[i].type = 0;
		}

		if (numtr > 0)
		{
			console.log(`${this.name}: Replaced transparent color index with alpha=0 for ${numtr} pixels`);
		}
		clearCanvas();
	}

	drawTile(t, x, y)
	{
		//t is the tile to draw (an arbitrary integer, indexed from 0)
		//x, y are the coordinates (relative, so must add sx, sy)
		//This function must take the variable t and
		//perform an operation on it to extract the coordinates
		//in the tile image of the tile we're trying to get
		
		t = t - 1;
		if (t < 0) {return false;}

		//Create an intermediary canvas to draw our tile on so transparency works:
		const overlayCanvas = document.createElement("canvas");
		overlayCanvas.width = 16*scaleX;
		overlayCanvas.height = 16*scaleY;
		overlayCanvas.getContext("2d").putImageData(this.tiles[t].data, 0, 0);
		ctx.drawImage(overlayCanvas, (x + sx)*scaleX, (y + sy)*scaleY);

		return true;
		//ctx.putImageData(this.tiles[t], x*scaleX, y*scaleY);
	}
}


class Level
{
	constructor()
	{
		//level class
		//contains the level map and draws the tiles

		this.player1 = new Player("Player 1", 0, 0, 1);
		this.backtiles = new Tiles("Background tiles");
		
		startKeyHandler();
		
		const itself = this;

		//Set up everything that needs to happen every frame:
		setInterval(function()
		{
			itself.handleKeyEvents();
			itself.drawAll();
			itself.incrementAll();
		}, 1000/framerate);

		this.getLevelData();




		//Get background image (no transparent colors here!!!):
		let imgData = ctx.getImageData(0, 0, 1, 1); //create an empty imgData object
		let imgid = document.getElementById("bac-img-01") //for now
		imgid.setAttribute('crossOrigin', 'Anonymous');
		ctx.drawImage(imgid, 0, 0, imgid.width*scaleX, imgid.height*scaleY);

		imgData = ctx.getImageData(0, 0, 320*scaleX, 200*scaleY);
		this.backimg = imgData;
	}

	checkCollisionWithTile(tile)
	{
		//tile is a tile object which contains the
		//data of the tile we're checking, such as
		//position, type, etc.

		//obj is the object to check collision with
		//could be a player or enemy class
		//all it needs to have is x, y and physics vars to access
		//if ((this.player1.y > tile.y - this.player1.height) && (this.player1.x + this.player1.width > tile.x && this.player1.x < tile.x + 16) && tile.type == 1)
		if (tile.type == 1 && collideTop(this.player1, tile))
		{
			//console.log("collision!");
			this.player1.y = tile.y - this.player1.height;
			this.player1.yv = 0;
			this.player1.ya = 0;
			this.player1.allowjump = true;
		}
	}

	getLevelData()
	{
		//Create some level data:
		//(this is a test level that is two "screens" square (40x24 tiles))

		this.data = [
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0,21,22,23,24,25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0,61,62,63,64,65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 1, 2, 3, 3, 3, 4, 3, 3, 3, 4, 3, 4, 3, 3, 4, 3, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[21,22,23,22,23,22,23,22,23,22,23,22,23,22,23,23,24,25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[61,62,63,62,63,62,63,62,63,62,63,62,63,62,63,63,64,65, 0, 1, 2, 3, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,21,22,23,24,25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,61,62,63,64,65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,21,22,23,24,25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0,21,22,23,24,25, 0, 0, 1, 2, 3, 4, 3, 4, 3, 4, 5,61,62,63,64,65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0,61,62,63,64,65, 0, 0,21,22,23,22,23,22,23,24,25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,61,62,63,62,63,62,63,64,65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,21,22,23,24,25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,61,62,63,64,65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[ 1, 2, 3, 3, 3, 4, 3, 3, 3, 4, 3, 4, 3, 3, 4, 3, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[21,22,23,22,23,22,23,22,23,22,23,22,23,22,23,23,24,25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[61,62,63,62,63,62,63,62,63,62,63,62,63,62,63,63,64,65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		]
	}

	drawAll()
	{
		clearCanvas();

		// //=======SOME TEST CODE=======
		// this.backtiles.drawTile(0, 0, 144);
		// this.backtiles.drawTile(1, 16, 144);
		// this.backtiles.drawTile(2, 32, 144);
		// this.backtiles.drawTile(3, 48, 144);
		// this.backtiles.drawTile(4, 64, 144);

		// this.backtiles.drawTile(20, 0, 160);
		// this.backtiles.drawTile(21, 16, 160);
		// this.backtiles.drawTile(22, 32, 160);
		// this.backtiles.drawTile(23, 48, 160);
		// this.backtiles.drawTile(24, 64, 160);

		// this.backtiles.drawTile(60, 0, 176);
		// this.backtiles.drawTile(61, 16, 176);
		// this.backtiles.drawTile(62, 32, 176);
		// this.backtiles.drawTile(63, 48, 176);
		// this.backtiles.drawTile(64, 64, 176);
		// //=============================
		this.drawBackground();
		this.drawTiles();
		this.player1.draw();
	}

	drawBackground()
	{
		//Checks global sx,sy variables to determine scrolling position of background
		
		//Note: the following math works because *everything* is negative! Don't change signs!
		let temp = 0;
		
		let sxnew = Math.floor(sx/2);
		let synew = Math.floor(sy/2);

		temp = Math.floor(sxnew/320);
		if (temp != 0) {temp++;}
		let tempsx = sxnew - (temp*320);
		temp = Math.floor(synew/200);
		if (temp != 0) {temp++;}
		let tempsy = synew - (temp*200);
		
		ctx.putImageData(this.backimg, tempsx*scaleX, tempsy*scaleY);
		ctx.putImageData(this.backimg, (tempsx+320)*scaleX, (tempsy)*scaleY);
		ctx.putImageData(this.backimg, (tempsx)*scaleX, (tempsy+200)*scaleY);
		ctx.putImageData(this.backimg, (tempsx+320)*scaleX, (tempsy+200)*scaleY);
	}

	drawTiles()
	{
		//Figure out what section of tiles to draw:

		//Draw the tiles:
		let tempx = Math.floor(-sx/16);
		let tempy = Math.floor(-sy/16);
		for (let j = tempx; j < tempx+21; j++)
		{
			if (j > this.data[0].length-1) {break;}
			for (let k = tempy; k < tempy+13; k++)
			{
				if (k > this.data.length-1) {break;}
				this.backtiles.drawTile(this.data[k][j], j*16, k*16);
				if (this.data[k][j] > 0)
				{
					this.checkCollisionWithTile({x: j*16, y: k*16, width:16, height:16, type: this.backtiles.tiles[this.data[k][j]].type});
				}
			}
		}
	}

	incrementAll()
	{
		this.player1.increment();
		this.handleScrolling();
		this.incrementCounters();
	}

	incrementCounters()
	{
		counter++;
		if (counter > 12) {counter = 1;}
	}

	handleScrolling()
	{
		//Horizontal scrolling:
		if ((this.player1.x + this.player1.width + sx) > 180)
		{
			sx = sx - this.player1.walkspeed;
		}
		if ((this.player1.x + sx) < 140)
		{
			sx = sx + this.player1.walkspeed;
		}
		if (sx > 0) {sx = 0;}

		//Vertical scrolling:
		if (this.player1.yv > 1 || this.player1.allowjump)
		{
			if ((this.player1.y + this.player1.height + sy) > 120)
			{
				sy = sy - this.player1.yv;
			}
			if ((this.player1.y + sy) < 80)
			{
				sy = sy + 4;
			}
		}
		if (sy > 0) {sy = 0;}
	}

	handleKeyEvents()
	{
		this.player1.handleInput();
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




//COLLISION FUNCTIONS:
function collideAny(obj1, obj2)
{
	//Checks whether obj1 is colliding at all with obj2
	//obj1 and obj2 should have the following properties:
	//x, y, width, height

	//horizontal checks:
	if ((obj1.x + obj1.width > obj2.x) && (obj1.x < obj2.x + obj2.width))
	{
		//vertical checks:
		if ((obj1.y + obj1.height > obj2.y) && (obj1.y < obj2.y + obj2.height))
		{
			return true;
		}
	}
	return false;
}

function collideTop(obj1, obj2)
{
	//Checks whether the bottom of obj1 is colliding with the top of obj2
	//obj1 and obj2 should have the following properties:
	//x, y, width, height

	//horizontal checks:
	if ((obj1.x + obj1.width > obj2.x) && (obj1.x < obj2.x + obj2.width))
	{
		//vertical checks:
		if ((obj1.y + obj1.height > obj2.y) && (obj1.y + obj1.height < obj2.y + (obj2.height/2)))
		{
			return true;
		}
	}
	return false;
}




const testlevel = new Level();
