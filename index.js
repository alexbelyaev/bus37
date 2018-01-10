var request = require('request').defaults({forever: true });;
var http = require("http");
var mysql = require('mysql');
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
var dbHost, dbUser, dbPass, dbName;
process.env.OPENSHIFT_MYSQL_DB_HOST ? dbHost = process.env.OPENSHIFT_MYSQL_DB_HOST : dbHost = 'localhost';
process.env.MYSQL_USER ? dbUser = process.env.MYSQL_USER : dbUser = 'root';
process.env.MYSQL_PASSWORD ? dbPass = process.env.MYSQL_PASSWORD : dbPass = '';
process.env.MYSQL_DATABASE ? dbName = process.env.MYSQL_DATABASE : dbName = 'bus';
console.log('host:'+dbHost+' user: '+dbUser+' db:'+dbName+' pass:'+!!dbPass);

var pageTpl = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />'+
'<title>Bus 37 time tracking</title></head><body><h1>Bus 37 time tracking. 1</h1>'+
'<div id="log">[body]</div></body></html>';


var server = http.createServer(function(request, response) {
  
  response.writeHead(200, {"Content-Type": "text/html"});

  //log('request URL /log: '+(request.url=="\/log"));

  if(request.url=="\/log") response.write(pgLog(logs)); else
    response.write(pgLap(laps));
  response.end();

});

server.listen(8080);

//Looping requests to the GPS site
request(options, callback);

setInterval(function(){

    request(options, callback);//.on('error', function(e){console.log(e) }).end();

   }, 30000);

function callback(error, response, body) {
  
  var dn, vn, dis, tds, gps, param, bus37;

  if (!error && response.statusCode == 200) {
    
    log("Response OK");

    try {

        gps = MouseEnter(body);
    
    } catch (e) {
    
        log(e);
        gps = false;
    
    };

    if(gps){

    //console.log(gps);

    bus = gps[242];

    for(i in bus){

        var msg = "";
        
    	dn  = (bus[i]['d_n']==1)?'<':'>';
    	vn  = bus[i]['v_n'];
    	dis = bus[i]['dis'];
        dts = bus[i]['d_ts'];
    	
            if(!lap[vn])lap[vn] = {};

    		msg = vn + " " + dn + " " + dis;

    		if(lap[vn].aPoint){
                msg+=" From: "+lap[vn].aPoint.dis;
                msg+=" Time: "+sec((dts-lap[vn].aPoint.d_ts)*1000);
                msg+=" Dist: "+r3((dis-lap[vn].aPoint.dis));
            };

            log(msg);
    		
            if(!lap[vn].aPoint){
    			if((dis >= stops[dn].a)&&(dis < stops[dn].b)){
    				lap[vn].aPoint = {};
    				for(param in bus[i]){
    					lap[vn].aPoint[param] = bus[i][param];
    				}
    				log(vn+': aPoint added');
    			};
    		} else if(bus[i]['d_n'] !== lap[vn].aPoint.d_n){
                log(vn+' NULL aPoint');
                lap[vn].aPoint = null; //remove aPoint if bPoint in that direction didn't happen
            } else if(!lap[vn].bPoint){
    			if(dis >= stops[dn].b){
    				if(!lap[vn].bPoint)lap[vn].bPoint = {};
    				for(param in bus[i]){
    					lap[vn].bPoint[param] = bus[i][param];
    				}
                    lap[vn].time = lap[vn].bPoint.d_ts - lap[vn].aPoint.d_ts;
    				laps.push(lap[vn]);
                    laps=laps.slice(-100);
                    log(vn+': bPoint added ');
                    msg = dtToStr(new Date())+" ";
                    msg += vn+" "+dn;
                    msg +=" at:"+(new Date(lap[vn].aPoint.d_ts*1000)).toTimeString().slice(0,8);
                    msg +=" TIME: "+sec(lap[vn].time);
                    msg +=" From:"+lap[vn].aPoint.dis;
                    msg +=" to:"+lap[vn].bPoint.dis;
                    console.log("\x1b[32m%s\x1b[0m",msg);
                    
                    addRec({'dt': new Date(), 
                            'vn': vn, 
                            'dn': dn , 
                            'dt_a': new Date(lap[vn].aPoint.d_ts*1000), 
                            't_lap': sec(lap[vn].time), 
                            'from_dis': lap[vn].aPoint.dis, 
                            'to_dis': lap[vn].bPoint.dis});
                    
                    lap[vn]={};
    			}
    		}
            
    }
	}
  } else {

  	 if(error){console.log(error); log(error)};
  	 if(body){console.log(body);log(body)};
  
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
    var t = dtToStr(new Date());
    //console.log(t+"  "+msg);
    logs.push(t+": "+msg);
    logs = logs.slice(-200);
};

function r3(n){
    return Math.round((n*1000))/1000
};

function sec(sec){
    var date = new Date(null);
    date.setSeconds(sec); // specify value for SECONDS here
    return date.toISOString().substr(11, 8);    
};

function dtToStr(dt){
    
    return  dt.getFullYear().toString().slice(2) + 
    '/' + ('0' + (dt.getMonth() + 1)).slice(-2) + 
    '/' + ('0' + dt.getDate()).slice(-2) +
    ' ' + ('0' + dt.getHours()).slice(-2) +
    ':' + ('0' + dt.getMinutes()).slice(-2) +
    ':' + ('0' + dt.getSeconds()).slice(-2);

};

function hhmm(dt){
    
    return ('0' + dt.getHours()).slice(-2) +
    ':' + ('0' + dt.getMinutes()).slice(-2);

};

function addRec(rec){
    var con = mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPass,
      database: dbName
    });

    var sqlText = 'INSERT INTO bustime (dt, vn, dn, dt_a, t_lap, from_dis, to_dis) VALUES (?,?,?,?,?,?,?)';
    var values = [rec.dt,rec.vn,rec.dn,rec.dt_a,rec.t_lap,rec.from_dis,rec.to_dis];

    log(values);

    con.query(sqlText, values, function (error, results, fields) {
        if (error) log(error);
    });

    con.end();

};

