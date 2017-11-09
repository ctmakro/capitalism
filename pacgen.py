
# download gfwlist and generate pac

import requests,base64,re,time

gfwlist = 'https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt'

def check_existence(path):
    import os.path
    return os.path.exists(path)

def down_if_nonexistent(url,name_of_file):
    if check_existence(name_of_file):
        print('file {} exists, not downloading.'.format(name_of_file))
    else:
        print("downloading from {}...".format(url))
        r = requests.get(url,verify=False)
        with open(name_of_file, "wb") as f:
             f.write(r.content)
        print('done!')

def down_and_read(url,name_of_file):
    down_if_nonexistent(url,name_of_file)
    with open(name_of_file,'r') as f:
        content = f.read()
    return content

def obtain_gfwlist():
    name_of_file = 'gfwlist.txt'
    content = down_and_read(gfwlist, name_of_file)
    decoded = base64.b64decode(content).decode('ascii')
    return decoded

def obtain_and_show_gfwlist():
    decoded = obtain_gfwlist
    print(decoded)

# copied from https://github.com/vangie/gfwlist2pac/blob/master/gfwlist2pac.py
def wildcardToRegexp(pattern):
    pattern = re.sub(r"([\\\+\|\{\}\[\]\(\)\^\$\.\#])", r"\\\1", pattern);
    #pattern = re.sub(r"\*+", r"*", pattern)
    pattern = re.sub(r"\*", r".*", pattern)
    pattern = re.sub(r"\？", r".", pattern)
    return pattern;

def parseRuleList(ruleList):
    directWildcardList = []
    directRegexpList = []
    proxyWildcardList = []
    proxyRegexpList = []
    for line in ruleList.splitlines()[1:]:
        # 忽略注释
        if (len(line) == 0) or (line.startswith("!")) or (line.startswith("[")):
            continue

        isDirect = False
        isRegexp = True

        origin_line = line

        # 例外
        if line.startswith("@@"):
            line = line[2:]
            isDirect = True

        # 正则表达式语法
        if line.startswith("/") and line.endswith("/"):
            line = line[1:-1]
        elif line.find("^") != -1:
            line = wildcardToRegexp(line)
            line = re.sub(r"\\\^", r"(?:[^\w\-.%\u0080-\uFFFF]|$)", line)
        elif line.startswith("||"):
            line = wildcardToRegexp(line[2:])
            # When using the constructor function, the normal string escape rules (preceding
            # special characters with \ when included in a string) are necessary.
            # For example, the following are equivalent:
            # re = new RegExp("\\w+")
            # re = /\w+/
            # via: http://aptana.com/reference/api/RegExp.html
            line = r"^[\\w\\-]+:\\/+(?!\\/)(?:[^\\/]+\\.)?" + line
        elif line.startswith("|") or line.endswith("|"):
            line = wildcardToRegexp(line)
            line = re.sub(r"^\\\|", "^", line, 1)
            line = re.sub(r"\\\|$", "$", line)
        else:
            isRegexp = False

        if not isRegexp:
            if not line.startswith("*"):
                line = "*" + line
            if not line.endswith("*"):
                line += "*"

        if isDirect:
            if isRegexp:
                directRegexpList.append(line)
            else:
                directWildcardList.append(line)
        else:
            if isRegexp:
                proxyRegexpList.append(line)
            else:
                proxyWildcardList.append(line)

        # if config['debug']:
        #     with open('debug_rule.txt', 'a') as f:
        #         f.write("%s\n\t%s\n\n" % (origin_line, line))

    return directRegexpList, directWildcardList, proxyRegexpList, proxyWildcardList

def convertListToJSArray(lst):
    lst = filter(lambda s: isinstance(s, (str)) and len(s) > 0, lst)
    array = "',\n    '".join(lst)
    if len(array) > 0:
        array = "\n    '" + array + "'\n    "
    return '[' + array + ']'

