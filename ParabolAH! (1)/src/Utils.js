export class Line extends PIXI.Graphics
{
	constructor(points, lineSize, lineColor)
	{
		super();

		var s = this.lineWidth = lineSize || 5;
		var c = this.lineColor = lineColor || "0x000000";

		this.points = points;

		this.lineStyle(s, c)

		this.moveTo(points[0].x, points[0].y);
		this.lineTo(points[1].x, points[1].y);
	}

	updatePoints(p)
	{
    var points = this.points = p.map((val, index) => val || this.points[index]);

    var s = this.lineWidth, c = this.lineColor;

    this.clear();
    this.lineStyle(s, c);
		this.moveTo(points[0].x, points[0].y);
		this.lineTo(points[1].x, points[1].y);
	}
}




export class Rectangle extends PIXI.Graphics
{
	constructor(p, d, opt)
	{
		super();

		this.position = p || new PIXI.Point(0,0);
		this.dimension = d || new PIXI.Point(1,1);
		this.color = opt.color || "0xFFFFFF";
		this.alpha = opt.alpha || 1;
		this.rounded = opt.rounded || false;
		this.roundRadius = opt.roundRadius || 10;

		this.redraw();
	}

	redraw()
	{
		this.beginFill(this.color);
		if (this.rounded == true){
			this.drawRoundedRect(this.position.x, this.position.y, this.dimension.x, this.dimension.y, this.roundRadius);
		}else{
			this.drawRect(this.position.x, this.position.y, this.dimension.x, this.dimension.y);
		}
		this.endFill();
	}
}




export class Button extends PIXI.Sprite
{
	constructor(texture, opt)
	{
		super(texture);
		this.onButtonOut = opt.onButtonOut || function(){};
		this.onButtonDown = opt.onButtonDown || function(){};
		this.onButtonUp = opt.onButtonUp || function(){};
		this.onButtonOver = opt.onButtonOver || function(){};

		this.buttonMode = true;
		this.interactive = true;
		this
			// set the mousedown and touchstart callback...
	    .on('mousedown', this.onButtonDown)
	    .on('touchstart', this.onButtonDown)

	    // set the mouseup and touchend callback...
	    .on('mouseup', this.onButtonUp)
	    .on('touchend', this.onButtonUp)
	    .on('mouseupoutside', this.onButtonUp)
	    .on('touchendoutside', this.onButtonUp)

	    // set the mouseover callback...
	    .on('mouseover', this.onButtonOver)

	    // set the mouseout callback...
	    .on('mouseout', this.onButtonOut)
	}
}





//functions
export function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

export function radians_to_degrees(radians)
{
  var pi = Math.PI;
  return radians * (180/pi);
}

export function lerp(start, end, speed)
{
  return (start + ((end - start) * speed));
}

export function lengthdir_x(length, direction)
{
  return (Math.cos(degrees_to_radians(direction)) * length); //x
}

export function lengthdir_y(length, direction)
{
  return (Math.sin(degrees_to_radians(direction)) * length); //y
}

export function clamp(value, min, max)
{
  return (Math.max(Math.min(value, max), min));
}

export function distanceToPoint(x1, y1, x2, y2)
{
  return (Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2)));
}

export function distanceToPoint3D(x1, y1, z1, x2, y2, z2)
{
  return (Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2) + Math.pow(z1-z2, 2)));
}

export function pointDirection(x1, y1, x2, y2)
{
  return (radians_to_degrees(Math.atan2(y2-y1, x2-x1)) % 360);
}

export function randomRange(min, max)
{
  return (min + (Math.random() * Math.abs(min-max)));
}

export function cloneArray(arr)
{
    var newArray = [];
    for (var i = 0; i < arr.length; i++){
        newArray[i] = arr[i].slice();
    }
    return newArray;
}

export function remap(x, inputMin, inputMax, min, max)
{
      return (x - inputMin) * (max - min) / (inputMax - inputMin) + min;
}


export function shuffleArray(array)
{
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }

	return array;
}
