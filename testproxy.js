var socks5 = require('./socksv5')
// var socks5 = require('socksv5')
var print = console.log

var outgoing_client = socks5.connect({
  host: 'www.baidu.com',
  port: 80,
  proxyHost: 'localhost',
  proxyPort: 1085,
  localDNS: false,
  auths: [ socks5.auth.UserPassword('qin','ash') ]
})
.on('error',err=>{
  print('outgoint_client error')
  print(err)
})
.on('connect',outgoing_socket=>{
  var error_handler = function(err){
    // if connection failed
    print('fuck')
    print(err)
  }

  // incoming_socket.on('error',error_handler)
  outgoing_socket.on('error',error_handler)

  // print(`[authentify] piping connection heading ${info.dstAddr}:${info.dstPort} to downstream proxy on ${conn_addr}:${conn_port}`)

  // now pipe the incoming socket to its destination
  // outgoing_socket.pipe(incoming_socket)
  // incoming_socket.pipe(outgoing_socket)
  outgoing_socket.write('GET / HTTP/1.0\r\n\r\n')
  outgoing_socket.pipe(process.stdout)

  // let the event system do its job
})
