#!/usr/bin/env node

const WebSocketServer = require('websocket').server;
const http = require('http');
const fs = require('fs');

const config = require('./config');


const {FirehoseDeltaHandler, FirehoseTraceHandler} = require('./firehose-handler');
const StateReceiver = require('../eosio-statereceiver');
const FirehoseWSClient = require('./firehose-ws-client');

global.clients = [];

class FirehoseWSServer {
    constructor(config) {
        this.config = config
    }

    log(msg){
        const dt = new Date()
        if (typeof msg !== 'string'){
            msg = JSON.stringify(msg)
        }
        console.log(dt + ' - ' + msg)
    }

    error(e){
        const dt = new Date()
        console.error(dt + ' - ' + e.message)
    }

    start(start_block){
        const self = this

        const sendIndex = (response) => {
            response.writeHead(200, {
                "Content-Type": "text/html"
            });
            fs.createReadStream("index.html").pipe(response)
        };


        const server = http.createServer(function(request, response) {
            // send test page
            sendIndex(response)
        });
        server.listen(config.firehose.httpPort, config.firehose.httpHost, function() {
            self.log(`Started http server on port ${config.firehose.httpPort}`)
        });

        // create the server
        const wsServer = new WebSocketServer({
            httpServer: server
        });

        // WebSocket server
        wsServer.on('request', this.onRequest.bind(this));


        // Start StateReceiver
        const delta_handler = new FirehoseDeltaHandler({config});
        const trace_handler = new FirehoseTraceHandler({config});
        console.log('starting state receiver')
        const br = new StateReceiver({startBlock: start_block, mode:0, config});
        br.registerDeltaHandler(delta_handler);
        br.registerTraceHandler(trace_handler);
        br.registerForkHandler(this.handleFork.bind(this));
        br.start()
    }

    handleFork(block_num){
        const self = this
        global.clients.forEach((client) => {
            const msg = `{"type":"fork", "data":{"new_head_block":${block_num}}}`
            self.log(msg)
            client.connection.send(msg)
        })
    }

    onRequest(request) {
        const self = this
        this.log('Connection from origin ' + request.origin);

        const connection = request.accept(null, request.origin);
        const client = new FirehoseWSClient({connection});
        const client_id = global.clients.push(client) - 1;

        connection.on('message', (message) => {
            if (message.type === 'utf8') {
                // process WebSocket message
                self.log('Received Message : ' + message.utf8Data);

                try {
                    const msg_obj = JSON.parse(message.utf8Data);
                    self.log(msg_obj);

                    client.register(msg_obj.type, msg_obj.data)
                }
                catch (e){
                    self.error(e)
                }
            }
        });
        connection.on('close', (code, reason) => {
            // close user connection
            self.log(`Peer ${client_id} disconnected.`);

            delete global.clients[client_id]
        });
    }

}

const start_block = 0xffffffff
const fhs = new FirehoseWSServer(config)
fhs.start(start_block)
