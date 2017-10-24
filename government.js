// udp server capable of session state machines.

const dgram = require('dgram');
var make = require('../meik/meik.js')
var print = console.log

var sid = 0 // session id.
var sessions = {}

function get_sid(){ // mechanism to generate new sids.
  var t = sid
  sid=(sid+1)%(65535*65537) // 4byte
  return sid
}

// udp packet sender
var Sender = make(p=>{
  p.init = function(){
    this.client = dgram.createSocket('udp4');
  }
  p.send(buffer,port,addr){
    client.send([buf1, buf2], 41234, '127.0.0.1', (err) => {
      client.close();
    });
  }
})

// the session class
var Session = make(p=>{
  p.init = function(rinfo){ // remote info object
    this.id = get_sid()
    this.remote_port = rinfo.port
    this.remote_addr = rinfo.address
    this.lom = [] // list of messages
  }
  p.recv = function(msg){
    this.lom.push(msg)
  }
  p.send = function(msg){

  }
  p.print_all = function(){
    print(`id: ${this.id}`)
    this.lom.map(x=>{print(x)})
  }
})

// the server class
var Server = make(p=>{
  p.init = function(){
    var s = dgram.createSocket('udp4')
    this.server = s

    s.on('error',this.onerr)
    s.on('message',this.onmsg)
    s.on('listening',this.oncreate)

    s.bind(9229)
  }

  p.onerr = function(err){
    console.log(`server error:\n${err.stack}`)
    this.server.close()
    process.exit(0)
  }

  p.onmsg = function(msg, rinfo){
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    // in order to determine which session this message belongs
    // we have to examine its session id.
    // session id comes from the first 4 bytes
    var id = msg[0]*16777216 + msg[1]*65536 + msg[2]*256 + msg[3]
    if(id===0){
      // zero -> create a new session and return sid to client
      print('creating new session')
      var sess = new Session(rinfo)

      // add this session to session dictionary
      sessions[sess.id]=sess

    }


  }

  p.oncreate = function(){
    var address = this.server.address();
    console.log(`server listening ${address.address}:${address.port}`);
  }
})
