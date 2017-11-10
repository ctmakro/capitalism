const { spawn } = require('child_process');
var print = console.log

var cwd = __dirname
var v2ray_dir = cwd + `/v2ray-v2.47-macos/`

function run(command,name){
  var first = command.shift()
  var proc = spawn(first, command, {
    cwd: v2ray_dir
  })

  var sp = name||first
  proc.stdout.on('data',data=>{
    print(`[${sp}][out] ${data}`)
  })
  proc.stderr.on('data',data=>{
    print(`[${sp}][err] ${data}`)
  })
  proc.on('close',code=>{
    print(`[${sp}][exit] code ${code}`)
  })

  return proc
}

function start_v2ray_with_config(jsonstring,name){
  var proc = run([
    './v2ray','-config=stdin:' // load from stdin
  ],name)

  proc.stdin.write(jsonstring)
  proc.stdin.end()
}

var fs = require('fs')
var serverconfig = fs.readFileSync('server.json','utf8')
var clientconfig = fs.readFileSync('client.json','utf8')


// start_v2ray_with_config(serverconfig,'server')
start_v2ray_with_config(clientconfig,'client')
