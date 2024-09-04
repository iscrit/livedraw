const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

mongoose.connect('mongodb://localhost:27017/live-draw', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const drawingSchema = new mongoose.Schema({
    data: Array
});

const Drawing = mongoose.model('Drawing', drawingSchema);

let onlineUsers = 0;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', async (socket) => {
    onlineUsers++;
    io.emit('liveCount', onlineUsers);

    console.log('a user connected');

    // Send the saved drawing to the new user
    const savedDrawing = await Drawing.findOne({});
    if (savedDrawing) {
        socket.emit('load', savedDrawing.data);
    }

    socket.on('draw', async (data) => {
        socket.broadcast.emit('draw', data);

        // Save the drawing data to the database
        let drawing = await Drawing.findOne({});
        if (!drawing) {
            drawing = new Drawing({ data: [] });
        }
        drawing.data.push(data);
        await drawing.save();
    });

    socket.on('disconnect', () => {
        onlineUsers--;
        io.emit('liveCount', onlineUsers);
        console.log('user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
