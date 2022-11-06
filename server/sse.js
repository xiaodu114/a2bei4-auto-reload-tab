const http = require("http");

http.createServer(function (req, res) {
    if (req.url.indexOf("/reload-page-by-sse") >= 0) {
        res.setHeader("Access-Control-Allow-Origin", "*");

        res.setHeader("Connection", "keep-alive");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Content-Type", "text/event-stream");

        setInterval(function () {
            res.write("data: 时间为：" + new Date() + "\n\n");
        }, 3000);
    }
}).listen(8899, "127.0.0.1");
