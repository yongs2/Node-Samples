const JsonSocket = require('./json-socket');

const options = { host: 'localhost', port: 4000 }

async function run() {
    let socket = new JsonSocket();
    socket.connect(options);

    let interval = setInterval(() => {
        console.log('sending', socket.write({
            "head":{
                "MsgName":"BIND_REQ",
                "Seq":1,
                "Ret":0,
                "Version":"1.0.0"
            },
            "body":{
                "szLoginId":"LOGIN_ID", "szToken":"TOKEN", "cRvSMS_F":0, "cRvMMS_F" : 0, "cEnc_F" : 0
            }
        }));
    }, 1000);

    socket.on('close', () => {
        clearInterval(interval);
        setTimeout(function() {
            connectToServer();
        }, 10000)
    });
    socket.on('error', console.error);
    socket.on('data', d => console.log(d));

    // socket.cork();
    // setTimeout(() => socket.uncork(), 10000);
}

run().catch(console.error);
