import { QuestionLOD, QuestionButton } from "./Questions.js";
import { SimplexNoise } from "./PerlinNoise.js";
import { Line, Rectangle, Button } from "./Utils.js";
import * as utils from "./Utils.js";


const WINDOW_SIZE = [window.outerWidth, window.outerHeight];
const WINDOW_RATIO = WINDOW_SIZE[0] / WINDOW_SIZE[1];

const ONE_SECOND = 1/90;

const MAX_POINTS_LENGTH = 200;

const SIMPLEX_SEED = 'shsttgfsg';

const PRIMARY_FONT = "Snap ITC";
const SECONDARY_FONT = "Krungthep";
const TERTIARY_FONT = "Open Sans";

const canvas = document.getElementById("canvas");
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;


export var game = {

};



var noise;



// Increase this to increase speed of the rollercoaster, non-integers may cause jittering,
// should not be less than 0.5
var startSpeed = 2;
var reducedSpeed = 0.02; // don't change this!!
var scoreIncrement = 100;
var speedInterval = scoreIncrement * 6;
var zoomScale = 0.7;
var zoomSpeed = 0.01;


export var trackSettings = {
	frequency: 0.1,
	amplitude: 10,
	resolution: 50,
	speed: initSpeed,
	blockLength: 200
}



var camPos;
var camDim;
var camScale;










///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// Game init stuff
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var cart = [];
function loadCarts()
{
	cart.length = 0;
	cart.push(PIXI.Sprite.from('assets/cartP1.png'));
	cart.push(PIXI.Sprite.from('assets/cartP2.png'));

	for (var i=0; i<2; i++){
		game.stage.addChild(cart[i]);
		cart[i].scale.x = cart[i].scale.y = 0.5;
		cart[i].anchor.x = cart[i].anchor.x = 0.5;
		cart[i].anchor.y = cart[i].anchor.y = 1;
	}
}



var track;
var initSpeed = 0;
var gameStarted = false;
function createGame()
{
	QuestionLOD.questions = utils.shuffleArray(QuestionLOD.questions);
	console.log(QuestionLOD.questions.length+" Question" +(QuestionLOD.questions.length > 1 ? "s":"")+ "!");

	loadPauseButton();
	loadCarts();

	gameStarted = true;
	gotlastRight = true;
	initSpeed = startSpeed;
	trackSettings.speed = initSpeed;
	howToPageIndex = 0;
	currentAbsPoint = 0;
	currentScore = 0;
	target = new PIXI.Point(0, 0);

	track = new Track(new PIXI.Point(0, game.renderer.height/2));

	countdownText = new PIXI.Text("",{fontFamily : SECONDARY_FONT, fontSize: 60, fill : "0x000000", align : 'center'});

	loadScoreText();

	getNextStop();
}



var currentAbsPoint = 0;
var target = new PIXI.Point(0, 0);

function gameUpdate()
{
	camDim = new PIXI.Point(game.renderer.width, game.renderer.height);

	if (track != null){
		if (track.totalLength > 20)
		{
			var spc = [currentAbsPoint, currentAbsPoint-10];
			for (var i=0; i<2; i++){
				cart[i].x = utils.lerp(cart[i].x, track.getPoint( Math.floor(Math.max( 0, spc[i] )) ).x, Math.min(1,trackSettings.speed));
				cart[i].y = utils.lerp(cart[i].y, track.getPoint( Math.floor(Math.max( 0, spc[i] )) ).y, Math.min(1,trackSettings.speed));

				cart[i].rotation = utils.degrees_to_radians(utils.pointDirection(
					track.getPoint( Math.floor(Math.max( 0, spc[i] )) ).x, track.getPoint( Math.floor(Math.max( 0, spc[i] )) ).y,
					track.getPoint( Math.floor(Math.max( 0, spc[i]-1 )) ).x, track.getPoint( Math.floor(Math.max( 0, spc[i]-1 )) ).y
				) - 180);
			}

			currentAbsPoint += trackSettings.speed;
		}
	}

	var offset = new PIXI.Point(cart[0].x + camDim.x/6, cart[0].y);
	target = offset.clone();

	countdownText.x = cart[0].x;
	countdownText.y = cart[0].y - (camDim.y/4);

	track.updateTrack();
	updateScoreText();

	if (questionOpening == true)
	{
		updateQuestionChecker();
	}
	else if (questionOpen == true)
	{
		var b = questionBlocks[questionBlocks.length-1];
		var offset = new PIXI.Point(
			utils.lerp(b.points[0].x, cart[0].x, 0.5),
			utils.lerp(b.points[0].y, cart[0].y, 0.5)
		);
		target = offset;

		let zsc = (zoomScale * game.renderer.width) / 1920;
		let zsp = (zoomSpeed * game.renderer.width) / 1920;
		camScale.x = utils.lerp(camScale.x, zsc, zsp);
		camScale.y = utils.lerp(camScale.y, zsc, zsp);

		updateCounter();
	}else{
		camScale.x = utils.lerp(camScale.x, 1, 0.1);
		camScale.y = utils.lerp(camScale.y, 1, 0.1);
	}


	camPos.x = utils.lerp(camPos.x, target.x - (camDim.x/camScale.x)/2, 0.025 * initSpeed);
	camPos.y = utils.lerp(camPos.y, target.y - (camDim.y/camScale.y)/2, 0.025 * initSpeed);
	game.stage.pivot.x = camPos.x;
	game.stage.pivot.y = camPos.y;
	game.stage.scale.x = camScale.x;
	game.stage.scale.y = camScale.y;
}









///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// shader stuff
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var netTexture = null;
function loadNet()
{
	netTexture = PIXI.RenderTexture.create({
		width: (trackSettings.blockLength/trackSettings.resolution)*20,
		height: game.renderer.height * 2
	});

	var simpleShader = new PIXI.Filter('', NET_SHADER);
	var tmp = new PIXI.Sprite(netTexture);
	tmp.filters = [simpleShader];
	game.renderer.render(tmp, netTexture);
}




var backgroundTexture;
var backgroundSprite;
var tempIterShdr = 0;
function loadBackgroundShader()
{
	backgroundSprite = new PIXI.Sprite();
	backgroundSprite.width = game.renderer.width;
	backgroundSprite.height = game.renderer.height;

	var bgTex = PIXI.Texture.from("assets/background.jpg");
	bgTex.on('update', function()
	{
		backgroundSprite.filters = [new PIXI.Filter('', BACKGROUND_SHADER, {
			backgroundTex: bgTex,
			backgroundSize: new PIXI.Point(bgTex.width, bgTex.height),
			iResolution: new PIXI.Point(game.renderer.width, game.renderer.height),
			iTime: tempIterShdr,
			camPos: new PIXI.Point(0,0)
		})];
	});

	game.background.addChild(backgroundSprite);
}










