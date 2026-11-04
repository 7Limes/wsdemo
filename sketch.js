const CANVAS_WIDTH = Math.min(window.innerWidth-15, 500);
const CANVAS_HEIGHT = CANVAS_WIDTH;
const DRAW_SCALE = CANVAS_WIDTH / 5;

const CANVAS_LEFT = CANVAS_WIDTH / DRAW_SCALE / -2
const CANVAS_RIGHT = CANVAS_WIDTH / DRAW_SCALE / 2;

const RESULT_VEC_TWEEN_DURATION = 0.25;

// Vector globals
let mouseVec = null;

let v1 = null;
let v2 = null;
let v3 = null;

let selectedVector = null;

let resultVectorStart = null;
let resultVectorTarget = null;
let resultVectorTweenTimer = 0.0;

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
let i_lerpTSlider = document.getElementById('i_lerpTSlider');
let l_lerpT = document.getElementById('l_lerpT');
let lerpTContainer = document.getElementById('lerpTContainer');

let cb_showV1 = document.getElementById('cb_showV1');
let cb_showV2 = document.getElementById('cb_showV2');
let cb_showV3 = document.getElementById('cb_showV3');
let cb_showV3AsPosition = document.getElementById('cb_showV3AsPosition');
let cb_showAngle = document.getElementById('cb_showAngle');
let cb_showTriangles = document.getElementById('cb_showTriangles');


class DrawableVector {
    constructor(x, y, color, selectable=true, arrowSize=10) {
        this.vector = createVector(x, y);
        this.color = color;
        this.selectable = selectable;
        this.arrowSize = arrowSize;
    }

    isMouseOver() {
        let checkPos = mouseVec.copy().mult(1 / DRAW_SCALE).sub(CENTER_POS);
        return checkPos.dist(this.vector) < 0.25;
    }

