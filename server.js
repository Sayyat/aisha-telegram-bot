const app = require('./telegram');
const http = require('http');

http.createServer(app).listen(process.env.PORT);