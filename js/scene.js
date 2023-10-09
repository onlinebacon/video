import DrawingContext from './drawing.js';
import * as Trig from './trig.js';
import * as Toggles from './toggles.js';
import { vec2 } from './vec2.js';
import * as Vars from './variables.js';

const { VARS } = Vars;

let ctx = true ? null : new DrawingContext(null);

const COLOR = {
	earth: 'rgb(0, 127, 255)',
	earthInterior: 'rgba(0, 127, 255, 0.15)',
	spot: 'rgb(255, 255, 255)',
	star: 'rgb(255, 192, 64)',
	starSight: 'rgba(255, 127, 0, 0.4)',
	down: '#0f7',
	up: '#70f',
	horizon: '#666',
	z1: '#fc5',
	z2: '#05c',
	angle: '#fff',
};

const earthRadiusMiles = 3958.76;
const starRadius = 10;
const lineExcess = 50;
const arrowLen = 100;

// User vars
let obsHeightMiles = 100;
let starDir = Trig.deg(50);
let z1Dir = Trig.deg(30);
let z2Dir = Trig.deg(60);

// Calculated vars
let obsHeight = 0;
let earthRadius = 0;
let starHeight = 0;
let obsVecPos = vec2();
let starVecPos = vec2();
let obsVecDir = vec2();
let obsGPVecPos = vec2();
let starGPVecPos = vec2();

const recalculateVars = () => {
	earthRadius = earthRadiusMiles*VARS.scale;
	starHeight = VARS.star_height*VARS.scale;
	obsHeight = obsHeightMiles*VARS.scale;
	const starVecDir = vec2(0, 1).rot(starDir);
	obsVecDir = vec2(0, 1).rot(VARS.obsDir);
	obsVecPos = obsVecDir.scale(earthRadius + obsHeight);
	starVecPos = starVecDir.scale(earthRadius + starHeight);
	obsGPVecPos = obsVecDir.scale(earthRadius);
	starGPVecPos = starVecDir.scale(earthRadius);
};

const drawLineWithExcess = (a, b, color) => {
	const excess = b.minus(a).normalized().scale(lineExcess);
	a = a.minus(excess);
	b = b.plus(excess);
	ctx.line(a, b, color);
};

const drawEarth = () => {
	ctx.circle([ 0, 0 ], earthRadius, COLOR.earth, COLOR.earthInterior);
};
const drawEarthCenter = () => {
	ctx.spot([ 0, 0 ], COLOR.spot);
};
const drawObserver = () => ctx.spot(obsVecPos, COLOR.spot);
const drawStar = () => ctx.star(starVecPos, starRadius, COLOR.star);
const drawObsStarSight = () => {
	drawLineWithExcess(obsVecPos, starVecPos, COLOR.starSight);
};
const drawDown = () => {
	const a = obsVecPos;
	const b = obsVecPos.minus(obsVecDir.scale(earthRadius + obsHeight - 5));
	ctx.arrow(a, b, COLOR.down);
};
const drawUp = () => {
	const a = obsVecPos;
	const b = obsVecPos.plus(obsVecDir.scale(arrowLen));
	ctx.arrow(a, b, COLOR.up);
};

const drawHorizon = () => {
	const hip = earthRadius + obsHeight;
	const adj = earthRadius;
	const dip = Trig.acos(adj/hip);
	const hrzVecDir = vec2(1, 0).rot(VARS.obsDir + dip);
	const hrzDist = (hip**2 - adj**2)**0.5;
	const hrzVecPos = obsVecPos.plus(hrzVecDir.scale(hrzDist));
	const a = obsVecPos.minus(hrzVecDir.scale(lineExcess));
	const b = hrzVecPos.plus(hrzVecDir.scale(lineExcess));
	ctx.line(a, b, COLOR.horizon);
	ctx.spot(hrzVecPos, COLOR.spot);
};
const drawEarthCenterStarLine = () => drawLineWithExcess(
	vec2(0, 0),
	starVecPos,
	COLOR.starSight,
);
const drawSextant = () => {
	const z1VecDir = vec2(0, 1).rot(VARS.obsDir + z1Dir);
	const z2VecDir = vec2(0, 1).rot(VARS.obsDir + z2Dir);
	ctx.arrow(obsVecPos, obsVecPos.plus(z1VecDir.scale(arrowLen)), COLOR.z1);
	ctx.arrow(obsVecPos, obsVecPos.plus(z2VecDir.scale(arrowLen)), COLOR.z2);
	let angA = VARS.obsDir + z1Dir;
	let angB = VARS.obsDir + z2Dir;
	if (z1Dir > z2Dir) {
		[ angA, angB ] = [ angB, angA ];
	}
	const reading = Number(Trig.toDeg(z2Dir - z1Dir).toFixed(1)) + '°';
	ctx.arc(obsVecPos, arrowLen/2, angA, angB, COLOR.angle);
	const textVecPos = obsVecPos.plus(vec2(0, 1).rot((angA + angB)/2).scale(arrowLen/2 + 3));
	ctx.fontSize(15);
	ctx.textAlign('left').textBaseline('middle');
	ctx.text(reading, textVecPos, COLOR.angle);
};
const drawObserverGP = () => {
	ctx.spot(obsGPVecPos, COLOR.spot);
};
const drawStarGP = () => {
	ctx.spot(starGPVecPos, COLOR.spot);
};
const drawGPDistanceArc = () => {
	const d360 = Trig.deg(360);
	let dif = (starDir - VARS.obsDir + d360)%d360;
	ctx.arc(vec2(0, 0), earthRadius, VARS.obsDir, VARS.obsDir + dif, COLOR.angle);
	let dist = Trig.toRad(dif)*earthRadiusMiles;
	let text = Number(dist.toFixed(2)) + ' mi';
	const midDirVec = vec2(0, 1).rot(VARS.obsDir + dif/2);
	ctx.textAlign('right').textBaseline('middle');
	ctx.text(text, midDirVec.scale(earthRadius - 10), COLOR.angle);
};