///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// timer functions
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var stop = 0;
var timer = 0;
var nextStop = 0;
var numOfStops = 0;

function updateTimer()
{
	if (questionOpening == false && questionOpen == false){
		timer++;
	}

	if (timer > nextStop){
		timer = 0;
		numOfStops++;
		questionOpening = true;
		getNextStop();
		makeQuestionBlocks(5);
	}else{
		var b = new Block(track);
		b.create();
		track.blocks.unshift(b);
	}
}

function getNextStop()
{
	var v = Math.max(10, track.blocks.length);
	nextStop = utils.randomRange(v, v*1.5);
}

function slowdown()
{
	openQuestion();
}
function resume()
{
	closeQuestion();
	trackSettings.speed = initSpeed;
}

function updateQuestionChecker()
{
	if (track.blocks.length > 3)
	{
		var pos = getNearestBlock();

		if (questionBlocks[0] == track.blocks[utils.clamp(pos - 2, 0, track.blocks.length-1)])
		{
			slowdown();
		}
	}
}

function hideBlock(id)
{
	track.blocks[utils.clamp(id, 0, track.blocks.length-1)].hide();
}
function unhideBlock(id)
{
	track.blocks[utils.clamp(id, 0, track.blocks.length-1)].unhide();
}


function getNearestBlock()
{
	var d = utils.distanceToPoint(
		cart[0].x, cart[0].y,
		game.renderer.width*2, game.renderer.height*2
	);
	var pos = 0;

	for (var i=0; i<track.blocks.length; i++){
		let nd = utils.distanceToPoint(
			cart[0].x, cart[0].y,
			track.blocks[i].points[0].x, track.blocks[i].points[0].y
		);

		if (nd < d){
			d = nd;
			pos = i;
		}
	}

	return pos;
}








///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// score stuff functions
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var highScore = 0;
var currentScore = 0;
var currentScoreText = null;

function incrementScore()
{
	currentScore += scoreIncrement
	if (currentScore > highScore){
		highScore = currentScore;
	}
}

function loadScoreText()
{
	currentScoreText = new PIXI.Text("", {fontFamily : SECONDARY_FONT, fontSize: 40, fill : "0x000000", align : 'center'});
	currentScoreText.anchor.set(0.5, 0);
	currentScoreText.x = game.renderer.width/2;
	currentScoreText.y = currentScoreText.height/2;
	game.ui.addChild(currentScoreText);
}

function updateScoreText()
{
	if (currentScoreText != null){
		currentScoreText.text = "Your Score - "+ currentScore +"m";
	}
}









///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// questions functions
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var questionBlocks = [];
var gotlastRight = true;
var questionOpen = false;
var questionOpening = false;
var runCountDown = false;
var questionIndex = 0;
var countdown = 0;
var countdownText;
var firstY = 0;
var initQX = 0;
var initQY = 0;

function openQuestion()
{
	gotlastRight = true;
	runCountDown = true;
	questionOpen = true;
	questionOpening = false;

	var cur = QuestionLOD.questions[questionIndex];

	// console.log("New Question");
	// for (var i=0; i<cur.options.length; i++){
	// 	console.log((i+1)+": "+cur.options[i]+"  ");
	// }

	createButtons(cur);
	game.stage.addChild(countdownText);

	countdown = Math.max(4, cur.countdown - (2 * Math.floor(currentScore/speedInterval)));
}

function closeQuestion()
{
	questionOpen = false;
	questionOpening = false;
	questionBlocks.length = 0;

	destroyButtons();

	questionIndex++;
	if (questionIndex >= QuestionLOD.questions.length-1){
		questionIndex = 0;
		QuestionLOD.questions = utils.shuffleArray(QuestionLOD.questions);
	}
	//questionIndex %= QuestionLOD.questions.length;

	countdown = 0;
}

function updateCounter()
{
	trackSettings.speed = utils.lerp(trackSettings.speed, reducedSpeed / initSpeed, 0.01 * initSpeed);

	countdown -= ONE_SECOND * game.delta; //console.log(countdown);
	countdownText.text = "Time left - "+Math.floor(countdown+1)+"s";

	if (countdown <= 0 && runCountDown == true){
		countdown = 0;
		gotWrong();
	}else if (countdown <= countAtAnswer-1){
		gotWrongEnd();
	}
}

function makeQuestionBlocks(num)
{
	initQX = -trackSettings.blockLength * (num/2);
	initQY = track.pointer.y;//track.points[track.points.length - 1].y;

	firstY = getFunction(initQX/trackSettings.resolution);
	for (var i=0; i<num; i++){
		var b = new Block(track, true, "0x4472c4");
		b.create();
		if (i % 2 == 0){
			b.hide();
		}

		track.blocks.unshift(b);
		questionBlocks.push(b);
	}
}

function getFunction(x)
{
	x = x / trackSettings.resolution;

	var y = QuestionLOD.questions[questionIndex].question(x);
	return y;
}

var flyOffPoint = new PIXI.Point(0,0);
function createFlyOff()
{
	var pos = getNearestBlock();
	var block = track.blocks[pos];

	var dir = utils.pointDirection(
		block.points[block.points.length-1].x, block.points[block.points.length-1].y,
		block.points[block.points.length-3].x, block.points[block.points.length-3].y
	);
	flyOffPoint.x = block.points[block.points.length-1].x + utils.lengthdir_x(game.renderer.height*3, dir+180);
	flyOffPoint.y = block.points[block.points.length-1].y + utils.lengthdir_y(game.renderer.height*3, dir+180);


}

function gotWrongEnd()
{
	countdown = 0;
	countAtAnswer = 0;
	resume();
	if (gotlastRight == false){
		gameOverScreen();
	}
}


var countAtAnswer = 0;
function gotWrong()
{
	gotlastRight = false;
	countAtAnswer = countdown;
	game.stage.removeChild(countdownText);

	runCountDown = false;

	for (var i=0; i<buttons.length; i++){
		displayAnswer(buttons[i]);
	}

	//createFlyOff();
}

