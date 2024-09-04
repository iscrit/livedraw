const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const countdownElement = document.getElementById('countdown');
const socket = new WebSocket('ws://localhost:8080'); // Update with your WebSocket server address

let drawing = false;
let currentColor = '#000000';
let lastDrawTime = Date.now();
let cooldown = 2000; // 2 seconds
let countdown = cooldown / 1000;

function startDrawing(e) {
    drawing = true;
    draw(e);
}

function stopDrawing() {
    drawing = false;
}

function draw(e) {
    if (!drawing) return;
    const now = Date.now();
    if (now - lastDrawTime < cooldown) {
        countdown = (cooldown - (now - lastDrawTime)) / 1000;
        countdownElement.textContent = `${Math.ceil(countdown)}s`;
        return;
    }

    countdown = cooldown / 1000;
    countdownElement.textContent = `${Math.ceil(countdown)}s`;
    lastDrawTime = now;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.fillStyle = currentColor;
    ctx.fillRect(x, y, 1, 1);

    // Send drawing data to the server
    socket.send(JSON.stringify({ x, y, color: currentColor }));
}

function changeColor(color) {
    currentColor = color;
}

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    ctx.fillStyle = data.color;
    ctx.fillRect(data.x, data.y, 1, 1);
};

socket.onopen = () => {
    console.log('WebSocket connection established');
};

socket.onerror = (error) => {
    console.error(`WebSocket error: ${error}`);
};

// Example of changing colors
document.body.addEventListener('keydown', function(e) {
    if (e.key === 'r') changeColor('#FF0000'); // Red
    if (e.key === 'g') changeColor('#00FF00'); // Green
    if (e.key === 'b') changeColor('#0000FF'); // Blue
});

// Download the canvas
function downloadCanvas() {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'drawing.png';
    link.click();
}

document.body.addEventListener('keydown', function(e) {
    if (e.key === 's') downloadCanvas(); // Save with 's' key
});
