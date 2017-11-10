// a socks5 server that proxies incoming non-authenticated connections to another socks5 server with authentication.

// basically serves as a connector.

// I know, I know.

var socks5 = require('./socksv5')
// var socks5 = require('socksv5')
var print = console.log

//argparse section
var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'Authenticating Tunneling Socks5 proxy'
});
parser.addArgument(['-u','--username'],{
  help:'the username/id to connect to downstream socks5 proxy',
  required:true,
  metavar:'<STRING>',
})
parser.addArgument(['-l','--listen'],{
  help:'the port this proxy will listen on for incoming connections',
  metavar:'<PORT_NUMBER>',
  defaultValue:'1081'
})
parser.addArgument(['-d','--downstream'],{
  help:'the address and portnumber of the downstream proxy to connect to',
  metavar:'<IP/DOMAIN:PORT_NUMBER>',
  defaultValue:'127.0.0.1:1080'
})

var args = parser.parseArgs();

// from
var listen_addr = '0.0.0.0'
var listen_port = args.listen?Number(args.listen):1081

// to
var s = args.downstream.split(':')
if(s.length!==2){
  throw 'Unreconizable downstream address and port.'
}
var conn_addr = s[0]
var conn_port = Number(s[1])

var username = args.username.length?args.username:'test'

print(`username:`,username)
print('listening:',listen_port)
print('downstream:',`${conn_addr}:${conn_port}`)

var srv = socks5.createServer(function(info, accept, deny) {
  var incoming_socket = accept(true);

  // okay we got incoming connection. now create a corresponding connection to another socks5 server

  var outgoing_client = socks5.connect({
    host: info.dstAddr,
    port: info.dstPort,
    proxyHost: conn_addr,
    proxyPort: conn_port,
    localDNS: false,
    auths: [ socks5.auth.UserPassword('qin','ash') ]
  })
  .on('error',err=>{
    print('outgoint_client error')
    print(err)
  })
  .on('connect',outgoing_socket=>{
    // now pipe the incoming socket to its destination
    incoming_socket.pipe(outgoing_socket).pipe(incoming_socket)
    
    var error_handler = function(err){
      // if connection failed
      print('fuck')
      print(err)
    }

    incoming_socket.on('error',error_handler)
    outgoing_socket.on('error',error_handler)

    print(`[authentify] piping connection heading ${info.dstAddr}:${info.dstPort} to downstream proxy on ${conn_addr}:${conn_port}`)

    // let the event system do its job
  })
})

srv.listen(listen_port, listen_addr, function() {
  print(`[authentify] listening on port ${listen_port}`)
});

srv.useAuth(socks5.auth.None());