function gotRight()
{
	gotlastRight = true;
	countAtAnswer = countdown;
	incrementScore();
	increaseSpeed();
	game.stage.removeChild(countdownText);

	for (var i=0; i<questionBlocks.length; i++){
		if (questionBlocks[i].hidden == true){
			questionBlocks[i].unhide();
		}
	}
	runCountDown = false;

	displayAnswer(buttons[QuestionLOD.questions[questionIndex].answer]);
}

function increaseSpeed()
{
	if (currentScore % speedInterval == 0){
		initSpeed += 1 / (currentScore/speedInterval + 1);
	}
}









///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// Question Bar functions
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var questionBar;
var buttons = [];
var buttonTextureIdle;
var buttonTextureRight;
var buttonTextureWrong;

function loadQuestionBar()
{
	questionBar = PIXI.Sprite.from('assets/Question bar.png');
	buttonTextureIdle = PIXI.Texture.from('assets/button.png');
	buttonTextureRight = PIXI.Texture.from('assets/buttonRight.png');
	buttonTextureWrong = PIXI.Texture.from('assets/buttonWrong.png');

	questionBar.texture.on('update', function()
	{
		var ratio = questionBar.width / questionBar.height;
		questionBar.width = game.renderer.width * 1.05;
		questionBar.height = questionBar.width / ratio;

		updateQuestionBar();
	});

	game.questionBar.addChild(questionBar);
}

function updateQuestionBar()
{
	questionBar.x = (camDim.x/2) - (questionBar.width/2);
	questionBar.y = (camDim.y) - questionBar.height/1.3;
}

function createButtons()
{
	var cur = QuestionLOD.questions[questionIndex];

	for (var i=0; i<cur.options.length; i++)
	{
		var b = new QuestionButton(buttonTextureIdle, i, {
			onButtonUp: function(){
				if (gotlastRight == true){
					if (this.index == QuestionLOD.questions[questionIndex].answer)
					{ gotRight(); } else { gotWrong(); }
				}

		    this.alpha = 1;
			},
		});

		var txt = new PIXI.Text(cur.options[i], {fontFamily : TERTIARY_FONT, fontSize: 40, fill : "0x000000", align : 'center'});
		b.addChild(txt);

		b.anchor.set(0.5, 0.5);
		b.scale.x = b.scale.y = (0.7 * game.renderer.width) / 1920;

		let w = b.width * 1.5;
		b.x = (camDim.x/2) + (w * (i - cur.options.length/2)) + w/2;
		b.y = (questionBar.y + questionBar.height/2);

		txt.anchor.set(0.5, 0.5);

		buttons.push(b);
		game.ui.addChild(b);
	}
}


function displayAnswer(button)
{
	if (button.index == QuestionLOD.questions[questionIndex].answer){
		button.texture = buttonTextureRight;
	}else{
		button.texture = buttonTextureWrong;
	}
}


function destroyButtons()
{
	for (var i=0; i<buttons.length; i++){
		buttons[i].parent.removeChild(buttons[i]);
		buttons[i].destroy({children:true, baseTexture:true});
	}
	buttons.length = 0;
}










///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// The Track Class
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


class Track
{
	constructor(p, questions)
	{
		this.realP = p || new PIXI.Point(0, game.renderer.height/2);
		this.questions = questions || true;
		this.pointer = this.realP.clone();
		this.points = [];
		this.blocks = [];
		this.lastPointsLength = 0;
		this.totalLength = 0;
	}

	updateTrack()
	{
		if (this.pointer.x < (camPos.x + camDim.x + trackSettings.blockLength)){
			this.movePointer();
		}

		if (this.blocks.length > 0){
			if (this.blocks[this.blocks.length-1].points[0].x < camPos.x - trackSettings.blockLength){
				this.removeFirstBlock();
			}
		}

		this.totalLength = this.points.length + this.lastPointsLength;
	}

	getPoint(index)
	{
		// var newIndex = 0;
		// if (index - this.lastPointsLength >= MAX_POINTS_LENGTH)
		// {
		// 	this.lastPointsLength = this.points.length;
		// 	this.points = this.points.slice(index, this.points.length);
		//
		// 	newIndex = this.lastPointsLength - index;
		//
		// 	console.log(this.points.length+" "+this.lastPointsLength+" "+index+" "+newIndex);
		//
		// 	return this.points[0];
		// }else{
		// 	newIndex = index;
		// }

		index = utils.clamp(index, 0, this.points.length - 1);
		var p = this.points[index];
		return p;
	}

	movePointer()
	{
		updateTimer();
	}

	removeFirstBlock()
	{
		this.blocks[this.blocks.length-1].hide();
		delete this.blocks[this.blocks.length-1];
		this.blocks.length--;
	}
}





class Block
{
	constructor(t, q, c)
	{
		this.track = t;
		this.question = q || false;
		this.color = c || "0x000000";
		this.points = [];
		this.lines = [];
		this.stands = [];

		this.hidden = false;
	}

	create()
	{
		let increment = trackSettings.blockLength/trackSettings.resolution;

		for (var i=0; i<trackSettings.resolution; i++)
		{
			this.points.push(this.track.pointer.clone());
			this.track.points.push(this.track.pointer.clone());

			this.track.pointer.x += increment;

			if (this.question == true){
				this.track.pointer.y = (initQY-firstY) + getFunction(initQX/trackSettings.resolution);
				initQX += trackSettings.blockLength/trackSettings.resolution;
			}else{
				this.track.pointer.y += getNoise(this.track.pointer.x/trackSettings.resolution);
			}

			if (this.points.length > 1)
			{
				var l = new Line( [
					this.points[this.points.length - 1], this.points[this.points.length - 2]
				], 15, this.color );
				this.lines.push(l);


				if (this.track.pointer.x % (increment*10) == 0)
				{
					var s = new PIXI.Container();
					var pnt1 = this.points[this.points.length - 1];
					var pnt2 = this.points[this.points.length - 2];

					// var tmp = new PIXI.Sprite(netTexture);
					// tmp.x = pnt1.y <= pnt2.y ? 0 : -(increment*10)*2;
					// tmp.y = 0;
					// s.addChild(tmp);

					s.addChild(new Line( [
						new PIXI.Point(0, 0),
						new PIXI.Point(pnt1.y <= pnt2.y ? increment*10 : -increment*10, 0)
					] ));

					s.addChild(new Line( [
						new PIXI.Point(0, 0),
						new PIXI.Point(0, game.renderer.height*2)
					] ));

					s.x = pnt1.x;
					s.y = pnt1.y;

					game.stage.addChild(s);
					this.stands.push(s);
				}


				game.stage.addChild(l);
			}
		}
	}

