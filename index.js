var request = require('request').defaults({forever: true });;
var http = require("http");
var stops = {'>' : {'a' : 1 ,'b' : 9},'<' : {'a' : 1.8,'b' : 8.5}};
var lap = {};
var laps = [];
var logs = [];
var options = {
  url: 'https://www.eway.in.ua/ajax/getGpsData.php?city_key=kyiv&lang_key=ua&route_id=242',
  method: 'post',
  body: 'route_id=242&city_key=kyiv&lang_key=ua',
  headers: {
    'Host': 'www.eway.in.ua',
	'Connection': 'keep-alive',
	'Origin': 'https://www.eway.in.ua',
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
	'Content-Type': 'application/x-www-form-urlencoded',
	'Accept': '*/*',
	'Accept-Languages': 'ru-RU,ru;q=0.7,en-US;q=0.6,en;q=0.4',
	'X-Requested-With': 'XMLHttpRequest',
	'Referer': 'https://www.eway.in.ua/ua/cities/kyiv/routes/242',
	'Accept-Encoding': 'deflate, br',
	'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8,de;q=0.7,uk;q=0.6'
  }
};
var respData = "";
var respLog ="";
laps.forEach(function(lap){respData+="<p>"+lap.time+"</p>"});
//logs.slice(Math.max(logs.length - 5, 1)).forEach(function(log){
//respLog+=log[i]
//});
var respBody = 
'<!DOCTYPE html>'+
'<html lang="en">'+
'<head>'+
'    <meta charset="UTF-8" />'+
'    <title>Bus 37 time tracking</title>'+
'</head>'+
'<body>'+
'<h1>Bus 37 time tracking</h1>'+ respData +
'    <table>'+
'    <tr>'+
'        <td></td>'+
'    </tr>'+
'    </table>'+
'</body>'+
'</html>';

var server = http.createServer(function(request, response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  response.write(respBody);
  response.end();
});
server.listen(8080);

request(options, callback);

setInterval(function(){
    request(options, callback);//.on('error', function(e){console.log(e) }).end();
   }, 30000);

function callback(error, response, body) {
  
  var dn, vn, dis, lt, ln, t, tds, bs, gps, param;

  if (!error && response.statusCode == 200) {
    
    log("Response OK");

    try {

        gps = MouseEnter(body);
    
    } catch (e) {
    
        log(e);
        gps = false;
    
    };

    if(gps){

    for(bus in gps[242]){

        var msg = "";
        bs = gps[242][bus];
    	dn = (bs['d_n']==1)?'<':'>';
    	vn = bs['v_n'];
    	dis = bs['dis'];
        tds = bs['d_ts'];
    	
            if(!lap[vn])lap[vn] = {};
    		msg = vn+" "+dn+" "+dis;
    		if(lap[vn].aState){
                msg+=" From: "+lap[vn].aState.dis;
                msg+=" Time: "+sec((tds-lap[vn].aState.d_ts)*1000);
                msg+=" Dist: "+r4((dis-lap[vn].aState.dis));
            };
            log(msg);
    		if(!lap[vn].aState){
    			if((dis >= stops[dn].a)&&(dis < stops[dn].b)){
    				lap[vn].aState = {};
    				for(param in gps[242][bus]){
    					lap[vn].aState[param] = gps[242][bus][param];
                        //log("aState Add "+param+": "+gps[242][bus][param])
    				}
    				log(vn+': aState added');
    			};
    		} else if(bs['d_n'] !== lap[vn].aState.d_n){
                log(vn+' NULL aState');
                lap[vn].aState = null; //remove aState if bState in that direction didn't happen
            } else if(!lap[vn].bState){
    			if(dis >= stops[dn].b){
    				if(!lap[vn].bState)lap[vn].bState = {};
    				for(param in gps[242][bus]){
    					lap[vn].bState[param] = gps[242][bus][param];
    				}
                    lap[vn].time = lap[vn].bState.d_ts - lap[vn].aState.d_ts;
    				laps.push(lap[vn]);
                    console.log("\x1b[32m%s\x1b[0m","---------------------------");
                    log(vn+': bState added ');
                    msg = new Date().toTimeString().slice(0,8)+" ";
                    msg += vn+" "+dn;
                    msg +=" at:"+(new Date(lap[vn].aState.d_ts*1000)).toTimeString().slice(0,8);
                    msg +=" TIME: "+sec(lap[vn].time);
                    msg +=" From:"+lap[vn].aState.dis;
                    msg +=" to:"+lap[vn].bState.dis;
                    console.log("\x1b[32m%s\x1b[0m",msg);
                    console.log("\x1b[32m%s\x1b[0m","---------------------------");
                    lap[vn]={};
    			}
    		}
            
    }
	}
  } else {
  	 if(error)console.log(error);
  	 if(body)console.log(body);
  }
};

MouseEnter = function(a) {
    var f = 0,
        e = 0,
        b = JSON.parse,
        k = null,
        l = "",
        c = new function(a) {
            var b, c, e, f, d, h, n, k, m, l;
            m = function(a, b) { for (var c; 0 !== b;) c = b, b = a % b, a = c; return a };
            l = function(a, c, e, m) {
                var l, t, s, C, A, w, v, B;
                B = function(a) { m ? d ? v.push(a) : v.push(String.fromCharCode(a)) : v.push(f.charAt(a)) };
                w = A = 0;
                v = [];
                t = a.length;
                for (l = 0; l < t; l += 1) {
                    w += c;
                    if (m)
                        if (s = a.charAt(l), C = f.indexOf(s), s === b) break;
                        else { if (0 > C) throw 'the character "' + s + '" is not a member of ' + f; }
                    else if (C = d ? a[l] : a.charCodeAt(l), (C | k) !== k) throw C +
                        " is outside the range 0-" + k;
                    for (A = A << c | C; w >= e;) w -= e, B(A >> w), A &= h[w]
                }
                if (!m && 0 < w)
                    for (B(A << e - w), t = v.length % n, l = 0; l < t; l += 1) v.push(b);
                return d && m ? v : v.join("")
            };
            this.encode = function(a) { return l(a, c, e, !1) };
            this.decode = function(a) { return l(a, e, c, !0) };
            (function() { var q, l, E;
                b = a.pad || "";
                c = a.paramBits;
                e = a.codeBits;
                f = a.keyString;
                d = a.arrayparam;
                l = Math.max(c, e);
                E = 0;
                h = []; for (q = 0; q < l; q += 1) h.push(E), E += E + 1;
                k = E;
                n = c / m(c, e) })()
        }({
            paramBits: 8,
            codeBits: 6,
            keyString: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            pad: "="
        }),
        n = { 0: -5, 1: -4, 2: 4, 3: -6, 4: 2, 5: -4 };
    a = c.decode(a);
    f = a.length;
    for (e = 0; e < f; e++) k = a.charCodeAt(e), k -= n[e % 6], l += String.fromCharCode(k);
    l = c.decode(l);
    return b(l)
};

function log(msg){
    var t = new Date().toTimeString().slice(0,8);
    //dconsole.log(t+"  "+msg);
    //logs.push(t+"  "+msg);
};

function r4(n){
return Math.round((n*10000))/10000
};

function sec(sec){
    var date = new Date(null);
    date.setSeconds(sec); // specify value for SECONDS here
    return date.toISOString().substr(11, 8);    
}
