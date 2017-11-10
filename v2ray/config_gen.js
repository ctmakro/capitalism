const uuidv4 = require('uuid/v4');

// generate user profiles

var user_records = [
  {
    email:'abc@example.com',
    hash:uuidv4(),
  },
  {
    email:'abc@example.com',
    hash:uuidv4(),
  }
]

function generate_user_config(user_records){
  return user_records.map(u=>({
    id:u.hash,
    alterId:1,
    level:0,
    email:u.email,
    security:'chacha20-poly1305',
  }))
}

var users = generate_user_config(user_records)

// server_profiles

var server_listen_port = 8448
var server_address = '127.0.0.1'

var client_listen_port = 1086

// generate config

function generate_config(role){
  // role can be 'server' or 'client'

  var serving = role==='server'

  var config =
  {
    "log": {},
    "dns": {},
    "routing": {},
    "inbound": {},
    "outbound": {},
    "inboundDetour": [],
    "outboundDetour": [],
    "transport": {}
  }

  config.log.access = 'access.log'
  config.log.error = 'error.log'
  config.log.loglevel = 'warning'

  // connection & routing

  config.routing.strategy = 'rules'
  config.routing.settings = {}

  if(serving){
    config.inbound = {
      protocol:'vmess',

      port:server_listen_port,

      listen:'0.0.0.0',

      settings:{
        clients:users
      },
      streamSettings:{
        network:'kcp'
      },
      tag:'vmess-incoming',

    }

    config.outbound = { // default outbound channel if not specified.
      protocol:'freedom',
      tag:'direct',
      settings:{
        timeout:10,
      }
    }

    config.outboundDetour = [ // outbound channels that can be specified.
      {
        protocol:'blackhole',
        tag:'blocked',
        settings:{}
      }
    ]

    config.routing.settings.rules = [
      {
        // local addresses goes to 'blocked'
        type: "field",
        "ip": [
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
        ],
        "outboundTag": "blocked"
      },
      // otherwise goes to default
    ]
  }else{ // client connections

    config.inbound = {
      protocol:'socks',

      port:client_listen_port,
      listen:'0.0.0.0',
      settings:{
        auth:'noauth',
        udp:true,
        ip:'0.0.0.0'
      },
      tag:'socks-incoming',
    }

    config.outbound = { // default outbound channel
      protocol:'vmess',
      tag:'vmess-outgoing',

      settings:{
        vnext:[ // array of servers
          {
            address:server_address,
            port:server_listen_port,
            users:users,
          }
        ]
      },

      streamSettings:{
        network:'kcp'
      }
    }

    config.outboundDetour = [ // if not matching any rule
      {
        protocol:'freedom',
        tag:'direct',
        settings:{
          timeout:0,
        }
      }
    ]

    config.routing.settings.rules = [
      { // local addresses
        type: "field",
        "ip": [
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
        ],
        "outboundTag": "direct"
      },
      // domestic addresses
      {
        type:'chinaip',
        outboundTag:'direct'
      },
      {
        type:'chinasites',
        outboundTag:'direct'
      },

      // rest goes to default
    ]
  }

  // transport global
  config.transport = {
    "tcpSettings": {},
    "kcpSettings": {},
    "wsSettings": {}
  }

  // only kcp setting is important
  config.transport.kcpSettings = {
    "mtu": 1350,
    "tti": 20,
    "uplinkCapacity": 2,
    "downlinkCapacity": 5,
    "congestion": false,
    "readBufferSize": 2,
    "writeBufferSize": 2,
    "header": {
      // "type": "none"
      type:'wechat-video' // might work
    }
  }

  return config
}

var fs = require('fs')
var print = console.log

function writeconfig(role){
  var cfg = generate_config(role)
  fs.writeFileSync(`${role}.json`,JSON.stringify(cfg,null,2),'utf8')
  print(`file written to ${role}.json`)
}

writeconfig('server')
writeconfig('client')