	unhide()
	{
		for (var i=0; i<this.stands.length; i++){
			game.stage.addChild(this.stands[i]);
		}
		for (var i=0; i<this.lines.length; i++){
			game.stage.addChild(this.lines[i]);
		}
		this.hidden = false;
	}

	hide()
	{
		for (var i=0; i<this.stands.length; i++){
			game.stage.removeChild(this.stands[i]);
		}
		for (var i=0; i<this.lines.length; i++){
			game.stage.removeChild(this.lines[i]);
		}
		this.hidden = true;
	}
}









///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// how to page loading
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var howToPageIndex = 0;
var howToPages = [];
var howToWords = [
	"Look through the functions on the cheat sheet and try to remember how they look\nWhen you are done press play game",
	"You are controlling a rollercoaster",
	"But the tracks are broken!\nQuick! Select the correct function that would fix the tracks",
	"If you get it right – congratulations! You have saved everyone!\nBut beware – there are more broken tracks to come!",
	"And if you get it wrong .. Well try again :("
];
function loadHowToPage()
{
	for (var i=0; i<5; i++)
	{
		howToPages[i] = new PIXI.Container();

		var pic = PIXI.Sprite.from("assets/how to pages/page"+(i+1)+".png");
		pic.anchor.set(0.5, 0.6);
		pic.scale.x = pic.scale.y = 0.7;
		pic.x = game.renderer.width/2;
		pic.y = game.renderer.height/2;

		var txt = new PIXI.Text(howToWords[i], {fontFamily : SECONDARY_FONT, fontSize: 24, fill : "0xFFFFFF", align : 'center'});
		txt.anchor.set(0.5, 1);
		txt.x = pic.x;
		txt.y = game.renderer.height - txt.height;

		howToPages[i].addChild(pic);
		howToPages[i].addChild(txt);
	}

	howToPages[5] = new PIXI.Container();

	var txt = new PIXI.Text(
		"Beat your high score and find new functions!\nYou can access the function sheet at any\npoint of the game by clicking CS",
		{fontFamily : SECONDARY_FONT, fontSize: 40, fill : "0xFFFFFF", align : 'center'}
	);
	txt.anchor.set(0.5, 0.6);
	txt.x = game.renderer.width/2;
	txt.y = game.renderer.height/2;

	howToPages[5].addChild(txt);


	//play game
	let playGameText = new PIXI.Text("Play Now!", {fontFamily : SECONDARY_FONT, fontSize: 50, fill : "0x000000", align : 'center'});
	playGameText.width;

	let playGame = new PIXI.Container();

	playGame.x = game.renderer.width/2 - playGameText.width/2;
	playGame.y = game.renderer.height/2 + txt.height;

	let playGameButton = new Button(playGameText.texture, {
		onButtonUp: function(){
			cheatSheetMenu();
		}
	});

	let playGameRect = new Rectangle(
		new PIXI.Point(0, 0), new PIXI.Point(playGameButton.width*1.5, playGameButton.height*1.25),{
			color: "0xFFFFFF",
			alpha: 0.9,
		}
	);
	playGameRect.x = playGameText.width/2 - playGameRect.width/2;
	playGameRect.y = playGameText.height/2 - playGameRect.height/2;

	playGame.addChild(playGameRect);
	playGame.addChild(playGameButton);

	howToPages[5].addChild(playGame);
}










///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// cheat sheet loading
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var cheatSheetIndex = 0;
var cheatSheets = [];
function loadCheatSheets()
{
	let maxWidth = 5;
	let extra = 1.125;
	let w = (game.renderer.width/1.5) / maxWidth/extra;
	let h = (w / (790/798)) * extra;

	for (var i=0; i<2; i++)
	{
		cheatSheets[i] = new PIXI.Container();

		for (var j=0; j<15; j++)
		{
			var x = (j % maxWidth) * w * extra;
			var y = Math.floor(j/maxWidth) * h * extra;

			x = (x + (maxWidth * w * extra)) - game.renderer.width/2;
			y = y + (game.renderer.height/(h/extra));

			var spr = PIXI.Sprite.from("assets/cheat sheet/"+ (i+1) +""+ (j+1) +".png");

			var rect = new Rectangle( new PIXI.Point(x/2, y/2), new PIXI.Point(w, h), {
				color: "0xFFFFFF",
				alpha: 0.8
			});

			var txt = new PIXI.Text(
				QuestionLOD.sheet[i][QuestionLOD.sheet[i].length-j-1],
				{fontFamily : TERTIARY_FONT, fontSize: 17, fill : "0x000000", align : 'center'}
			);

			var titleCont = new PIXI.Container();
			var title = new PIXI.Text("CHEAT SHEET", {fontFamily : SECONDARY_FONT, fontSize: 75, fill : "0x000000", align : 'center'});
			var titleRect = new Rectangle( new PIXI.Point(0, 0), new PIXI.Point(title.height, title.width), {
				color: "0xFFFFFF",
				alpha: 0.0
			});
			titleCont.addChild(titleRect);
			titleCont.addChild(title);
			title.anchor.set(0.5, 0.5);
			title.rotation = Math.PI/2;
			title.x = title.height/2;
			title.y = title.width/2;

			titleCont.x = game.renderer.width - title.height*1.25;
			titleCont.y = game.renderer.height/2 - title.width/2;

			spr.x = x; spr.y = y;
			spr.width = w; spr.height = h / 1.25;

			txt.anchor.set(0.5, 0.5);
			txt.x = x + w/2;
			txt.y = (y + h) - (h-spr.height)/2;

			cheatSheets[i].addChild(rect);
			cheatSheets[i].addChild(spr);
			cheatSheets[i].addChild(txt);
			cheatSheets[i].addChild(titleCont);
		}
	}
}










