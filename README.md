# Capitalism

Every proxy software that is simple to use is hard to implement.

## pacgen.py

downloads `gfwlist.txt` from github, then convert it into a PAC file, then save to `generated.pac`.

## counting_socks.js

```bash
$ node counting_socks -p <PORT> -u <FILE>
```

starts a socks5 proxy on port <PORT> with username authentication. the list of active users will be read from <FILE>.

## authentify.js

```bash
$ node authentify.js -u USERID -l PORT -d DESTADDR:DESTPORT
```

starts a socks5 proxy on localhost:<PORT>, which pipes connections to the other socks5 proxy located at <DESTADDR:DESTPORT>, authenticating with username <USERID>.
