// testing udp relay with nodejs

const dgram = require('dgram');

function create_server(){
  const server = dgram.createSocket('udp4');

  server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
  });

  server.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  });

  server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });

  server.bind(9229);
}

function create_client(){
  const client = dgram.createSocket('udp4');

  const buf1 = Buffer.from('Some ');
  const buf2 = Buffer.from('bytes');

  // socket.send(msg, [offset, length,] port [, address] [, callback])
  client.send([buf1, buf2], 9229, '54.214.61.47', (err) => {
    client.close();
  });
}

create_server()
create_client()
