const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

const DROPDOWN_OPEN_DURATION = 0.5;

let dropdownArrow;
let dropdown;


class Dropdown {
    constructor(x, y, width, height, dropdownHeight, text, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.dropdownHeight = dropdownHeight;

        this.text = text;
        this.image = image;

        this.animTimer = 0.0;
        this.opening = false;

        this.prevMouseState = false;
    }

    isMouseOver() {
        return (
            mouseX >= this.x &&
            mouseX <= this.x+this.width &&
            mouseY >= this.y &&
            mouseY <= this.y+this.height
        );
    }

    draw() {
        this.checkClicked();

        const t = this.updateAnimation();

        // Draw rect
        if (this.isMouseOver()) {
            fill(200, 225, 255);
        }
        else {
            fill(200, 200, 200);
        }

        stroke(0, 0, 0);
        strokeWeight(2);
        rect(this.x, this.y, this.width, this.height);

        // Draw label
        noStroke();
        fill(0, 0, 0);
        textAlign(LEFT, CENTER);
        text(this.text, this.x + 5, this.y+this.height/2);

        // Draw dropdown box
        if (this.animTimer > 0) {
            const dropdownBoxHeight = lerp(0, this.dropdownHeight, t);
            push();
            clip(() => rect(this.x-2, this.y+this.height+1, this.width+4, dropdownBoxHeight));
            fill(200, 200, 200);
            stroke(0, 0, 0);
            strokeWeight(2);
            rect(this.x, this.y+this.height, this.width, dropdownBoxHeight);
            image(this.image, this.x+10, this.y+this.height+10, this.width-20, this.dropdownHeight-20);
            pop();
        }

        // Draw dropdown arrow
        push();
        translate(this.x+this.width-15, this.y+this.height/2);
        rotate(lerp(0, PI, t));
        imageMode(CENTER);
        image(dropdownArrow, 0, 0);
        pop();
    }

    checkClicked() {
        if (this.isMouseOver() && !this.prevMouseState && mouseIsPressed) {
            this.opening = !this.opening;
        }
        this.prevMouseState = mouseIsPressed;
    }

    updateAnimation() {
        if (this.opening) {
            this.animTimer = moveToward(this.animTimer, DROPDOWN_OPEN_DURATION, deltaTime/1000);
        }
        else {
            this.animTimer = moveToward(this.animTimer, 0, deltaTime/1000);
        }

        const t = this.animTimer / DROPDOWN_OPEN_DURATION;
        return this.opening ? easeOutBounce(t) : easeInOutCubic(t);
    }
}


function moveToward(from, to, delta) {
    if (Math.abs(to - from) <= delta) {
        return to;
    }
    return from + Math.sign(to - from) * delta;
}


function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutBounce(x) {
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
}


async function setup() {
    let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('canvasContainer');
    let image = await loadImage("assets/catthumbsup.gif");
    
    dropdownArrow = await loadImage("assets/dropdown-arrow.svg");

    dropdown = new Dropdown(100, 50, 300, 30, 200, "Click Here!", image);
}


function draw() {
    background(240, 240, 240);

    dropdown.draw();
}