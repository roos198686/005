window.__require = function e(t, n, o) {
function s(r, a) {
if (!n[r]) {
if (!t[r]) {
var c = r.split("/");
c = c[c.length - 1];
if (!t[c]) {
var l = "function" == typeof __require && __require;
if (!a && l) return l(c, !0);
if (i) return i(c, !0);
throw new Error("Cannot find module '" + r + "'");
}
r = c;
}
var u = n[r] = {
exports: {}
};
t[r][0].call(u.exports, function(e) {
return s(t[r][1][e] || e);
}, u, u.exports, e, t, n, o);
}
return n[r].exports;
}
for (var i = "function" == typeof __require && __require, r = 0; r < o.length; r++) s(o[r]);
return s;
}({
AnysdkMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "dfe3edwzmNFyohgr8CILrto", "AnysdkMgr");
cc.Class({
extends: cc.Component,
properties: {
_isCapturing: !1
},
onLoad: function() {},
init: function() {
this.ANDROID_API = "com/vivigames/scmj/WXAPI";
this.IOS_API = "AppController";
},
login: function() {
cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod(this.ANDROID_API, "Login", "()V") : cc.sys.os == cc.sys.OS_IOS ? jsb.reflection.callStaticMethod(this.IOS_API, "login") : console.log("platform:" + cc.sys.os + " dosn't implement share.");
},
share: function(e, t) {
cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod(this.ANDROID_API, "Share", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", cc.vv.SI.appweb, e, t) : cc.sys.os == cc.sys.OS_IOS ? jsb.reflection.callStaticMethod(this.IOS_API, "share:shareTitle:shareDesc:", cc.vv.SI.appweb, e, t) : console.log("platform:" + cc.sys.os + " dosn't implement share.");
},
shareResult: function() {
if (!this._isCapturing) {
this._isCapturing = !0;
var e = cc.director.getWinSize(), t = (new Date(), jsb.fileUtils.getWritablePath() + "result_share.jpg");
jsb.fileUtils.isFileExist(t) && jsb.fileUtils.removeFile(t);
var n = new cc.RenderTexture(Math.floor(e.width), Math.floor(e.height));
n.setPosition(cc.p(e.width / 2, e.height / 2));
n.begin();
cc.director.getRunningScene().visit();
n.end();
n.saveToFile("result_share.jpg", cc.IMAGE_FORMAT_JPG);
var o = this, s = 0;
setTimeout(function n() {
if (jsb.fileUtils.isFileExist(t)) {
var i = 100 / e.height, r = Math.floor(e.width * i);
cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod(o.ANDROID_API, "ShareIMG", "(Ljava/lang/String;II)V", t, r, 100) : cc.sys.os == cc.sys.OS_IOS ? jsb.reflection.callStaticMethod(o.IOS_API, "shareIMG:width:height:", t, r, 100) : console.log("platform:" + cc.sys.os + " dosn't implement share.");
o._isCapturing = !1;
} else {
if (++s > 10) {
console.log("time out...");
return;
}
setTimeout(n, 50);
}
}, 50);
}
},
onLoginResp: function(e) {
var t = {
code: e,
os: cc.sys.os
}, n = cc.sys.localStorage.getItem("account");
n && 0 === n.indexOf("guest_") && (t.bind_account = n);
cc.vv.http.sendRequest("/wechat_auth", t, function(e) {
if (0 == e.errcode) {
cc.sys.localStorage.setItem("wx_account", e.account);
cc.sys.localStorage.setItem("wx_sign", e.sign);
} else if (cc.vv.wc && cc.vv.wc.showError) {
cc.vv.wc.showError("wechat login disabled" == e.errmsg ? "后台已关闭微信登录" : "微信登录失败,请重试");
return;
}
cc.vv.userMgr.onAuth(e);
});
}
});
cc._RF.pop();
}, {} ],
AudioMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "f7582YPQ3hJ1J1oYxH3MYpi", "AudioMgr");
cc.Class({
extends: cc.Component,
properties: {
bgmVolume: 1,
sfxVolume: 1,
bgmAudioID: -1
},
init: function() {
var e;
null != (e = cc.sys.localStorage.getItem("bgmVolume")) && (this.bgmVolume = parseFloat(e));
null != (e = cc.sys.localStorage.getItem("sfxVolume")) && (this.sfxVolume = parseFloat(e));
cc.game.on(cc.game.EVENT_HIDE, function() {
console.log("cc.audioEngine.pauseAll");
cc.audioEngine.pauseAll();
});
cc.game.on(cc.game.EVENT_SHOW, function() {
console.log("cc.audioEngine.resumeAll");
cc.audioEngine.resumeAll();
});
},
_loadClip: function(e, t) {
(function n(o) {
cc.resources.load(o, cc.AudioClip, function(s, i) {
if (!s && i) t(i); else {
if (o.toLowerCase().endsWith(".mp3")) {
n(o.substring(0, o.length - 4) + ".wav");
return;
}
if (!o.includes(".")) {
n(o + ".mp3");
return;
}
console.log("[AudioMgr]加载失败:", e);
}
});
})("sounds/" + e);
},
playBGM: function(e) {
var t = this;
this._loadClip(e, function(e) {
t.bgmAudioID >= 0 && cc.audioEngine.stop(t.bgmAudioID);
t.bgmAudioID = cc.audioEngine.play(e, !0, t.bgmVolume);
});
},
playSFX: function(e) {
var t = this;
this.sfxVolume > 0 && this._loadClip(e, function(e) {
cc.audioEngine.play(e, !1, t.sfxVolume);
});
},
setSFXVolume: function(e) {
if (this.sfxVolume != e) {
cc.sys.localStorage.setItem("sfxVolume", e);
this.sfxVolume = e;
}
},
setBGMVolume: function(e, t) {
this.bgmAudioID >= 0 && (e > 0 ? cc.audioEngine.resume(this.bgmAudioID) : cc.audioEngine.pause(this.bgmAudioID));
if (this.bgmVolume != e || t) {
cc.sys.localStorage.setItem("bgmVolume", e);
this.bgmVolume = e;
cc.audioEngine.setVolume(this.bgmAudioID, e);
}
},
pauseAll: function() {
cc.audioEngine.pauseAll();
},
resumeAll: function() {
cc.audioEngine.resumeAll();
}
});
cc._RF.pop();
}, {} ],
GameNetMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "4c5cfC0K1VGQYg9AqndkIE9", "GameNetMgr");
cc.Class({
extends: cc.Component,
properties: {
dataEventHandler: null,
roomId: null,
maxNumOfGames: 0,
numOfGames: 0,
numOfMJ: 0,
seatIndex: -1,
seats: null,
turn: -1,
button: -1,
chupai: -1,
gamestate: "",
isOver: !1,
dissoveData: null,
waitCaishenMode: null,
waitBaoData: null,
_ignoreDisconnectOnce: !1
},
reset: function() {
this.turn = -1;
this.chupai = -1;
this.button = -1;
this.gamestate = "";
this.curaction = null;
if (null != this.seats) for (var e = 0; e < this.seats.length; ++e) {
this.seats[e].holds = [];
this.seats[e].folds = [];
this.seats[e].pengs = [];
this.seats[e].chis = [];
this.seats[e].angangs = [];
this.seats[e].diangangs = [];
this.seats[e].wangangs = [];
this.seats[e].ready = !1;
this.seats[e].hued = !1;
}
},
clear: function() {
this.dataEventHandler = null;
if (null == this.isOver) {
this.seats = null;
this.roomId = null;
this.maxNumOfGames = 0;
this.numOfGames = 0;
}
},
clearRoomState: function() {
this.reset();
this.roomId = null;
this.seats = null;
this.conf = null;
this.numOfMJ = 0;
this.numOfGames = 0;
this.maxNumOfGames = 0;
this.laozhuang = 0;
this.isOver = !1;
this.dissoveData = null;
this.overData = null;
this.waitCaishenMode = null;
this.waitBaoData = null;
this._pendingEvents = [];
},
onLoad: function() {
this._pendingEvents = [];
var e = null, t = this;
Object.defineProperty(this, "dataEventHandler", {
configurable: !0,
get: function() {
return e;
},
set: function(n) {
e = n;
if (n && t._pendingEvents.length) {
var o = t._pendingEvents;
t._pendingEvents = [];
for (var s = 0; s < o.length; ++s) {
console.log("[GameNetMgr] 重放事件", o[s].event);
n.emit(o[s].event, {
detail: o[s].data
});
}
}
}
});
},
dispatchEvent: function(e, t) {
console.log("[GameNetMgr.dispatchEvent] event=", e, " dataEventHandler=", !!this.dataEventHandler);
if (this.dataEventHandler) this.dataEventHandler.emit(e, {
detail: t
}); else {
null == this._pendingEvents && (this._pendingEvents = []);
this._pendingEvents.length < 300 && this._pendingEvents.push({
event: e,
data: t
});
console.error("[GameNetMgr.dispatchEvent] dataEventHandler is NULL! event=" + e + " 已入队待重放");
}
},
getSeatIndexByID: function(e) {
for (var t = 0; t < this.seats.length; ++t) if (this.seats[t].userid == e) return t;
return -1;
},
isOwner: function() {
return 0 == this.seatIndex;
},
getSeatByID: function(e) {
var t = this.getSeatIndexByID(e);
return this.seats[t];
},
getSelfData: function() {
return this.seats[this.seatIndex];
},
getLocalIndex: function(e) {
var t = this.seats ? this.seats.length : 2;
return (e - this.seatIndex + t) % t;
},
getGameScene: function() {
var e = this.conf && this.conf.type;
return "zj_lao" == e ? "mjgame_zjlao" : "zj_bt" == e ? "mjgame_bmj" : "zj_zx" == e ? "mjgame_zjzx" : "zj4_zx" == e ? "mjgame_zjzx4" : "zp" == e ? "mjgame_zp" : "zp4" == e ? "mjgame_zp4" : "wujin" == e ? "mjgame_wujin" : "guanpai2" == e ? "mjgame_gp2" : "guanpai3" == e ? "mjgame_gp3" : "mjgame_ldh";
},
prepareReplay: function(e, t) {
this.roomId = e.id;
this.seats = e.seats;
this.turn = t.base_info.button;
for (var n = t.base_info, o = 0; o < this.seats.length; ++o) {
var s = this.seats[o];
s.seatindex = o;
s.score = null;
s.holds = n.game_seats[o];
s.pengs = [];
s.chis = [];
s.angangs = [];
s.diangangs = [];
s.wangangs = [];
s.folds = [];
cc.vv.userMgr.userId == s.userid && (this.seatIndex = o);
}
this.conf = {
type: n.type
};
null == this.conf.type && (this.conf.type = "zj");
},
getWanfa: function() {
var e = this.conf;
if (null == e) {
console.log("[getWanfa] conf IS NULL");
return "";
}
var t = {};
for (var n in e) t[n] = "string" == typeof e[n] && e[n].length > 60 ? e[n].substring(0, 60) + "..." : e[n];
console.log("[getWanfa] conf keys=", Object.keys(e), "dbg=", JSON.stringify(t));
var o = "诸暨翻财神";
"zj" == e.type ? o = "诸暨翻财神" : "zj_bt" == e.type ? o = "诸暨包麻将" : "zj_lao" == e.type ? o = "诸暨赖倒胡" : "zj4" == e.type ? o = "诸暨翻财神(4人)" : "zj4_bt" == e.type ? o = "诸暨包麻将(4人)" : "zp" == e.type ? o = "漳浦麻将(2人)" : "zp4" == e.type ? o = "漳浦麻将(4人)" : "wujin" == e.type ? o = "漳浦无金麻将" : "zj_zx" == e.type ? o = "诸暨自选麻将" : "zj4_zx" == e.type ? o = "诸暨自选麻将(4人)" : e.type && (o = e.type);
var s = [ o ], i = null != e.baseScore ? e.baseScore : null != e.base_score ? e.base_score : e.base;
console.log("[getWanfa] baseScore=", i, " conf.baseScore=", e.baseScore, " conf.base_score=", e.base_score, " conf.base=", e.base);
null != i && "" !== i && i > 0 ? s.push("底分" + i) : console.log("[getWanfa] baseScore SKIPPED (null/empty/0)");
var r = null != e.maxTai ? e.maxTai : e.max_tai;
console.log("[getWanfa] maxTaiVal=", r, " conf.maxTai=", e.maxTai);
null != r && r > 0 && s.push(r + "台封顶");
console.log("[getWanfa] maxGames=", e.maxGames, " conf.max_games=", e.max_games);
null != e.maxGames && e.maxGames > 0 && s.push(e.maxGames + "局");
if ("zj" == e.type || "zj_bt" == e.type || "zj4" == e.type || "zj4_bt" == e.type || "zj_zx" == e.type || "zj4_zx" == e.type) {
var a = e.taiRules;
if (null != a && "string" == typeof a) try {
a = JSON.parse(a);
} catch (e) {
console.log("[getWanfa] taiRules parse FAIL:", e.message);
a = null;
}
console.log("[getWanfa] taiRules after parse=", a);
var c = a && null != a.min_tai ? Number(a.min_tai) : 1;
c > 0 && s.push(c + "台起胡");
}
var l = s.join(" ");
console.log("[getWanfa] FINAL=", l);
return l;
},
applyPushHolds: function(e, t) {
null != e && null != t && ("[object Array]" === Object.prototype.toString.call(t) ? e.holds = t : "number" == typeof t && (e.holdCount = t));
},
initSeatData: function(e) {
null == e.holds && (e.holds = []);
null == e.folds && (e.folds = []);
null == e.pengs && (e.pengs = []);
null == e.chis && (e.chis = []);
null == e.angangs && (e.angangs = []);
null == e.diangangs && (e.diangangs = []);
null == e.wangangs && (e.wangangs = []);
null == e.hued && (e.hued = !1);
null == e.ready && (e.ready = !1);
},
initHandlers: function() {
var e = this;
cc.vv.net.addHandler("login_result", function(t) {
console.log(t);
if (e._loginTimer) {
clearTimeout(e._loginTimer);
e._loginTimer = null;
}
if (0 === t.errcode) {
t = t.data;
e.roomId = t.roomid;
e.conf = t.conf;
e.maxNumOfGames = t.conf.maxGames;
e.numOfGames = t.numofgames;
e.seats = t.seats;
e.seatIndex = e.getSeatIndexByID(cc.vv.userMgr.userId);
e.isOver = !1;
t.conf && t.conf.type && (cc.vv.lastGameType = t.conf.type);
} else cc.vv.wc.showError(t.errmsg || "进入房间失败");
});
cc.vv.net.addHandler("login_finished", function() {
console.log("login_finished");
if (e._loginTimer) {
clearTimeout(e._loginTimer);
e._loginTimer = null;
}
var t = e.getGameScene();
console.log("[进入房间]加载场景 " + t);
var n = null;
try {
n = cc.director.loadScene(t, function() {
if (e.overData) {
var t = e.overData;
e.overData = null;
e.dispatchEvent("game_over", t.results);
if (t.endinfo) {
e.isOver = !0;
e.dispatchEvent("game_end", {
endinfo: t.endinfo,
roundHistory: t.roundHistory || null
});
}
}
});
} catch (e) {
console.log("[进入房间]加载场景异常:" + (e && e.message));
}
!1 === n && cc.vv.wc.showError("场景 " + t + " 未导入,请在Cocos Creator中刷新资源后重试");
});
cc.vv.net.addHandler("exit_result", function() {
e._ignoreDisconnectOnce = !0;
setTimeout(function() {
e._ignoreDisconnectOnce = !1;
}, 3e3);
e.clearRoomState();
});
cc.vv.net.addHandler("exit_notify_push", function(t) {
var n = t, o = e.getSeatByID(n);
if (null != o) {
o.userid = 0;
o.name = "";
e.dispatchEvent("user_state_changed", o);
}
});
cc.vv.net.addHandler("dispress_push", function() {
e._ignoreDisconnectOnce = !0;
setTimeout(function() {
e._ignoreDisconnectOnce = !1;
}, 3e3);
e.clearRoomState();
});
cc.vv.net.addHandler("disconnect", function() {
if (!e._ignoreDisconnectOnce) if (null == e.roomId) cc.vv.fromClub || cc.vv.fromClubId ? cc.director.loadScene("club") : cc.director.loadScene("hall"); else if (0 == e.isOver) {
cc.vv.userMgr.oldRoomId = e.roomId;
e.dispatchEvent("disconnect");
} else e.roomId = null;
});
cc.vv.net.addHandler("new_user_comes_push", function(t) {
var n = t.seatindex;
if (e.seats[n].userid > 0) e.seats[n].online = !0; else {
t.online = !0;
e.seats[n] = t;
}
e.dispatchEvent("new_user", e.seats[n]);
});
cc.vv.net.addHandler("user_state_push", function(t) {
var n = t.userid, o = e.getSeatByID(n);
o.online = t.online;
e.dispatchEvent("user_state_changed", o);
});
cc.vv.net.addHandler("user_ready_push", function(t) {
var n = t.userid, o = e.getSeatByID(n);
o.ready = t.ready;
e.dispatchEvent("user_state_changed", o);
});
cc.vv.net.addHandler("game_start_push", function(t) {
console.log("game_start_push");
e.button = t.button;
e.laozhuang = t.laozhuang || 0;
e.turn = null != t.turn ? t.turn : t.button;
e.numOfMJ = t.numofmj;
e.gamestate = "begin";
e.dispatchEvent("mj_count");
null == e.conf && (e.conf = {});
e.conf.caishen = t.caishen;
e.conf.caishen2 = t.caishen2;
e.conf.fanPai = t.fanPai;
e.conf.playStyle = t.playStyle;
e.conf.baoDone = !1;
e.conf.baoMode = null != t.baoMode ? t.baoMode : -1;
e.conf.baoSeatIndex = null != t.baoSeatIndex ? t.baoSeatIndex : -1;
e.conf.baoTai = null != t.baoTai ? t.baoTai : 0;
null != t.chupaiTimeout && (e.chupaiTimeout = t.chupaiTimeout);
for (var n = 0; n < t.seats.length; ++n) {
var o = t.seats[n], s = e.seats[n];
s.userid = o.userid;
s.name = o.name;
s.score = o.score;
e.applyPushHolds(s, o.holds);
o.pengs instanceof Array && (s.pengs = o.pengs);
o.pengTiles instanceof Array && (s.pengTiles = o.pengTiles);
o.chis instanceof Array && (s.chis = o.chis);
o.angangs instanceof Array && (s.angangs = o.angangs);
o.diangangs instanceof Array && (s.diangangs = o.diangangs);
o.wangangs instanceof Array && (s.wangangs = o.wangangs);
o.folds instanceof Array && (s.folds = o.folds);
o.hua instanceof Array && (s.hua = o.hua);
null != o.youjin && (s.youjinLevel = o.youjin);
e.initSeatData(s);
s.ready = !1;
s.hued = !1;
}
e.selectingCaishen = !!t.selectingCaishen;
t.plans && t.plans.length > 0 && (e.waitCaishenPlans = t.plans);
e.dispatchEvent("game_start");
});
cc.vv.net.addHandler("game_mopai_push", function(t) {
console.log("game_mopai_push");
var n = e.seats[t.si];
if (null != n) {
e.applyPushHolds(n, t.holds);
e.numOfMJ = t.numofmj;
e.turn = t.si;
e.dispatchEvent("mj_count");
e.dispatchEvent("game_mopai", {
seatIndex: t.si,
pai: t.pai
});
}
});
cc.vv.net.addHandler("game_chupai_push", function(t) {
console.log("game_chupai_push");
e.doTurnChange(t.si);
});
cc.vv.net.addHandler("game_chupai_notify_push", function(t) {
var n = e.getSeatIndexByID(t.userId);
if (!(n < 0)) {
var o = e.seats[n];
e.applyPushHolds(o, t.holds);
e.chupai = t.pai;
null == o.folds && (o.folds = []);
o.folds.push(t.pai);
e.dispatchEvent("game_chupai_notify", {
seatData: o,
pai: t.pai
});
}
});
cc.vv.net.addHandler("game_peng_push", function(t) {
console.log("game_peng_push", JSON.stringify(t));
var n = e.seats[t.si];
if (null != n) {
e.removeFoldOfTurn(t.pai);
e.applyPushHolds(n, t.holds);
null == n.pengs && (n.pengs = []);
n.pengs.push(t.pai);
t.pengTiles instanceof Array && (n.pengTiles = t.pengTiles);
e.turn = t.si;
console.log("[game_peng_push] seatIndex=", e.seatIndex, "updated holds=", n.holds ? "object" == typeof n.holds ? n.holds.length : n.holds : "null");
e.dispatchEvent("peng_notify", n);
}
});
cc.vv.net.addHandler("game_gang_push", function(t) {
console.log("game_gang_push");
var n = e.seats[t.si];
if (null != n) {
e.applyPushHolds(n, t.holds);
t.pengs instanceof Array && (n.pengs = t.pengs);
t.pengTiles instanceof Array && (n.pengTiles = t.pengTiles);
null == n.pengs && (n.pengs = []);
null == n.angangs && (n.angangs = []);
null == n.diangangs && (n.diangangs = []);
null == n.wangangs && (n.wangangs = []);
var o = t.gangtype || "";
if ("wan" == o) {
var s = n.pengs.indexOf(t.pai);
-1 != s && n.pengs.splice(s, 1);
n.wangangs.push(t.pai);
} else if ("ming" == o) {
e.removeFoldOfTurn(t.pai);
n.diangangs.push(t.pai);
} else n.angangs.push(t.pai);
e.turn = t.si;
e.dispatchEvent("gang_notify", {
seatData: n,
gangtype: "wan" == o ? "wangang" : "ming" == o ? "diangang" : "angang",
pai: t.pai
});
}
});
cc.vv.net.addHandler("game_chi_push", function(t) {
console.log("game_chi_push");
var n = e.seats[t.si];
if (null != n) {
e.removeFoldOfTurn(e.chupai);
e.applyPushHolds(n, t.holds);
null == n.chis && (n.chis = []);
var o = t.pais.slice().sort(function(e, t) {
return e - t;
});
n.chis.push(o);
e.turn = t.si;
e.dispatchEvent("chi_notify", n);
}
});
cc.vv.net.addHandler("game_action_push", function(t) {
e.curaction = t;
console.log(t);
e.dispatchEvent("game_action", t);
});
cc.vv.net.addHandler("game_hu_push", function(t) {
console.log("game_hu_push");
e.dispatchEvent("hupai", t);
});
cc.vv.net.addHandler("game_hua_push", function(t) {
console.log("game_hua_push");
var n = e.seats[t.si];
n && t.hua instanceof Array && (n.hua = t.hua);
if (null != t.numofmj) {
e.numOfMJ = t.numofmj;
e.dispatchEvent("mj_count");
}
e.dispatchEvent("game_hua", t);
});
cc.vv.net.addHandler("game_youjin_push", function(t) {
console.log("game_youjin_push");
var n = e.seats[t.si];
n && (n.youjinLevel = t.level || 0);
e.dispatchEvent("game_youjin", t);
});
cc.vv.net.addHandler("game_fenbing_push", function(t) {
console.log("game_fenbing_push");
e.dispatchEvent("game_fenbing", t);
});
cc.vv.net.addHandler("bao_select_push", function(t) {
console.log("bao_select_push");
e.waitBaoData = t;
e.dispatchEvent("bao_select", t);
});
cc.vv.net.addHandler("bao_turn_push", function(t) {
console.log("bao_turn_push");
e.dispatchEvent("bao_turn", t);
});
cc.vv.net.addHandler("bao_result_push", function(t) {
console.log("bao_result_push", JSON.stringify(t));
e.waitBaoData = null;
null == e.conf && (e.conf = {});
e.conf.baoMode = t.baoMode;
if (null != t.caishen && t.caishen >= 0) {
e.conf.caishen = t.caishen;
e.conf.caishen2 = t.caishen2;
e.conf.fanPai = t.fanPai;
e.conf.baoDone = !0;
e.waitCaishenMode = null;
}
null != t.numofmj && (e.numOfMJ = t.numofmj);
e.dispatchEvent("bao_result", t);
});
cc.vv.net.addHandler("caishen_select_push", function(t) {
console.log("caishen_select_push");
e.waitCaishenMode = t && null != t.mode ? t.mode : 1;
e.dispatchEvent("caishen_select", t);
});
cc.vv.net.addHandler("game_caishen_plans_push", function(t) {
console.log("game_caishen_plans_push", JSON.stringify(t));
if (t && t.plans) {
e.waitCaishenPlans = t.plans;
e.dispatchEvent("game_caishen_plans", {
plans: t.plans
});
} else {
e.waitCaishenPlans = null;
e.dispatchEvent("game_caishen_plans", {
plans: []
});
}
});
function t(t) {
e.gamestate = "begin";
e.gpMyCards = (t && t.myCards ? t.myCards : []).slice();
e.gpMySeat = t && null != t.mySeat ? t.mySeat : e.seatIndex;
e.gpTurn = t ? null != t.startSeat ? t.startSeat : t.turn : 0;
e.gpFreePlay = !t || !!t.freePlay;
e.gpLastPlay = t && t.lastPlay ? t.lastPlay : null;
e.gpSeats = t ? t.seats : null;
e.gpTurnDeadline = t ? t.turnDeadline : 0;
e.waitGpStart = t;
e.dispatchEvent("gp_start", t);
}
cc.vv.net.addHandler("gp_start_push", function(e) {
console.log("gp_start_push", e ? JSON.stringify(e.myCards) : "");
t(e);
});
cc.vv.net.addHandler("gp_resend_push", function(e) {
console.log("gp_resend_push", e ? JSON.stringify(e.myCards) : "");
t(e);
});
cc.vv.net.addHandler("gp_chupai_push", function(t) {
if (t) {
console.log("gp_chupai_push seat=", t.seatIndex);
if (t.seatIndex == e.gpMySeat && e.gpMyCards) {
var n = e.gpMyCards.slice();
(t.pais || []).forEach(function(e) {
var t = n.indexOf(e);
t >= 0 && n.splice(t, 1);
});
e.gpMyCards = n;
}
t.seats && (e.gpSeats = t.seats);
e.gpFreePlay = !1;
e.gpLastPlay = {
seatIndex: t.seatIndex,
type: t.type,
key: t.key,
len: t.len,
bombLevel: t.bombLevel || 0,
pais: (t.pais || []).slice()
};
e.dispatchEvent("gp_chupai", t);
}
});
cc.vv.net.addHandler("gp_turn_push", function(t) {
if (t) {
console.log("gp_turn_push turn=", t.turn);
e.gpTurn = t.turn;
e.gpFreePlay = !!t.freePlay;
e.gpLastPlay = t.lastPlay || null;
t.seats && (e.gpSeats = t.seats);
e.gpTurnDeadline = t.turnDeadline;
e.dispatchEvent("gp_turn", t);
}
});
cc.vv.net.addHandler("gp_pass_push", function(t) {
if (t) {
console.log("gp_pass_push seat=", t.seatIndex);
e.dispatchEvent("gp_pass", t);
}
});
cc.vv.net.addHandler("gp_newround_push", function(t) {
if (t) {
console.log("gp_newround_push turn=", t.turn);
e.gpTurn = t.turn;
e.gpTurnDeadline = t.turnDeadline;
e.gpFreePlay = !0;
e.gpLastPlay = null;
e.dispatchEvent("gp_newround", t);
}
});
cc.vv.net.addHandler("gp_error_push", function(t) {
console.log("gp_error_push", t && t.msg);
e.dispatchEvent("gp_error", t);
});
cc.vv.net.addHandler("game_begin_push", function(t) {
console.log("game_begin_push");
e.button = t;
e.turn = e.button;
e.gamestate = "begin";
e.dispatchEvent("game_begin");
});
cc.vv.net.addHandler("game_num_push", function(t) {
e.numOfGames = t;
e.dispatchEvent("game_num", t);
});
cc.vv.net.addHandler("game_over_push", function(t) {
console.log("game_over_push");
null == e.conf && (e.conf = {});
null != t.caishen && (e.conf.caishen = t.caishen);
null != t.caishen2 && (e.conf.caishen2 = t.caishen2);
for (var n = t.results, o = 0; o < e.seats.length; ++o) {
var s = e.seats[o];
if (n && n[o]) {
var i = n[o];
s.score = i.totalscore;
s.holds = i.holds || [];
s.pengs = i.pengs || [];
s.chis = i.chis || [];
s.folds = i.folds || [];
s.angangs = i.angangs || [];
s.diangangs = i.diangangs || [];
s.wangangs = i.wangangs || [];
s.hued = !1;
if (i.huinfo) for (var r = 0; r < i.huinfo.length; ++r) i.huinfo[r].ishupai && (s.hued = !0);
} else s.score = 0;
}
e.dispatchEvent("game_over", n);
e.overData = t;
if (t.endinfo) {
e.isOver = !0;
e.dispatchEvent("game_end", {
endinfo: t.endinfo,
roundHistory: t.roundHistory || null
});
}
e.reset();
for (o = 0; o < e.seats.length; ++o) e.dispatchEvent("user_state_changed", e.seats[o]);
});
cc.vv.net.addHandler("chat_push", function(t) {
e.dispatchEvent("chat_push", t);
});
cc.vv.net.addHandler("quick_chat_push", function(t) {
e.dispatchEvent("quick_chat_push", t);
});
cc.vv.net.addHandler("emoji_push", function(t) {
e.dispatchEvent("emoji_push", t);
});
cc.vv.net.addHandler("dissolve_notice_push", function(t) {
console.log("dissolve_notice_push");
e.dissoveData = t;
e.dispatchEvent("dissolve_notice", t);
});
cc.vv.net.addHandler("dissolve_cancel_push", function(t) {
e.dissoveData = null;
e.dispatchEvent("dissolve_cancel", t);
});
cc.vv.net.addHandler("voice_msg_push", function(t) {
e.dispatchEvent("voice_msg", t);
});
},
removeFoldOfTurn: function(e) {
if (!(this.turn < 0 || null == this.seats)) {
var t = this.seats[this.turn];
if (t && t.folds) {
var n = t.folds.lastIndexOf(e);
-1 != n && t.folds.splice(n, 1);
}
}
},
doTurnChange: function(e) {
var t = {
last: this.turn,
turn: e
};
this.turn = e;
this.dispatchEvent("game_chupai", t);
},
connectGameServer: function(e) {
this.dissoveData = null;
cc.vv.net.ip = (window.__rewriteHost ? window.__rewriteHost(e.ip) : e.ip) + ":" + e.port;
console.log(cc.vv.net.ip);
cc.vv.wc.show("正在进入房间");
console.log("[进入房间]连接游戏服 " + cc.vv.net.ip);
var t = this;
this._loginTimer = setTimeout(function() {
t._loginTimer = null;
cc.vv.wc.showError("进入房间超时(" + cc.vv.net.ip + "),请重试");
}, 8e3);
try {
cc.vv.net.connect(function() {
console.log("onConnectOK");
var t = {
token: e.token,
roomid: e.roomid,
time: e.time,
sign: e.sign
};
cc.vv.net.send("login", t);
}, function() {
console.log("failed.");
cc.vv.wc.showError("连接游戏服失败(" + cc.vv.net.ip + "),请确认游戏服已启动");
});
} catch (e) {
console.log("[进入房间]连接初始化异常:" + (e && e.message));
if (this._loginTimer) {
clearTimeout(this._loginTimer);
this._loginTimer = null;
}
cc.vv.wc.showError("连接初始化失败:" + (e && e.message));
}
}
});
cc._RF.pop();
}, {} ],
Global: [ function(e, t) {
"use strict";
cc._RF.push(t, "c0244demoVIG4jTu1XDASHs", "Global");
cc.Class({
extends: cc.Component,
statics: {
isstarted: !1,
netinited: !1,
userguid: 0,
nickname: "",
money: 0,
lv: 0,
roomId: 0
}
});
cc._RF.pop();
}, {} ],
HTTP: [ function(e, t) {
"use strict";
cc._RF.push(t, "73df3nV5IZAPoFSW/0IES+m", "HTTP");
var n = "127.0.0.1";
if ("undefined" != typeof cc) {
cc.sys && cc.sys.isNative && (n = "47.239.100.68");
cc.sys && (cc.sys.platform, cc.sys.ANDROID);
}
var o = "http://" + n + ":9000";
"undefined" != typeof window && (window.__rewriteHost = function(e) {
return e;
});
cc.VERSION = 20180108;
var s = cc.Class({
extends: cc.Component,
statics: {
sessionId: 0,
userId: 0,
master_url: o,
url: o,
sendRequest: function(e, t, n, o) {
var i = cc.loader.getXMLHttpRequest();
i.timeout = 5e3;
var r = "?";
for (var a in t) {
"?" != r && (r += "&");
r += a + "=" + t[a];
}
null == o && (o = s.url);
var c = o + e + encodeURI(r);
console.log("RequestURL:" + c);
i.open("GET", c, !0);
cc.sys.isNative && i.setRequestHeader("Accept-Encoding", "gzip,deflate", "text/html;charset=UTF-8");
i.onreadystatechange = function() {
if (4 === i.readyState && i.status >= 200 && i.status < 300) {
console.log("http res(" + i.responseText.length + "):" + i.responseText);
try {
var e = JSON.parse(i.responseText);
null !== n && n(e);
} catch (e) {
console.log("err:" + e);
} finally {
cc.vv && cc.vv.wc;
}
} else if (4 === i.readyState) {
console.log("http failed status:" + i.status);
cc.vv && cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("网络请求失败(" + i.status + "),请确认服务已启动");
}
};
i.onerror = function() {
console.log("http onerror");
cc.vv && cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("无法连接服务器,请确认服务已启动");
};
i.ontimeout = function() {
console.log("http ontimeout");
cc.vv && cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("请求超时,请重试");
};
cc.vv && cc.vv.wc;
i.send();
return i;
}
}
});
cc._RF.pop();
}, {} ],
HotUpdate: [ function(e, t) {
"use strict";
cc._RF.push(t, "8b10788j31A0I2e3MKpB3Q0", "HotUpdate");
cc.Class({
extends: cc.Component,
properties: {
updatePanel: {
default: null,
type: cc.Node
},
manifestUrl: {
default: null,
url: cc.Asset
},
percent: {
default: null,
type: cc.Label
},
lblErr: {
default: null,
type: cc.Label
}
},
checkCb: function(e) {
cc.log("Code: " + e.getEventCode());
switch (e.getEventCode()) {
case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
cc.log("No local manifest file found, hot update skipped.");
cc.eventManager.removeListener(this._checkListener);
break;

case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
cc.log("Fail to download manifest file, hot update skipped.");
cc.eventManager.removeListener(this._checkListener);
break;

case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
cc.log("Already up to date with the latest remote version.");
cc.eventManager.removeListener(this._checkListener);
this.lblErr.string += "游戏不需要更新\n";
cc.director.loadScene("loading");
break;

case jsb.EventAssetsManager.NEW_VERSION_FOUND:
this._needUpdate = !0;
this.updatePanel.active = !0;
this.percent.string = "00.00%";
cc.eventManager.removeListener(this._checkListener);
}
this.hotUpdate();
},
updateCb: function(e) {
var t = !1, n = !1;
switch (e.getEventCode()) {
case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
cc.log("No local manifest file found, hot update skipped.");
n = !0;
break;

case jsb.EventAssetsManager.UPDATE_PROGRESSION:
var o = e.getPercent(), s = (e.getPercentByFile(), e.getMessage());
s && cc.log(s);
cc.log(o.toFixed(2) + "%");
this.percent.string = o + "%";
break;

case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
cc.log("Fail to download manifest file, hot update skipped.");
n = !0;
break;

case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
cc.log("Already up to date with the latest remote version.");
n = !0;
break;

case jsb.EventAssetsManager.UPDATE_FINISHED:
cc.log("Update finished. " + e.getMessage());
t = !0;
break;

case jsb.EventAssetsManager.UPDATE_FAILED:
cc.log("Update failed. " + e.getMessage());
this._failCount++;
if (this._failCount < 5) this._am.downloadFailedAssets(); else {
cc.log("Reach maximum fail count, exit update process");
this._failCount = 0;
n = !0;
}
break;

case jsb.EventAssetsManager.ERROR_UPDATING:
cc.log("Asset update error: " + e.getAssetId() + ", " + e.getMessage());
break;

case jsb.EventAssetsManager.ERROR_DECOMPRESS:
cc.log(e.getMessage());
}
if (n) {
cc.eventManager.removeListener(this._updateListener);
this.updatePanel.active = !1;
}
if (t) {
cc.eventManager.removeListener(this._updateListener);
var i = jsb.fileUtils.getSearchPaths(), r = this._am.getLocalManifest().getSearchPaths();
Array.prototype.unshift(i, r);
cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify(i));
jsb.fileUtils.setSearchPaths(i);
this.lblErr.string += "游戏资源更新完毕\n";
cc.game.restart();
}
},
hotUpdate: function() {
if (this._am && this._needUpdate) {
this.lblErr.string += "开始更新游戏资源...\n";
this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
cc.eventManager.addListener(this._updateListener, 1);
this._failCount = 0;
this._am.update();
}
},
onLoad: function() {
if (cc.sys.isNative) {
this.lblErr.string += "检查游戏资源...\n";
var e = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "tiantianqipai-asset";
cc.log("Storage path for remote asset : " + e);
this.lblErr.string += e + "\n";
cc.log("Local manifest URL : " + this.manifestUrl);
this._am = new jsb.AssetsManager(this.manifestUrl, e);
this._am.retain();
this._needUpdate = !1;
if (this._am.getLocalManifest().isLoaded()) {
this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
cc.eventManager.addListener(this._checkListener, 1);
this._am.checkUpdate();
}
}
},
onDestroy: function() {
this._am && this._am.release();
}
});
cc._RF.pop();
}, {} ],
MahjongMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "e4fb97mwvFL3qT4H0AbOojz", "MahjongMgr");
var n = [];
cc.Class({
extends: cc.Component,
properties: {
leftAtlas: {
default: null,
type: cc.SpriteAtlas
},
rightAtlas: {
default: null,
type: cc.SpriteAtlas
},
bottomAtlas: {
default: null,
type: cc.SpriteAtlas
},
bottomFoldAtlas: {
default: null,
type: cc.SpriteAtlas
},
pengPrefabSelf: {
default: null,
type: cc.Prefab
},
pengPrefabLeft: {
default: null,
type: cc.Prefab
},
emptyAtlas: {
default: null,
type: cc.SpriteAtlas
},
holdsEmpty: {
default: [],
type: [ cc.SpriteFrame ]
},
_sides: null,
_pres: null,
_foldPres: null
},
onLoad: function() {
if (null != cc.vv) {
this._sides = [ "myself", "right", "up", "left" ];
this._pres = [ "M_", "R_", "B_", "L_" ];
this._foldPres = [ "B_", "R_", "B_", "L_" ];
cc.vv.mahjongmgr = this;
for (var e = 1; e < 10; ++e) n.push("dot_" + e);
for (e = 1; e < 10; ++e) n.push("bamboo_" + e);
for (e = 1; e < 10; ++e) n.push("character_" + e);
n.push("red");
n.push("green");
n.push("white");
n.push("wind_east");
n.push("wind_west");
n.push("wind_south");
n.push("wind_north");
}
},
getMahjongSpriteByID: function(e) {
return n[e];
},
getMahjongType: function(e) {
return e >= 0 && e < 9 ? 0 : e >= 9 && e < 18 ? 1 : e >= 18 && e < 27 ? 2 : void 0;
},
getSpriteFrameByMJID: function(e, t) {
var n = this.getMahjongSpriteByID(t);
n = e + n;
return "M_" == e ? this.bottomAtlas.getSpriteFrame(n) : "B_" == e ? this.bottomFoldAtlas.getSpriteFrame(n) : "L_" == e ? this.leftAtlas.getSpriteFrame(n) : "R_" == e ? this.rightAtlas.getSpriteFrame(n) : void 0;
},
getAudioURLByMJID: function(e) {
var t = 0;
e >= 0 && e < 9 ? t = e + 21 : e >= 9 && e < 18 ? t = e - 8 : e >= 18 && e < 27 && (t = e - 7);
return "nv/" + t + ".mp3";
},
getEmptySpriteFrame: function(e) {
return "up" == e ? this.emptyAtlas.getSpriteFrame("e_mj_b_up") : "myself" == e ? this.emptyAtlas.getSpriteFrame("e_mj_b_bottom") : "left" == e ? this.emptyAtlas.getSpriteFrame("e_mj_b_left") : "right" == e ? this.emptyAtlas.getSpriteFrame("e_mj_b_right") : void 0;
},
getHoldsEmptySpriteFrame: function(e) {
return "up" == e ? this.emptyAtlas.getSpriteFrame("e_mj_up") : "myself" == e ? null : "left" == e ? this.emptyAtlas.getSpriteFrame("e_mj_left") : "right" == e ? this.emptyAtlas.getSpriteFrame("e_mj_right") : void 0;
},
sortMJ: function(e, t) {
var n = this;
e.sort(function(e, o) {
if (t >= 0) {
var s = n.getMahjongType(e), i = n.getMahjongType(o);
if (s != i) {
if (t == s) return 1;
if (t == i) return -1;
}
}
return e - o;
});
},
is2Player: function() {
return !!(cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.seats && 2 == cc.vv.gameNetMgr.seats.length);
},
getSide: function(e) {
return this.is2Player() ? 0 == e ? "myself" : "up" : this._sides[e];
},
getPre: function(e) {
return this.is2Player() ? 0 == e ? "M_" : "B_" : this._pres[e];
},
getFoldPre: function(e) {
return this.is2Player() ? "B_" : this._foldPres[e];
},
getSlotIndex: function(e) {
return this.is2Player() ? 0 == e ? 0 : 2 : e;
},
getLocalIndexBySlot: function(e) {
return this.is2Player() ? 2 == e ? 1 : -1 : e;
}
});
cc._RF.pop();
}, {} ],
Net: [ function(e, t) {
"use strict";
cc._RF.push(t, "21784k1nCpOz70Z2In10GT7", "Net");
var n = e("socket-io");
null != n && n.connect && (window.io = n);
cc.Class({
extends: cc.Component,
statics: {
ip: "",
sio: null,
isPinging: !1,
fnDisconnect: null,
handlers: {},
addHandler: function(e, t) {
if (this.handlers[e]) console.log("event:" + e + "' handler has been registered."); else {
var n = function(n) {
"disconnect" != e && "string" == typeof n && (n = JSON.parse(n));
t(n);
};
this.handlers[e] = n;
if (this.sio) {
console.log("register:function " + e);
this.sio.on(e, n);
}
}
},
connect: function(e, t) {
var n = this, o = this.ip;
o.indexOf("://") < 0 && (o = "http://" + o);
this.sio = window.io.connect(o, {
reconnection: !0,
"force new connection": !0,
transports: [ "websocket", "polling" ]
});
this.sio.on("reconnect", function() {
console.log("reconnection");
});
this.sio.io && this.sio.io.onAny && this.sio.io.onAny(function(e, t) {
(0 === e.indexOf("game_") || e.indexOf("hu") >= 0 || e.indexOf("caishen") >= 0) && console.log("[socket.io onAny]", e, "string" == typeof t ? t.substring(0, 100) : t);
});
this.sio.on("connect", function(t) {
n.sio.connected = !0;
e(t);
});
this.sio.on("disconnect", function() {
console.log("disconnect");
n.sio.connected = !1;
n.close();
});
this.sio.on("connect_failed", function() {
console.log("connect_failed");
t && t();
});
this.sio.on("connect_error", function() {
console.log("connect_error");
t && t();
});
console.log("[Net.connect] handlers keys:", Object.keys(this.handlers));
for (var s in this.handlers) {
var i = this.handlers[s];
if ("function" == typeof i) if ("disconnect" == s) this.fnDisconnect = i; else {
console.log("[Net.connect] register sio.on:", s);
this.sio.on(s, i);
}
}
this.startHearbeat();
},
startHearbeat: function() {
this.sio.on("game_pong", function() {
console.log("game_pong");
e.lastRecieveTime = Date.now();
});
this.lastRecieveTime = Date.now();
var e = this;
console.log(1);
if (!e.isPinging) {
console.log(1);
e.isPinging = !0;
setInterval(function() {
console.log(3);
if (e.sio) {
console.log(4);
Date.now() - e.lastRecieveTime > 1e4 ? e.close() : e.ping();
}
}, 5e3);
}
},
send: function(e, t) {
if (this.sio.connected) {
null != t && "object" == typeof t && (t = JSON.stringify(t));
this.sio.emit(e, t);
}
},
ping: function() {
this.send("game_ping");
},
close: function() {
console.log("close");
if (this.sio && this.sio.connected) {
this.sio.connected = !1;
this.sio.disconnect();
this.sio = null;
}
if (this.fnDisconnect) {
this.fnDisconnect();
this.fnDisconnect = null;
}
},
test: function(e) {
var t = null, n = this.ip.split(":"), o = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
ip: n[0],
port: n[1]
};
t = cc.vv.http.sendRequest("/is_server_online", o, function(n) {
e(n.isonline);
t = null;
});
setTimeout(function() {
if (t) {
t.abort();
e(!1);
}
}, 1500);
}
}
});
cc._RF.pop();
}, {
"socket-io": "socket-io"
} ],
OnBack: [ function(e, t) {
"use strict";
cc._RF.push(t, "74331fmhv1GrY7cIXQ35kuc", "OnBack");
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
var e = this.node.getChildByName("btn_back");
cc.vv.utils.addClickEvent(e, this.node, "OnBack", "onBtnClicked");
},
onBtnClicked: function(e) {
"btn_back" == e.target.name && (this.node.active = !1);
}
});
cc._RF.pop();
}, {} ],
ReplayMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "445e3qeTe1HrZvjs7b24OFj", "ReplayMgr");
cc.Class({
extends: cc.Component,
properties: {
_lastAction: null,
_actionRecords: null,
_currentIndex: 0
},
onLoad: function() {},
clear: function() {
this._lastAction = null;
this._actionRecords = null;
this._currentIndex = 0;
},
init: function(e) {
this._actionRecords = e.action_records;
null == this._actionRecords && (this._actionRecords = {});
this._currentIndex = 0;
this._lastAction = null;
},
isReplay: function() {
return null != this._actionRecords;
},
getNextAction: function() {
return this._currentIndex >= this._actionRecords.length ? null : {
si: this._actionRecords[this._currentIndex++],
type: this._actionRecords[this._currentIndex++],
pai: this._actionRecords[this._currentIndex++]
};
},
takeAction: function() {
var e = this.getNextAction();
null != this._lastAction && 1 == this._lastAction.type && null != e && 3 != e.type && 4 != e.type && 5 != e.type && cc.vv.gameNetMgr.doGuo(this._lastAction.si, this._lastAction.pai);
this._lastAction = e;
if (null == e) return -1;
if (1 == e.type) {
cc.vv.gameNetMgr.doChupai(e.si, e.pai);
return 1;
}
if (2 == e.type) {
cc.vv.gameNetMgr.doMopai(e.si, e.pai);
cc.vv.gameNetMgr.doTurnChange(e.si);
return .5;
}
if (3 == e.type) {
cc.vv.gameNetMgr.doPeng(e.si, e.pai);
cc.vv.gameNetMgr.doTurnChange(e.si);
return 1;
}
if (4 == e.type) {
cc.vv.gameNetMgr.dispatchEvent("hangang_notify", e.si);
cc.vv.gameNetMgr.doGang(e.si, e.pai);
cc.vv.gameNetMgr.doTurnChange(e.si);
return 1;
}
if (5 == e.type) {
cc.vv.gameNetMgr.doHu({
seatindex: e.si,
hupai: e.pai,
iszimo: !1
});
return 1.5;
}
}
});
cc._RF.pop();
}, {} ],
SelectPlayway: [ function(e, t) {
"use strict";
cc._RF.push(t, "7c36fbnLl9G+ITRQJdKnKcW", "SelectPlayway");
cc.Class({
extends: cc.Component,
properties: {
first: {
default: null,
type: cc.Node
},
playway: {
default: null,
type: cc.Prefab
},
content: {
default: null,
type: cc.Node
}
},
onLoad: function() {}
});
cc._RF.pop();
}, {} ],
UserMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "49846wj4bdFWoRYOeYfGhJ2", "UserMgr");
cc.Class({
extends: cc.Component,
properties: {
account: null,
userId: null,
userName: null,
lv: 0,
exp: 0,
coins: 0,
gems: 0,
sign: 0,
ip: "",
sex: 0,
roomData: null,
oldRoomId: null
},
guestAuth: function() {
var e = cc.args.account;
null == e && (e = cc.sys.localStorage.getItem("account"));
if (null == e) {
e = Date.now();
cc.sys.localStorage.setItem("account", e);
}
cc.vv.http.sendRequest("/guest", {
account: e
}, this.onAuth);
},
onAuth: function(e) {
var t = cc.vv.userMgr;
if (0 !== e.errcode) console.log(e.errmsg); else {
t.account = e.account;
t.sign = e.sign;
cc.vv.http.url = "http://" + (window.__rewriteHost ? window.__rewriteHost(cc.vv.SI.hall) : cc.vv.SI.hall);
t.login();
}
},
login: function() {
var e = this;
cc.vv.wc.show("正在登录游戏");
cc.vv.http.sendRequest("/login", {
account: this.account,
sign: this.sign
}, function(t) {
if (0 !== t.errcode) console.log(t.errmsg); else if (t.userid) {
console.log(t);
e.account = t.account;
e.userId = t.userid;
e.userName = t.name;
e.lv = t.lv;
e.exp = t.exp;
e.coins = t.coins;
e.gems = t.gems;
e.roomData = t.roomid;
e.sex = t.sex;
e.ip = t.ip;
cc.director.loadScene("hall");
} else cc.director.loadScene("createrole");
});
},
create: function(e) {
var t = this, n = {
account: this.account,
sign: this.sign,
name: e
};
cc.vv.http.sendRequest("/create_user", n, function(e) {
0 !== e.errcode ? console.log(e.errmsg) : t.login();
});
},
enterRoom: function(e, t) {
var n = this, o = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
roomid: e
};
cc.vv.wc.show("正在进入房间 " + e);
cc.vv.http.sendRequest("/enter_private_room", o, function(o) {
if (0 !== o.errcode) if (-1 == o.errcode) setTimeout(function() {
n.enterRoom(e, t);
}, 5e3); else {
cc.vv.wc.hide();
null != t && t(o);
} else {
null != t && t(o);
cc.vv.gameNetMgr.connectGameServer(o);
}
});
},
getHistoryList: function(e) {
var t = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
};
cc.vv.http.sendRequest("/get_history_list", t, function(t) {
if (0 !== t.errcode) console.log(t.errmsg); else {
console.log(t.history);
null != e && e(t.history);
}
});
},
getGamesOfRoom: function(e, t) {
var n = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
uuid: e
};
cc.vv.http.sendRequest("/get_games_of_room", n, function(e) {
if (0 !== e.errcode) console.log(e.errmsg); else {
console.log(e.data);
t(e.data);
}
});
},
getDetailOfGame: function(e, t, n) {
var o = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
uuid: e,
index: t
};
cc.vv.http.sendRequest("/get_detail_of_game", o, function(e) {
if (0 !== e.errcode) console.log(e.errmsg); else {
console.log(e.data);
n(e.data);
}
});
}
});
cc._RF.pop();
}, {} ],
Utils: [ function(e, t) {
"use strict";
cc._RF.push(t, "bf040eJWYNO6aWuiHWq60SX", "Utils");
cc.Class({
extends: cc.Component,
properties: {},
addClickEvent: function(e, t, n, o) {
console.log(n + ":" + o);
var s = new cc.Component.EventHandler();
s.target = t;
s.component = n;
s.handler = o;
e.getComponent(cc.Button).clickEvents.push(s);
},
addSlideEvent: function(e, t, n, o) {
var s = new cc.Component.EventHandler();
s.target = t;
s.component = n;
s.handler = o;
e.getComponent(cc.Slider).slideEvents.push(s);
}
});
cc._RF.pop();
}, {} ],
VoiceMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "04f79lfizNB5a8M0o33HmPW", "VoiceMgr");
var n = 12, o = 128 - n;
function s(e) {
e -= o;
var t = Math.floor(e / n) + o, s = e % n + o;
return String.fromCharCode(t) + String.fromCharCode(s);
}
for (var i = {}, r = {}, a = 0; a < 256; ++a) {
var c, l = a + 1;
c = l >= o ? s(l) : String.fromCharCode(l);
i[a] = c;
r[c] = a;
}
function u(e) {
var t = "", n = e.length, o = n >> 16 & 255, s = n >> 8 & 255, r = 255 & n;
t += i[n >> 24 & 255];
t += i[o];
t += i[s];
t += i[r];
for (var a = 0; a < e.length; ++a) t += i[e[a]];
return t;
}
function p(e, t) {
var n = e.charCodeAt(t);
return n >= o ? e.charAt(t) + e.charAt(t + 1) : e.charAt(t);
}
function h(e) {
for (var t = 0, n = 0, o = 0; o < 4; ++o) {
t += (a = p(e, t)).length;
n |= r[a] << 8 * (3 - o);
}
for (var s = new Uint8Array(n), i = 0; t < e.length; ) {
var a;
t += (a = p(e, t)).length;
s[i] = r[a];
i++;
}
return s;
}
cc.Class({
extends: cc.Component,
properties: {
onPlayCallback: null,
_voiceMediaPath: null
},
init: function() {
if (cc.sys.isNative) {
this._voiceMediaPath = jsb.fileUtils.getWritablePath() + "/voicemsgs/";
this.setStorageDir(this._voiceMediaPath);
}
},
prepare: function(e) {
if (cc.sys.isNative) {
cc.vv.audioMgr.pauseAll();
this.clearCache(e);
cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "prepare", "(Ljava/lang/String;)V", e) : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "prepareRecord:", e);
}
},
release: function() {
if (cc.sys.isNative) {
cc.vv.audioMgr.resumeAll();
cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "release", "()V") : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "finishRecord");
}
},
cancel: function() {
if (cc.sys.isNative) {
cc.vv.audioMgr.resumeAll();
cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "cancel", "()V") : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "cancelRecord");
}
},
writeVoice: function(e, t) {
if (cc.sys.isNative && t && t.length > 0) {
var n = h(t), o = this._voiceMediaPath + e;
this.clearCache(e);
jsb.fileUtils.writeDataToFile(n, o);
}
},
clearCache: function(e) {
if (cc.sys.isNative) {
var t = this._voiceMediaPath + e;
jsb.fileUtils.isFileExist(t) && jsb.fileUtils.removeFile(t);
jsb.fileUtils.isFileExist(t + ".wav") && jsb.fileUtils.removeFile(t + ".wav");
}
},
play: function(e) {
if (cc.sys.isNative) {
cc.vv.audioMgr.pauseAll();
cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoicePlayer", "play", "(Ljava/lang/String;)V", e) : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "play:", e);
}
},
stop: function() {
if (cc.sys.isNative) {
cc.vv.audioMgr.resumeAll();
cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoicePlayer", "stop", "()V") : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "stopPlay");
}
},
getVoiceLevel: function(e) {
return Math.floor(Math.random() * e + 1);
},
getVoiceData: function(e) {
if (cc.sys.isNative) {
var t = this._voiceMediaPath + e;
console.log("getVoiceData:" + t);
var n = jsb.fileUtils.getDataFromFile(t);
if (n) return u(n);
}
return "";
},
download: function() {},
setStorageDir: function(e) {
if (cc.sys.isNative) if (cc.sys.os == cc.sys.OS_ANDROID) jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "setStorageDir", "(Ljava/lang/String;)V", e); else if (cc.sys.os == cc.sys.OS_IOS) {
jsb.reflection.callStaticMethod("VoiceSDK", "setStorageDir:", e);
jsb.fileUtils.isDirectoryExist(e) || jsb.fileUtils.createDirectory(e);
}
}
});
cc._RF.pop();
}, {} ],
WaitingConnection: [ function(e, t) {
"use strict";
cc._RF.push(t, "31f47RcytJJ67ul1CLdirxD", "WaitingConnection");
cc.Class({
extends: cc.Component,
properties: {
target: cc.Node,
_isShow: !1,
lblContent: cc.Label
},
onLoad: function() {
if (null == cc.vv) return null;
cc.vv.wc = this;
this.lblContent && (this.lblContent.node.color = cc.color(90, 50, 20));
this.node.active = this._isShow;
},
update: function(e) {
this.target.angle = this.target.angle + 90 * e;
},
show: function(e) {
this._isShow = !0;
if (this.node) {
this.node.active = this._isShow;
var t = this.node.parent;
if (t) {
var n = cc.view.getVisibleSize(), o = cc.view.getVisibleOrigin();
this.node.setPosition(t.convertToNodeSpaceAR(cc.v2(o.x + n.width / 2, o.y + n.height / 2)));
}
}
this.target && (this.target.active = !0);
if (this.lblContent) {
null == e && (e = "");
this.lblContent.string = e;
}
},
hide: function() {
this._isShow = !1;
this.node && (this.node.active = this._isShow);
},
showError: function(e) {
var t = this;
this.show(null == e ? "操作失败,请重试" : String(e));
this.target && (this.target.active = !1);
this._errTimer && clearTimeout(this._errTimer);
this._errTimer = setTimeout(function() {
t._errTimer = null;
t.hide();
}, 3e3);
}
});
cc._RF.pop();
}, {} ],
playway: [ function(e, t) {
"use strict";
cc._RF.push(t, "af6f4wEbYlIp6soloWanW8g", "playway");
cc.Class({
extends: cc.Component,
properties: {
atlas: {
default: null,
type: cc.SpriteAtlas
}
},
onLoad: function() {}
});
cc._RF.pop();
}, {} ],
"socket-io": [ function(e, t, n) {
(function(o) {
"use strict";
cc._RF.push(t, "393290vPc1IIYfh8FrmxcNZ", "socket-io");
(function(e) {
"object" == typeof n && "undefined" != typeof t ? t.exports = e() : "function" == typeof define && define.amd ? define([], e) : ("undefined" != typeof window ? window : "undefined" != typeof o ? o : "undefined" != typeof self ? self : this).io = e();
})(function() {
return function t(n, o, s) {
function i(a, c) {
if (!o[a]) {
if (!n[a]) {
var l = "function" == typeof e && e;
if (!c && l) return l(a, !0);
if (r) return r(a, !0);
var u = new Error("Cannot find module '" + a + "'");
throw u.code = "MODULE_NOT_FOUND", u;
}
var p = o[a] = {
exports: {}
};
n[a][0].call(p.exports, function(e) {
return i(n[a][1][e] || e);
}, p, p.exports, t, n, o, s);
}
return o[a].exports;
}
for (var r = "function" == typeof e && e, a = 0; a < s.length; a++) i(s[a]);
return i;
}({
1: [ function(e, t) {
t.exports = e("./lib/");
}, {
"./lib/": 2
} ],
2: [ function(e, t) {
t.exports = e("./socket");
t.exports.parser = e("engine.io-parser");
}, {
"./socket": 3,
"engine.io-parser": 19
} ],
3: [ function(e, t) {
(function(n) {
var o = e("./transports"), s = e("component-emitter"), i = e("debug")("engine.io-client:socket"), r = e("indexof"), a = e("engine.io-parser"), c = e("parseuri"), l = e("parsejson"), u = e("parseqs");
t.exports = p;
function p(e, t) {
if (!(this instanceof p)) return new p(e, t);
t = t || {};
if (e && "object" == typeof e) {
t = e;
e = null;
}
if (e) {
e = c(e);
t.hostname = e.host;
t.secure = "https" == e.protocol || "wss" == e.protocol;
t.port = e.port;
e.query && (t.query = e.query);
} else t.host && (t.hostname = c(t.host).host);
this.secure = null != t.secure ? t.secure : n.location && "https:" == location.protocol;
t.hostname && !t.port && (t.port = this.secure ? "443" : "80");
this.agent = t.agent || !1;
this.hostname = t.hostname || (n.location ? location.hostname : "localhost");
this.port = t.port || (n.location && location.port ? location.port : this.secure ? 443 : 80);
this.query = t.query || {};
"string" == typeof this.query && (this.query = u.decode(this.query));
this.upgrade = !1 !== t.upgrade;
this.path = (t.path || "/engine.io").replace(/\/$/, "") + "/";
this.forceJSONP = !!t.forceJSONP;
this.jsonp = !1 !== t.jsonp;
this.forceBase64 = !!t.forceBase64;
this.enablesXDR = !!t.enablesXDR;
this.timestampParam = t.timestampParam || "t";
this.timestampRequests = t.timestampRequests;
this.transports = t.transports || [ "polling", "websocket" ];
this.readyState = "";
this.writeBuffer = [];
this.policyPort = t.policyPort || 843;
this.rememberUpgrade = t.rememberUpgrade || !1;
this.binaryType = null;
this.onlyBinaryUpgrades = t.onlyBinaryUpgrades;
this.perMessageDeflate = !1 !== t.perMessageDeflate && (t.perMessageDeflate || {});
!0 === this.perMessageDeflate && (this.perMessageDeflate = {});
this.perMessageDeflate && null == this.perMessageDeflate.threshold && (this.perMessageDeflate.threshold = 1024);
this.pfx = t.pfx || null;
this.key = t.key || null;
this.passphrase = t.passphrase || null;
this.cert = t.cert || null;
this.ca = t.ca || null;
this.ciphers = t.ciphers || null;
this.rejectUnauthorized = void 0 === t.rejectUnauthorized || t.rejectUnauthorized;
var o = "object" == typeof n && n;
o.global === o && t.extraHeaders && Object.keys(t.extraHeaders).length > 0 && (this.extraHeaders = t.extraHeaders);
this.open();
}
p.priorWebsocketSuccess = !1;
s(p.prototype);
p.protocol = a.protocol;
p.Socket = p;
p.Transport = e("./transport");
p.transports = e("./transports");
p.parser = e("engine.io-parser");
p.prototype.createTransport = function(e) {
i('creating transport "%s"', e);
var t = h(this.query);
t.EIO = a.protocol;
t.transport = e;
this.id && (t.sid = this.id);
return new o[e]({
agent: this.agent,
hostname: this.hostname,
port: this.port,
secure: this.secure,
path: this.path,
query: t,
forceJSONP: this.forceJSONP,
jsonp: this.jsonp,
forceBase64: this.forceBase64,
enablesXDR: this.enablesXDR,
timestampRequests: this.timestampRequests,
timestampParam: this.timestampParam,
policyPort: this.policyPort,
socket: this,
pfx: this.pfx,
key: this.key,
passphrase: this.passphrase,
cert: this.cert,
ca: this.ca,
ciphers: this.ciphers,
rejectUnauthorized: this.rejectUnauthorized,
perMessageDeflate: this.perMessageDeflate,
extraHeaders: this.extraHeaders
});
};
function h(e) {
var t = {};
for (var n in e) e.hasOwnProperty(n) && (t[n] = e[n]);
return t;
}
p.prototype.open = function() {
var e;
if (this.rememberUpgrade && p.priorWebsocketSuccess && -1 != this.transports.indexOf("websocket")) e = "websocket"; else {
if (0 === this.transports.length) {
var t = this;
setTimeout(function() {
t.emit("error", "No transports available");
}, 0);
return;
}
e = this.transports[0];
}
this.readyState = "opening";
try {
e = this.createTransport(e);
} catch (e) {
this.transports.shift();
this.open();
return;
}
e.open();
this.setTransport(e);
};
p.prototype.setTransport = function(e) {
i("setting transport %s", e.name);
var t = this;
if (this.transport) {
i("clearing existing transport %s", this.transport.name);
this.transport.removeAllListeners();
}
this.transport = e;
e.on("drain", function() {
t.onDrain();
}).on("packet", function(e) {
t.onPacket(e);
}).on("error", function(e) {
t.onError(e);
}).on("close", function() {
t.onClose("transport close");
});
};
p.prototype.probe = function(e) {
i('probing transport "%s"', e);
var t = this.createTransport(e, {
probe: 1
}), n = !1, o = this;
p.priorWebsocketSuccess = !1;
function s() {
if (o.onlyBinaryUpgrades) {
var s = !this.supportsBinary && o.transport.supportsBinary;
n = n || s;
}
if (!n) {
i('probe transport "%s" opened', e);
t.send([ {
type: "ping",
data: "probe"
} ]);
t.once("packet", function(s) {
if (!n) if ("pong" == s.type && "probe" == s.data) {
i('probe transport "%s" pong', e);
o.upgrading = !0;
o.emit("upgrading", t);
if (!t) return;
p.priorWebsocketSuccess = "websocket" == t.name;
i('pausing current transport "%s"', o.transport.name);
o.transport.pause(function() {
if (!n && "closed" != o.readyState) {
i("changing transport and sending upgrade packet");
h();
o.setTransport(t);
t.send([ {
type: "upgrade"
} ]);
o.emit("upgrade", t);
t = null;
o.upgrading = !1;
o.flush();
}
});
} else {
i('probe transport "%s" failed', e);
var r = new Error("probe error");
r.transport = t.name;
o.emit("upgradeError", r);
}
});
}
}
function r() {
if (!n) {
n = !0;
h();
t.close();
t = null;
}
}
function a(n) {
var s = new Error("probe error: " + n);
s.transport = t.name;
r();
i('probe transport "%s" failed because of error: %s', e, n);
o.emit("upgradeError", s);
}
function c() {
a("transport closed");
}
function l() {
a("socket closed");
}
function u(e) {
if (t && e.name != t.name) {
i('"%s" works - aborting "%s"', e.name, t.name);
r();
}
}
function h() {
t.removeListener("open", s);
t.removeListener("error", a);
t.removeListener("close", c);
o.removeListener("close", l);
o.removeListener("upgrading", u);
}
t.once("open", s);
t.once("error", a);
t.once("close", c);
this.once("close", l);
this.once("upgrading", u);
t.open();
};
p.prototype.onOpen = function() {
i("socket open");
this.readyState = "open";
p.priorWebsocketSuccess = "websocket" == this.transport.name;
this.emit("open");
this.flush();
if ("open" == this.readyState && this.upgrade && this.transport.pause) {
i("starting upgrade probes");
for (var e = 0, t = this.upgrades.length; e < t; e++) this.probe(this.upgrades[e]);
}
};
p.prototype.onPacket = function(e) {
if ("opening" == this.readyState || "open" == this.readyState) {
i('socket receive: type "%s", data "%s"', e.type, e.data);
this.emit("packet", e);
this.emit("heartbeat");
switch (e.type) {
case "open":
this.onHandshake(l(e.data));
break;

case "pong":
this.setPing();
this.emit("pong");
break;

case "error":
var t = new Error("server error");
t.code = e.data;
this.onError(t);
break;

case "message":
this.emit("data", e.data);
this.emit("message", e.data);
}
} else i('packet received with socket readyState "%s"', this.readyState);
};
p.prototype.onHandshake = function(e) {
this.emit("handshake", e);
this.id = e.sid;
this.transport.query.sid = e.sid;
this.upgrades = this.filterUpgrades(e.upgrades);
this.pingInterval = e.pingInterval;
this.pingTimeout = e.pingTimeout;
this.onOpen();
if ("closed" != this.readyState) {
this.setPing();
this.removeListener("heartbeat", this.onHeartbeat);
this.on("heartbeat", this.onHeartbeat);
}
};
p.prototype.onHeartbeat = function(e) {
clearTimeout(this.pingTimeoutTimer);
var t = this;
t.pingTimeoutTimer = setTimeout(function() {
"closed" != t.readyState && t.onClose("ping timeout");
}, e || t.pingInterval + t.pingTimeout);
};
p.prototype.setPing = function() {
var e = this;
clearTimeout(e.pingIntervalTimer);
e.pingIntervalTimer = setTimeout(function() {
i("writing ping packet - expecting pong within %sms", e.pingTimeout);
e.ping();
e.onHeartbeat(e.pingTimeout);
}, e.pingInterval);
};
p.prototype.ping = function() {
var e = this;
this.sendPacket("ping", function() {
e.emit("ping");
});
};
p.prototype.onDrain = function() {
this.writeBuffer.splice(0, this.prevBufferLen);
this.prevBufferLen = 0;
0 === this.writeBuffer.length ? this.emit("drain") : this.flush();
};
p.prototype.flush = function() {
if ("closed" != this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
i("flushing %d packets in socket", this.writeBuffer.length);
this.transport.send(this.writeBuffer);
this.prevBufferLen = this.writeBuffer.length;
this.emit("flush");
}
};
p.prototype.write = p.prototype.send = function(e, t, n) {
this.sendPacket("message", e, t, n);
return this;
};
p.prototype.sendPacket = function(e, t, n, o) {
if ("function" == typeof t) {
o = t;
t = void 0;
}
if ("function" == typeof n) {
o = n;
n = null;
}
if ("closing" != this.readyState && "closed" != this.readyState) {
(n = n || {}).compress = !1 !== n.compress;
var s = {
type: e,
data: t,
options: n
};
this.emit("packetCreate", s);
this.writeBuffer.push(s);
o && this.once("flush", o);
this.flush();
}
};
p.prototype.close = function() {
if ("opening" == this.readyState || "open" == this.readyState) {
this.readyState = "closing";
var e = this;
this.writeBuffer.length ? this.once("drain", function() {
this.upgrading ? o() : t();
}) : this.upgrading ? o() : t();
}
function t() {
e.onClose("forced close");
i("socket closing - telling transport to close");
e.transport.close();
}
function n() {
e.removeListener("upgrade", n);
e.removeListener("upgradeError", n);
t();
}
function o() {
e.once("upgrade", n);
e.once("upgradeError", n);
}
return this;
};
p.prototype.onError = function(e) {
i("socket error %j", e);
p.priorWebsocketSuccess = !1;
this.emit("error", e);
this.onClose("transport error", e);
};
p.prototype.onClose = function(e, t) {
if ("opening" == this.readyState || "open" == this.readyState || "closing" == this.readyState) {
i('socket close with reason: "%s"', e);
clearTimeout(this.pingIntervalTimer);
clearTimeout(this.pingTimeoutTimer);
this.transport.removeAllListeners("close");
this.transport.close();
this.transport.removeAllListeners();
this.readyState = "closed";
this.id = null;
this.emit("close", e, t);
this.writeBuffer = [];
this.prevBufferLen = 0;
}
};
p.prototype.filterUpgrades = function(e) {
for (var t = [], n = 0, o = e.length; n < o; n++) ~r(this.transports, e[n]) && t.push(e[n]);
return t;
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
"./transport": 4,
"./transports": 5,
"component-emitter": 15,
debug: 17,
"engine.io-parser": 19,
indexof: 23,
parsejson: 26,
parseqs: 27,
parseuri: 28
} ],
4: [ function(e, t) {
var n = e("engine.io-parser"), o = e("component-emitter");
t.exports = s;
function s(e) {
this.path = e.path;
this.hostname = e.hostname;
this.port = e.port;
this.secure = e.secure;
this.query = e.query;
this.timestampParam = e.timestampParam;
this.timestampRequests = e.timestampRequests;
this.readyState = "";
this.agent = e.agent || !1;
this.socket = e.socket;
this.enablesXDR = e.enablesXDR;
this.pfx = e.pfx;
this.key = e.key;
this.passphrase = e.passphrase;
this.cert = e.cert;
this.ca = e.ca;
this.ciphers = e.ciphers;
this.rejectUnauthorized = e.rejectUnauthorized;
this.extraHeaders = e.extraHeaders;
}
o(s.prototype);
s.prototype.onError = function(e, t) {
var n = new Error(e);
n.type = "TransportError";
n.description = t;
this.emit("error", n);
return this;
};
s.prototype.open = function() {
if ("closed" == this.readyState || "" == this.readyState) {
this.readyState = "opening";
this.doOpen();
}
return this;
};
s.prototype.close = function() {
if ("opening" == this.readyState || "open" == this.readyState) {
this.doClose();
this.onClose();
}
return this;
};
s.prototype.send = function(e) {
if ("open" != this.readyState) throw new Error("Transport not open");
this.write(e);
};
s.prototype.onOpen = function() {
this.readyState = "open";
this.writable = !0;
this.emit("open");
};
s.prototype.onData = function(e) {
var t = n.decodePacket(e, this.socket.binaryType);
this.onPacket(t);
};
s.prototype.onPacket = function(e) {
this.emit("packet", e);
};
s.prototype.onClose = function() {
this.readyState = "closed";
this.emit("close");
};
}, {
"component-emitter": 15,
"engine.io-parser": 19
} ],
5: [ function(e, t, n) {
(function(t) {
var o = e("xmlhttprequest-ssl"), s = e("./polling-xhr"), i = e("./polling-jsonp"), r = e("./websocket");
n.polling = function(e) {
var n = !1, r = !1, a = !1 !== e.jsonp;
if (t.location) {
var c = "https:" == location.protocol, l = location.port;
l || (l = c ? 443 : 80);
n = e.hostname != location.hostname || l != e.port;
r = e.secure != c;
}
e.xdomain = n;
e.xscheme = r;
if ("open" in new o(e) && !e.forceJSONP) return new s(e);
if (!a) throw new Error("JSONP disabled");
return new i(e);
};
n.websocket = r;
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
"./polling-jsonp": 6,
"./polling-xhr": 7,
"./websocket": 9,
"xmlhttprequest-ssl": 10
} ],
6: [ function(e, t) {
(function(n) {
var o = e("./polling"), s = e("component-inherit");
t.exports = l;
var i, r = /\n/g, a = /\\n/g;
function c() {}
function l(e) {
o.call(this, e);
this.query = this.query || {};
if (!i) {
n.___eio || (n.___eio = []);
i = n.___eio;
}
this.index = i.length;
var t = this;
i.push(function(e) {
t.onData(e);
});
this.query.j = this.index;
n.document && n.addEventListener && n.addEventListener("beforeunload", function() {
t.script && (t.script.onerror = c);
}, !1);
}
s(l, o);
l.prototype.supportsBinary = !1;
l.prototype.doClose = function() {
if (this.script) {
this.script.parentNode.removeChild(this.script);
this.script = null;
}
if (this.form) {
this.form.parentNode.removeChild(this.form);
this.form = null;
this.iframe = null;
}
o.prototype.doClose.call(this);
};
l.prototype.doPoll = function() {
var e = this, t = document.createElement("script");
if (this.script) {
this.script.parentNode.removeChild(this.script);
this.script = null;
}
t.async = !0;
t.src = this.uri();
t.onerror = function(t) {
e.onError("jsonp poll error", t);
};
var n = document.getElementsByTagName("script")[0];
n ? n.parentNode.insertBefore(t, n) : (document.head || document.body).appendChild(t);
this.script = t;
"undefined" != typeof navigator && /gecko/i.test(navigator.userAgent) && setTimeout(function() {
var e = document.createElement("iframe");
document.body.appendChild(e);
document.body.removeChild(e);
}, 100);
};
l.prototype.doWrite = function(e, t) {
var n = this;
if (!this.form) {
var o, s = document.createElement("form"), i = document.createElement("textarea"), c = this.iframeId = "eio_iframe_" + this.index;
s.className = "socketio";
s.style.position = "absolute";
s.style.top = "-1000px";
s.style.left = "-1000px";
s.target = c;
s.method = "POST";
s.setAttribute("accept-charset", "utf-8");
i.name = "d";
s.appendChild(i);
document.body.appendChild(s);
this.form = s;
this.area = i;
}
this.form.action = this.uri();
function l() {
u();
t();
}
function u() {
if (n.iframe) try {
n.form.removeChild(n.iframe);
} catch (e) {
n.onError("jsonp polling iframe removal error", e);
}
try {
var e = '<iframe src="javascript:0" name="' + n.iframeId + '">';
o = document.createElement(e);
} catch (e) {
(o = document.createElement("iframe")).name = n.iframeId;
o.src = "javascript:0";
}
o.id = n.iframeId;
n.form.appendChild(o);
n.iframe = o;
}
u();
e = e.replace(a, "\\\n");
this.area.value = e.replace(r, "\\n");
try {
this.form.submit();
} catch (e) {}
this.iframe.attachEvent ? this.iframe.onreadystatechange = function() {
"complete" == n.iframe.readyState && l();
} : this.iframe.onload = l;
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
"./polling": 8,
"component-inherit": 16
} ],
7: [ function(e, t) {
(function(n) {
var o = e("xmlhttprequest-ssl"), s = e("./polling"), i = e("component-emitter"), r = e("component-inherit"), a = e("debug")("engine.io-client:polling-xhr");
t.exports = l;
t.exports.Request = u;
function c() {}
function l(e) {
s.call(this, e);
if (n.location) {
var t = "https:" == location.protocol, o = location.port;
o || (o = t ? 443 : 80);
this.xd = e.hostname != n.location.hostname || o != e.port;
this.xs = e.secure != t;
} else this.extraHeaders = e.extraHeaders;
}
r(l, s);
l.prototype.supportsBinary = !0;
l.prototype.request = function(e) {
(e = e || {}).uri = this.uri();
e.xd = this.xd;
e.xs = this.xs;
e.agent = this.agent || !1;
e.supportsBinary = this.supportsBinary;
e.enablesXDR = this.enablesXDR;
e.pfx = this.pfx;
e.key = this.key;
e.passphrase = this.passphrase;
e.cert = this.cert;
e.ca = this.ca;
e.ciphers = this.ciphers;
e.rejectUnauthorized = this.rejectUnauthorized;
e.extraHeaders = this.extraHeaders;
return new u(e);
};
l.prototype.doWrite = function(e, t) {
var n = "string" != typeof e && void 0 !== e, o = this.request({
method: "POST",
data: e,
isBinary: n
}), s = this;
o.on("success", t);
o.on("error", function(e) {
s.onError("xhr post error", e);
});
this.sendXhr = o;
};
l.prototype.doPoll = function() {
a("xhr poll");
var e = this.request(), t = this;
e.on("data", function(e) {
t.onData(e);
});
e.on("error", function(e) {
t.onError("xhr poll error", e);
});
this.pollXhr = e;
};
function u(e) {
this.method = e.method || "GET";
this.uri = e.uri;
this.xd = !!e.xd;
this.xs = !!e.xs;
this.async = !1 !== e.async;
this.data = null != e.data ? e.data : null;
this.agent = e.agent;
this.isBinary = e.isBinary;
this.supportsBinary = e.supportsBinary;
this.enablesXDR = e.enablesXDR;
this.pfx = e.pfx;
this.key = e.key;
this.passphrase = e.passphrase;
this.cert = e.cert;
this.ca = e.ca;
this.ciphers = e.ciphers;
this.rejectUnauthorized = e.rejectUnauthorized;
this.extraHeaders = e.extraHeaders;
this.create();
}
i(u.prototype);
u.prototype.create = function() {
var e = {
agent: this.agent,
xdomain: this.xd,
xscheme: this.xs,
enablesXDR: this.enablesXDR
};
e.pfx = this.pfx;
e.key = this.key;
e.passphrase = this.passphrase;
e.cert = this.cert;
e.ca = this.ca;
e.ciphers = this.ciphers;
e.rejectUnauthorized = this.rejectUnauthorized;
var t = this.xhr = new o(e), s = this;
try {
a("xhr open %s: %s", this.method, this.uri);
t.open(this.method, this.uri, this.async);
try {
if (this.extraHeaders) {
t.setDisableHeaderCheck(!0);
for (var i in this.extraHeaders) this.extraHeaders.hasOwnProperty(i) && t.setRequestHeader(i, this.extraHeaders[i]);
}
} catch (e) {}
this.supportsBinary && (t.responseType = "arraybuffer");
if ("POST" == this.method) try {
this.isBinary ? t.setRequestHeader("Content-type", "application/octet-stream") : t.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
} catch (e) {}
"withCredentials" in t && (t.withCredentials = !0);
if (this.hasXDR()) {
t.onload = function() {
s.onLoad();
};
t.onerror = function() {
s.onError(t.responseText);
};
} else t.onreadystatechange = function() {
4 == t.readyState && (200 == t.status || 1223 == t.status ? s.onLoad() : setTimeout(function() {
s.onError(t.status);
}, 0));
};
a("xhr data %s", this.data);
t.send(this.data);
} catch (e) {
setTimeout(function() {
s.onError(e);
}, 0);
return;
}
if (n.document) {
this.index = u.requestsCount++;
u.requests[this.index] = this;
}
};
u.prototype.onSuccess = function() {
this.emit("success");
this.cleanup();
};
u.prototype.onData = function(e) {
this.emit("data", e);
this.onSuccess();
};
u.prototype.onError = function(e) {
this.emit("error", e);
this.cleanup(!0);
};
u.prototype.cleanup = function(e) {
if ("undefined" != typeof this.xhr && null !== this.xhr) {
this.hasXDR() ? this.xhr.onload = this.xhr.onerror = c : this.xhr.onreadystatechange = c;
if (e) try {
this.xhr.abort();
} catch (e) {}
n.document && delete u.requests[this.index];
this.xhr = null;
}
};
u.prototype.onLoad = function() {
var e;
try {
var t;
try {
t = this.xhr.getResponseHeader("Content-Type").split(";")[0];
} catch (e) {}
if ("application/octet-stream" === t) e = this.xhr.response; else if (this.supportsBinary) try {
e = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
} catch (t) {
for (var n = new Uint8Array(this.xhr.response), o = [], s = 0, i = n.length; s < i; s++) o.push(n[s]);
e = String.fromCharCode.apply(null, o);
} else e = this.xhr.responseText;
} catch (e) {
this.onError(e);
}
null != e && this.onData(e);
};
u.prototype.hasXDR = function() {
return "undefined" != typeof n.XDomainRequest && !this.xs && this.enablesXDR;
};
u.prototype.abort = function() {
this.cleanup();
};
if (n.document) {
u.requestsCount = 0;
u.requests = {};
n.attachEvent ? n.attachEvent("onunload", p) : n.addEventListener && n.addEventListener("beforeunload", p, !1);
}
function p() {
for (var e in u.requests) u.requests.hasOwnProperty(e) && u.requests[e].abort();
}
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
"./polling": 8,
"component-emitter": 15,
"component-inherit": 16,
debug: 17,
"xmlhttprequest-ssl": 10
} ],
8: [ function(e, t) {
var n = e("../transport"), o = e("parseqs"), s = e("engine.io-parser"), i = e("component-inherit"), r = e("yeast"), a = e("debug")("engine.io-client:polling");
t.exports = l;
var c = null != new (e("xmlhttprequest-ssl"))({
xdomain: !1
}).responseType;
function l(e) {
var t = e && e.forceBase64;
c && !t || (this.supportsBinary = !1);
n.call(this, e);
}
i(l, n);
l.prototype.name = "polling";
l.prototype.doOpen = function() {
this.poll();
};
l.prototype.pause = function(e) {
var t = this;
this.readyState = "pausing";
function n() {
a("paused");
t.readyState = "paused";
e();
}
if (this.polling || !this.writable) {
var o = 0;
if (this.polling) {
a("we are currently polling - waiting to pause");
o++;
this.once("pollComplete", function() {
a("pre-pause polling complete");
--o || n();
});
}
if (!this.writable) {
a("we are currently writing - waiting to pause");
o++;
this.once("drain", function() {
a("pre-pause writing complete");
--o || n();
});
}
} else n();
};
l.prototype.poll = function() {
a("polling");
this.polling = !0;
this.doPoll();
this.emit("poll");
};
l.prototype.onData = function(e) {
var t = this;
a("polling got data %s", e);
s.decodePayload(e, this.socket.binaryType, function(e) {
"opening" == t.readyState && t.onOpen();
if ("close" == e.type) {
t.onClose();
return !1;
}
t.onPacket(e);
});
if ("closed" != this.readyState) {
this.polling = !1;
this.emit("pollComplete");
"open" == this.readyState ? this.poll() : a('ignoring poll - transport state "%s"', this.readyState);
}
};
l.prototype.doClose = function() {
var e = this;
function t() {
a("writing close packet");
e.write([ {
type: "close"
} ]);
}
if ("open" == this.readyState) {
a("transport open - closing");
t();
} else {
a("transport not open - deferring close");
this.once("open", t);
}
};
l.prototype.write = function(e) {
var t = this;
this.writable = !1;
var n = function() {
t.writable = !0;
t.emit("drain");
};
t = this;
s.encodePayload(e, this.supportsBinary, function(e) {
t.doWrite(e, n);
});
};
l.prototype.uri = function() {
var e = this.query || {}, t = this.secure ? "https" : "http", n = "";
!1 !== this.timestampRequests && (e[this.timestampParam] = r());
this.supportsBinary || e.sid || (e.b64 = 1);
e = o.encode(e);
this.port && ("https" == t && 443 != this.port || "http" == t && 80 != this.port) && (n = ":" + this.port);
e.length && (e = "?" + e);
return t + "://" + (-1 !== this.hostname.indexOf(":") ? "[" + this.hostname + "]" : this.hostname) + n + this.path + e;
};
}, {
"../transport": 4,
"component-inherit": 16,
debug: 17,
"engine.io-parser": 19,
parseqs: 27,
"xmlhttprequest-ssl": 10,
yeast: 30
} ],
9: [ function(e, t) {
(function(n) {
var o = e("../transport"), s = e("engine.io-parser"), i = e("parseqs"), r = e("component-inherit"), a = e("yeast"), c = e("debug")("engine.io-client:websocket"), l = n.WebSocket || n.MozWebSocket, u = l;
if (!u && "undefined" == typeof window) try {
u = e("ws");
} catch (e) {}
t.exports = p;
function p(e) {
e && e.forceBase64 && (this.supportsBinary = !1);
this.perMessageDeflate = e.perMessageDeflate;
o.call(this, e);
}
r(p, o);
p.prototype.name = "websocket";
p.prototype.supportsBinary = !0;
p.prototype.doOpen = function() {
if (this.check()) {
var e = this.uri(), t = {
agent: this.agent,
perMessageDeflate: this.perMessageDeflate
};
t.pfx = this.pfx;
t.key = this.key;
t.passphrase = this.passphrase;
t.cert = this.cert;
t.ca = this.ca;
t.ciphers = this.ciphers;
t.rejectUnauthorized = this.rejectUnauthorized;
this.extraHeaders && (t.headers = this.extraHeaders);
this.ws = l ? new u(e) : new u(e, void 0, t);
void 0 === this.ws.binaryType && (this.supportsBinary = !1);
if (this.ws.supports && this.ws.supports.binary) {
this.supportsBinary = !0;
this.ws.binaryType = "buffer";
} else this.ws.binaryType = "arraybuffer";
this.addEventListeners();
}
};
p.prototype.addEventListeners = function() {
var e = this;
this.ws.onopen = function() {
e.onOpen();
};
this.ws.onclose = function() {
e.onClose();
};
this.ws.onmessage = function(t) {
e.onData(t.data);
};
this.ws.onerror = function(t) {
e.onError("websocket error", t);
};
};
"undefined" != typeof navigator && /iPad|iPhone|iPod/i.test(navigator.userAgent) && (p.prototype.onData = function(e) {
var t = this;
setTimeout(function() {
o.prototype.onData.call(t, e);
}, 0);
});
p.prototype.write = function(e) {
var t = this;
this.writable = !1;
for (var o = e.length, i = 0, r = o; i < r; i++) (function(e) {
s.encodePacket(e, t.supportsBinary, function(s) {
if (!l) {
var i = {};
e.options && (i.compress = e.options.compress);
t.perMessageDeflate && ("string" == typeof s ? n.Buffer.byteLength(s) : s.length) < t.perMessageDeflate.threshold && (i.compress = !1);
}
try {
l ? t.ws.send(s) : t.ws.send(s, i);
} catch (e) {
c("websocket closed before onclose event");
}
--o || a();
});
})(e[i]);
function a() {
t.emit("flush");
setTimeout(function() {
t.writable = !0;
t.emit("drain");
}, 0);
}
};
p.prototype.onClose = function() {
o.prototype.onClose.call(this);
};
p.prototype.doClose = function() {
"undefined" != typeof this.ws && this.ws.close();
};
p.prototype.uri = function() {
var e = this.query || {}, t = this.secure ? "wss" : "ws", n = "";
this.port && ("wss" == t && 443 != this.port || "ws" == t && 80 != this.port) && (n = ":" + this.port);
this.timestampRequests && (e[this.timestampParam] = a());
this.supportsBinary || (e.b64 = 1);
(e = i.encode(e)).length && (e = "?" + e);
return t + "://" + (-1 !== this.hostname.indexOf(":") ? "[" + this.hostname + "]" : this.hostname) + n + this.path + e;
};
p.prototype.check = function() {
return !(!u || "__initialize" in u && this.name === p.prototype.name);
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
"../transport": 4,
"component-inherit": 16,
debug: 17,
"engine.io-parser": 19,
parseqs: 27,
ws: void 0,
yeast: 30
} ],
10: [ function(e, t) {
var n = e("has-cors");
t.exports = function(e) {
var t = e.xdomain, o = e.xscheme, s = e.enablesXDR;
try {
if ("undefined" != typeof XMLHttpRequest && (!t || n)) return new XMLHttpRequest();
} catch (e) {}
try {
if ("undefined" != typeof XDomainRequest && !o && s) return new XDomainRequest();
} catch (e) {}
if (!t) try {
return new ActiveXObject("Microsoft.XMLHTTP");
} catch (e) {}
};
}, {
"has-cors": 22
} ],
11: [ function(e, t) {
t.exports = function(e, t, o) {
var s = !1;
o = o || n;
i.count = e;
return 0 === e ? t() : i;
function i(e, n) {
if (i.count <= 0) throw new Error("after called too many times");
--i.count;
if (e) {
s = !0;
t(e);
t = o;
} else 0 !== i.count || s || t(null, n);
}
};
function n() {}
}, {} ],
12: [ function(e, t) {
t.exports = function(e, t, n) {
var o = e.byteLength;
t = t || 0;
n = n || o;
if (e.slice) return e.slice(t, n);
t < 0 && (t += o);
n < 0 && (n += o);
n > o && (n = o);
if (t >= o || t >= n || 0 === o) return new ArrayBuffer(0);
for (var s = new Uint8Array(e), i = new Uint8Array(n - t), r = t, a = 0; r < n; r++, 
a++) i[a] = s[r];
return i.buffer;
};
}, {} ],
13: [ function(e, t, n) {
(function(e) {
n.encode = function(t) {
var n, o = new Uint8Array(t), s = o.length, i = "";
for (n = 0; n < s; n += 3) {
i += e[o[n] >> 2];
i += e[(3 & o[n]) << 4 | o[n + 1] >> 4];
i += e[(15 & o[n + 1]) << 2 | o[n + 2] >> 6];
i += e[63 & o[n + 2]];
}
s % 3 == 2 ? i = i.substring(0, i.length - 1) + "=" : s % 3 == 1 && (i = i.substring(0, i.length - 2) + "==");
return i;
};
n.decode = function(t) {
var n, o, s, i, r, a = .75 * t.length, c = t.length, l = 0;
if ("=" === t[t.length - 1]) {
a--;
"=" === t[t.length - 2] && a--;
}
var u = new ArrayBuffer(a), p = new Uint8Array(u);
for (n = 0; n < c; n += 4) {
o = e.indexOf(t[n]);
s = e.indexOf(t[n + 1]);
i = e.indexOf(t[n + 2]);
r = e.indexOf(t[n + 3]);
p[l++] = o << 2 | s >> 4;
p[l++] = (15 & s) << 4 | i >> 2;
p[l++] = (3 & i) << 6 | 63 & r;
}
return u;
};
})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
}, {} ],
14: [ function(e, t) {
(function(e) {
var n = e.BlobBuilder || e.WebKitBlobBuilder || e.MSBlobBuilder || e.MozBlobBuilder, o = function() {
try {
return 2 === new Blob([ "hi" ]).size;
} catch (e) {
return !1;
}
}(), s = o && function() {
try {
return 2 === new Blob([ new Uint8Array([ 1, 2 ]) ]).size;
} catch (e) {
return !1;
}
}(), i = n && n.prototype.append && n.prototype.getBlob;
function r(e) {
for (var t = 0; t < e.length; t++) {
var n = e[t];
if (n.buffer instanceof ArrayBuffer) {
var o = n.buffer;
if (n.byteLength !== o.byteLength) {
var s = new Uint8Array(n.byteLength);
s.set(new Uint8Array(o, n.byteOffset, n.byteLength));
o = s.buffer;
}
e[t] = o;
}
}
}
t.exports = o ? s ? e.Blob : function(e, t) {
r(e);
return new Blob(e, t || {});
} : i ? function(e, t) {
t = t || {};
var o = new n();
r(e);
for (var s = 0; s < e.length; s++) o.append(e[s]);
return t.type ? o.getBlob(t.type) : o.getBlob();
} : void 0;
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {} ],
15: [ function(e, t) {
t.exports = n;
function n(e) {
if (e) return o(e);
}
function o(e) {
for (var t in n.prototype) e[t] = n.prototype[t];
return e;
}
n.prototype.on = n.prototype.addEventListener = function(e, t) {
this._callbacks = this._callbacks || {};
(this._callbacks[e] = this._callbacks[e] || []).push(t);
return this;
};
n.prototype.once = function(e, t) {
var n = this;
this._callbacks = this._callbacks || {};
function o() {
n.off(e, o);
t.apply(this, arguments);
}
o.fn = t;
this.on(e, o);
return this;
};
n.prototype.off = n.prototype.removeListener = n.prototype.removeAllListeners = n.prototype.removeEventListener = function(e, t) {
this._callbacks = this._callbacks || {};
if (0 == arguments.length) {
this._callbacks = {};
return this;
}
var n, o = this._callbacks[e];
if (!o) return this;
if (1 == arguments.length) {
delete this._callbacks[e];
return this;
}
for (var s = 0; s < o.length; s++) if ((n = o[s]) === t || n.fn === t) {
o.splice(s, 1);
break;
}
return this;
};
n.prototype.emit = function(e) {
this._callbacks = this._callbacks || {};
var t = [].slice.call(arguments, 1), n = this._callbacks[e];
if (n) for (var o = 0, s = (n = n.slice(0)).length; o < s; ++o) n[o].apply(this, t);
return this;
};
n.prototype.listeners = function(e) {
this._callbacks = this._callbacks || {};
return this._callbacks[e] || [];
};
n.prototype.hasListeners = function(e) {
return !!this.listeners(e).length;
};
}, {} ],
16: [ function(e, t) {
t.exports = function(e, t) {
var n = function() {};
n.prototype = t.prototype;
e.prototype = new n();
e.prototype.constructor = e;
};
}, {} ],
17: [ function(e, t, n) {
(n = t.exports = e("./debug")).log = function() {
return "object" == typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
};
n.formatArgs = function() {
var e = arguments, t = this.useColors;
e[0] = (t ? "%c" : "") + this.namespace + (t ? " %c" : " ") + e[0] + (t ? "%c " : " ") + "+" + n.humanize(this.diff);
if (!t) return e;
var o = "color: " + this.color;
e = [ e[0], o, "color: inherit" ].concat(Array.prototype.slice.call(e, 1));
var s = 0, i = 0;
e[0].replace(/%[a-z%]/g, function(e) {
if ("%%" !== e) {
s++;
"%c" === e && (i = s);
}
});
e.splice(i, 0, o);
return e;
};
n.save = function(e) {
try {
null == e ? n.storage.removeItem("debug") : n.storage.debug = e;
} catch (e) {}
};
n.load = o;
n.useColors = function() {
return "WebkitAppearance" in document.documentElement.style || window.console && (console.firebug || console.exception && console.table) || navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31;
};
n.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : function() {
try {
return window.localStorage;
} catch (e) {}
}();
n.colors = [ "lightseagreen", "forestgreen", "goldenrod", "dodgerblue", "darkorchid", "crimson" ];
n.formatters.j = function(e) {
return JSON.stringify(e);
};
function o() {
var e;
try {
e = n.storage.debug;
} catch (e) {}
return e;
}
n.enable(o());
}, {
"./debug": 18
} ],
18: [ function(e, t, n) {
(n = t.exports = function(e) {
function t() {}
t.enabled = !1;
function i() {
var e = i, t = +new Date(), r = t - (o || t);
e.diff = r;
e.prev = o;
e.curr = t;
o = t;
null == e.useColors && (e.useColors = n.useColors());
null == e.color && e.useColors && (e.color = n.colors[s++ % n.colors.length]);
var a = Array.prototype.slice.call(arguments);
a[0] = n.coerce(a[0]);
"string" != typeof a[0] && (a = [ "%o" ].concat(a));
var c = 0;
a[0] = a[0].replace(/%([a-z%])/g, function(t, o) {
if ("%%" === t) return t;
c++;
var s = n.formatters[o];
if ("function" == typeof s) {
var i = a[c];
t = s.call(e, i);
a.splice(c, 1);
c--;
}
return t;
});
"function" == typeof n.formatArgs && (a = n.formatArgs.apply(e, a));
(i.log || n.log || console.log.bind(console)).apply(e, a);
}
i.enabled = !0;
var r = n.enabled(e) ? i : t;
r.namespace = e;
return r;
}).coerce = function(e) {
return e instanceof Error ? e.stack || e.message : e;
};
n.disable = function() {
n.enable("");
};
n.enable = function(e) {
n.save(e);
for (var t = (e || "").split(/[\s,]+/), o = t.length, s = 0; s < o; s++) t[s] && ("-" === (e = t[s].replace(/\*/g, ".*?"))[0] ? n.skips.push(new RegExp("^" + e.substr(1) + "$")) : n.names.push(new RegExp("^" + e + "$")));
};
n.enabled = function(e) {
var t, o;
for (t = 0, o = n.skips.length; t < o; t++) if (n.skips[t].test(e)) return !1;
for (t = 0, o = n.names.length; t < o; t++) if (n.names[t].test(e)) return !0;
return !1;
};
n.humanize = e("ms");
n.names = [];
n.skips = [];
n.formatters = {};
var o, s = 0;
}, {
ms: 25
} ],
19: [ function(e, t, n) {
(function(t) {
var o = e("./keys"), s = e("has-binary"), i = e("arraybuffer.slice"), r = e("base64-arraybuffer"), a = e("after"), c = e("utf8"), l = navigator.userAgent.match(/Android/i), u = /PhantomJS/i.test(navigator.userAgent), p = l || u;
n.protocol = 3;
var h = n.packets = {
open: 0,
close: 1,
ping: 2,
pong: 3,
message: 4,
upgrade: 5,
noop: 6
}, f = o(h), d = {
type: "error",
data: "parser error"
}, g = e("blob");
n.encodePacket = function(e, n, o, s) {
if ("function" == typeof n) {
s = n;
n = !1;
}
if ("function" == typeof o) {
s = o;
o = null;
}
var i = void 0 === e.data ? void 0 : e.data.buffer || e.data;
if (t.ArrayBuffer && i instanceof ArrayBuffer) return v(e, n, s);
if (g && i instanceof t.Blob) return b(e, n, s);
if (i && i.base64) return y(e, s);
var r = h[e.type];
void 0 !== e.data && (r += o ? c.encode(String(e.data)) : String(e.data));
return s("" + r);
};
function y(e, t) {
return t("b" + n.packets[e.type] + e.data.data);
}
function v(e, t, o) {
if (!t) return n.encodeBase64Packet(e, o);
var s = e.data, i = new Uint8Array(s), r = new Uint8Array(1 + s.byteLength);
r[0] = h[e.type];
for (var a = 0; a < i.length; a++) r[a + 1] = i[a];
return o(r.buffer);
}
function m(e, t, o) {
if (!t) return n.encodeBase64Packet(e, o);
var s = new FileReader();
s.onload = function() {
e.data = s.result;
n.encodePacket(e, t, !0, o);
};
return s.readAsArrayBuffer(e.data);
}
function b(e, t, o) {
if (!t) return n.encodeBase64Packet(e, o);
if (p) return m(e, t, o);
var s = new Uint8Array(1);
s[0] = h[e.type];
return o(new g([ s.buffer, e.data ]));
}
n.encodeBase64Packet = function(e, o) {
var s, i = "b" + n.packets[e.type];
if (g && e.data instanceof t.Blob) {
var r = new FileReader();
r.onload = function() {
var e = r.result.split(",")[1];
o(i + e);
};
return r.readAsDataURL(e.data);
}
try {
s = String.fromCharCode.apply(null, new Uint8Array(e.data));
} catch (t) {
for (var a = new Uint8Array(e.data), c = new Array(a.length), l = 0; l < a.length; l++) c[l] = a[l];
s = String.fromCharCode.apply(null, c);
}
i += t.btoa(s);
return o(i);
};
n.decodePacket = function(e, t, o) {
if ("string" == typeof e || void 0 === e) {
if ("b" == e.charAt(0)) return n.decodeBase64Packet(e.substr(1), t);
if (o) try {
e = c.decode(e);
} catch (e) {
return d;
}
var s = e.charAt(0);
return Number(s) == s && f[s] ? e.length > 1 ? {
type: f[s],
data: e.substring(1)
} : {
type: f[s]
} : d;
}
s = new Uint8Array(e)[0];
var r = i(e, 1);
g && "blob" === t && (r = new g([ r ]));
return {
type: f[s],
data: r
};
};
n.decodeBase64Packet = function(e, n) {
var o = f[e.charAt(0)];
if (!t.ArrayBuffer) return {
type: o,
data: {
base64: !0,
data: e.substr(1)
}
};
var s = r.decode(e.substr(1));
"blob" === n && g && (s = new g([ s ]));
return {
type: o,
data: s
};
};
n.encodePayload = function(e, t, o) {
if ("function" == typeof t) {
o = t;
t = null;
}
var i = s(e);
if (t && i) return g && !p ? n.encodePayloadAsBlob(e, o) : n.encodePayloadAsArrayBuffer(e, o);
if (!e.length) return o("0:");
function r(e) {
return e.length + ":" + e;
}
_(e, function(e, o) {
n.encodePacket(e, !!i && t, !0, function(e) {
o(null, r(e));
});
}, function(e, t) {
return o(t.join(""));
});
};
function _(e, t, n) {
for (var o = new Array(e.length), s = a(e.length, n), i = function(e, n, s) {
t(n, function(t, n) {
o[e] = n;
s(t, o);
});
}, r = 0; r < e.length; r++) i(r, e[r], s);
}
n.decodePayload = function(e, t, o) {
if ("string" != typeof e) return n.decodePayloadAsBinary(e, t, o);
if ("function" == typeof t) {
o = t;
t = null;
}
var s;
if ("" == e) return o(d, 0, 1);
for (var i, r, a = "", c = 0, l = e.length; c < l; c++) {
var u = e.charAt(c);
if (":" != u) a += u; else {
if ("" == a || a != (i = Number(a))) return o(d, 0, 1);
if (a != (r = e.substr(c + 1, i)).length) return o(d, 0, 1);
if (r.length) {
s = n.decodePacket(r, t, !0);
if (d.type == s.type && d.data == s.data) return o(d, 0, 1);
if (!1 === o(s, c + i, l)) return;
}
c += i;
a = "";
}
}
return "" != a ? o(d, 0, 1) : void 0;
};
n.encodePayloadAsArrayBuffer = function(e, t) {
if (!e.length) return t(new ArrayBuffer(0));
_(e, function(e, t) {
n.encodePacket(e, !0, !0, function(e) {
return t(null, e);
});
}, function(e, n) {
var o = n.reduce(function(e, t) {
var n;
return e + (n = "string" == typeof t ? t.length : t.byteLength).toString().length + n + 2;
}, 0), s = new Uint8Array(o), i = 0;
n.forEach(function(e) {
var t = "string" == typeof e, n = e;
if (t) {
for (var o = new Uint8Array(e.length), r = 0; r < e.length; r++) o[r] = e.charCodeAt(r);
n = o.buffer;
}
s[i++] = t ? 0 : 1;
var a = n.byteLength.toString();
for (r = 0; r < a.length; r++) s[i++] = parseInt(a[r]);
s[i++] = 255;
for (o = new Uint8Array(n), r = 0; r < o.length; r++) s[i++] = o[r];
});
return t(s.buffer);
});
};
n.encodePayloadAsBlob = function(e, t) {
_(e, function(e, t) {
n.encodePacket(e, !0, !0, function(e) {
var n = new Uint8Array(1);
n[0] = 1;
if ("string" == typeof e) {
for (var o = new Uint8Array(e.length), s = 0; s < e.length; s++) o[s] = e.charCodeAt(s);
e = o.buffer;
n[0] = 0;
}
var i = (e instanceof ArrayBuffer ? e.byteLength : e.size).toString(), r = new Uint8Array(i.length + 1);
for (s = 0; s < i.length; s++) r[s] = parseInt(i[s]);
r[i.length] = 255;
if (g) {
var a = new g([ n.buffer, r.buffer, e ]);
t(null, a);
}
});
}, function(e, n) {
return t(new g(n));
});
};
n.decodePayloadAsBinary = function(e, t, o) {
if ("function" == typeof t) {
o = t;
t = null;
}
for (var s = e, r = [], a = !1; s.byteLength > 0; ) {
for (var c = new Uint8Array(s), l = 0 === c[0], u = "", p = 1; 255 != c[p]; p++) {
if (u.length > 310) {
a = !0;
break;
}
u += c[p];
}
if (a) return o(d, 0, 1);
s = i(s, 2 + u.length);
u = parseInt(u);
var h = i(s, 0, u);
if (l) try {
h = String.fromCharCode.apply(null, new Uint8Array(h));
} catch (e) {
var f = new Uint8Array(h);
h = "";
for (p = 0; p < f.length; p++) h += String.fromCharCode(f[p]);
}
r.push(h);
s = i(s, u);
}
var g = r.length;
r.forEach(function(e, s) {
o(n.decodePacket(e, t, !0), s, g);
});
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
"./keys": 20,
after: 11,
"arraybuffer.slice": 12,
"base64-arraybuffer": 13,
blob: 14,
"has-binary": 21,
utf8: 29
} ],
20: [ function(e, t) {
t.exports = Object.keys || function(e) {
var t = [], n = Object.prototype.hasOwnProperty;
for (var o in e) n.call(e, o) && t.push(o);
return t;
};
}, {} ],
21: [ function(e, t) {
(function(n) {
var o = e("isarray");
t.exports = function(e) {
return function e(t) {
if (!t) return !1;
if (n.Buffer && n.Buffer.isBuffer(t) || n.ArrayBuffer && t instanceof ArrayBuffer || n.Blob && t instanceof Blob || n.File && t instanceof File) return !0;
if (o(t)) {
for (var s = 0; s < t.length; s++) if (e(t[s])) return !0;
} else if (t && "object" == typeof t) {
t.toJSON && (t = t.toJSON());
for (var i in t) if (Object.prototype.hasOwnProperty.call(t, i) && e(t[i])) return !0;
}
return !1;
}(e);
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
isarray: 24
} ],
22: [ function(e, t) {
try {
t.exports = "undefined" != typeof XMLHttpRequest && "withCredentials" in new XMLHttpRequest();
} catch (e) {
t.exports = !1;
}
}, {} ],
23: [ function(e, t) {
var n = [].indexOf;
t.exports = function(e, t) {
if (n) return e.indexOf(t);
for (var o = 0; o < e.length; ++o) if (e[o] === t) return o;
return -1;
};
}, {} ],
24: [ function(e, t) {
t.exports = Array.isArray || function(e) {
return "[object Array]" == Object.prototype.toString.call(e);
};
}, {} ],
25: [ function(e, t) {
var n = 1e3, o = 60 * n, s = 60 * o, i = 24 * s, r = 365.25 * i;
t.exports = function(e, t) {
t = t || {};
return "string" == typeof e ? a(e) : t.long ? l(r = e, i, "day") || l(r, s, "hour") || l(r, o, "minute") || l(r, n, "second") || r + " ms" : c(e);
var r;
};
function a(e) {
if (!((e = "" + e).length > 1e4)) {
var t = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(e);
if (t) {
var a = parseFloat(t[1]);
switch ((t[2] || "ms").toLowerCase()) {
case "years":
case "year":
case "yrs":
case "yr":
case "y":
return a * r;

case "days":
case "day":
case "d":
return a * i;

case "hours":
case "hour":
case "hrs":
case "hr":
case "h":
return a * s;

case "minutes":
case "minute":
case "mins":
case "min":
case "m":
return a * o;

case "seconds":
case "second":
case "secs":
case "sec":
case "s":
return a * n;

case "milliseconds":
case "millisecond":
case "msecs":
case "msec":
case "ms":
return a;
}
}
}
}
function c(e) {
return e >= i ? Math.round(e / i) + "d" : e >= s ? Math.round(e / s) + "h" : e >= o ? Math.round(e / o) + "m" : e >= n ? Math.round(e / n) + "s" : e + "ms";
}
function l(e, t, n) {
if (!(e < t)) return e < 1.5 * t ? Math.floor(e / t) + " " + n : Math.ceil(e / t) + " " + n + "s";
}
}, {} ],
26: [ function(e, t) {
(function(e) {
var n = /^[\],:{}\s]*$/, o = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, s = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, i = /(?:^|:|,)(?:\s*\[)+/g, r = /^\s+/, a = /\s+$/;
t.exports = function(t) {
if ("string" != typeof t || !t) return null;
t = t.replace(r, "").replace(a, "");
return e.JSON && JSON.parse ? JSON.parse(t) : n.test(t.replace(o, "@").replace(s, "]").replace(i, "")) ? new Function("return " + t)() : void 0;
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {} ],
27: [ function(e, t, n) {
n.encode = function(e) {
var t = "";
for (var n in e) if (e.hasOwnProperty(n)) {
t.length && (t += "&");
t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n]);
}
return t;
};
n.decode = function(e) {
for (var t = {}, n = e.split("&"), o = 0, s = n.length; o < s; o++) {
var i = n[o].split("=");
t[decodeURIComponent(i[0])] = decodeURIComponent(i[1]);
}
return t;
};
}, {} ],
28: [ function(e, t) {
var n = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, o = [ "source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor" ];
t.exports = function(e) {
var t = e, s = e.indexOf("["), i = e.indexOf("]");
-1 != s && -1 != i && (e = e.substring(0, s) + e.substring(s, i).replace(/:/g, ";") + e.substring(i, e.length));
for (var r = n.exec(e || ""), a = {}, c = 14; c--; ) a[o[c]] = r[c] || "";
if (-1 != s && -1 != i) {
a.source = t;
a.host = a.host.substring(1, a.host.length - 1).replace(/;/g, ":");
a.authority = a.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
a.ipv6uri = !0;
}
return a;
};
}, {} ],
29: [ function(e, t, n) {
(function(e) {
(function(o) {
var s = "object" == typeof n && n, i = "object" == typeof t && t && t.exports == s && t, r = "object" == typeof e && e;
r.global !== r && r.window !== r || (o = r);
var a, c, l, u = String.fromCharCode;
function p(e) {
for (var t, n, o = [], s = 0, i = e.length; s < i; ) if ((t = e.charCodeAt(s++)) >= 55296 && t <= 56319 && s < i) if (56320 == (64512 & (n = e.charCodeAt(s++)))) o.push(((1023 & t) << 10) + (1023 & n) + 65536); else {
o.push(t);
s--;
} else o.push(t);
return o;
}
function h(e) {
for (var t, n = e.length, o = -1, s = ""; ++o < n; ) {
if ((t = e[o]) > 65535) {
s += u((t -= 65536) >>> 10 & 1023 | 55296);
t = 56320 | 1023 & t;
}
s += u(t);
}
return s;
}
function f(e) {
if (e >= 55296 && e <= 57343) throw Error("Lone surrogate U+" + e.toString(16).toUpperCase() + " is not a scalar value");
}
function d(e, t) {
return u(e >> t & 63 | 128);
}
function g(e) {
if (0 == (4294967168 & e)) return u(e);
var t = "";
if (0 == (4294965248 & e)) t = u(e >> 6 & 31 | 192); else if (0 == (4294901760 & e)) {
f(e);
t = u(e >> 12 & 15 | 224);
t += d(e, 6);
} else if (0 == (4292870144 & e)) {
t = u(e >> 18 & 7 | 240);
t += d(e, 12);
t += d(e, 6);
}
return t + u(63 & e | 128);
}
function y() {
if (l >= c) throw Error("Invalid byte index");
var e = 255 & a[l];
l++;
if (128 == (192 & e)) return 63 & e;
throw Error("Invalid continuation byte");
}
function v() {
var e, t;
if (l > c) throw Error("Invalid byte index");
if (l == c) return !1;
e = 255 & a[l];
l++;
if (0 == (128 & e)) return e;
if (192 == (224 & e)) {
if ((t = (31 & e) << 6 | y()) >= 128) return t;
throw Error("Invalid continuation byte");
}
if (224 == (240 & e)) {
if ((t = (15 & e) << 12 | y() << 6 | y()) >= 2048) {
f(t);
return t;
}
throw Error("Invalid continuation byte");
}
if (240 == (248 & e) && (t = (15 & e) << 18 | y() << 12 | y() << 6 | y()) >= 65536 && t <= 1114111) return t;
throw Error("Invalid UTF-8 detected");
}
var m = {
version: "2.0.0",
encode: function(e) {
for (var t = p(e), n = t.length, o = -1, s = ""; ++o < n; ) s += g(t[o]);
return s;
},
decode: function(e) {
a = p(e);
c = a.length;
l = 0;
for (var t, n = []; !1 !== (t = v()); ) n.push(t);
return h(n);
}
};
if (s && !s.nodeType) if (i) i.exports = m; else {
var b = {}.hasOwnProperty;
for (var _ in m) b.call(m, _) && (s[_] = m[_]);
} else o.utf8 = m;
})(this);
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {} ],
30: [ function(e, t) {
var n, o = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""), s = 64, i = {}, r = 0, a = 0;
function c(e) {
var t = "";
do {
t = o[e % s] + t;
e = Math.floor(e / s);
} while (e > 0);
return t;
}
function l() {
var e = c(+new Date());
return e !== n ? (r = 0, n = e) : e + "." + c(r++);
}
for (;a < s; a++) i[o[a]] = a;
l.encode = c;
l.decode = function(e) {
var t = 0;
for (a = 0; a < e.length; a++) t = t * s + i[e.charAt(a)];
return t;
};
t.exports = l;
}, {} ],
31: [ function(e, t, n) {
var o = e("./url"), s = e("socket.io-parser"), i = e("./manager"), r = e("debug")("socket.io-client");
t.exports = n = c;
var a = n.managers = {};
function c(e, t) {
if ("object" == typeof e) {
t = e;
e = void 0;
}
t = t || {};
var n, s = o(e), c = s.source, l = s.id, u = s.path, p = a[l] && u in a[l].nsps;
if (t.forceNew || t["force new connection"] || !1 === t.multiplex || p) {
r("ignoring socket cache for %s", c);
n = i(c, t);
} else {
if (!a[l]) {
r("new io instance for %s", c);
a[l] = i(c, t);
}
n = a[l];
}
return n.socket(s.path);
}
n.protocol = s.protocol;
n.connect = c;
n.Manager = e("./manager");
n.Socket = e("./socket");
}, {
"./manager": 32,
"./socket": 34,
"./url": 35,
debug: 39,
"socket.io-parser": 47
} ],
32: [ function(e, t) {
var n = e("engine.io-client"), o = e("./socket"), s = e("component-emitter"), i = e("socket.io-parser"), r = e("./on"), a = e("component-bind"), c = e("debug")("socket.io-client:manager"), l = e("indexof"), u = e("backo2"), p = Object.prototype.hasOwnProperty;
t.exports = h;
function h(e, t) {
if (!(this instanceof h)) return new h(e, t);
if (e && "object" == typeof e) {
t = e;
e = void 0;
}
(t = t || {}).path = t.path || "/socket.io";
this.nsps = {};
this.subs = [];
this.opts = t;
this.reconnection(!1 !== t.reconnection);
this.reconnectionAttempts(t.reconnectionAttempts || Infinity);
this.reconnectionDelay(t.reconnectionDelay || 1e3);
this.reconnectionDelayMax(t.reconnectionDelayMax || 5e3);
this.randomizationFactor(t.randomizationFactor || .5);
this.backoff = new u({
min: this.reconnectionDelay(),
max: this.reconnectionDelayMax(),
jitter: this.randomizationFactor()
});
this.timeout(null == t.timeout ? 2e4 : t.timeout);
this.readyState = "closed";
this.uri = e;
this.connecting = [];
this.lastPing = null;
this.encoding = !1;
this.packetBuffer = [];
this.encoder = new i.Encoder();
this.decoder = new i.Decoder();
this.autoConnect = !1 !== t.autoConnect;
this.autoConnect && this.open();
}
h.prototype.emitAll = function() {
this.emit.apply(this, arguments);
for (var e in this.nsps) p.call(this.nsps, e) && this.nsps[e].emit.apply(this.nsps[e], arguments);
};
h.prototype.updateSocketIds = function() {
for (var e in this.nsps) p.call(this.nsps, e) && (this.nsps[e].id = this.engine.id);
};
s(h.prototype);
h.prototype.reconnection = function(e) {
if (!arguments.length) return this._reconnection;
this._reconnection = !!e;
return this;
};
h.prototype.reconnectionAttempts = function(e) {
if (!arguments.length) return this._reconnectionAttempts;
this._reconnectionAttempts = e;
return this;
};
h.prototype.reconnectionDelay = function(e) {
if (!arguments.length) return this._reconnectionDelay;
this._reconnectionDelay = e;
this.backoff && this.backoff.setMin(e);
return this;
};
h.prototype.randomizationFactor = function(e) {
if (!arguments.length) return this._randomizationFactor;
this._randomizationFactor = e;
this.backoff && this.backoff.setJitter(e);
return this;
};
h.prototype.reconnectionDelayMax = function(e) {
if (!arguments.length) return this._reconnectionDelayMax;
this._reconnectionDelayMax = e;
this.backoff && this.backoff.setMax(e);
return this;
};
h.prototype.timeout = function(e) {
if (!arguments.length) return this._timeout;
this._timeout = e;
return this;
};
h.prototype.maybeReconnectOnOpen = function() {
!this.reconnecting && this._reconnection && 0 === this.backoff.attempts && this.reconnect();
};
h.prototype.open = h.prototype.connect = function(e) {
c("readyState %s", this.readyState);
if (~this.readyState.indexOf("open")) return this;
c("opening %s", this.uri);
this.engine = n(this.uri, this.opts);
var t = this.engine, o = this;
this.readyState = "opening";
this.skipReconnect = !1;
var s = r(t, "open", function() {
o.onopen();
e && e();
}), i = r(t, "error", function(t) {
c("connect_error");
o.cleanup();
o.readyState = "closed";
o.emitAll("connect_error", t);
if (e) {
var n = new Error("Connection error");
n.data = t;
e(n);
} else o.maybeReconnectOnOpen();
});
if (!1 !== this._timeout) {
var a = this._timeout;
c("connect attempt will timeout after %d", a);
var l = setTimeout(function() {
c("connect attempt timed out after %d", a);
s.destroy();
t.close();
t.emit("error", "timeout");
o.emitAll("connect_timeout", a);
}, a);
this.subs.push({
destroy: function() {
clearTimeout(l);
}
});
}
this.subs.push(s);
this.subs.push(i);
return this;
};
h.prototype.onopen = function() {
c("open");
this.cleanup();
this.readyState = "open";
this.emit("open");
var e = this.engine;
this.subs.push(r(e, "data", a(this, "ondata")));
this.subs.push(r(e, "ping", a(this, "onping")));
this.subs.push(r(e, "pong", a(this, "onpong")));
this.subs.push(r(e, "error", a(this, "onerror")));
this.subs.push(r(e, "close", a(this, "onclose")));
this.subs.push(r(this.decoder, "decoded", a(this, "ondecoded")));
};
h.prototype.onping = function() {
this.lastPing = new Date();
this.emitAll("ping");
};
h.prototype.onpong = function() {
this.emitAll("pong", new Date() - this.lastPing);
};
h.prototype.ondata = function(e) {
this.decoder.add(e);
};
h.prototype.ondecoded = function(e) {
this.emit("packet", e);
};
h.prototype.onerror = function(e) {
c("error", e);
this.emitAll("error", e);
};
h.prototype.socket = function(e) {
var t = this.nsps[e];
if (!t) {
t = new o(this, e);
this.nsps[e] = t;
var n = this;
t.on("connecting", s);
t.on("connect", function() {
t.id = n.engine.id;
});
this.autoConnect && s();
}
function s() {
~l(n.connecting, t) || n.connecting.push(t);
}
return t;
};
h.prototype.destroy = function(e) {
var t = l(this.connecting, e);
~t && this.connecting.splice(t, 1);
this.connecting.length || this.close();
};
h.prototype.packet = function(e) {
c("writing packet %j", e);
var t = this;
if (t.encoding) t.packetBuffer.push(e); else {
t.encoding = !0;
this.encoder.encode(e, function(n) {
for (var o = 0; o < n.length; o++) t.engine.write(n[o], e.options);
t.encoding = !1;
t.processPacketQueue();
});
}
};
h.prototype.processPacketQueue = function() {
if (this.packetBuffer.length > 0 && !this.encoding) {
var e = this.packetBuffer.shift();
this.packet(e);
}
};
h.prototype.cleanup = function() {
c("cleanup");
for (var e; e = this.subs.shift(); ) e.destroy();
this.packetBuffer = [];
this.encoding = !1;
this.lastPing = null;
this.decoder.destroy();
};
h.prototype.close = h.prototype.disconnect = function() {
c("disconnect");
this.skipReconnect = !0;
this.reconnecting = !1;
"opening" == this.readyState && this.cleanup();
this.backoff.reset();
this.readyState = "closed";
this.engine && this.engine.close();
};
h.prototype.onclose = function(e) {
c("onclose");
this.cleanup();
this.backoff.reset();
this.readyState = "closed";
this.emit("close", e);
this._reconnection && !this.skipReconnect && this.reconnect();
};
h.prototype.reconnect = function() {
if (this.reconnecting || this.skipReconnect) return this;
var e = this;
if (this.backoff.attempts >= this._reconnectionAttempts) {
c("reconnect failed");
this.backoff.reset();
this.emitAll("reconnect_failed");
this.reconnecting = !1;
} else {
var t = this.backoff.duration();
c("will wait %dms before reconnect attempt", t);
this.reconnecting = !0;
var n = setTimeout(function() {
if (!e.skipReconnect) {
c("attempting reconnect");
e.emitAll("reconnect_attempt", e.backoff.attempts);
e.emitAll("reconnecting", e.backoff.attempts);
e.skipReconnect || e.open(function(t) {
if (t) {
c("reconnect attempt error");
e.reconnecting = !1;
e.reconnect();
e.emitAll("reconnect_error", t.data);
} else {
c("reconnect success");
e.onreconnect();
}
});
}
}, t);
this.subs.push({
destroy: function() {
clearTimeout(n);
}
});
}
};
h.prototype.onreconnect = function() {
var e = this.backoff.attempts;
this.reconnecting = !1;
this.backoff.reset();
this.updateSocketIds();
this.emitAll("reconnect", e);
};
}, {
"./on": 33,
"./socket": 34,
backo2: 36,
"component-bind": 37,
"component-emitter": 38,
debug: 39,
"engine.io-client": 1,
indexof: 42,
"socket.io-parser": 47
} ],
33: [ function(e, t) {
t.exports = function(e, t, n) {
e.on(t, n);
return {
destroy: function() {
e.removeListener(t, n);
}
};
};
}, {} ],
34: [ function(e, t) {
var n = e("socket.io-parser"), o = e("component-emitter"), s = e("to-array"), i = e("./on"), r = e("component-bind"), a = e("debug")("socket.io-client:socket"), c = e("has-binary");
t.exports = p;
var l = {
connect: 1,
connect_error: 1,
connect_timeout: 1,
connecting: 1,
disconnect: 1,
error: 1,
reconnect: 1,
reconnect_attempt: 1,
reconnect_failed: 1,
reconnect_error: 1,
reconnecting: 1,
ping: 1,
pong: 1
}, u = o.prototype.emit;
function p(e, t) {
this.io = e;
this.nsp = t;
this.json = this;
this.ids = 0;
this.acks = {};
this.receiveBuffer = [];
this.sendBuffer = [];
this.connected = !1;
this.disconnected = !0;
this.io.autoConnect && this.open();
}
o(p.prototype);
p.prototype.subEvents = function() {
if (!this.subs) {
var e = this.io;
this.subs = [ i(e, "open", r(this, "onopen")), i(e, "packet", r(this, "onpacket")), i(e, "close", r(this, "onclose")) ];
}
};
p.prototype.open = p.prototype.connect = function() {
if (this.connected) return this;
this.subEvents();
this.io.open();
"open" == this.io.readyState && this.onopen();
this.emit("connecting");
return this;
};
p.prototype.send = function() {
var e = s(arguments);
e.unshift("message");
this.emit.apply(this, e);
return this;
};
p.prototype.emit = function(e) {
if (l.hasOwnProperty(e)) {
u.apply(this, arguments);
return this;
}
var t = s(arguments), o = n.EVENT;
c(t) && (o = n.BINARY_EVENT);
var i = {
type: o,
data: t,
options: {}
};
i.options.compress = !this.flags || !1 !== this.flags.compress;
if ("function" == typeof t[t.length - 1]) {
a("emitting packet with ack id %d", this.ids);
this.acks[this.ids] = t.pop();
i.id = this.ids++;
}
this.connected ? this.packet(i) : this.sendBuffer.push(i);
delete this.flags;
return this;
};
p.prototype.packet = function(e) {
e.nsp = this.nsp;
this.io.packet(e);
};
p.prototype.onopen = function() {
a("transport is open - connecting");
"/" != this.nsp && this.packet({
type: n.CONNECT
});
};
p.prototype.onclose = function(e) {
a("close (%s)", e);
this.connected = !1;
this.disconnected = !0;
delete this.id;
this.emit("disconnect", e);
};
p.prototype.onpacket = function(e) {
if (e.nsp == this.nsp) switch (e.type) {
case n.CONNECT:
this.onconnect();
break;

case n.EVENT:
case n.BINARY_EVENT:
this.onevent(e);
break;

case n.ACK:
case n.BINARY_ACK:
this.onack(e);
break;

case n.DISCONNECT:
this.ondisconnect();
break;

case n.ERROR:
this.emit("error", e.data);
}
};
p.prototype.onevent = function(e) {
var t = e.data || [];
a("emitting event %j", t);
if (null != e.id) {
a("attaching ack callback to event");
t.push(this.ack(e.id));
}
this.connected ? u.apply(this, t) : this.receiveBuffer.push(t);
};
p.prototype.ack = function(e) {
var t = this, o = !1;
return function() {
if (!o) {
o = !0;
var i = s(arguments);
a("sending ack %j", i);
var r = c(i) ? n.BINARY_ACK : n.ACK;
t.packet({
type: r,
id: e,
data: i
});
}
};
};
p.prototype.onack = function(e) {
var t = this.acks[e.id];
if ("function" == typeof t) {
a("calling ack %s with %j", e.id, e.data);
t.apply(this, e.data);
delete this.acks[e.id];
} else a("bad ack %s", e.id);
};
p.prototype.onconnect = function() {
this.connected = !0;
this.disconnected = !1;
this.emit("connect");
this.emitBuffered();
};
p.prototype.emitBuffered = function() {
var e;
for (e = 0; e < this.receiveBuffer.length; e++) u.apply(this, this.receiveBuffer[e]);
this.receiveBuffer = [];
for (e = 0; e < this.sendBuffer.length; e++) this.packet(this.sendBuffer[e]);
this.sendBuffer = [];
};
p.prototype.ondisconnect = function() {
a("server disconnect (%s)", this.nsp);
this.destroy();
this.onclose("io server disconnect");
};
p.prototype.destroy = function() {
if (this.subs) {
for (var e = 0; e < this.subs.length; e++) this.subs[e].destroy();
this.subs = null;
}
this.io.destroy(this);
};
p.prototype.close = p.prototype.disconnect = function() {
if (this.connected) {
a("performing disconnect (%s)", this.nsp);
this.packet({
type: n.DISCONNECT
});
}
this.destroy();
this.connected && this.onclose("io client disconnect");
return this;
};
p.prototype.compress = function(e) {
this.flags = this.flags || {};
this.flags.compress = e;
return this;
};
}, {
"./on": 33,
"component-bind": 37,
"component-emitter": 38,
debug: 39,
"has-binary": 41,
"socket.io-parser": 47,
"to-array": 51
} ],
35: [ function(e, t) {
(function(n) {
var o = e("parseuri"), s = e("debug")("socket.io-client:url");
t.exports = function(e, t) {
var i = e;
t = t || n.location;
null == e && (e = t.protocol + "//" + t.host);
if ("string" == typeof e) {
"/" == e.charAt(0) && (e = "/" == e.charAt(1) ? t.protocol + e : t.host + e);
if (!/^(https?|wss?):\/\//.test(e)) {
s("protocol-less url %s", e);
e = "undefined" != typeof t ? t.protocol + "//" + e : "https://" + e;
}
s("parse %s", e);
i = o(e);
}
i.port || (/^(http|ws)$/.test(i.protocol) ? i.port = "80" : /^(http|ws)s$/.test(i.protocol) && (i.port = "443"));
i.path = i.path || "/";
var r = -1 !== i.host.indexOf(":") ? "[" + i.host + "]" : i.host;
i.id = i.protocol + "://" + r + ":" + i.port;
i.href = i.protocol + "://" + r + (t && t.port == i.port ? "" : ":" + i.port);
return i;
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
debug: 39,
parseuri: 45
} ],
36: [ function(e, t) {
t.exports = n;
function n(e) {
e = e || {};
this.ms = e.min || 100;
this.max = e.max || 1e4;
this.factor = e.factor || 2;
this.jitter = e.jitter > 0 && e.jitter <= 1 ? e.jitter : 0;
this.attempts = 0;
}
n.prototype.duration = function() {
var e = this.ms * Math.pow(this.factor, this.attempts++);
if (this.jitter) {
var t = Math.random(), n = Math.floor(t * this.jitter * e);
e = 0 == (1 & Math.floor(10 * t)) ? e - n : e + n;
}
return 0 | Math.min(e, this.max);
};
n.prototype.reset = function() {
this.attempts = 0;
};
n.prototype.setMin = function(e) {
this.ms = e;
};
n.prototype.setMax = function(e) {
this.max = e;
};
n.prototype.setJitter = function(e) {
this.jitter = e;
};
}, {} ],
37: [ function(e, t) {
var n = [].slice;
t.exports = function(e, t) {
"string" == typeof t && (t = e[t]);
if ("function" != typeof t) throw new Error("bind() requires a function");
var o = n.call(arguments, 2);
return function() {
return t.apply(e, o.concat(n.call(arguments)));
};
};
}, {} ],
38: [ function(e, t) {
t.exports = n;
function n(e) {
if (e) return o(e);
}
function o(e) {
for (var t in n.prototype) e[t] = n.prototype[t];
return e;
}
n.prototype.on = n.prototype.addEventListener = function(e, t) {
this._callbacks = this._callbacks || {};
(this._callbacks["$" + e] = this._callbacks["$" + e] || []).push(t);
return this;
};
n.prototype.once = function(e, t) {
function n() {
this.off(e, n);
t.apply(this, arguments);
}
n.fn = t;
this.on(e, n);
return this;
};
n.prototype.off = n.prototype.removeListener = n.prototype.removeAllListeners = n.prototype.removeEventListener = function(e, t) {
this._callbacks = this._callbacks || {};
if (0 == arguments.length) {
this._callbacks = {};
return this;
}
var n, o = this._callbacks["$" + e];
if (!o) return this;
if (1 == arguments.length) {
delete this._callbacks["$" + e];
return this;
}
for (var s = 0; s < o.length; s++) if ((n = o[s]) === t || n.fn === t) {
o.splice(s, 1);
break;
}
return this;
};
n.prototype.emit = function(e) {
this._callbacks = this._callbacks || {};
var t = [].slice.call(arguments, 1), n = this._callbacks["$" + e];
if (n) for (var o = 0, s = (n = n.slice(0)).length; o < s; ++o) n[o].apply(this, t);
return this;
};
n.prototype.listeners = function(e) {
this._callbacks = this._callbacks || {};
return this._callbacks["$" + e] || [];
};
n.prototype.hasListeners = function(e) {
return !!this.listeners(e).length;
};
}, {} ],
39: [ function(e, t, n) {
arguments[4][17][0].apply(n, arguments);
}, {
"./debug": 40,
dup: 17
} ],
40: [ function(e, t, n) {
arguments[4][18][0].apply(n, arguments);
}, {
dup: 18,
ms: 44
} ],
41: [ function(e, t) {
(function(n) {
var o = e("isarray");
t.exports = function(e) {
return function e(t) {
if (!t) return !1;
if (n.Buffer && n.Buffer.isBuffer && n.Buffer.isBuffer(t) || n.ArrayBuffer && t instanceof ArrayBuffer || n.Blob && t instanceof Blob || n.File && t instanceof File) return !0;
if (o(t)) {
for (var s = 0; s < t.length; s++) if (e(t[s])) return !0;
} else if (t && "object" == typeof t) {
t.toJSON && "function" == typeof t.toJSON && (t = t.toJSON());
for (var i in t) if (Object.prototype.hasOwnProperty.call(t, i) && e(t[i])) return !0;
}
return !1;
}(e);
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
isarray: 43
} ],
42: [ function(e, t, n) {
arguments[4][23][0].apply(n, arguments);
}, {
dup: 23
} ],
43: [ function(e, t, n) {
arguments[4][24][0].apply(n, arguments);
}, {
dup: 24
} ],
44: [ function(e, t, n) {
arguments[4][25][0].apply(n, arguments);
}, {
dup: 25
} ],
45: [ function(e, t, n) {
arguments[4][28][0].apply(n, arguments);
}, {
dup: 28
} ],
46: [ function(e, t, n) {
(function(t) {
var o = e("isarray"), s = e("./is-buffer");
n.deconstructPacket = function(e) {
var t = [], n = e.data, i = e;
i.data = function e(n) {
if (!n) return n;
if (s(n)) {
var i = {
_placeholder: !0,
num: t.length
};
t.push(n);
return i;
}
if (o(n)) {
for (var r = new Array(n.length), a = 0; a < n.length; a++) r[a] = e(n[a]);
return r;
}
if ("object" == typeof n && !(n instanceof Date)) {
r = {};
for (var c in n) r[c] = e(n[c]);
return r;
}
return n;
}(n);
i.attachments = t.length;
return {
packet: i,
buffers: t
};
};
n.reconstructPacket = function(e, t) {
e.data = function e(n) {
if (n && n._placeholder) return t[n.num];
if (o(n)) {
for (var s = 0; s < n.length; s++) n[s] = e(n[s]);
return n;
}
if (n && "object" == typeof n) {
for (var i in n) n[i] = e(n[i]);
return n;
}
return n;
}(e.data);
e.attachments = void 0;
return e;
};
n.removeBlobs = function(e, n) {
var i = 0, r = e;
(function e(a, c, l) {
if (!a) return a;
if (t.Blob && a instanceof Blob || t.File && a instanceof File) {
i++;
var u = new FileReader();
u.onload = function() {
l ? l[c] = this.result : r = this.result;
--i || n(r);
};
u.readAsArrayBuffer(a);
} else if (o(a)) for (var p = 0; p < a.length; p++) e(a[p], p, a); else if (a && "object" == typeof a && !s(a)) for (var h in a) e(a[h], h, a);
})(r);
i || n(r);
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {
"./is-buffer": 48,
isarray: 43
} ],
47: [ function(e, t, n) {
var o = e("debug")("socket.io-parser"), s = e("json3"), i = (e("isarray"), e("component-emitter")), r = e("./binary"), a = e("./is-buffer");
n.protocol = 4;
n.types = [ "CONNECT", "DISCONNECT", "EVENT", "BINARY_EVENT", "ACK", "BINARY_ACK", "ERROR" ];
n.CONNECT = 0;
n.DISCONNECT = 1;
n.EVENT = 2;
n.ACK = 3;
n.ERROR = 4;
n.BINARY_EVENT = 5;
n.BINARY_ACK = 6;
n.Encoder = c;
n.Decoder = p;
function c() {}
c.prototype.encode = function(e, t) {
o("encoding packet %j", e);
n.BINARY_EVENT == e.type || n.BINARY_ACK == e.type ? u(e, t) : t([ l(e) ]);
};
function l(e) {
var t = "", i = !1;
t += e.type;
if (n.BINARY_EVENT == e.type || n.BINARY_ACK == e.type) {
t += e.attachments;
t += "-";
}
if (e.nsp && "/" != e.nsp) {
i = !0;
t += e.nsp;
}
if (null != e.id) {
if (i) {
t += ",";
i = !1;
}
t += e.id;
}
if (null != e.data) {
i && (t += ",");
t += s.stringify(e.data);
}
o("encoded %j as %s", e, t);
return t;
}
function u(e, t) {
r.removeBlobs(e, function(e) {
var n = r.deconstructPacket(e), o = l(n.packet), s = n.buffers;
s.unshift(o);
t(s);
});
}
function p() {
this.reconstructor = null;
}
i(p.prototype);
p.prototype.add = function(e) {
var t;
if ("string" == typeof e) {
t = h(e);
if (n.BINARY_EVENT == t.type || n.BINARY_ACK == t.type) {
this.reconstructor = new f(t);
0 === this.reconstructor.reconPack.attachments && this.emit("decoded", t);
} else this.emit("decoded", t);
} else {
if (!a(e) && !e.base64) throw new Error("Unknown type: " + e);
if (!this.reconstructor) throw new Error("got binary data when not reconstructing a packet");
if (t = this.reconstructor.takeBinaryData(e)) {
this.reconstructor = null;
this.emit("decoded", t);
}
}
};
function h(e) {
var t = {}, i = 0;
t.type = Number(e.charAt(0));
if (null == n.types[t.type]) return d();
if (n.BINARY_EVENT == t.type || n.BINARY_ACK == t.type) {
for (var r = ""; "-" != e.charAt(++i); ) {
r += e.charAt(i);
if (i == e.length) break;
}
if (r != Number(r) || "-" != e.charAt(i)) throw new Error("Illegal attachments");
t.attachments = Number(r);
}
if ("/" == e.charAt(i + 1)) {
t.nsp = "";
for (;++i && "," != (c = e.charAt(i)); ) {
t.nsp += c;
if (i == e.length) break;
}
} else t.nsp = "/";
var a = e.charAt(i + 1);
if ("" !== a && Number(a) == a) {
t.id = "";
for (;++i; ) {
var c;
if (null == (c = e.charAt(i)) || Number(c) != c) {
--i;
break;
}
t.id += e.charAt(i);
if (i == e.length) break;
}
t.id = Number(t.id);
}
if (e.charAt(++i)) try {
t.data = s.parse(e.substr(i));
} catch (e) {
return d();
}
o("decoded %s as %j", e, t);
return t;
}
p.prototype.destroy = function() {
this.reconstructor && this.reconstructor.finishedReconstruction();
};
function f(e) {
this.reconPack = e;
this.buffers = [];
}
f.prototype.takeBinaryData = function(e) {
this.buffers.push(e);
if (this.buffers.length == this.reconPack.attachments) {
var t = r.reconstructPacket(this.reconPack, this.buffers);
this.finishedReconstruction();
return t;
}
return null;
};
f.prototype.finishedReconstruction = function() {
this.reconPack = null;
this.buffers = [];
};
function d() {
return {
type: n.ERROR,
data: "parser error"
};
}
}, {
"./binary": 46,
"./is-buffer": 48,
"component-emitter": 49,
debug: 39,
isarray: 43,
json3: 50
} ],
48: [ function(e, t) {
(function(e) {
t.exports = function(t) {
return e.Buffer && e.Buffer.isBuffer(t) || e.ArrayBuffer && t instanceof ArrayBuffer;
};
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {} ],
49: [ function(e, t, n) {
arguments[4][15][0].apply(n, arguments);
}, {
dup: 15
} ],
50: [ function(e, t, n) {
(function(e) {
(function() {
var o = {
function: !0,
object: !0
}, s = o[typeof n] && n && !n.nodeType && n, i = o[typeof window] && window || this, r = s && o[typeof t] && t && !t.nodeType && "object" == typeof e && e;
!r || r.global !== r && r.window !== r && r.self !== r || (i = r);
function a(e, t) {
e || (e = i.Object());
t || (t = i.Object());
var n = e.Number || i.Number, s = e.String || i.String, r = e.Object || i.Object, c = e.Date || i.Date, l = e.SyntaxError || i.SyntaxError, u = e.TypeError || i.TypeError, p = e.Math || i.Math, h = e.JSON || i.JSON;
if ("object" == typeof h && h) {
t.stringify = h.stringify;
t.parse = h.parse;
}
var f, d, g, y = r.prototype, v = y.toString, m = new c(-0xc782b5b800cec);
try {
m = -109252 == m.getUTCFullYear() && 0 === m.getUTCMonth() && 1 === m.getUTCDate() && 10 == m.getUTCHours() && 37 == m.getUTCMinutes() && 6 == m.getUTCSeconds() && 708 == m.getUTCMilliseconds();
} catch (e) {}
function b(e) {
if (b[e] !== g) return b[e];
var o;
if ("bug-string-char-index" == e) o = "a" != "a"[0]; else if ("json" == e) o = b("json-stringify") && b("json-parse"); else {
var i, r = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
if ("json-stringify" == e) {
var a = t.stringify, l = "function" == typeof a && m;
if (l) {
(i = function() {
return 1;
}).toJSON = i;
try {
l = "0" === a(0) && "0" === a(new n()) && '""' == a(new s()) && a(v) === g && a(g) === g && a() === g && "1" === a(i) && "[1]" == a([ i ]) && "[null]" == a([ g ]) && "null" == a(null) && "[null,null,null]" == a([ g, v, null ]) && a({
a: [ i, !0, !1, null, "\0\b\n\f\r\t" ]
}) == r && "1" === a(null, i) && "[\n 1,\n 2\n]" == a([ 1, 2 ], null, 1) && '"-271821-04-20T00:00:00.000Z"' == a(new c(-864e13)) && '"+275760-09-13T00:00:00.000Z"' == a(new c(864e13)) && '"-000001-01-01T00:00:00.000Z"' == a(new c(-621987552e5)) && '"1969-12-31T23:59:59.999Z"' == a(new c(-1));
} catch (e) {
l = !1;
}
}
o = l;
}
if ("json-parse" == e) {
var u = t.parse;
if ("function" == typeof u) try {
if (0 === u("0") && !u(!1)) {
var p = 5 == (i = u(r)).a.length && 1 === i.a[0];
if (p) {
try {
p = !u('"\t"');
} catch (e) {}
if (p) try {
p = 1 !== u("01");
} catch (e) {}
if (p) try {
p = 1 !== u("1.");
} catch (e) {}
}
}
} catch (e) {
p = !1;
}
o = p;
}
}
return b[e] = !!o;
}
if (!b("json")) {
var _ = b("bug-string-char-index");
if (!m) var w = p.floor, S = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ], A = function(e, t) {
return S[t] + 365 * (e - 1970) + w((e - 1969 + (t = +(t > 1))) / 4) - w((e - 1901 + t) / 100) + w((e - 1601 + t) / 400);
};
(f = y.hasOwnProperty) || (f = function(e) {
var t, n = {};
if ((n.__proto__ = null, n.__proto__ = {
toString: 1
}, n).toString != v) f = function(e) {
var t = this.__proto__, n = e in (this.__proto__ = null, this);
this.__proto__ = t;
return n;
}; else {
t = n.constructor;
f = function(e) {
var n = (this.constructor || t).prototype;
return e in this && !(e in n && this[e] === n[e]);
};
}
n = null;
return f.call(this, e);
});
d = function(e, t) {
var n, s, i, r = 0;
(n = function() {
this.valueOf = 0;
}).prototype.valueOf = 0;
s = new n();
for (i in s) f.call(s, i) && r++;
n = s = null;
if (r) d = 2 == r ? function(e, t) {
var n, o = {}, s = "[object Function]" == v.call(e);
for (n in e) s && "prototype" == n || f.call(o, n) || !(o[n] = 1) || !f.call(e, n) || t(n);
} : function(e, t) {
var n, o, s = "[object Function]" == v.call(e);
for (n in e) s && "prototype" == n || !f.call(e, n) || (o = "constructor" === n) || t(n);
(o || f.call(e, n = "constructor")) && t(n);
}; else {
s = [ "valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor" ];
d = function(e, t) {
var n, i, r = "[object Function]" == v.call(e), a = !r && "function" != typeof e.constructor && o[typeof e.hasOwnProperty] && e.hasOwnProperty || f;
for (n in e) r && "prototype" == n || !a.call(e, n) || t(n);
for (i = s.length; n = s[--i]; a.call(e, n) && t(n)) ;
};
}
return d(e, t);
};
if (!b("json-stringify")) {
var k = {
92: "\\\\",
34: '\\"',
8: "\\b",
12: "\\f",
10: "\\n",
13: "\\r",
9: "\\t"
}, x = function(e, t) {
return ("000000" + (t || 0)).slice(-e);
}, E = function(e) {
for (var t = '"', n = 0, o = e.length, s = !_ || o > 10, i = s && (_ ? e.split("") : e); n < o; n++) {
var r = e.charCodeAt(n);
switch (r) {
case 8:
case 9:
case 10:
case 12:
case 13:
case 34:
case 92:
t += k[r];
break;

default:
if (r < 32) {
t += "\\u00" + x(2, r.toString(16));
break;
}
t += s ? i[n] : e.charAt(n);
}
}
return t + '"';
}, j = function e(t, n, o, s, i, r, a) {
var c, l, p, h, y, m, b, _, S, k, j, C, O, R, M, I;
try {
c = n[t];
} catch (e) {}
if ("object" == typeof c && c) if ("[object Date]" != (l = v.call(c)) || f.call(c, "toJSON")) "function" == typeof c.toJSON && ("[object Number]" != l && "[object String]" != l && "[object Array]" != l || f.call(c, "toJSON")) && (c = c.toJSON(t)); else if (c > -1 / 0 && c < 1 / 0) {
if (A) {
y = w(c / 864e5);
for (p = w(y / 365.2425) + 1970 - 1; A(p + 1, 0) <= y; p++) ;
for (h = w((y - A(p, 0)) / 30.42); A(p, h + 1) <= y; h++) ;
y = 1 + y - A(p, h);
b = w((m = (c % 864e5 + 864e5) % 864e5) / 36e5) % 24;
_ = w(m / 6e4) % 60;
S = w(m / 1e3) % 60;
k = m % 1e3;
} else {
p = c.getUTCFullYear();
h = c.getUTCMonth();
y = c.getUTCDate();
b = c.getUTCHours();
_ = c.getUTCMinutes();
S = c.getUTCSeconds();
k = c.getUTCMilliseconds();
}
c = (p <= 0 || p >= 1e4 ? (p < 0 ? "-" : "+") + x(6, p < 0 ? -p : p) : x(4, p)) + "-" + x(2, h + 1) + "-" + x(2, y) + "T" + x(2, b) + ":" + x(2, _) + ":" + x(2, S) + "." + x(3, k) + "Z";
} else c = null;
o && (c = o.call(n, t, c));
if (null === c) return "null";
if ("[object Boolean]" == (l = v.call(c))) return "" + c;
if ("[object Number]" == l) return c > -1 / 0 && c < 1 / 0 ? "" + c : "null";
if ("[object String]" == l) return E("" + c);
if ("object" == typeof c) {
for (R = a.length; R--; ) if (a[R] === c) throw u();
a.push(c);
j = [];
M = r;
r += i;
if ("[object Array]" == l) {
for (O = 0, R = c.length; O < R; O++) {
C = e(O, c, o, s, i, r, a);
j.push(C === g ? "null" : C);
}
I = j.length ? i ? "[\n" + r + j.join(",\n" + r) + "\n" + M + "]" : "[" + j.join(",") + "]" : "[]";
} else {
d(s || c, function(t) {
var n = e(t, c, o, s, i, r, a);
n !== g && j.push(E(t) + ":" + (i ? " " : "") + n);
});
I = j.length ? i ? "{\n" + r + j.join(",\n" + r) + "\n" + M + "}" : "{" + j.join(",") + "}" : "{}";
}
a.pop();
return I;
}
};
t.stringify = function(e, t, n) {
var s, i, r, a;
if (o[typeof t] && t) if ("[object Function]" == (a = v.call(t))) i = t; else if ("[object Array]" == a) {
r = {};
for (var c, l = 0, u = t.length; l < u; c = t[l++], ("[object String]" == (a = v.call(c)) || "[object Number]" == a) && (r[c] = 1)) ;
}
if (n) if ("[object Number]" == (a = v.call(n))) {
if ((n -= n % 1) > 0) for (s = "", n > 10 && (n = 10); s.length < n; s += " ") ;
} else "[object String]" == a && (s = n.length <= 10 ? n : n.slice(0, 10));
return j("", ((c = {})[""] = e, c), i, r, s, "", []);
};
}
if (!b("json-parse")) {
var C, O, R = s.fromCharCode, M = {
92: "\\",
34: '"',
47: "/",
98: "\b",
116: "\t",
110: "\n",
102: "\f",
114: "\r"
}, I = function() {
C = O = null;
throw l();
}, D = function() {
for (var e, t, n, o, s, i = O, r = i.length; C < r; ) switch (s = i.charCodeAt(C)) {
case 9:
case 10:
case 13:
case 32:
C++;
break;

case 123:
case 125:
case 91:
case 93:
case 58:
case 44:
e = _ ? i.charAt(C) : i[C];
C++;
return e;

case 34:
for (e = "@", C++; C < r; ) if ((s = i.charCodeAt(C)) < 32) I(); else if (92 == s) switch (s = i.charCodeAt(++C)) {
case 92:
case 34:
case 47:
case 98:
case 116:
case 110:
case 102:
case 114:
e += M[s];
C++;
break;

case 117:
t = ++C;
for (n = C + 4; C < n; C++) (s = i.charCodeAt(C)) >= 48 && s <= 57 || s >= 97 && s <= 102 || s >= 65 && s <= 70 || I();
e += R("0x" + i.slice(t, C));
break;

default:
I();
} else {
if (34 == s) break;
s = i.charCodeAt(C);
t = C;
for (;s >= 32 && 92 != s && 34 != s; ) s = i.charCodeAt(++C);
e += i.slice(t, C);
}
if (34 == i.charCodeAt(C)) {
C++;
return e;
}
I();

default:
t = C;
if (45 == s) {
o = !0;
s = i.charCodeAt(++C);
}
if (s >= 48 && s <= 57) {
48 == s && (s = i.charCodeAt(C + 1)) >= 48 && s <= 57 && I();
o = !1;
for (;C < r && (s = i.charCodeAt(C)) >= 48 && s <= 57; C++) ;
if (46 == i.charCodeAt(C)) {
n = ++C;
for (;n < r && (s = i.charCodeAt(n)) >= 48 && s <= 57; n++) ;
n == C && I();
C = n;
}
if (101 == (s = i.charCodeAt(C)) || 69 == s) {
43 != (s = i.charCodeAt(++C)) && 45 != s || C++;
for (n = C; n < r && (s = i.charCodeAt(n)) >= 48 && s <= 57; n++) ;
n == C && I();
C = n;
}
return +i.slice(t, C);
}
o && I();
if ("true" == i.slice(C, C + 4)) {
C += 4;
return !0;
}
if ("false" == i.slice(C, C + 5)) {
C += 5;
return !1;
}
if ("null" == i.slice(C, C + 4)) {
C += 4;
return null;
}
I();
}
return "$";
}, T = function e(t) {
var n, o;
"$" == t && I();
if ("string" == typeof t) {
if ("@" == (_ ? t.charAt(0) : t[0])) return t.slice(1);
if ("[" == t) {
n = [];
for (;"]" != (t = D()); o || (o = !0)) {
o && ("," == t ? "]" == (t = D()) && I() : I());
"," == t && I();
n.push(e(t));
}
return n;
}
if ("{" == t) {
n = {};
for (;"}" != (t = D()); o || (o = !0)) {
o && ("," == t ? "}" == (t = D()) && I() : I());
"," != t && "string" == typeof t && "@" == (_ ? t.charAt(0) : t[0]) && ":" == D() || I();
n[t.slice(1)] = e(D());
}
return n;
}
I();
}
return t;
}, N = function(e, t, n) {
var o = P(e, t, n);
o === g ? delete e[t] : e[t] = o;
}, P = function(e, t, n) {
var o, s = e[t];
if ("object" == typeof s && s) if ("[object Array]" == v.call(s)) for (o = s.length; o--; ) N(s, o, n); else d(s, function(e) {
N(s, e, n);
});
return n.call(e, t, s);
};
t.parse = function(e, t) {
var n, o;
C = 0;
O = "" + e;
n = T(D());
"$" != D() && I();
C = O = null;
return t && "[object Function]" == v.call(t) ? P(((o = {})[""] = n, o), "", t) : n;
};
}
}
t.runInContext = a;
return t;
}
if (s) a(i, s); else {
var c = i.JSON, l = i.JSON3, u = !1, p = a(i, i.JSON3 = {
noConflict: function() {
if (!u) {
u = !0;
i.JSON = c;
i.JSON3 = l;
c = l = null;
}
return p;
}
});
i.JSON = {
parse: p.parse,
stringify: p.stringify
};
}
}).call(this);
}).call(this, "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof o ? o : {});
}, {} ],
51: [ function(e, t) {
t.exports = function(e, t) {
for (var n = [], o = (t = t || 0) || 0; o < e.length; o++) n[o - t] = e[o];
return n;
};
}, {} ]
}, {}, [ 31 ])(31);
});
cc._RF.pop();
}).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
}, {} ]
}, {}, [ "socket-io", "AnysdkMgr", "AudioMgr", "GameNetMgr", "Global", "HTTP", "HotUpdate", "MahjongMgr", "Net", "OnBack", "ReplayMgr", "SelectPlayway", "UserMgr", "Utils", "VoiceMgr", "WaitingConnection", "playway" ]);