const render = () => {
	ctx.clear();
	recalculateVars();
	if (Toggles.get('observer')) {
		ctx.setCenter(...obsVecPos);
	} else {
		ctx.setCenter(0, 0);
	}
	if (Toggles.get('earth')) {
		drawEarth();
	}
	if (Toggles.get('star_gp_sight')) {
		drawEarthCenterStarLine();
	}
	if (Toggles.get('hrz')) {
		drawHorizon();
	}
	if (Toggles.get('down')) {
		drawDown();
	}
	if (Toggles.get('up')) {
		drawUp();
	}
	if (Toggles.get('star_sight')) {
		drawObsStarSight();
	}
	if (Toggles.get('arc')) {
		drawGPDistanceArc();
	}
	if (Toggles.get('sextant')) {
		drawSextant();
	}
	if (Toggles.get('star')) {
		drawStar();
	}
	if (Toggles.get('observer')) {
		drawObserver();
	}
	if (Toggles.get('earth')) {
		drawEarthCenter();
	}
	if (Toggles.get('gp')) {
		drawObserverGP();
	}
	if (Toggles.get('star_gp')) {
		drawStarGP();
	}
};

const frameLoop = () => {
	render();
	requestAnimationFrame(frameLoop);
};

export const init = (drawingContext) => {
	ctx = drawingContext;
	frameLoop();
};

Vars.add({
	label: 'Scale',
	name: 'scale',
	min: 0.0001,
	max: 40,
	init: Number((400/earthRadiusMiles).toPrecision(3)),
	ease: Vars.exp10,
	round: (val) => Number(val.toPrecision(3)),
	parse: (str) => str.replace(/px\/mi\s*$/i, ''),
	format: (val) => val + ' px/mi',
});

Vars.add({
	label: 'Observer position',
	name: 'obsDir',
	min: 0,
	max: 360,
	init: 15,
	round: (val) => Number(val.toFixed(1)),
	parse: (s) => Number(s.repalce(/\s*°\s*$/, '')),
	format: (val) => val + '°',
	map: (deg) => Trig.deg(deg),
	unmap: (angle) => Trig.toDeg(angle),
});

// Range.build({
// 	label: 'Observer height',
// 	min: 0,
// 	val: obsHeightMiles,
// 	max: 500,
// 	ease: Range.quadratic,
// 	round: (val) => Number(val.toPrecision(3)),
// 	format: (val) => val + ' mi',
// 	onchange: (val) => obsHeightMiles = val,
// });

// Range.build({
// 	label: 'Star position',
// 	min: 0,
// 	max: 360,
// 	val: Number(Trig.toDeg(starDir).toFixed(1)),
// 	round: (val) => Number(val.toFixed(1)),
// 	format: (val) => val + '°',
// 	onchange: (val) => starDir = Trig.deg(val),
// });

Vars.add({
	label: 'Star height',
	name: 'star_height',
	init: 4000,
	min: 0,
	max: 1e6,
	ease: Vars.quadratic,
	round: (val) => Number(val.toPrecision(3)),
	format: (val) => val + ' mi',
});

// Range.build({
// 	label: 'Sextant. Z1',
// 	min: 0,
// 	val: Math.round(Trig.toDeg(z1Dir)),
// 	max: 180,
// 	ease: Range.linear,
// 	round: (val) => Number(val.toFixed(1)),
// 	format: (val) => val + '°',
// 	onchange: (val) => z1Dir = Trig.deg(val),
// });

// Range.build({
// 	label: 'Sextant. Z2',
// 	min: 0,
// 	val: Math.round(Trig.toDeg(z2Dir)),
// 	max: 180,
// 	ease: Range.linear,
// 	round: (val) => Number(val.toFixed(1)),
// 	format: (val) => val + '°',
// 	onchange: (val) => z2Dir = Trig.deg(val),
// });
