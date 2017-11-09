var socks5 = require('./socksv5')
var irc = require('ip-range-check')
var fs = require('fs')
var print = console.log

//argparse section
var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'Socks5 server with username authentication'
});
parser.addArgument(['-p','--port'],{
  help:'the port number to listen on',
  required:true,
  metavar:'<PORT_NUMBER>',
  defaultValue:'1080',
})
parser.addArgument(['-u','--users'],{
  help:'the plaintext file that contains a list of usernames',
  metavar:'<FILE_NAME>',
  defaultValue:'userlist.txt'
})
parser.addArgument(['-t','--test'],{
  help:'mode without authentication',
  nargs:0,
})

var args = parser.parseArgs();

// main program

var userlist = fs.readFileSync(args.users,{
  encoding:'utf-8',
  flag:'r',
})
.split('\n')
.map(x=>x.trim())
.filter(x=>x.length>0)

print(`user list loaded from ${args.users}`)
print(`length: ${userlist.length}`)

var usermap = {}
userlist.map(str=>{usermap[str]=true})

var is_active = function(name){
  if(!usermap[name]){
    return false
  }
  return usermap[name]?true:false
}

const AccountChecker = function(){
  p = {}
  p.isAccountActive = function(account){
    return is_active(account)
  }
  return p
}

// from v2ray configuration
var non_accessible_ipranges = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "::1/128",
  "fc00::/7",
  "fe80::/10"
]

const CountingSocks = function(listen_port){
  var s5 = socks5.createServer(function(info,accept,deny){

    // check if destination IP is accessible
    var non_accessible = irc(info.dstAddr,non_accessible_ipranges)

    if(non_accessible){
      // deny service if not
      deny()
      print(`[socks5] deny connection to ${info.dstAddr}`)
    }else{
      accept()
      print(`[socks5] accept and proxy connection to ${info.dstAddr}:${info.dstPort}`)
    }
  })

  s5.listen(listen_port,'0.0.0.0',()=>{
    print(`[socks5] proxy created on port ${listen_port}`)
  });

  if(args.test!==undefined){
    s5.useAuth(socks5.auth.None());
  }else{
    var ac = AccountChecker()
    s5.useAuth(socks5.auth.UserPassword(function(user, password, cb) {
      // check if username(account) is active
      var activity = ac.isAccountActive(user)
      if(activity){
        print(`[socks5] user "${user}" active`)
        cb(true)
      }else{
        // deny service if not
        print(`[socks5] user "${user}" inactive/nonexist`)
        cb(false)
      }
    }));
  }
}

CountingSocks(Number(args.port))
