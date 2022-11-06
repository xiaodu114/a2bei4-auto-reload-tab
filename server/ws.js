const { WebSocketServer } = require("ws");
//const wss = new WebSocket.Server({ port: 8899, path: "reload-page-by-ws" }); // websocket的端口

const wss = new WebSocketServer({ port: 8080, path: "/reload-page-by-ws" });

wss.on("connection", function connection(ws) {
    // ws.on("message", function message(data) {
    //     console.log("received: %s", data);
    // });

    setInterval(function () {
        ws.send("data: 时间为：" + new Date() + "\n\n");
    }, 3000);
});
