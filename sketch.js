const WIDTH = 500;
const HEIGHT = 500;
const DRAW_SCALE = 100;

let CANVAS_LEFT = WIDTH / DRAW_SCALE / -2
let CANVAS_RIGHT = WIDTH / DRAW_SCALE / 2;

// Vector globals
let mousePos = null;

let v1 = null;
let v2 = null;
let v3 = null;

let selectedVector = null;

let CENTER_POS = null;
let CENTER_SCALED = null;


// DOM Elements
let i_v1x = document.getElementById('i_v1x');
let i_v1y = document.getElementById('i_v1y');
let b_normalizeV1 = document.getElementById('b_normalizeV1');

let i_v2x = document.getElementById('i_v2x');
let i_v2y = document.getElementById('i_v2y');
let b_normalizeV2 = document.getElementById('b_normalizeV2');

let sel_operation = document.getElementById('sel_operation');


class DrawableVector {
    constructor(x, y, color, selectable=true, arrowSize=10) {
        this.vector = createVector(x, y);
        this.color = color;
        this.selectable = selectable;
        this.arrowSize = arrowSize;
    }

    isMouseOver() {
        let checkPos = mousePos.copy().mult(1 / DRAW_SCALE).sub(CENTER_POS);
        return checkPos.dist(this.vector) < 0.25;
    }

    draw() {
        const scaledVec = this.vector.copy().mult(DRAW_SCALE);
        drawArrow(CENTER_SCALED.x, CENTER_SCALED.y, scaledVec, this.color, this.arrowSize);

        if (this.selectable && this.isMouseOver() && selectedVector === null) {
            let drawPos = CENTER_POS.copy().add(this.vector).mult(DRAW_SCALE);

            if (mouseIsPressed) {
                selectedVector = this;
            }

            push();
            noStroke()
            fill(color(200, 200, 255, 128));
            circle(drawPos.x, drawPos.y, 25);
            pop();
        }
    }
}


// Source: https://editor.p5js.org/mahdadbor/sketches/evyWdjCSH
function drawArrow(x, y, vec, color, arrowSize) {
    push();
    stroke(color);
    strokeWeight(3);
    fill(color);
    translate(x, y);
    line(0, 0, vec.x, vec.y);
    rotate(vec.heading());
    translate(vec.mag() - arrowSize, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
}


// https://stackoverflow.com/a/7343013
function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}


function clampNumber(value, lower, upper) {
    if (value < lower) {
        return lower;
    }
    if (value > upper) {
        return upper;
    }
    return value;
}


function clampVector(vec, lower, upper) {
    vec.x = clampNumber(vec.x, lower, upper);
    vec.y = clampNumber(vec.y, lower, upper);
    return vec;
}


function updateInputs() {
    i_v1x.value = round(v1.vector.x, 1);
    i_v1y.value = round(v1.vector.y, 1);
    i_v2x.value = round(v2.vector.x, 1);
    i_v2y.value = round(v2.vector.y, 1);
}


function drawGrid() {
    const LINE_COUNT = WIDTH / DRAW_SCALE;
    const OFFSET = DRAW_SCALE / 2;

    push();
    stroke(220, 220, 220);

    for (let i = 0; i < LINE_COUNT; i++) {
        let x = i * DRAW_SCALE + OFFSET;
        line(x, 0, x, HEIGHT);
    }

    for (let i = 0; i < LINE_COUNT; i++) {
        let y = i * DRAW_SCALE + OFFSET;
        line(0, y, WIDTH, y);
    }

    pop();
}


function updateResultVector() {
    switch (sel_operation.value) {
        case "add":
            v3.vector = v1.vector.copy().add(v2.vector);
            break;
        case "sub":
            v3.vector = v1.vector.copy().sub(v2.vector);
            break;
        case "dot":
            let dot = v1.vector.dot(v2.vector);
            v3.vector = createVector(dot, 0);
            break;
    }
}


function drawAngleBetween() {
    const angle = v1.vector.angleBetween(v2.vector);
    const v1Norm = v1.vector.copy().normalize();
    const v2Norm = v2.vector.copy().normalize();
    let labelShiftVec = v1Norm.copy().add(v2Norm).setMag(40);

    if (angle < 0) {
        labelShiftVec = labelShiftVec.mult(-1);
    }
    const labelPos = CENTER_SCALED.copy().add(labelShiftVec);

    const angleText = `${round(degrees(angle), 0)}°`;

    push();
    textAlign(CENTER, CENTER);
    text(angleText, labelPos.x, labelPos.y);
    fill(200, 150, 230, 128);
    noStroke();
    arc(CENTER_SCALED.x, CENTER_SCALED.y, 40, 40, v1.vector.heading(), v2.vector.heading())
    pop();
}


function setup() {
    let canvas = createCanvas(WIDTH, HEIGHT);
    canvas.parent('canvasContainer')

    CENTER_SCALED = createVector(WIDTH/2, HEIGHT/2);
    CENTER_POS = CENTER_SCALED.copy().mult(1 / DRAW_SCALE);

    mousePos = createVector(mouseX, mouseY);

    v1 = new DrawableVector(1, -1, color(255, 0, 0));
    v2 = new DrawableVector(1, 0.5, color(0, 0, 255));
    v3 = new DrawableVector(0, 0, color(0, 255, 0), false, 5);
}


function draw() {
    mousePos.x = mouseX;
    mousePos.y = mouseY;

    updateResultVector();

    background(240, 240, 240);
    drawGrid();

    v1.draw();
    v2.draw();
    v3.draw();

    drawAngleBetween();

    if (selectedVector !== null) {
        let vec = mousePos.copy().mult(1 / DRAW_SCALE).sub(CENTER_POS);
        selectedVector.vector = clampVector(vec, CANVAS_LEFT, CANVAS_RIGHT);
        updateInputs();
    }
}


function mouseReleased() {
    selectedVector = null;
}


function setComponent(vecObj, axis, input) {
    const parsed = parseFloat(input.value);
    if (!Number.isNaN(parsed)) {
        vecObj.vector[axis] = clampNumber(parsed, CANVAS_LEFT, CANVAS_RIGHT);
    }
    input.value = round(vecObj.vector[axis], 1); // resync the field
}

i_v1x.addEventListener("change", () => setComponent(v1, 'x', i_v1x));
i_v1y.addEventListener("change", () => setComponent(v1, 'y', i_v1y));
i_v2x.addEventListener("change", () => setComponent(v2, 'x', i_v2x));
i_v2y.addEventListener("change", () => setComponent(v2, 'y', i_v2y));


// Click normalize buttons
b_normalizeV1.addEventListener("click", () => {
    v1.vector.normalize();
});

b_normalizeV2.addEventListener("click", () => {
    v2.vector.normalize();
});
