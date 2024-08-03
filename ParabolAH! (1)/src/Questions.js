import { Button } from "./Utils.js";
import * as utils from "./Utils.js";

export var QuestionLOD = {
	questions: [],
	sheet: []

};

QuestionLOD.sheet[0] = [
	"y= √x", "y= -∣x∣",
	"y= ∣x∣", "y= cot x",
	"y= tan x", "y= cos x",
	"y= sin x", "y=- x^3",
	"y= x^3", "y= - (1/x)",
	"y= 1/x", "y= -x^2",
	"y= x^2", "y= -x",
	"y= x",
];

QuestionLOD.sheet[1] = [
	"y= -x^4", "y= x^4",
	"x= const(k)",
	"y= cos-1 x", "y= sin-1 x",
	"y= -x^3 - x^2 - x", "y= x^3 + x^2 + x",
	"y= -(1/x^2)", "y= 1/x^2", "y= const(k)",
	"y= ∛x", "y= -e^x", "y= e^x",
	"y= ln x", "y= -√x",
];



export class Question
{
	constructor(p)
	{
		this.question = p.question || getNoise;
		this.options = p.options || ["idk"];
		this.answer = p.answer || "idk";
		this.countdown = p.countdown || 10;
	}
}



export class QuestionButton extends Button
{
	constructor(texture, index, opt)
	{
		super(texture, opt);
		this.index = index;
	}
}





// Questions



// y = 1/x^2
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			const EPSILON = 0.05;
			x = Math.max(EPSILON, Math.abs(x)) * Math.sign(x);
			x = x == 0 ? EPSILON : x;

			var y = -(1/Math.pow(x, 2));

			return y;
		},
		options: ["y = x^2", "y = 1/x^2", "y = sin x", "y = x", "y = 1/x", "y = x^3"],
		answer: 1
	}
));



// y = -1/x^2
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			const EPSILON = 0.05;
			x = Math.max(EPSILON, Math.abs(x)) * Math.sign(x);
			x = x == 0 ? EPSILON : x;

			var y = (1/Math.pow(x, 2));

			return y;
		},
		options: ["y = x^2", "y = 1/x^2", "y = sin x", "y = x", "y = -1/x^2", "y = x^3"],
		answer: 4
	}
));



// y = x^2
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = -Math.pow(x * 100, 2);

			return y;
		},
		options: ["y = tan(x)", "y = cot(x)", "y = -x^2", "y = x", "y = 1/x^2", "y = x^2"],
		answer: 5
	}
));



// y = -x^2
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = Math.pow(x * 100, 2);

			return y;
		},
		options: ["y = x^2", "y = cot(x)", "y = -x^2", "y = x", "y = 1/x^2", "y = sin(x)"],
		answer: 2
	}
));



// y = x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = -x * 2000;

			return y;
		},
		options: ["y = x^2", "y = -1/x^2", "y = sin x", "y = x", "y = 1/x", "y = x^3"],
		answer: 3
	}
));



// y = -x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = x * 2000;

			return y;
		},
		options: ["y = x^2", "y = x^3", "y = sin x", "y = x^4", "y = -x", "y = x"],
		answer: 4
	}
));



//y = sin x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = Math.sin(x * 30) * 150;

			return y;
		},
		options: ["y = x^2", "y = 1/x^2", "y = sin x", "y = x", "y = 1/x", "y = x^3"],
		answer: 2
	}
));



//y = cos x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = Math.cos(x * 30) * 150;

			return y;
		},
		options: ["y = x^2", "y = cot x", "y = sin x", "y = x", "y = cos x", "y = x^2"],
		answer: 4
	}
));



//y = x^4
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = -Math.pow(x * 22.5, 4);

			return y;
		},
		options: ["y = -x^4", "y = 1/x^2", "y = x^4", "y = x", "y = 1/x", "y = x^3"],
		answer: 2
	}
));



//y = -x^4
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = Math.pow(x * 22.5, 4);

			return y;
		},
		options: ["y = x^4", "y = -x^3", "y = -x^4", "y = x", "y = 1/x", "y = x^3"],
		answer: 2
	}
));



//y = x^3
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = -Math.pow(x * 38, 3);

			return y;
		},
		options: ["y = -x^4", "y = -(1/x^2)", "y = x^4", "y = -x", "y = x^3", "y = x^4"],
		answer: 4
	}
));



//y = -x^3
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = Math.pow(x * 38, 3);

			return y;
		},
		options: ["y = x^2", "y = x^3", "y = sin x", "y = x^4", "y = -x", "y = -x^3"],
		answer: 5
	}
));



// y = |x|
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = -Math.abs(x) * 2000;

			return y;
		},
		options: ["y = x^2", "y = -|x|", "y = sin x", "y = x", "y = |x|", "y = x^3"],
		answer: 4
	}
));



// y = -|x|
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = Math.abs(x) * 2000;

			return y;
		},
		options: ["y = x^2", "y = x^3", "y = sin x", "y = -|x|", "y = -x", "y = x"],
		answer: 3
	}
));



// y = √x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = -Math.sqrt(Math.max(0, x) * 20) * 150;

			return y;
		},
		options: ["y = x^2", "y = √x", "y = sin x", "y = x", "y = 1/x", "y = x^3"],
		answer: 1
	}
));



// y = -√x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = Math.sqrt(Math.max(0, x) * 20) * 150;

			return y;
		},
		options: ["y = 1/x^2", "y = -√x", "y = √x", "y = -x", "y = const(k)", "y = x^4"],
		answer: 1
	}
));



// y = sin-1 x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = -Math.asin(utils.clamp(x * 10, -1, 1)) * 200;

			return y;
		},
		options: ["y = -x^4", "y = cot x", "y = tan x", "y = sin x", "y = sin-1 x", "y = x^2"],
		answer: 4
	}
));



// y = cos-1 x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {
			var y = -Math.acos(utils.clamp(x * 10, -1, 1)) * 200;

			return y;
		},
		options: ["y = x^2", "y = cot x", "y = sin x", "y = cos-1 x", "y = cos x", "y = -x^2"],
		answer: 3
	}
));



// y = ∛x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = Math.sign(-x) * Math.pow(Math.abs(x) * 30, 1/3) * 125;

			return y;
		},
		options: ["y = x", "y = ∛x", "y = -∛x", "y = -x", "y = x^3", "y = x^(1/2)"],
		answer: 1
	}
));



// y = e^x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = -Math.pow(2000, x) * 150;

			return y;
		},
		options: ["y = ln x", "y = -(1/x^2)", "y = e^x", "y = -e^x", "y = 1/(e^x)", "y = x^4"],
		answer: 2
	}
));



// y = -e^x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = Math.pow(2000, x) * 150;

			return y;
		},
		options: ["y = e^x", "y = -(1/x^2)", "y = -1/(e^x)", "y = -e^x", "y = 1/(e^x)", "y = ln x"],
		answer: 3
	}
));



// y = ln x
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = -Math.log(utils.remap(x * 5, -1, 1, 0.05, 1) * 80) * 200;

			return y;
		},
		options: ["y = cot x", "y = sin x", "y = -1/(e^x)", "y = cos x", "y = 1/(e^x)", "y = ln x"],
		answer: 5
	}
));



// BONUS!!!
// y = const(k)
QuestionLOD.questions.push(
	new Question({
		question: (x) => {

			var y = 0;

			return y;
		},
		options: ["x = const(k)", "y = -∛x", "y = const(k)"],
		answer: 2,
		countdown: 20
	}
));
