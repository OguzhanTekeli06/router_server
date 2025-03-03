/*
 * Sample restify server that also accepts socket.io connections.
 *
 * This example shows how to:
 *
 * - serve some API via Restify
 * - serve static files via Restify
 * - receive socket.io connection requests and reply with asynchronous messages (unicast and broadcast)
 */
import { Server } from "socket.io";
import restify from "restify";
import fs from "fs"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const
    SERVER_PORT = 8001,
    PATH_TO_CLIENT_SIDE_SOCKET_IO_SCRIPT = __dirname + "/node_modules/socket.io-client/dist/socket.io.min.js",
    server = restify.createServer(),
    io = new Server(server.server);

const clientsOnline = new Set();


// Body parser eklentisini kullanarak gelen JSON verilerini ayrıştırın
server.use(restify.plugins.bodyParser());


// async function random(req, res, next) { // burda üretileni socket.io ya gönder ve orda console a yazdır
//     try {
//         const responses = await io.timeout(2000).emitWithAck("login");
//         console.log('Received responses:', responses);
//     } catch (error) {
//         console.error('Error or timeout:', error);
//     }
//    res.send({ value: req.body });    
//     return next();
// }

async function kullanicibilgi(req, res, next) {
    try {
        const { email, password } = req.body; // İstekten e-posta ve şifre bilgilerini al
        const responses = await io.timeout(2000).emitWithAck("login", { email, password }); // tüm istemcilerde login olayını tetikler. her bir istemciden onay bekler.
        console.log('Received responses:', responses);
    } catch (error) {
        console.error('Error or timeout:', error);
    }
    res.send({ value: req.body });
    return next();
}

async function kullanicibilgi2(req, res, next) {
    try {
        const { email, password } = req.body; // İstekten e-posta ve şifre bilgilerini al
        const responses = await io.timeout(2000).emitWithAck("user-login", { email, password }); // tüm istemcilerde login olayını tetikler. her bir istemciden onay bekler.
        console.log('Received responses:', responses);
    } catch (error) {
        console.error('Error or timeout:', error);
    }
    res.send({ value: req.body });
    return next();
}

server.post("/login", function (req, res, next) {
    return kullanicibilgi(req, res, next);
    
  });

server.post("/user-login", function (req, res, next) {
    return kullanicibilgi2(req, res, next);
});

// serve client-side socket.io script
server.get('/socket.io.js', restify.plugins.serveStatic({
    directory: path.join(__dirname, 'node_modules', 'socket.io', 'client-dist'),
    file: 'socket.io.min.js'
  }));

server.get('/', function indexHTML(req, res, next) {
    fs.readFile(__dirname + '/public/index.html', function (err, data) {
        if (err) {
            next(err);
            return;
        }

        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(data);
        next();
    });
});

// serve static files under /public
/*
server.get("/*", restify.plugins.serveStatic({
    directory: __dirname + "/public",
    default: "index.html",
}));
*/

// handle socket.io clients connecting to us
io.sockets.on("connect", socket => {
    clientsOnline.add(socket);
    io.emit("clients-online", clientsOnline.size);

    
    socket.on('message', (msg) => {
        console.log('Message received:', msg);
    });
    // handle client disconnect
    socket.on("disconnect", () => {
        clientsOnline.delete(socket);
        io.emit("clients-online", clientsOnline.size);
    })
});

// send regular messages to all socket.io clients with the current server time
//setInterval(() => clientsOnline.size > 0 && io.emit("server-time", (new Date()).toISOString()), 100);

server.listen(SERVER_PORT, "0.0.0.0", () => console.log(`Listening at ${server.url}`));
