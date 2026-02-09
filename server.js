const express = require('express');
const path = require('path');
const app = express();

// Serve static files from 'static' directory
app.use('/static', express.static(path.join(__dirname, 'static')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'index.html'));
});

const port = 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${port}`);
});