///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// menu screen class and functions
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function cheatSheetMenu()
{
	var backButton, nextButton;

	var currentSheet = cheatSheets[cheatSheetIndex];

	new MenuScreen(
		function(){
			this.addChild(new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(game.renderer.width, game.renderer.height), {
					color: "0x000000",
					alpha: 0.8
				}
			));


			var nextText, backText;

			if (gameStarted == false)
			{
				if (cheatSheetIndex == cheatSheets.length-1){
					nextText = new PIXI.Text("Play Game!", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
				}else{
					nextText = new PIXI.Text("Next >", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
				}
				if (cheatSheetIndex == 0){
					backText = new PIXI.Text("< Back To Menu", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
				}else{
					backText = new PIXI.Text("< Back", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
				}
			}else{
				if (cheatSheetIndex == cheatSheets.length-1){
					nextText = new PIXI.Text("Resume Game >", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
				}else{
					nextText = new PIXI.Text("Next >", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
				}
				if (cheatSheetIndex == 0){
					backText = new PIXI.Text("< Resume Game", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
				}else{
					backText = new PIXI.Text("< Back", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
				}
			}


			//back to menu
			backText.width;
			let backButton = new Button(backText.texture, {
				onButtonUp: function(){
					if (cheatSheetIndex == 0){
						cheatSheetIndex = 0;

						if (gameStarted == false){
							gotWrongEnd();
							mainMenuScreen();
						}else{
							currentMenu.destroy();
						}
					}else{
						cheatSheetIndex--;
						cheatSheetIndex = Math.max(cheatSheetIndex, 0);
						currentMenu.destroy();
						cheatSheetMenu();
					}
				}
			});
			backButton.anchor.set(0, 1.5);
			backButton.y = game.renderer.height;
			backButton.x = 20;

			this.addChild(backButton);



			//Next
			nextText.width;
			let nextButton = new Button(nextText.texture, {
				onButtonUp: function(){
					if (cheatSheetIndex == cheatSheets.length-1){
						cheatSheetIndex = 0;

						if (gameStarted == false){
							restartGame();
						}else{
							currentMenu.destroy();
						}
					}else{
						cheatSheetIndex++;
						cheatSheetIndex = Math.min(cheatSheetIndex, cheatSheets.length-1);
						currentMenu.destroy();
						cheatSheetMenu();
					}
				}
			});
			nextButton.anchor.set(1, 1.5);
			nextButton.y = game.renderer.height;
			nextButton.x = game.renderer.width - 20;

			this.addChild(nextButton);


			this.addChild(currentSheet);
		},

		function(){

		},

	).show();
}





function loadPauseButton()
{
	let pauseButton = new Button(PIXI.Texture.from("assets/pauseButton.png"), {
		onButtonUp: function(){
			pauseScreen();
		}
	});

	let cheatButton = new Button(PIXI.Texture.from("assets/cheatButton.png"), {
		onButtonUp: function(){
			cheatSheetMenu();
		}
	});
	// let cheatText = new PIXI.Text("CS", {fontFamily : PRIMARY_FONT, fontSize: 150, fill : "0x000000", align : 'center'});
	// cheatText.anchor.set(0.5, 0.5);
	// cheatText.width = cheatButton.width;
	// cheatButton.addChild(cheatText);

	pauseButton.anchor.set(1, 0);
	pauseButton.x = game.renderer.width;
	pauseButton.y = 0;

	cheatButton.anchor.set(2.5, 0);
	cheatButton.x = game.renderer.width;
	cheatButton.y = 0;

	game.ui.addChild(pauseButton);
	game.ui.addChild(cheatButton);
}





function pauseScreen()
{
	let pauseScreen = new MenuScreen(
		function(){
			this.addChild(new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(game.renderer.width, game.renderer.height), {
					color: "0x000000",
					alpha: 0.5
				}
			));



			//paused text
			let paused = new PIXI.Container();

			let pausedText = new PIXI.Text("Paused",{fontFamily : PRIMARY_FONT, fontSize: 150, fill : "0x000000", align : 'center'});

			var ratio = pausedText.width / pausedText.height;
			pausedText.width = game.renderer.width/3;
			pausedText.height = pausedText.width / ratio;

			paused.x = game.renderer.width/2 - pausedText.width/2;
			paused.y = game.renderer.height/3 - pausedText.height/2;

			let pausedRect = new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(pausedText.width, pausedText.height),
				{
					color: "0xFFFFFF",
					alpha: 0.5,
				}
			);

			paused.addChild(pausedRect);
			paused.addChild(pausedText);
			this.addChild(paused);



			//resume text
			let resume = new PIXI.Container();

			let resumeText = new PIXI.Text("Resume",{fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0x000000", align : 'center'});
			resume.x = game.renderer.width/2 - resumeText.width/2;
			resume.y = game.renderer.height/1.75 - resumeText.height/2;

			let resumeButton = new Button(resumeText.texture, {
				onButtonUp: function(){
					currentMenu.destroy();
				}
			});

			let resumeRect = new Rectangle(
				new PIXI.Point(0, 0),
				new PIXI.Point(resumeButton.width*1.5, resumeButton.height*1.5),
				{
					color: "0xFFFFFF",
					alpha: 0.5,
				}
			);
			resumeRect.x = resumeText.width/2 - (resumeText.width*1.5)/2;
			resumeRect.y = resumeText.height/2 - (resumeText.height*1.5)/2;

			resume.addChild(resumeRect);
			resume.addChild(resumeButton);
			this.addChild(resume);



			//restart
			let restart = new PIXI.Container();

			let restartText = new PIXI.Text("Restart",{fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0x000000", align : 'center'});
			restart.x = game.renderer.width/2 - restartText.width/2;
			restart.y = game.renderer.height/1.75 + (game.renderer.height/10) * 1 - restartText.height/2;

			let restartButton = new Button(restartText.texture, {
				onButtonUp: function(){
					gotWrongEnd();
					restartGame();
				}
			});

			let restartRect = new Rectangle(
				new PIXI.Point(0, 0),
				new PIXI.Point(restartButton.width*1.5, restartButton.height*1.5),
				{
					color: "0xFFFFFF",
					alpha: 0.5,
				}
			);
			restartRect.x = restartText.width/2 - (restartText.width*1.5)/2;
			restartRect.y = restartText.height/2 - (restartText.height*1.5)/2;

			restart.addChild(restartRect);
			restart.addChild(restartButton);
			this.addChild(restart);



			//Main Menu
			let mainMenu = new PIXI.Container();

			let mainMenuText = new PIXI.Text("Main Menu",{fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0x000000", align : 'center'});
			mainMenu.x = game.renderer.width/2 - mainMenuText.width/2;
			mainMenu.y = game.renderer.height/1.75 + (game.renderer.height/10) * 2 - mainMenuText.height/2;

			let mainMenuButton = new Button(mainMenuText.texture, {
				onButtonUp: function(){
					gotWrongEnd();
					mainMenuScreen();
				}
			});

			let mainMenuRect = new Rectangle(
				new PIXI.Point(0, 0),
				new PIXI.Point(mainMenuButton.width*1.5, mainMenuButton.height*1.5),
				{
					color: "0xFFFFFF",
					alpha: 0.5,
				}
			);
			mainMenuRect.x = mainMenuText.width/2 - (mainMenuText.width*1.5)/2;
			mainMenuRect.y = mainMenuText.height/2 - (mainMenuText.height*1.5)/2;

			mainMenu.addChild(mainMenuRect);
			mainMenu.addChild(mainMenuButton);
			this.addChild(mainMenu);
		}
	);

	pauseScreen.show();
}



function gameOverScreen()
{
	var gameOver = new MenuScreen(
		function(){
			this.addChild(new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(game.renderer.width, game.renderer.height), {
					color: "0x000000",
					alpha: 0.5
				}
			));

			//game over text
			let gameOver = new PIXI.Container();

			let gameOverText = new PIXI.Text("Game Over :(",{fontFamily : PRIMARY_FONT, fontSize: 150, fill : "0x000000", align : 'center'});

			var ratio = gameOverText.width / gameOverText.height;
			gameOverText.width = game.renderer.width/1.5;
			gameOverText.height = gameOverText.width / ratio;

			gameOver.x = game.renderer.width/2 - gameOverText.width/2;
			gameOver.y = game.renderer.height/4.5 - gameOverText.height/2;

			let gameOverRect = new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(gameOverText.width, gameOverText.height),
				{
					color: "0xFFFFFF",
					alpha: 0.5,
				}
			);

			gameOver.addChild(gameOverRect);
			gameOver.addChild(gameOverText);
			this.addChild(gameOver);



			//your score
			let yourScore = new PIXI.Container();
			let yourScoreText = new PIXI.Text("Your Score: "+currentScore+"m",{fontFamily : SECONDARY_FONT, fontSize: 150, fill : "0x000000", align : 'center'});

			var ratio = yourScoreText.width / yourScoreText.height;
			yourScoreText.width = game.renderer.width/6;
			yourScoreText.height = yourScoreText.width / ratio;

			yourScore.x = game.renderer.width/2 - yourScoreText.width/2;
			yourScore.y = game.renderer.height/2.5 - yourScoreText.height/2;

			let yourScoreRect = new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(yourScoreText.width*1.25, yourScoreText.height*1.125),
				{
					color: "0xFFFFFF",
					alpha: 0.5,
				}
			);

			yourScoreRect.x = yourScoreText.width/2 - (yourScoreText.width*1.25)/2;
			yourScoreRect.y = yourScoreText.height/2 - (yourScoreText.height*1.25)/2;

			yourScore.addChild(yourScoreRect);
			yourScore.addChild(yourScoreText);
			this.addChild(yourScore);



			//high score
			let highScoreC = new PIXI.Container();
			let highScoreCText = new PIXI.Text("High Score: "+highScore+"m",{fontFamily : SECONDARY_FONT, fontSize: 150, fill : "0x000000", align : 'center'});

			var ratio = highScoreCText.width / highScoreCText.height;
			highScoreCText.width = game.renderer.width/6;
			highScoreCText.height = highScoreCText.width / ratio;

			highScoreC.x = game.renderer.width/2 - highScoreCText.width/2;
			highScoreC.y = yourScore.y + (game.renderer.height/8);

			let highScoreCRect = new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(highScoreCText.width*1.25, highScoreCText.height*1.125),
				{
					color: "0xFFFFFF",
					alpha: 0.5,
				}
			);

			highScoreCRect.x = highScoreCText.width/2 - (highScoreCText.width*1.25)/2;
			highScoreCRect.y = highScoreCText.height/2 - (highScoreCText.height*1.25)/2;

			highScoreC.addChild(highScoreCRect);
			highScoreC.addChild(highScoreCText);
			this.addChild(highScoreC);



			//play again
			let playAgain = new PIXI.Container();

			let playAgainText = new PIXI.Text("Play Again!",{fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0x000000", align : 'center'});
			playAgain.x = game.renderer.width/2 - playAgainText.width/2;
			playAgain.y = highScoreC.y + (game.renderer.height/7);

			let playAgainButton = new Button(playAgainText.texture, {
				onButtonUp: function(){
					restartGame();
				}
			});

			let playAgainRect = new Rectangle(
				new PIXI.Point(0, 0),
				new PIXI.Point(playAgainButton.width*1.5, playAgainButton.height*1.5),
				{
					color: "0xFFFFFF",
					alpha: 0.9,
				}
			);
			playAgainRect.x = playAgainText.width/2 - (playAgainText.width*1.5)/2;
			playAgainRect.y = playAgainText.height/2 - (playAgainText.height*1.5)/2;

			playAgain.addChild(playAgainRect);
			playAgain.addChild(playAgainButton);
			this.addChild(playAgain);



			//Main Menu
			let mainMenu = new PIXI.Container();

			let mainMenuText = new PIXI.Text("Main Menu",{fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0x000000", align : 'center'});
			mainMenu.x = game.renderer.width/2 - mainMenuText.width/2;
			mainMenu.y = playAgain.y + (game.renderer.height/10);

			let mainMenuButton = new Button(mainMenuText.texture, {
				onButtonUp: function(){
					gotWrongEnd();
					mainMenuScreen();
				}
			});

			let mainMenuRect = new Rectangle(
				new PIXI.Point(0, 0),
				new PIXI.Point(mainMenuButton.width*1.5, mainMenuButton.height*1.5),
				{
					color: "0xFFFFFF",
					alpha: 0.5,
				}
			);
			mainMenuRect.x = mainMenuText.width/2 - (mainMenuText.width*1.5)/2;
			mainMenuRect.y = mainMenuText.height/2 - (mainMenuText.height*1.5)/2;

			mainMenu.addChild(mainMenuRect);
			mainMenu.addChild(mainMenuButton);
			this.addChild(mainMenu);
		},

		function(){

		}
	);

	gameOver.show();
}





var tempIter = 0;
function updateTempTrack(tempTrack)
{
	if (tempTrack.pointer.x < (camPos.x + camDim.x + trackSettings.blockLength)){
		var b = new Block(tempTrack);
		b.create();
		tempTrack.blocks.unshift(b);
	}

	if (tempTrack.blocks.length > 0){
		if (tempTrack.blocks[tempTrack.blocks.length-1].points[0].x < camPos.x - trackSettings.blockLength){
			tempTrack.removeFirstBlock();
		}
	}

	tempTrack.totalLength = tempTrack.points.length + tempTrack.lastPointsLength;


	if (tempTrack.blocks.length > 1){
		camPos.x = utils.lerp(camPos.x, tempTrack.getPoint( Math.floor(tempIter) ).x, 1) - camDim.x/2;
		camPos.y = utils.lerp(camPos.y, tempTrack.getPoint( Math.floor(tempIter) ).y, 1) - camDim.y/2;
		game.stage.pivot.x = camPos.x;
		game.stage.pivot.y = camPos.y;

		tempIter += 1;//trackSettings.speed;
		tempIter = utils.clamp(tempIter, 0, tempTrack.totalLength-1);
	}
}





function howToPlayScreen()
{
	destroyGameConstants();
	initGameConstants();

	var tempTrack;

	let currentHowToPage = howToPages[howToPageIndex];

	new MenuScreen(
		function(){
			this.addChild(new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(game.renderer.width, game.renderer.height), {
					color: "0x000000",
					alpha: 0.8
				}
			));


			var backText, nextText;
			if (howToPageIndex == howToPages.length-1){
				nextText = new PIXI.Text("", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
			}else{
				nextText = new PIXI.Text("Next >", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
			}
			if (howToPageIndex == 0){
				backText = new PIXI.Text("< Back To Menu", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
			}else{
				backText = new PIXI.Text("< Back", {fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'});
			}


			//back to menu
			backText.width;
			let backButton = new Button(backText.texture, {
				onButtonUp: function(){
					if (howToPageIndex == 0){
						howToPageIndex = 0;
						gotWrongEnd();
						mainMenuScreen();
					}else{
						howToPageIndex--;
						howToPageIndex = Math.max(howToPageIndex, 0);
						currentMenu.destroy();
						howToPlayScreen();
					}
				}
			});
			backButton.anchor.set(-0, 1.5);
			backButton.y = game.renderer.height;
			backButton.x = 10;

			this.addChild(backButton);



			//Next
			nextText.width;
			let nextButton = new Button(nextText.texture, {
				onButtonUp: function(){
					if (howToPageIndex < howToPages.length-1){
						howToPageIndex++;
						howToPageIndex = Math.min(howToPageIndex, howToPages.length-1);
						currentMenu.destroy();
						howToPlayScreen();
					}
				}
			});
			nextButton.anchor.set(1, 1.5);
			nextButton.y = game.renderer.height;
			nextButton.x = game.renderer.width - 10;

			this.addChild(nextButton);


			this.addChild(currentHowToPage);


			//temporary track
			tempTrack = new Track(new PIXI.Point(0, game.renderer.height/2));
			tempIter = 0;
		},


		function(){
			updateTempTrack(tempTrack);
		}
	).show();
}






function mainMenuScreen()
{
	destroyGameConstants();
	initGameConstants();

	gameStarted = false;
	var tempTrack;

	var mainMenu = new MenuScreen(
		function(){
			this.addChild(new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(game.renderer.width, game.renderer.height), {
					color: "0x000000",
					alpha: 0.5
				}
			));



			//credits
			let credits = new PIXI.Text(
				"Disha Modi and Aarti Modi",
				{fontFamily : SECONDARY_FONT, fontSize: 30, fill : "0xFFFFFF", align : 'center'}
			);
			credits.anchor.set(0.5, 0.5);
			credits.x = game.renderer.width/2;
			credits.y = game.renderer.height - credits.height;
			this.addChild(credits);



			//game over text
			let mainMenu = new PIXI.Container();

			let mainMenuText = new PIXI.Text("ParabolAH!", {fontFamily : PRIMARY_FONT, fontSize: 150, fill : "0x000000", align : 'center'});

			var ratio = mainMenuText.width / mainMenuText.height;
			mainMenuText.width = game.renderer.width/1.5;
			mainMenuText.height = mainMenuText.width / ratio;

			mainMenu.x = game.renderer.width/2 - mainMenuText.width/2;
			mainMenu.y = game.renderer.height/3 - mainMenuText.height/2;

			let mainMenuRect = new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(mainMenuText.width, mainMenuText.height),
				{
					color: "0xFFFFFF",
					alpha: 1.0,
				}
			);

			mainMenu.addChild(mainMenuRect);
			mainMenu.addChild(mainMenuText);
			this.addChild(mainMenu);



			let playGameText = new PIXI.Text("Play!", {fontFamily : SECONDARY_FONT, fontSize: 50, fill : "0x000000", align : 'center'});
			let howToText = new PIXI.Text("How to Play?", {fontFamily : SECONDARY_FONT, fontSize: 50, fill : "0x000000", align : 'center'});



			//play game
			let playGame = new PIXI.Container();

			playGame.x = game.renderer.width/2 - ((playGameText.width+howToText.width)*1.5)/2;
			playGame.y = mainMenu.y + mainMenuText.height*1.5;

			let playGameButton = new Button(playGameText.texture, {
				onButtonUp: function(){
					cheatSheetMenu();
				}
			});

			let playGameRect = new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(playGameButton.width*1.5, playGameButton.height*1.25),{
					color: "0xFFFFFF",
					alpha: 0.9,
				}
			);
			playGameRect.x = playGameText.width/2 - playGameRect.width/2;
			playGameRect.y = playGameText.height/2 - playGameRect.height/2;

			playGame.addChild(playGameRect);
			playGame.addChild(playGameButton);
			this.addChild(playGame);



			//how to play!
			let howTo = new PIXI.Container();

			howTo.x = game.renderer.width/2 - ((playGameText.width+howToText.width)*1.5)/2 + howToText.width;
			howTo.y = mainMenu.y + mainMenuText.height*1.5;

			let howToButton = new Button(howToText.texture, {
				onButtonUp: function(){
					howToPlayScreen();
				}
			});

			let howToRect = new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(howToButton.width*1.5, howToButton.height*1.25),{
					color: "0xFFFFFF",
					alpha: 0.9,
				}
			);
			howToRect.x = howToText.width/2 - howToRect.width/2;
			howToRect.y = howToText.height/2 - howToRect.height/2;

			howTo.addChild(howToRect);
			howTo.addChild(howToButton);
			this.addChild(howTo);





			//temporary track
			tempTrack = new Track(new PIXI.Point(0, game.renderer.height/2));
			tempIter = 0;
		},


		function(){
			updateTempTrack(tempTrack);
		}
	);

	mainMenu.show();
}





var menuScreenOn = false;
var currentMenu = null;

class MenuScreen extends PIXI.Container
{
	constructor(create, update, destroy)
	{
		super();
		this.createF = create || function(){};
		this.updateF = update || function(){};
		this.destroyF = destroy || function(){};
	}

	show(){
		game.app.stage.removeChild(game.ui);
		game.menu.addChild(this);
		if (currentMenu != null){ currentMenu.destroy(); }
		this.createF();
		menuScreenOn = true;
		currentMenu = this;
	}

	update(){
		this.updateF();
	}

	destroy(){
		this.destroyF();
		game.app.stage.addChildAt(game.ui, 3);
		game.menu.removeChild(this);
		menuScreenOn = false;
		currentMenu = null;
	}
}









///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////
//// other main stuff
////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getNoise(x)
{
	var y = noise.noise2D(x * trackSettings.frequency, 0) * trackSettings.amplitude;
	return y;
}




function resize() {
	// let windowW = window.innerWidth;
	// let windowH = window.innerHeight;
	//
	// if (windowW / windowH >= WINDOW_RATIO) {
  //     var w = windowH * WINDOW_RATIO;
  //     var h = windowH;
  // } else {
  //     var w = windowW;
  //     var h = windowW / WINDOW_RATIO;
  // }
	//
  // game.renderer.view.style.width = w + 'px';
  // game.renderer.view.style.height = h + 'px';
	game.app.resizeTo = window;
}
window.onresize = resize;





var countDownForStart = 0;
var countDownForStartText;
var countDownForStartRect;
function countDownToStart()
{
	createGame();

	var countMenu = new MenuScreen(
		function(){
			countDownForStart = 3;
			countDownForStartText = new PIXI.Text("",{fontFamily : PRIMARY_FONT, fontSize: 100, fill : "0x000000", align : 'center'});

			this.addChild(new Rectangle(
				new PIXI.Point(0, 0), new PIXI.Point(game.renderer.width, game.renderer.height), {
					color: "0x000000",
					alpha: 0.3
				}
			));

			let w = 200;
			countDownForStartRect = new Rectangle(
				new PIXI.Point(0,0), new PIXI.Point(w, w), {
					color: "0xFFFFFF",
					alpha: 0.3,
				}
			);

			this.addChild(countDownForStartRect);
			this.addChild(countDownForStartText);

			for (var i=0; i<21; i++){
				gameUpdate();
			}
		},

		function(){
			countDownForStart -= ONE_SECOND * game.delta;
			countDownForStartText.text = Math.floor(countDownForStart+1)+"";

			countDownForStartText.x = game.renderer.width/2 - countDownForStartText.width/2;
			countDownForStartText.y = game.renderer.height/2 - countDownForStartText.height/2;

			countDownForStartRect.x = game.renderer.width/2 - countDownForStartRect.dimension.x/2;
			countDownForStartRect.y = game.renderer.height/2 - countDownForStartRect.dimension.y/2;

			if (countDownForStart <= 0){
				this.destroy();
			}
		}
	);

	countMenu.show();
}





function create()
{
	resize();
	mainMenuScreen();
	loadQuestionBar();
	loadHowToPage();
	loadCheatSheets();
	loadBackgroundShader();
}




function initGameConstants()
{
	game.delta = 0;
	game.ui = new PIXI.Container();
	game.menu = new PIXI.Container();
	game.stage = new PIXI.Container();
	if (game.background == null){ game.background = new PIXI.Container(); }
	if (game.questionBar == null){ game.questionBar = new PIXI.Container(); }

	game.app.stage.addChild(game.background);
	game.app.stage.addChild(game.stage);
	game.app.stage.addChild(game.questionBar);
	game.app.stage.addChild(game.ui);
	game.app.stage.addChild(game.menu);

	camPos = new PIXI.Point(0, 0);
	camDim = new PIXI.Point(game.renderer.width, game.renderer.height);
	camScale = new PIXI.Point(1, 1);

	noise = new SimplexNoise();
}

function destroyGameConstants()
{
	if (game.menu != null){
		game.menu.destroy({children:true, texture: true, baseTexture:true});
		game.ui.destroy({children:true, texture: true, baseTexture:true});
		game.stage.destroy({children:true, texture: true, baseTexture:true});

		game.app.stage.removeChild(game.background);
		game.app.stage.removeChild(game.stage);
		game.app.stage.removeChild(game.questionBar);
		game.app.stage.removeChild(game.ui);
		game.app.stage.removeChild(game.menu);
	}
}




function restartGame()
{
	if (currentMenu != null){ currentMenu.destroy(); }

	destroyGameConstants();
	initGameConstants();
	countDownToStart();
}




function update(delta)
{
	game.delta = delta;

	if (questionBar != null){
		updateQuestionBar();
	}

	if (menuScreenOn == false){
		gameUpdate();
	}else{
		if (currentMenu != null){ currentMenu.update(); }
	}

	if (backgroundSprite.filters != null){
		backgroundSprite.filters[0].uniforms.iTime += 0.1;
		if (camPos != null){
			backgroundSprite.filters[0].uniforms.camPos = camPos.clone();
			backgroundSprite.filters[0].uniforms.iResolution = new PIXI.Point(game.renderer.width, game.renderer.height);
			backgroundSprite.width = game.renderer.width;
			backgroundSprite.height = game.renderer.height;
		}
	}
}





window.addEventListener("DOMContentLoaded", function()
{
	game.app = new PIXI.Application({
	    width: window.innerWidth,
	    height: window.innerHeight,
	    backgroundColor: 0x2c3e50,
			view: canvas
	});

	game.delta = 0;
	game.update = game.app.ticker;
	game.loader = game.app.loader;
	game.renderer = game.app.renderer;


	var fontData = {
		PRIMARY_FONT: { src: 'url(assets/Snap_ITC.ttf)' },
		SECONDARY_FONT: { src: 'url(assets/Krungthep.ttf)' },
		TERTIARY_FONT: { src: 'url(assets/OpenSans-Regular.ttf)' }
	  // Etc.
	}

	var observers = []
	var fonts = []

	// Make one Observer along with each font
	Object.keys(fontData).forEach(function(family) {
	  var data = fontData[family]
	  var obs = new FontFaceObserver(family, data)
	  var font = new FontFace(family, data.src)

	  observers.push(obs.load(null, 5000))
	  fonts.push(
	    font
	      .load()
	      .then((f) => {
	        document.fonts.add(f)
	      }, (err) => {
	        throw {type: "font_loading_err", fontName: family, DOMException: err}
	      })
	  )
	})

	Promise.all(fonts)
	.then(() => {
		create();
		game.update.add(update);
	}, (err) => {
	  console.error(err);
	})

});
