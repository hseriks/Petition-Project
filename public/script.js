// When true, moving the mouse draws on the canvas

let isDrawing = false;
let x = 0;
let y = 0;

console.log("acces to the file");


var ratio = Math.max(window.devicePixelRatio || 1, 1);
// canvas.getContext("2d").scale(ratio, ratio);

const canvas = document.getElementById("canvas");

canvas.width = canvas.offsetWidth * ratio;
canvas.height = canvas.offsetHeight * ratio;
const context = canvas.getContext("2d");
let signature = canvas.toDataURL();

console.log(canvas);

// event.offsetX, event.offsetY gives the (x,y) offset from the edge of the canvas.

// Add the event listeners for mousedown, mousemove, and mouseup
canvas.addEventListener("mousedown", (e) => {
    console.log("mousedown");
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    console.log(x,y);
    if (isDrawing === true) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

canvas.addEventListener("mouseup", (e) => {
    console.log("mouseup");

    if (isDrawing === true) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = 0;
        y = 0;
        isDrawing = false;
    }
});

function drawLine(context, x1, y1, x2, y2) {
    signature = canvas.toDataURL();
    console.log(context);
    console.log("works");
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}


const login = document.getElementById("login");

const submit = document.getElementById("button");


submit.addEventListener("click", () => {
    document.getElementById("signature").value = signature;
});

login.addEventListener("click", () => {
    console.log("login pressed");
});