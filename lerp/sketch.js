const CANVAS_WIDTH = Math.min(window.innerWidth-15, 500);
const CANVAS_HEIGHT = CANVAS_WIDTH;

const CIRCLE_DIAMETER = 40;
const CIRCLE_RADIUS = CIRCLE_DIAMETER / 2;

const PATH_CIRCLE_DIAMETER = 20;
const MIN_PATH_CIRCLE_DIAMETER = 4; // keeps circles visible where the velocity is near 0
const VELOCITY_SAMPLE_OFFSET = 0.001;

const ANIMATION_DURATION = 1.5; // seconds

const EASING_FUNCTIONS = {
    linear: (x) => x,

    easeInQuad: (x) => x * x,
    easeOutQuad: (x) => 1 - (1 - x) * (1 - x),
    easeInOutQuad: (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,

    easeInCubic: (x) => x * x * x,
    easeOutCubic: (x) => 1 - Math.pow(1 - x, 3),
    easeInOutCubic: (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,

    easeOutBack: (x) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    },

    easeOutBounce: (x) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (x < 1 / d1) {
            return n1 * x * x;
        } else if (x < 2 / d1) {
            return n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
            return n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
            return n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
    },
};

let b_play = document.getElementById('b_play');
let sel_easing = document.getElementById('sel_easing');
let cb_scaleByVelocity = document.getElementById('cb_scaleByVelocity');
let i_pathCountSlider = document.getElementById('i_pathCountSlider');
let l_pathCount = document.getElementById('l_pathCount');

let startPoint;
let endPoint;

let draggedPoint = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let isPlaying = false;
let animationTimer = 0;


function isMouseOver(point) {
    return dist(mouseX, mouseY, point.x, point.y) <= CIRCLE_RADIUS;
}


// The end point is drawn on top, so it gets picked first when the two overlap
function getPointUnderMouse() {
    if (isMouseOver(endPoint)) {
        return endPoint;
    }
    if (isMouseOver(startPoint)) {
        return startPoint;
    }
    return null;
}


// Returns the position of the circle at time t (0 to 1), after applying the selected easing
function getPositionAt(t) {
    const easedT = EASING_FUNCTIONS[sel_easing.value](t);
    return {
        x: lerp(startPoint.x, endPoint.x, easedT),
        y: lerp(startPoint.y, endPoint.y, easedT),
    };
}


// Returns how fast the eased value is changing at time t, relative to linear motion.
// 1 is the same speed as linear, 2 is twice as fast, and 0 is stopped.
function getRelativeSpeedAt(t) {
    const ease = EASING_FUNCTIONS[sel_easing.value];
    const change = ease(t + VELOCITY_SAMPLE_OFFSET) - ease(t - VELOCITY_SAMPLE_OFFSET);
    return Math.abs(change) / (2 * VELOCITY_SAMPLE_OFFSET);
}


function getPathCircleDiameter(t) {
    if (!cb_scaleByVelocity.checked) {
        return PATH_CIRCLE_DIAMETER;
    }
    return Math.max(PATH_CIRCLE_DIAMETER * getRelativeSpeedAt(t), MIN_PATH_CIRCLE_DIAMETER);
}


function updateAnimation() {
    if (!isPlaying) {
        return;
    }

    animationTimer += deltaTime / 1000;
    if (animationTimer >= ANIMATION_DURATION) {
        isPlaying = false;
    }
}


function drawPath() {
    noStroke();
    fill(0, 0, 0, 40);

    // Spaces the circles evenly between the endpoints, so 19 circles are at t = 0.05, 0.1, ... 0.95
    const pathCount = parseInt(i_pathCountSlider.value);
    for (let i = 1; i <= pathCount; i++) {
        const t = i / (pathCount + 1);
        const position = getPositionAt(t);
        circle(position.x, position.y, getPathCircleDiameter(t));
    }
}


function drawEndpoint(point, r, g, b) {
    stroke(0, 0, 0);
    strokeWeight(2);
    fill(r, g, b);
    circle(point.x, point.y, CIRCLE_DIAMETER);
}


function drawMovingCircle() {
    if (!isPlaying) {
        return;
    }

    const position = getPositionAt(animationTimer / ANIMATION_DURATION);
    noStroke();
    fill(0, 0, 0);
    circle(position.x, position.y, CIRCLE_DIAMETER);
}


function updateCursor() {
    if (draggedPoint !== null) {
        cursor('grabbing');
    }
    else if (getPointUnderMouse() !== null) {
        cursor('grab');
    }
    else {
        cursor(ARROW);
    }
}


function setup() {
    let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('canvasContainer');

    startPoint = createVector(CANVAS_WIDTH * 0.2, CANVAS_HEIGHT * 0.8);
    endPoint = createVector(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.2);
}


function draw() {
    background(240, 240, 240);

    updateAnimation();
    updateCursor();

    drawPath();
    drawEndpoint(startPoint, 221, 101, 101);
    drawEndpoint(endPoint, 103, 103, 209);
    drawMovingCircle();
}


function mousePressed() {
    draggedPoint = getPointUnderMouse();
    if (draggedPoint !== null) {
        dragOffsetX = draggedPoint.x - mouseX;
        dragOffsetY = draggedPoint.y - mouseY;
    }
}


function mouseDragged() {
    if (draggedPoint === null) {
        return;
    }

    // Keep the whole circle on the canvas so it can always be grabbed again
    draggedPoint.x = constrain(mouseX + dragOffsetX, CIRCLE_RADIUS, CANVAS_WIDTH - CIRCLE_RADIUS);
    draggedPoint.y = constrain(mouseY + dragOffsetY, CIRCLE_RADIUS, CANVAS_HEIGHT - CIRCLE_RADIUS);
}


function mouseReleased() {
    draggedPoint = null;
}


function updatePathCountLabel() {
    l_pathCount.textContent = i_pathCountSlider.value;
}


b_play.addEventListener("click", () => {
    animationTimer = 0;
    isPlaying = true;
});

i_pathCountSlider.addEventListener("input", updatePathCountLabel);

// Browsers can restore the slider's position on reload, so sync the label on load
updatePathCountLabel();