def generatePACRuls(userRules, gfwListRules):
    directRegexpList, directWildcardList, proxyRegexpList, proxyWildcardList = gfwListRules
    directUserRegexpList, directUserWildcardList, proxyUserRegexpList, proxyUserWildcardList = userRules

    rules = '''
// user rules
var directUserRegexpList   = %s;
var directUserWildcardList = %s;
var proxyUserRegexpList    = %s;
var proxyUserWildcardList  = %s;
// gfwlist rules
var directRegexpList   = %s;
var directWildcardList = %s;
var proxyRegexpList    = %s;
var proxyWildcardList  = %s;
''' % ( convertListToJSArray(directUserRegexpList),
        convertListToJSArray(directUserWildcardList),
        convertListToJSArray(proxyUserRegexpList),
        convertListToJSArray(proxyUserWildcardList),
        convertListToJSArray(directRegexpList),
        convertListToJSArray(directWildcardList),
        convertListToJSArray(proxyRegexpList),
        convertListToJSArray(proxyWildcardList)
    )
    return rules

def CreatePacFile(userRules, gfwlistRules, config=None):
    pacContent = '''/**
 * gfwlist2pac %(ver)s http://codelife.me
 * Generated: %(generated)s
 * GFWList Last-Modified: %(gfwmodified)s
 */
// proxy
var P = "%(proxy)s";
var D = "%(direct)s";
%(rules)s
function FindProxyForURL(url, host) {
    var regExpMatch = function(url, pattern) {
        try {
            return new RegExp(pattern).test(url);
        } catch(ex) {
            return false;
        }
    };

    var i = 0;
    for (i in directUserRegexpList) {
        if(regExpMatch(url, directUserRegexpList[i])) return D;
    }
    for (i in directUserWildcardList) {
        if (shExpMatch(url, directUserWildcardList[i])) return D;
    }
    for (i in proxyUserRegexpList) {
        if(regExpMatch(url, proxyUserRegexpList[i])) return P;
    }
    for (i in proxyUserWildcardList) {
        if(shExpMatch(url, proxyUserWildcardList[i])) return P;
    }
    for (i in directRegexpList) {
        if(regExpMatch(url, directRegexpList[i])) return D;
    }
    for (i in directWildcardList) {
        if (shExpMatch(url, directWildcardList[i])) return D;
    }
    for (i in proxyRegexpList) {
        if(regExpMatch(url, proxyRegexpList[i])) return P;
    }
    for (i in proxyWildcardList) {
        if(shExpMatch(url, proxyWildcardList[i])) return P;
    }
    return D;
}
'''
    VERSION = 'n/a'
    gfwlistModified = 'n/a'
    result = {'ver': VERSION,
              'generated': time.strftime('%a, %d %b %Y %H:%M:%S GMT', time.gmtime()),
              'gfwmodified': gfwlistModified,
              'proxy': config['proxy'],
              'direct': config['direct'],
              'rules': generatePACRuls(userRules, gfwlistRules)
    }
    pacContent = pacContent % result
    # with open(config['pacFilename'], 'w') as handle:
    #     handle.write(pacContent)
    return pacContent


if __name__ == '__main__':
    decoded = obtain_gfwlist()
    four = dr,dw,pr,pw = parseRuleList(decoded)

    for i in four:
        print('length:',len(i))

    behind_wall = 'SOCKS5 127.0.0.1:8118'
    within_wall = 'DIRECT; SOCKS5 127.0.0.1:8118'

    print('unblocked addresses goes to:',within_wall)
    print('blocked addresses goes to:',behind_wall)

    pacfile = CreatePacFile([[],[],[],[]],four,{
        'proxy':behind_wall,
        'direct':within_wall,
    })
    # print(four)
    pacfn = 'generated.pac'
    with open(pacfn,'w') as f:
        f.write(pacfile)
    print('pac file successfully written to {}.'.format(pacfn))