function pgLap(laps){
    var laps = laps;
    var txt = '<strong>time : bus : direction : at : lap time : from dis : to dis</strong>';

    lapInArr = function(lap){

        txt+="<p>"+dtToStr(new Date(lap.bPoint.d_ts*1000))+" | ";
        txt+=lap.aPoint.v_n+" | ";
        lap.aPoint.d_n == 1 ? txt+="< | " :txt+="> | ";
        txt+=hhmm(new Date(lap.aPoint.d_ts*1000))+" | ";
        txt+=sec(lap.time)+" | ";
        txt+=lap.aPoint.dis+" | ";
        txt+=lap.bPoint.dis+"</p>";

    }
    
    laps.forEach(lapInArr);

    return pageTpl.replace(/\[body\]/, txt);

};

function pgLog(logs){

    var logs = logs;
    var txt = '<strong>logs</strong>';

    logs.forEach(function(msg, i){txt+='<p>'+(i+1)+': '+msg+'</p>'});

    return pageTpl.replace(/\[body\]/, txt);

};

/*
{ '242':
   [ { s_c: 'OK',
       r_i: 242,
       s: 'OK',
       lt: 50.4104,
       ln: 30.2367,
       p_lt: 50.420455,
       p_ln: 30.246701,
       hc: 1,
       wf: 0,
       d_n: 1,
       d_s: 'ж/м Зах?дний',
       v_i: 171,
       v_n: '8514',
       t_p_i: 175,
       f_d: 1,
       dis: 8.72,
       p_ts: 1515437462,
       d_ts: 1515437456 },
     { s_c: 'OK',
       r_i: 242,
       s: 'OK',
       lt: 50.411,
       ln: 30.3436,
       p_lt: 50.411001,
       p_ln: 30.323699,
       hc: 1,
       wf: 0,
       d_n: 2,
       d_s: 'ст. м. Святошин ',
       v_i: 1306,
       v_n: '4501',
       t_p_i: 181,
       f_d: 1,
       dis: 8.5722,
       p_ts: 1515437462,
       d_ts: 1515437456 } ],
  date_time: 1515437543 }
  */