    draw(drawAsPosition=false) {
        const scaledVec = this.vector.copy().mult(DRAW_SCALE);

        if (drawAsPosition) {
            const pos = scaledVec.copy().add(CENTER_SCALED);
            push();
            noStroke();
            fill(this.color);
            circle(pos.x, pos.y, 10);
            pop();
        }
        else {
            drawArrow(CENTER_SCALED.x, CENTER_SCALED.y, scaledVec, this.color, this.arrowSize);
        }

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
function roundNumber(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}


function moveToward(from, to, delta) {
    if (Math.abs(to - from) <= delta) {
        return to;
    }
    return from + Math.sign(to - from) * delta;
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


function projectVector(v1, v2) {
    const scale = v1.dot(v2) / v2.dot(v2);
    return v2.copy().mult(scale);
}


function updateInputs() {
    i_v1x.value = roundNumber(v1.vector.x, 1);
    i_v1y.value = roundNumber(v1.vector.y, 1);
    i_v2x.value = roundNumber(v2.vector.x, 1);
    i_v2y.value = roundNumber(v2.vector.y, 1);
}


function drawGrid() {
    const LINE_COUNT = CANVAS_WIDTH / DRAW_SCALE;
    const OFFSET = DRAW_SCALE / 2;

    push();
    stroke(220, 220, 220);

    // Vertical lines
    for (let i = 0; i < LINE_COUNT; i++) {
        let x = i * DRAW_SCALE + OFFSET;
        line(x, 0, x, CANVAS_HEIGHT);

        push();
        fill(100, 100, 100);
        textAlign(CENTER, BOTTOM)
        text(i-2, x, CANVAS_HEIGHT)
        pop();
    }

    // Horizontal lines
    for (let i = 0; i < LINE_COUNT; i++) {
        let y = i * DRAW_SCALE + OFFSET;
        line(0, y, CANVAS_WIDTH, y);

        push();
        fill(100, 100, 100);
        textAlign(LEFT, CENTER)
        text(i-2, 3, y)
        pop();
    }

    pop();
}


function updateResultVector() {
    let result = null;
    switch (sel_operation.value) {
        case "add":
            result = v1.vector.copy().add(v2.vector);
            break;
        case "sub":
            result = v1.vector.copy().sub(v2.vector);
            break;
        case "dot":
            let dot = v1.vector.dot(v2.vector);
            result = createVector(dot, 0);
            break;
        case "norm_dot":
            let normDot = v1.vector.copy().normalize().dot(v2.vector.copy().normalize());
            result = createVector(normDot, 0);
            break;
        case "proj_1_on_2":
            result = projectVector(v1.vector, v2.vector);
            break;
        case "proj_2_on_1":
            result = projectVector(v2.vector, v1.vector);
            break;
        case "reflect_1_on_2":
            result = projectVector(v1.vector, v2.vector).mult(2).sub(v1.vector);
            break;
        case "reflect_2_on_1":
            result = projectVector(v2.vector, v1.vector).mult(2).sub(v2.vector);
            break;
        case "lerp":
            const t = parseInt(i_lerpTSlider.value) / 100;
            result = v1.vector.copy().lerp(v2.vector, t);
            break;
    }

    // Only restart tween when the target changes
    if (resultVectorTarget === null || !result.equals(resultVectorTarget)) {
        resultVectorStart = v3.vector.copy();
        resultVectorTarget = result;
        resultVectorTweenTimer = 0.0;
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

    const angleText = `${roundNumber(degrees(angle), 0)}°`;

    push();
    textAlign(CENTER, CENTER);
    text(angleText, labelPos.x, labelPos.y);
    fill(200, 150, 230, 128);
    noStroke();
    arc(CENTER_SCALED.x, CENTER_SCALED.y, 40, 40, v1.vector.heading(), v2.vector.heading())
    pop();
}


function drawVectorTriangles() {
    const v1Transformed = v1.vector.copy().add(CENTER_POS).mult(DRAW_SCALE);
    const v2Transformed = v2.vector.copy().add(CENTER_POS).mult(DRAW_SCALE);

    push();
    stroke(200, 150, 230, 200);
    drawingContext.setLineDash([5]);

    // v1 lines
    if (cb_showV1.checked) {
        line(CENTER_SCALED.x, CENTER_SCALED.y, v1Transformed.x, CENTER_SCALED.y);
        line(v1Transformed.x, v1Transformed.y, v1Transformed.x, CENTER_SCALED.y);
    }
    
    // v2 lines
    if (cb_showV2.checked) {
        line(CENTER_SCALED.x, CENTER_SCALED.y, v2Transformed.x, CENTER_SCALED.y);
        line(v2Transformed.x, v2Transformed.y, v2Transformed.x, CENTER_SCALED.y);
    }
    
    noStroke();

    // v1 text
    if (cb_showV1.checked) {
        fill(200, 40, 40);
        textAlign(CENTER);
        text(roundNumber(v1.vector.x, 1), CENTER_SCALED.x + v1.vector.x*DRAW_SCALE/2, CENTER_SCALED.y - 5);
        textAlign(LEFT, TOP);
        text(roundNumber(v1.vector.y, 1), CENTER_SCALED.x + v1.vector.x*DRAW_SCALE, CENTER_SCALED.y + v1.vector.y*DRAW_SCALE/2)
    }

    // v2 text
    if (cb_showV2.checked) {
        fill(40, 40, 200);
        textAlign(CENTER, TOP);
        text(roundNumber(v2.vector.x, 1), CENTER_SCALED.x + v2.vector.x*DRAW_SCALE/2, CENTER_SCALED.y + 5);
        textAlign(RIGHT);
        text(roundNumber(v2.vector.y, 1), CENTER_SCALED.x + v2.vector.x*DRAW_SCALE, CENTER_SCALED.y + v2.vector.y*DRAW_SCALE/2);
    }

    pop();
}

function drawResultVector(drawAsPosition=false) {
    if (resultVectorTarget !== null && resultVectorTweenTimer < RESULT_VEC_TWEEN_DURATION) {
        resultVectorTweenTimer = moveToward(resultVectorTweenTimer, RESULT_VEC_TWEEN_DURATION, deltaTime / 1000);
        const t = resultVectorTweenTimer / RESULT_VEC_TWEEN_DURATION;
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        v3.vector = p5.Vector.lerp(resultVectorStart, resultVectorTarget, eased);
    }

    v3.draw(drawAsPosition);
}


function setup() {
    let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('canvasContainer')

    CENTER_SCALED = createVector(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    CENTER_POS = CENTER_SCALED.copy().mult(1 / DRAW_SCALE);

    mouseVec = createVector(mouseX, mouseY);

    v1 = new DrawableVector(1, -1, color(255, 0, 0));
    v2 = new DrawableVector(1, 0.5, color(0, 0, 255));
    v3 = new DrawableVector(0, 0, color(0, 200, 0), false, 5);

    updateInputs();
}


function draw() {
    mouseVec.x = mouseX;
    mouseVec.y = mouseY;

    updateResultVector();

    background(240, 240, 240);
    drawGrid();

    if (cb_showTriangles.checked) {
        drawVectorTriangles();
    }

    if (cb_showV1.checked) {
        v1.draw();
    }
    if (cb_showV2.checked) {
        v2.draw();
    }
    if (cb_showV3.checked) {
        drawResultVector(cb_showV3AsPosition.checked);
    }

    if (cb_showAngle.checked && cb_showV1.checked && cb_showV2.checked) {
        drawAngleBetween();
    }

    if (selectedVector !== null) {
        let vec = mouseVec.copy().mult(1 / DRAW_SCALE).sub(CENTER_POS);
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
    input.value = roundNumber(vecObj.vector[axis], 1); // resync the field
}

i_v1x.addEventListener("change", () => setComponent(v1, 'x', i_v1x));
i_v1y.addEventListener("change", () => setComponent(v1, 'y', i_v1y));
i_v2x.addEventListener("change", () => setComponent(v2, 'x', i_v2x));
i_v2y.addEventListener("change", () => setComponent(v2, 'y', i_v2y));


// Click normalize buttons
b_normalizeV1.addEventListener("click", () => {
    v1.vector.normalize();
    updateInputs();
});

b_normalizeV2.addEventListener("click", () => {
    v2.vector.normalize();
    updateInputs();
});


sel_operation.addEventListener("change", () => {
    if (sel_operation.value === "lerp") {
        lerpTContainer.classList.remove("hidden");
    }
    else {
        lerpTContainer.classList.add("hidden");
    }
})


i_lerpTSlider.addEventListener("input", () => {
    l_lerpT.innerText = parseInt(i_lerpTSlider.value) / 100;
})