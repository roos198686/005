window.__require = function e(t, i, n) {
function a(c, s) {
if (!i[c]) {
if (!t[c]) {
var l = c.split("/");
l = l[l.length - 1];
if (!t[l]) {
var r = "function" == typeof __require && __require;
if (!s && r) return r(l, !0);
if (o) return o(l, !0);
throw new Error("Cannot find module '" + c + "'");
}
c = l;
}
var h = i[c] = {
exports: {}
};
t[c][0].call(h.exports, function(e) {
return a(t[c][1][e] || e);
}, h, h.exports, e, t, i, n);
}
return i[c].exports;
}
for (var o = "function" == typeof __require && __require, c = 0; c < n.length; c++) a(n[c]);
return a;
}({
Alert: [ function(e, t) {
"use strict";
cc._RF.push(t, "f94d6YENh9BzbX+OMiJMLIg", "Alert");
cc.Class({
extends: cc.Component,
properties: {
_alert: null,
_btnOK: null,
_btnCancel: null,
_title: null,
_content: null,
_onok: null
},
onLoad: function() {
if (null != cc.vv) {
this._alert = cc.find("Canvas/alert");
this._title = cc.find("Canvas/alert/title").getComponent(cc.Label);
this._content = cc.find("Canvas/alert/content").getComponent(cc.Label);
this._title.node.color = cc.color(0, 0, 0);
this._content.node.color = cc.color(0, 0, 0);
this._btnOK = cc.find("Canvas/alert/btn_ok");
this._btnCancel = cc.find("Canvas/alert/btn_cancel");
cc.vv.utils.addClickEvent(this._btnOK, this.node, "Alert", "onBtnClicked");
cc.vv.utils.addClickEvent(this._btnCancel, this.node, "Alert", "onBtnClicked");
this._alert.active = !1;
cc.vv.alert = this;
}
},
onBtnClicked: function(e) {
"btn_ok" == e.target.name && this._onok && this._onok();
this._alert.active = !1;
this._onok = null;
},
show: function(e, t, i, n) {
this._alert.active = !0;
this._onok = i;
null != e && this._title && (this._title.string = e);
null != t && this._content && (this._content.string = t);
if (n) {
this._btnCancel.active = !0;
this._btnOK.x = -150;
this._btnCancel.x = 150;
} else {
this._btnCancel.active = !1;
this._btnOK.x = 0;
}
},
onDestroy: function() {
cc.vv && (cc.vv.alert = null);
}
});
cc._RF.pop();
}, {} ],
Chat: [ function(e, t) {
"use strict";
cc._RF.push(t, "76549noA9RG1IWEXK1ranbY", "Chat");
cc.Class({
extends: cc.Component,
properties: {
_chatRoot: null,
_tabQuick: null,
_tabEmoji: null,
_iptChat: null,
_quickChatInfo: null,
_btnChat: null
},
onLoad: function() {
if (null != cc.vv) {
cc.vv.chat = this;
this._btnChat = this.node.getChildByName("btn_chat");
this._btnChat.active = 0 == cc.vv.replayMgr.isReplay();
this._chatRoot = this.node.getChildByName("chat");
this._chatRoot.active = !1;
this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
this._tabEmoji = this._chatRoot.getChildByName("emojis");
this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
this._quickChatInfo = {};
this._quickChatInfo.item0 = {
index: 0,
content: "快点啊，都等到我花儿都谢谢了！",
sound: "fix_msg_1.mp3"
};
this._quickChatInfo.item1 = {
index: 1,
content: "怎么又断线了，网络怎么这么差啊！",
sound: "fix_msg_2.mp3"
};
this._quickChatInfo.item2 = {
index: 2,
content: "不要走，决战到天亮！",
sound: "fix_msg_3.mp3"
};
this._quickChatInfo.item3 = {
index: 3,
content: "你的牌打得也太好了！",
sound: "fix_msg_4.mp3"
};
this._quickChatInfo.item4 = {
index: 4,
content: "你是妹妹还是哥哥啊？",
sound: "fix_msg_5.mp3"
};
this._quickChatInfo.item5 = {
index: 5,
content: "和你合作真是太愉快了！",
sound: "fix_msg_6.mp3"
};
this._quickChatInfo.item6 = {
index: 6,
content: "大家好，很高兴见到各位！",
sound: "fix_msg_7.mp3"
};
this._quickChatInfo.item7 = {
index: 7,
content: "各位，真是不好意思，我得离开一会儿。",
sound: "fix_msg_8.mp3"
};
this._quickChatInfo.item8 = {
index: 8,
content: "不要吵了，专心玩游戏吧！",
sound: "fix_msg_9.mp3"
};
}
},
getQuickChatInfo: function(e) {
var t = "item" + e;
return this._quickChatInfo[t];
},
onBtnChatClicked: function() {
this._chatRoot.active = !0;
},
onBgClicked: function() {
this._chatRoot.active = !1;
},
onTabClicked: function(e) {
if ("tabQuick" == e.target.name) {
this._tabQuick.active = !0;
this._tabEmoji.active = !1;
} else if ("tabEmoji" == e.target.name) {
this._tabQuick.active = !1;
this._tabEmoji.active = !0;
}
},
onQuickChatItemClicked: function(e) {
this._chatRoot.active = !1;
var t = this._quickChatInfo[e.target.name];
cc.vv.net.send("quick_chat", t.index);
},
onEmojiItemClicked: function(e) {
console.log(e.target.name);
this._chatRoot.active = !1;
cc.vv.net.send("emoji", e.target.name);
},
onBtnSendChatClicked: function() {
this._chatRoot.active = !1;
if ("" != this._iptChat.string) {
cc.vv.net.send("chat", this._iptChat.string);
this._iptChat.string = "";
}
}
});
cc._RF.pop();
}, {} ],
CheckBox: [ function(e, t) {
"use strict";
cc._RF.push(t, "c28b9sPc5hKn7UEQdim51Ja", "CheckBox");
cc.Class({
extends: cc.Component,
properties: {
target: cc.Node,
sprite: cc.SpriteFrame,
checkedSprite: cc.SpriteFrame,
checked: !1
},
onLoad: function() {
this.refresh();
},
onClicked: function() {
this.checked = !this.checked;
this.refresh();
},
refresh: function() {
var e = this.target.getComponent(cc.Sprite);
this.checked ? e.spriteFrame = this.checkedSprite : e.spriteFrame = this.sprite;
}
});
cc._RF.pop();
}, {} ],
CreateRoom: [ function(e, t) {
"use strict";
cc._RF.push(t, "4f8710GtexB7r0Q7wvjVNEv", "CreateRoom");
cc.Class({
extends: cc.Component,
properties: {
_difenxuanze: null,
_zimo: null,
_wanfaxuanze: null,
_zuidafanshu: null,
_jushuxuanze: null,
_dianganghua: null,
_leixingxuanze: null
},
onLoad: function() {
this._leixingxuanze = [];
for (var e = this.node.getChildByName("leixingxuanze"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._leixingxuanze.push(i);
this._difenxuanze = [];
for (e = this.node.getChildByName("difenxuanze"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._difenxuanze.push(i);
this._zimo = [];
for (e = this.node.getChildByName("zimojiacheng"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._zimo.push(i);
this._wanfaxuanze = [];
for (e = this.node.getChildByName("wanfaxuanze"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("CheckBox")) && this._wanfaxuanze.push(i);
this._zuidafanshu = [];
for (e = this.node.getChildByName("zuidafanshu"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._zuidafanshu.push(i);
this._jushuxuanze = [];
for (e = this.node.getChildByName("xuanzejushu"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._jushuxuanze.push(i);
this._dianganghua = [];
for (e = this.node.getChildByName("dianganghua"), t = 0; t < e.childrenCount; ++t) {
var i;
null != (i = e.children[t].getComponent("RadioButton")) && this._dianganghua.push(i);
}
this.node.getChildByName("leixingxuanze").active = !1;
},
onBtnBack: function() {
this.node.active = !1;
},
onBtnOK: function() {
this.node.active = !1;
this.createRoom();
},
createRoom: function() {
for (var e = 0, t = 0; t < this._difenxuanze.length; ++t) if (this._difenxuanze[t].checked) {
e = t;
break;
}
var i = 0;
for (t = 0; t < this._zimo.length; ++t) if (this._zimo[t].checked) {
i = t;
break;
}
var n = this._wanfaxuanze[0].checked, a = this._wanfaxuanze[1].checked, o = this._wanfaxuanze[2].checked, c = this._wanfaxuanze[3].checked, s = 0;
for (t = 0; t < this._zuidafanshu.length; ++t) if (this._zuidafanshu[t].checked) {
s = t;
break;
}
var l = 0;
for (t = 0; t < this._jushuxuanze.length; ++t) if (this._jushuxuanze[t].checked) {
l = t;
break;
}
var r = 0;
for (t = 0; t < this._dianganghua.length; ++t) if (this._dianganghua[t].checked) {
r = t;
break;
}
var h = {
type: "xlch",
difen: e,
zimo: i,
jiangdui: a,
huansanzhang: n,
zuidafanshu: s,
jushuxuanze: l,
dianganghua: r,
menqing: o,
tiandihu: c
}, d = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
conf: JSON.stringify(h)
};
console.log(d);
cc.vv.wc.show("正在创建房间");
cc.vv.http.sendRequest("/create_private_room", d, function(e) {
0 !== e.errcode ? 2222 == e.errcode ? cc.vv.wc.showError("房卡不足，创建房间失败!") : cc.vv.wc.showError("创建房间失败,错误码:" + e.errcode) : cc.vv.gameNetMgr.connectGameServer(e);
});
}
});
cc._RF.pop();
}, {} ],
DingQue: [ function(e, t) {
"use strict";
cc._RF.push(t, "02fc7NMBp9JxajVjy/4rO2p", "DingQue");
cc.Class({
extends: cc.Component,
properties: {
queYiMen: null,
tips: [],
selected: [],
dingques: []
},
onLoad: function() {
if (null != cc.vv) {
this.initView();
this.initDingQue();
this.initEventHandlers();
}
},
initView: function() {
var e = this.node.getChildByName("game");
this.queYiMen = e.getChildByName("dingque");
this.queYiMen.active = cc.vv.gameNetMgr.isDingQueing;
for (var t = [ "myself", "right", "up", "left" ], i = 0; i < t.length; ++i) {
var n = e.getChildByName(t[i]).getChildByName("seat").getChildByName("que");
this.dingques.push(n);
}
this.reset();
var a = this.queYiMen.getChildByName("tips");
for (i = 0; i < a.childrenCount; ++i) {
var o = a.children[i];
this.tips.push(o.getComponent(cc.Label));
}
"dingque" == cc.vv.gameNetMgr.gamestate && this.showDingQueChoice();
},
initEventHandlers: function() {
var e = this;
this.node.on("game_dingque", function() {
e.showDingQueChoice();
});
this.node.on("game_dingque_notify", function(t) {
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.detail), n = cc.vv.gameNetMgr.getLocalIndex(i);
console.log("game_dingque_notify:" + n);
e.tips[n].node.active = !0;
});
this.node.on("game_dingque_finish", function() {
e.queYiMen.active = !1;
cc.vv.gameNetMgr.isDingQueing = !1;
e.initDingQue();
});
},
showDingQueChoice: function() {
this.queYiMen.active = !0;
for (var e = cc.vv.gameNetMgr.getSelfData(), t = [ 0, 0, 0 ], i = 0; i < e.holds.length; ++i) {
var n = e.holds[i];
t[cc.vv.mahjongmgr.getMahjongType(n)]++;
}
var a = 65535, o = 0;
for (i = 0; i < t.length; ++i) if (t[i] < a) {
a = t[i];
o = i;
}
var c = [ "tong", "tiao", "wan" ];
for (i = 0; i < c.length; ++i) {
var s = this.queYiMen.getChildByName(c[i]);
o == i ? s.getComponent(cc.Animation).play("dingque_tuijian") : s.getComponent(cc.Animation).stop();
}
this.reset();
for (i = 0; i < this.tips.length; ++i) {
this.tips[i].node.active = !(i > 0);
}
},
initDingQue: function() {
var e = [ "tong", "tiao", "wan" ], t = cc.vv.gameNetMgr.seats;
if (t) for (var i = 0; i < t.length; ++i) {
var n = t[i].dingque;
n = null == n || n < 0 || n >= e.length ? null : e[n];
var a = cc.vv.gameNetMgr.getLocalIndex(i);
n && (this.dingques[a].getChildByName(n).active = !0);
}
},
reset: function() {
this.setInteractable(!0);
this.selected.push(this.queYiMen.getChildByName("tong_selected"));
this.selected.push(this.queYiMen.getChildByName("tiao_selected"));
this.selected.push(this.queYiMen.getChildByName("wan_selected"));
for (var e = 0; e < this.selected.length; ++e) this.selected[e].active = !1;
for (e = 0; e < this.dingques.length; ++e) for (var t = 0; t < this.dingques[e].children.length; ++t) this.dingques[e].children[t].active = !1;
},
onQueYiMenClicked: function(e) {
var t = 0;
"tong" == e.target.name ? t = 0 : "tiao" == e.target.name ? t = 1 : "wan" == e.target.name && (t = 2);
for (var i = 0; i < this.selected.length; ++i) this.selected[i].active = !1;
this.selected[t].active = !0;
cc.vv.gameNetMgr.dingque = t;
cc.vv.net.send("dingque", t);
},
setInteractable: function(e) {
this.queYiMen.getChildByName("tong").getComponent(cc.Button).interactable = e;
this.queYiMen.getChildByName("tiao").getComponent(cc.Button).interactable = e;
this.queYiMen.getChildByName("wan").getComponent(cc.Button).interactable = e;
}
});
cc._RF.pop();
}, {} ],
Folds: [ function(e, t) {
"use strict";
cc._RF.push(t, "9a304jWq+JBAIkQm1bY2h61", "Folds");
cc.Class({
extends: cc.Component,
properties: {
_folds: null
},
onLoad: function() {
if (null != cc.vv) {
this.initView();
this.initEventHandler();
this.initAllFolds();
}
},
initView: function() {
this._folds = {};
for (var e = this.node.getChildByName("game"), t = [ "myself", "right", "up", "left" ], i = 0; i < t.length; ++i) {
var n = t[i], a = e.getChildByName(n);
if (null != a) {
for (var o = [], c = a.getChildByName("folds"), s = 0; s < c.children.length; ++s) {
var l = c.children[s];
l.active = !1;
var r = l.getComponent(cc.Sprite);
r.spriteFrame = null;
o.push(r);
}
this._folds[n] = o;
}
}
this.hideAllFolds();
},
hideAllFolds: function() {
for (var e in this._folds) {
var t = this._folds[e];
for (var i in t) t[i].node.active = !1;
}
},
initEventHandler: function() {
var e = this;
this.node.on("game_begin", function() {
e.initAllFolds();
});
this.node.on("game_start", function() {
e.initAllFolds();
});
this.node.on("game_sync", function() {
e.initAllFolds();
});
this.node.on("game_chupai_notify", function() {
e.initAllFolds();
});
this.node.on("peng_notify", function() {
e.initAllFolds();
});
this.node.on("gang_notify", function() {
e.initAllFolds();
});
this.node.on("chi_notify", function() {
e.initAllFolds();
});
this.node.on("guo_notify", function(t) {
var i = t.detail;
i && i.seatData && e.initFolds(i.seatData);
});
},
initAllFolds: function() {
var e = cc.vv.gameNetMgr.seats;
for (var t in e) this.initFolds(e[t]);
},
initFolds: function(e) {
if (e) {
var t = e.folds;
if (null != t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e.seatindex), n = cc.vv.mahjongmgr.getFoldPre(i), a = cc.vv.mahjongmgr.getSide(i), o = this._folds[a];
if (0 != o.length) {
for (var c = o[0].node.parent, s = o[0].node.y, l = 0, r = 0; r < o.length; ++r) Math.abs(o[r].node.y - s) < 1 && l++;
l <= 0 && (l = o.length);
var h = 0;
l < o.length && (h = o[l].node.y - s);
0 == h && (h = -40);
var d = 3 * l;
if (d > o.length) for (var g = o.length; g < d; ++g) {
var u = g % l, v = Math.floor(g / l), m = cc.instantiate(o[u].node);
m.y = s + h * v;
m.active = !1;
c.addChild(m);
o.push(m.getComponent(cc.Sprite));
} else d = o.length;
this._foldStacks || (this._foldStacks = {});
for (var p = this._foldStacks[a] || [], f = 0; f < p.length; ++f) cc.isValid(p[f]) && p[f].destroy();
var _ = [];
this._foldStacks[a] = _;
for (var C = Math.min(t.length, d), y = 0; y < t.length; ++y) {
var b = y % d, N = Math.floor(y / d), M = b;
"right" != a && "up" != a || (M = o.length - b - 1);
var S = o[M];
if (0 == N) {
S.node.active = !0;
this.setSpriteFrameByMJID(n, S, t[y]);
} else {
var B = S.node, w = cc.instantiate(B);
w.x = B.x;
w.y = B.y + 8 * N;
w.zIndex = B.zIndex + N;
c.addChild(w);
w.active = !0;
this.setSpriteFrameByMJID(n, w.getComponent(cc.Sprite), t[y]);
_.push(w);
}
}
for (y = C; y < o.length; ++y) {
M = y;
"right" != a && "up" != a || (M = o.length - y - 1);
(S = o[M]).spriteFrame = null;
S.node.active = !1;
}
}
}
}
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
}
});
cc._RF.pop();
}, {} ],
GPGame: [ function(e, t) {
"use strict";
cc._RF.push(t, "2d195LYN55N5bfuaRB5fJ5r", "GPGame");
cc.Class({
extends: cc.Component,
properties: {
maxPlayers: {
default: 3,
type: cc.Integer
}
},
onLoad: function() {
if (cc.vv) {
this._cards = [];
this._selected = {};
this._mySeat = -1;
this._turn = -1;
this._freePlay = !0;
this._lastPlay = null;
this._deadline = 0;
this._over = !1;
this._final = !1;
this._selectUpOffset = 28;
this._gpConf = {};
this._dealAnimating = !1;
this._dealAnimNodes = null;
this._dealAnimId = 0;
this._playAnimBusy = !1;
this._pendingRenderPais = null;
this._playHistory = [];
this._historyRound = 0;
if (!this.node.getComponent("Alert")) {
var e = cc.js.getClassByName("Alert");
e && this.node.addComponent(e);
}
if (!cc.sys.isNative) {
var t = this.node.getComponent(cc.Canvas);
if (t) {
t.fitHeight = !0;
t.fitWidth = !1;
}
}
this.initView();
this.initEvents();
this.refreshFromState();
cc.vv.audioMgr && cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
},
onDestroy: function() {
if (this._sio && this._sioListeners) {
this._sio.removeListener("exit_result", this._sioListeners.exit_result);
this._sio.removeListener("dispress_push", this._sioListeners.dispress_push);
this._sioListeners = null;
}
cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.dataEventHandler == this.node && (cc.vv.gameNetMgr.dataEventHandler = null);
},
findNode: function(e, t) {
if (null == e) return null;
if (e.name == t) return e;
for (var i = e.children, n = 0; n < i.length; ++n) {
var a = this.findNode(i[n], t);
if (a) return a;
}
return null;
},
initView: function() {
this._n = {};
for (var e = [ "bg", "game", "prepare", "titleLabel", "roundLabel", "tipLabel", "countdownLabel", "handArea", "playArea", "playOwnerLabel", "cardsContainer", "playBtn", "passBtn", "hintBtn", "readyBtn", "exitBtn", "dissolveBtn", "prepareInfo", "settlePanel", "settleTitle", "settleContent", "settleAgainBtn", "settleAgainLabel", "settleCloseBtn", "settleExitBtn", "finalSettlePanel", "finalSettleTitle", "finalSettleContent", "finalSettleExitBtn", "dissolvePanel", "dissolveLabel", "dissolveAgreeBtn", "dissolveRejectBtn" ], t = 0; t < e.length; ++t) this._n[e[t]] = this.findNode(this.node, e[t]);
this._seatViews = [];
for (var i = 0; i < 3; ++i) {
var n = this.findNode(this.node, "seatInfo" + i);
this._seatViews.push(n ? {
root: n,
name: this.findNode(n, "nameLabel"),
count: this.findNode(n, "countLabel"),
remain: this.findNode(n, "remainLabel"),
state: this.findNode(n, "stateLabel")
} : null);
}
(function e(t) {
if (t) {
"ChatBubble" === t._name && (t.active = !1);
(t._children || []).forEach(function(t) {
e(t);
});
}
})(this.node);
this._seatMap = null;
this._refreshTitle();
if (this._n.settleAgainBtn) {
this._n.settleAgainLabel = this.findNode(this._n.settleAgainBtn, "settleAgainBtnLabel");
this._n.settleAgainBtn.active = !1;
this._n.settleAgainLabel && (this._n.settleAgainLabel.active = !1);
var a = this._n.settleAgainBtn.getComponent(cc.Label);
if (a) {
a.enabled = !0;
a.string = "准备";
}
}
this._n.settlePanel.active = !1;
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.dissolvePanel.active = !1;
this._n.prepareInfo.active = !1;
(o = this.findNode(this.node, "ops")) && (o.active = !1);
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
(c = this.findNode(this.node, "arrow")) && (c.active = !1);
this.setStr(this._n.tipLabel, "");
this.setStr(this._n.countdownLabel, "");
this.setStr(this._n.playOwnerLabel, "");
this._n.arrow = this.findNode(this.node, "arrow");
if (this._n.arrow) {
this._n.arrowPointer = this.findNode(this._n.arrow, "pointer");
this._n.arrowTime = this.findNode(this._n.arrow, "lblTime");
this._n.arrow.active = !1;
}
this.setArrowTime("");
[ "holds", "folds", "penggangs", "ChuPai", "settlePokerResult" ].forEach(function(e) {
var t = this.findNode(this.node, e);
t && (t.active = !1);
}.bind(this));
this._cardFrames = {};
var o, c, s = this.findNode(this.node, "cardTemplates");
if (s) {
var l = s.children;
for (t = 0; t < l.length; ++t) {
var r = l[t].name, h = l[t].getComponent(cc.Sprite);
h && h.spriteFrame && (this._cardFrames[r] = h.spriteFrame);
}
s.active = !1;
}
this.loadCardFramesFromRes();
this._handSlots = [];
this._playSlots = [];
for (var d = this, g = 0; g < 16; ++g) {
var u = this.findNode(this._n.handArea, "handSlot" + g);
if (u) {
u.on(cc.Node.EventType.TOUCH_END, function(e) {
return function() {
d.onSlotTouched(e);
};
}(u));
var v = u.getChildByName("selMark");
v && (v.active = !1);
this._handSlots.push(u);
}
var m = this.findNode(this._n.cardsContainer, "playSlot" + g);
m && this._playSlots.push(m);
}
if (0 == this._playSlots.length) for (var p = 0; p < 16; ++p) {
var f = this.findNode(this.node, "playSlot" + p);
f && this._playSlots.push(f);
}
console.log("[GP] init cardsContainer=", this._n.cardsContainer ? "OK" : "NULL", "_playSlots.length=", this._playSlots.length);
console.log("[GP] _handSlots.length=", this._handSlots.length, "_cardFrames count=", Object.keys(this._cardFrames).length);
this._n.btnSettings = this.findNode(this.node, "btn_settings");
this._n.btnChat = this.findNode(this.node, "btn_chat");
this._n.btnVoice = this.findNode(this.node, "btn_voice");
this._n.settingsPanel = this.findNode(this.node, "settings");
this._n.chatPanel = this.findNode(this.node, "chat");
this._n.settingsPanel && (this._n.settingsPanel.active = !1);
this._n.chatPanel && (this._n.chatPanel.active = !1);
this.bindButton(this._n.btnSettings, this.onBtnSettings, this);
this.bindButton(this._n.btnChat, this.onBtnChat, this);
this.bindButton(this._n.btnVoice, this.onBtnVoice, this);
if (this._n.settingsPanel) {
this._n.btnSettingsClose = this.findNode(this._n.settingsPanel, "btn_close");
this._n.btnSettingsDissolve = this.findNode(this._n.settingsPanel, "btn_sqjsfj");
this._n.btnSettingsExit = this.findNode(this._n.settingsPanel, "btn_exit");
this.bindButton(this._n.btnSettingsClose, this.onBtnSettingsClose, this);
this.bindButton(this._n.btnSettingsDissolve, this.onBtnSettingsDissolve, this);
this.bindButton(this._n.btnSettingsExit, this.onExit, this);
}
if (this._n.chatPanel) {
this._n.btnChatSend = this.findNode(this._n.chatPanel, "btnSend");
this._n.iptChat = this.findNode(this._n.chatPanel, "iptChat");
this._n.tabQuick = this.findNode(this._n.chatPanel, "tabQuick");
this._n.tabEmoji = this.findNode(this._n.chatPanel, "tabEmoji");
this._n.quickchatlist = this.findNode(this._n.chatPanel, "quickchatlist");
this._n.emojis = this.findNode(this._n.chatPanel, "emojis");
this.bindButton(this._n.btnChatSend, this.onBtnChatSend, this);
this.bindButton(this._n.tabQuick, this.onTabQuick, this);
this.bindButton(this._n.tabEmoji, this.onTabEmoji, this);
var _ = this.findNode(this._n.chatPanel, "bg");
this.bindButton(_, this.onBtnChatClose, this);
this._quickChatInfo = {
item0: "快点啊，都等到我花儿都谢了！",
item1: "怎么又断线了，网络怎么这么差啊！",
item2: "不要走，决战到天亮！",
item3: "你的牌打得也太好了！",
item4: "你是妹妹还是哥哥啊？",
item5: "和你合作真是太愉快了！",
item6: "大家好，很高兴见到各位！",
item7: "各位，真是不好意思，我得离开一会儿。",
item8: "不要吵了，专心玩游戏吧！"
};
var C = this, y = this.findNode(this._n.quickchatlist, "content") || this._n.quickchatlist;
y && y.children.forEach(function(e) {
/^item\d+$/.test(e.name) && C.bindButton(e, function() {
cc.vv.net.send("quick_chat", e.name);
C._n.chatPanel && (C._n.chatPanel.active = !1);
}, C);
});
}
this._oppSlots = [];
for (var b = 0; b < 2; ++b) {
for (var N = [], M = 0; M < 16; ++M) {
var S = this.findNode(this.node, "oppCard" + b + "_" + M);
if (S) {
S.active = !1;
N.push(S);
}
}
N.length > 0 && this._oppSlots.push(N);
}
this.loadCardBack();
this.bindButton(this._n.playBtn, this.onPlay, this);
this.bindButton(this._n.passBtn, this.onPass, this);
this.bindButton(this._n.hintBtn, this.onHint, this);
this.bindButton(this._n.readyBtn, this.onReady, this);
this.bindButton(this._n.exitBtn, this.onExit, this);
this.bindButton(this._n.dissolveBtn, this.onDissolve, this);
this.bindButton(this._n.settleAgainBtn, this.onSettleAgain, this);
this.bindButton(this._n.settleExitBtn, this.onExit, this);
this.bindButton(this._n.settleCloseBtn, this.onSettleClose, this);
this._n.settleNewBtn = this._n.settlePanel ? this._n.settlePanel.getChildByName("New Sprite") : null;
this.bindButton(this._n.settleNewBtn, this.onSettleClose, this);
this.bindButton(this._n.finalSettleExitBtn, this.onExit, this);
this.bindButton(this._n.dissolveAgreeBtn, this.onDissolveAgree, this);
this.bindButton(this._n.dissolveRejectBtn, this.onDissolveReject, this);
(o = this.findNode(this.node, "ops")) && o.children.forEach(function(e) {
"playBtn" !== e.name && "passBtn" !== e.name && "hintBtn" !== e.name && (e.active = !1);
});
this._clearBoard();
o && (o.active = !1);
(c = this.findNode(this.node, "arrow")) && (c.active = !1);
this.setStr(this._n.playOwnerLabel, "");
this._n.historyBtn = this.findNode(this.node, "historyBtn");
this._n.historyPanel = this.findNode(this.node, "historyPanel");
this._n.historyContent = this._n.historyPanel ? this.findNode(this._n.historyPanel, "content") : null;
if (this._n.historyBtn) {
this._n.historyBtn.active = !1;
this.bindButton(this._n.historyBtn, this.onHistoryBtn, this);
}
this._n.historyPanel && (this._n.historyPanel.active = !1);
this._n.gameResult = this.node.getChildByName("game_result");
if (this._n.gameResult) {
this._n.gameResult.active = !1;
var B = this._n.gameResult.getChildByName("btnShare");
B && this.bindButton(B, this.onExit, this);
var w = this._n.gameResult.getChildByName("btnClose");
if (w) {
w.active = !1;
this.bindButton(w, this.onExit, this);
}
}
this.updateActionBtns();
},
bindButton: function(e, t, i) {
if (null != e) {
var n = e.name;
e.on("click", function() {
console.log("[GP] btn click:", n);
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("ui_click.mp3");
t.call(i);
});
}
},
_isHistoryEnabled: function() {
return !!(this._gpConf || {}).gp_card_history;
},
onHistoryBtn: function() {
if (this._n.historyPanel) {
this._renderHistory();
this._n.historyPanel.active = !this._n.historyPanel.active;
}
},
_showHistoryIfEnabled: function() {
var e = this._isHistoryEnabled();
this._n.historyBtn && (this._n.historyBtn.active = e);
!e && this._n.historyPanel && (this._n.historyPanel.active = !1);
},
_formatPaiId: function(e) {
if (null == e) return "";
var t = this.rankOf(e);
return 14 === t ? "A" : 11 === t ? "J" : 12 === t ? "Q" : 13 === t ? "K" : String(t);
},
_addHistory: function(e) {
this._playHistory.push(e);
this._playHistory.length > 60 && this._playHistory.shift();
this._renderHistory();
},
_historyNextRound: function() {
this._historyRound++;
this._playHistory.length > 0 && this._playHistory.push({
roundBreak: !0
});
},
_renderHistory: function() {
var e = this._n && this._n.historyContent, t = e ? e.getComponent(cc.Label) : null;
if (t) {
for (var i = [], n = 0; n < this._playHistory.length; ++n) {
var a = this._playHistory[n];
if (a.roundBreak) i.push("── 第" + (this._historyRound + 1) + "轮 ──"); else {
var o = "";
if (a.pais) for (var c = 0; c < a.pais.length; c++) o += this._formatPaiId(a.pais[c]) + " ";
i.push(this._shortName(this.seatName(a.seatIndex)) + "(" + (this._comboName(a.type) || "") + "): " + o);
}
}
var s = (e.height || 250) - 8, l = Math.max(4, Math.floor(s / (1.45 * t.fontSize)));
i.length > l && (i = i.slice(i.length - l));
e.color = cc.color(255, 255, 255, 255);
t.string = i.join("\n");
}
},
_shortName: function(e) {
var t = String(null == e ? "" : e), i = /[\u4e00-\u9fa5]/.test(t) ? 3 : 5;
return t.length > i ? t.substr(0, i) + "…" : t;
},
_comboName: function(e) {
return {
single: "单张",
pair: "对子",
triple: "三张",
triple_one: "三带一",
triple_pair: "三带二",
four_two: "四带二",
four_three: "四带三",
straight: "顺子",
pair_straight: "连对",
triple_straight: "飞机",
bomb: "炸弹"
}[e] || "";
},
_refreshTitle: function() {
var e = cc.vv.gameNetMgr || {}, t = this._gpConf || e.conf || {}, i = e.roomId || "", n = t.baseScore || 1, a = [];
i && a.push("房号 " + i);
a.push("关牌·" + this.maxPlayers + "人");
a.push("底分:" + n);
this._n.titleLabel && this.setStr(this._n.titleLabel, a.join(" · "));
},
rankOf: function(e) {
return Math.floor(e / 4) + 3;
},
suitOf: function(e) {
return e % 4;
},
cardFrameKey: function(e) {
return [ "Spade", "Heart", "Club", "Diamond" ][this.suitOf(e)] + [ "", "", "", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2" ][this.rankOf(e)];
},
loadCardFramesFromRes: function() {
var e = this;
cc.resources.load("images/atlas/cards", cc.SpriteAtlas, function(t, i) {
if (!t && i) {
for (var n = [ "Spade", "Heart", "Club", "Diamond" ], a = [ "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2" ], o = 0; o < n.length; ++o) for (var c = 0; c < a.length; ++c) {
var s = n[o] + a[c], l = r(s);
l && (e._cardFrames[s] = l);
}
e._cardBack = r("card_back") || e._cardBack;
console.log("[GP] 牌面图集加载完成, 缓存张数=", Object.keys(e._cardFrames).length);
e.applyCardBack();
e._cards && e._cards.length && e.renderAll();
} else console.log("[GP] 牌面图集加载失败:", t);
function r(e) {
return i.getSpriteFrame(e + ".png") || i.getSpriteFrame(e);
}
});
cc.resources.load("images/chatbg", cc.SpriteFrame, function(t, i) {
!t && i && (e._chatBgFrame = i);
});
},
loadCardBack: function() {
this.applyCardBack();
},
applyCardBack: function() {
if (this._cardBack && this._oppSlots) {
var e = this._cardBack;
this._oppSlots.forEach(function(t) {
t.forEach(function(t) {
var i = t.getComponent(cc.Sprite);
i && (i.spriteFrame = e);
});
});
this._blankStrayCardBacks();
}
},
_blankStrayCardBacks: function() {
if (this._cardBack) {
var e = {};
(this._oppSlots || []).forEach(function(t) {
t.forEach(function(t) {
e[t.uuid] = !0;
});
});
var t = this, i = [];
(function n(a) {
var o = a.getComponent(cc.Sprite);
if (o && o.spriteFrame === t._cardBack && !e[a.uuid]) {
o.spriteFrame = null;
i.push(a.name);
}
for (var c = a.children || [], s = 0; s < c.length; ++s) n(c[s]);
})(this.node);
i.length && console.log("[GP] 清理残留牌背节点: " + i.join(","));
}
},
frameOf: function(e) {
if (!this._cardFrames) return null;
var t = this.cardFrameKey(e);
return this._cardFrames[t] || null;
},
_identifyCards: function(e, t) {
if (!e || 0 == e.length) return null;
for (var i = e.length, n = this, a = e.map(function(e) {
return n.rankOf(e);
}).sort(function(e, t) {
return e - t;
}), o = {}, c = 0; c < a.length; ++c) o[a[c]] = (o[a[c]] || 0) + 1;
for (var s = Object.keys(o).map(Number).sort(function(e, t) {
return e - t;
}), l = 0, r = -1, h = -1, d = 0; d < s.length; ++d) {
var g = o[s[d]];
if (g > l) {
l = g;
r = s[d];
}
4 == g && (h = s[d]);
}
var u = this._gpConf || {}, v = null == u.gp_bomb || !!u.gp_bomb, m = null == u.gp_bomb_four || !!u.gp_bomb_four;
if (v) {
if (4 == i && o[14] >= 3) return {
type: "bomb",
key: 14,
len: 4,
bombLevel: 2
};
if (4 == i && h > 0 && m) return {
type: "bomb",
key: h,
len: 4,
bombLevel: 1
};
if (5 == i && h > 0) return {
type: "bomb",
key: h,
len: 5,
bombLevel: 0
};
}
if (1 == i) return {
type: "single",
key: a[0],
len: 1
};
if (2 == i && 1 == s.length) return {
type: "pair",
key: s[0],
len: 2
};
if (3 == i && 1 == s.length) return {
type: "triple",
key: s[0],
len: 3
};
if (4 == i && 3 == l) return null == u.gp_three_one || u.gp_three_one || t && null != u.gp_last_three_one && u.gp_last_three_one ? {
type: "triple_one",
key: r,
len: 4
} : null;
if (5 == i && 3 == l && 2 == s.length && 3 == o[r]) return {
type: "triple_pair",
key: r,
len: 5
};
if (6 == i && h > 0) return null != u.gp_four_two && u.gp_four_two || t && u.gp_last_four_two_three ? {
type: "four_two",
key: h,
len: 6
} : null;
if (7 == i && h > 0) return null != u.gp_four_three && u.gp_four_three || t && u.gp_last_four_two_three ? {
type: "four_three",
key: h,
len: 7
} : null;
if (i >= 5 && s.length == i) {
var p = !0;
for (var f in o) if (1 != o[f]) {
p = !1;
break;
}
if (p) {
var _ = null == u.gp_straight_a2 || !!u.gp_straight_a2, C = this._straightKey(s, _);
return C > 0 ? {
type: "straight",
key: C,
len: i
} : null;
}
}
if (i >= 4 && i % 2 == 0 && 2 * s.length == i) {
var y = !0;
for (var b in o) if (2 != o[b]) {
y = !1;
break;
}
if (y) {
var N = this._pairStraightKey(s, _);
return N > 0 ? {
type: "pair_straight",
key: N,
len: i
} : null;
}
}
if (i >= 6 && i % 3 == 0 && 3 * s.length == i) {
var M = !0;
for (var S in o) if (3 != o[S]) {
M = !1;
break;
}
if (M) {
var B = this._pairStraightKey(s, _);
return B > 0 ? {
type: "triple_straight",
key: B,
len: i
} : null;
}
}
return null;
},
_virtRank: function(e) {
return 14 == e ? 1 : 15 == e ? 2 : e;
},
_straightKey: function(e, t) {
if (e.length < 5) return -1;
var i = e[e.length - 1];
if (15 != i) {
for (var n = !0, a = 1; a < e.length; ++a) if (e[a] != e[a - 1] + 1) {
n = !1;
break;
}
if (n) return i;
}
if (t && (e.indexOf(14) >= 0 || e.indexOf(15) >= 0)) {
var o = e.map(this._virtRank).sort(function(e, t) {
return e - t;
}), c = !0;
for (a = 1; a < o.length; ++a) if (o[a] != o[a - 1] + 1) {
c = !1;
break;
}
if (c) return o[o.length - 1];
}
return -1;
},
_pairStraightKey: function(e, t) {
if (e.length < 2) return -1;
var i = e[e.length - 1];
if (15 != i) {
for (var n = !0, a = 1; a < e.length; ++a) if (e[a] != e[a - 1] + 1) {
n = !1;
break;
}
if (n) return i;
}
if (t && (e.indexOf(14) >= 0 || e.indexOf(15) >= 0)) {
var o = e.map(this._virtRank).sort(function(e, t) {
return e - t;
}), c = !0;
for (a = 1; a < o.length; ++a) if (o[a] != o[a - 1] + 1) {
c = !1;
break;
}
if (c) return o[o.length - 1];
}
return -1;
},
_canBeat: function(e, t) {
if (!e || !t) return !1;
var i = "bomb" == e.type, n = "bomb" == t.type;
return !(!i || n) || !(!i && n) && (i && n ? e.bombLevel != t.bombLevel ? e.bombLevel > t.bombLevel : e.key > t.key : e.type == t.type && e.len == t.len && e.key > t.key);
},
collectPlayableCombos: function() {
var e = [];
if (!this._lastPlay) {
this._playableCombos = e;
return e;
}
for (var t = this._lastPlay, i = {
type: t.type,
key: t.key,
len: t.len,
bombLevel: t.bombLevel || 0
}, n = this._cards, a = n.length, o = a, c = {}, s = 1; s < 1 << a; ++s) {
for (var l = [], r = 0; r < a; ++r) s & 1 << r && l.push(n[r]);
var h = l.length == o, d = this._identifyCards(l, h);
if (d && this._canBeat(d, i)) {
var g = l.slice().sort(function(e, t) {
return e - t;
}), u = g.join(",");
if (!c[u]) {
c[u] = !0;
e.push(g);
}
}
}
e.sort(function(e, t) {
return e.length !== t.length ? e.length - t.length : e[0] - t[0];
});
this._playableCombos = e;
return e;
},
hasPlayable: function() {
return !this._lastPlay || this.collectPlayableCombos().length > 0;
},
onHint: function() {
if (this.isMyTurn() && !this._freePlay && this._lastPlay) {
var e = this._playableCombos;
e && 0 !== e.length || (e = this.collectPlayableCombos());
if (0 !== e.length) {
(null == this._hintIndex || this._hintIndex >= e.length) && (this._hintIndex = 0);
var t = e[this._hintIndex];
this._selected = {};
for (var i = 0; i < t.length; ++i) this._selected[t[i]] = !0;
this.renderHand();
this.updateTurnUI();
this._hintIndex = (this._hintIndex + 1) % e.length;
} else this.showTip("没有能压过上家的牌");
} else this.showTip("自由出牌无需提示");
},
checkAutoPass: function() {
if (this.isMyTurn() && !this._freePlay && this._lastPlay && 0 === this.collectPlayableCombos().length) {
this._selected = {};
this.renderHand();
this._playAutoPassAnim();
var e = this;
this._autoPassTimer && clearTimeout(this._autoPassTimer);
this._autoPassTimer = setTimeout(function() {
e.isMyTurn() && !e._over && cc.vv.net.send("guo");
}, 600);
}
},
_playAutoPassAnim: function() {
var e = this._n.passBtn;
if (e) {
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("pass.mp3");
e.active = !0;
e.stopAllActions();
var t = e.scale;
e.scale = 1.3 * t;
cc.tween(e).to(.12, {
scale: 1.15 * t
}).to(.1, {
scale: t
}).start();
} else cc.vv.audioMgr && cc.vv.audioMgr.playSFX("pass.mp3");
},
resetHintState: function() {
this._playableCombos = null;
this._hintIndex = 0;
if (this._autoPassTimer) {
clearTimeout(this._autoPassTimer);
this._autoPassTimer = null;
}
},
initEvents: function() {
var e = this, t = cc.vv.gameNetMgr;
t.dataEventHandler = this.node;
this.node.on("gp_start", function(t) {
e.onGpStart(t && t.detail);
});
this.node.on("gp_chupai", function(t) {
e.onGpChupai(t && t.detail);
});
this.node.on("gp_turn", function(t) {
e.onGpTurn(t && t.detail);
});
this.node.on("gp_pass", function(t) {
e.onGpPass(t && t.detail);
});
this.node.on("gp_newround", function(t) {
e.onGpNewRound(t && t.detail);
});
this.node.on("gp_error", function(t) {
e.showTip(t && t.detail && t.detail.msg || "操作失败");
});
this.node.on("game_over", function(t) {
e.onGameOver(t && t.detail);
});
this.node.on("game_end", function(t) {
e.onGameEnd(t && t.detail);
});
this.node.on("game_begin", function() {
e.onNewGameBegin();
});
this.node.on("game_num", function() {
e.updateRoundLabel();
});
this.node.on("user_ready", function(t) {
e.onUserReady(t && t.detail);
});
this.node.on("new_user", function() {
e.renderSeats();
});
this.node.on("user_state_changed", function() {
e.renderSeats();
});
var i = t._pendingEvents;
if (i && i.length) {
t._pendingEvents = null;
console.log("[GP] 重放场景加载前的推送 " + i.length + " 条");
for (var n = 0; n < i.length; ++n) this.node.emit(i[n].event, {
detail: i[n].data
});
}
if ((!this._cards || 0 == this._cards.length) && t.gpMyCards && t.gpMyCards.length) {
console.log("[GP] 用缓存状态直接重绘 " + t.gpMyCards.length + " 张");
e.onGpStart({
myCards: t.gpMyCards.slice(),
mySeat: t.gpMySeat,
startSeat: t.gpTurn,
freePlay: t.gpFreePlay,
lastPlay: t.gpLastPlay,
seats: t.gpSeats,
turnDeadline: t.gpTurnDeadline
});
}
function a(i, n) {
if (!(null == i || i < 0)) {
var a = e._seatViews, o = e._seatMap, c = o && o.length ? o.indexOf(i) : i === t.seatIndex ? 0 : 1;
if (!(c < 0) && a[c]) {
var s = a[c].root.getChildByName("ChatBubble");
if (s) {
s.active = !0;
var l = s.getComponent(cc.Label);
if (l) {
l.string = n;
l.node.color = cc.color(255, 255, 255);
}
var r = s.getChildByName("New Label");
r && (r.active = !1);
var h = s.getChildByName("chatbg_ld");
if (h) {
h.active = !0;
var d = h.getComponent(cc.Sprite);
if (d && e._chatBgFrame) {
d.spriteFrame = e._chatBgFrame;
d.type = cc.Sprite.Type.SLICED;
d.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
var g = Math.min(420, Math.max(80, 26 * String(n).length + 36));
h.setContentSize(g, 52);
h.color = cc.color(45, 40, 38, 210);
}
s.getContentSize().width < 10 && s.setContentSize(220, 68);
e._chatBubbleTimers = e._chatBubbleTimers || {};
e._chatBubbleTimers[i] && clearTimeout(e._chatBubbleTimers[i]);
e._chatBubbleTimers[i] = setTimeout(function() {
s.active = !1;
}, 3e3);
}
}
}
}
this.node.on("chat_push", function(e) {
var i = e.detail;
a(t.getSeatIndexByID(i.sender), i.content);
});
this.node.on("quick_chat_push", function(i) {
var n = i.detail, o = e._quickChatInfo && e._quickChatInfo[n.content] || n.content;
a(t.getSeatIndexByID(n.sender), o);
});
this.node.on("dissolve_notice", function(t) {
e.onDissolveNotice(t && t.detail);
});
this.node.on("dissolve_cancel", function() {
e._n.dissolvePanel && (e._n.dissolvePanel.active = !1);
});
this.node.on("room_exit", function() {
e.leaveRoom();
});
this.node.on("room_dispress", function() {
e.leaveRoom();
});
var o = cc.vv.net ? cc.vv.net.sio : null;
if (o) {
var c = function() {
console.log("[GP] exit_result: 退出成功, 返回大厅/俱乐部");
e.leaveRoom();
}, s = function() {
console.log("[GP] dispress_push: 房间已解散, 返回大厅/俱乐部");
e.leaveRoom();
};
o.on("exit_result", c);
o.on("dispress_push", s);
this._sio = o;
this._sioListeners = {
exit_result: c,
dispress_push: s
};
}
this.node.on("disconnect", function() {
e.showTip("网络已断开，正在重连...");
});
this.node.on("reconnect", function() {
e.setStr(e._n.tipLabel, "");
});
},
leaveRoom: function() {
if (!this._leaving) {
this._leaving = !0;
var e = cc.director.getScene ? cc.director.getScene() : null, t = e && e.name ? e.name : "";
if ("hall" !== t && "club" !== t) {
console.log("[GP] leaveRoom fromClub=" + cc.vv.fromClub + " fromClubId=" + cc.vv.fromClubId);
cc.vv.fromClub || cc.vv.fromClubId ? cc.director.loadScene("club") : cc.director.loadScene("hall");
}
}
},
refreshFromState: function() {
this._clearBoard();
var e = cc.vv.gameNetMgr;
e.conf && (this._gpConf = e.conf);
this._refreshTitle();
if ("begin" == e.gamestate && e.gpMyCards && e.gpMyCards.length > 0) this.applyGame(e.gpMyCards, e.gpMySeat, e.gpTurn, e.gpFreePlay, e.gpLastPlay, e.gpSeats, e.gpTurnDeadline, !1); else {
this.showPrepare();
this.renderSeats();
this.updateRoundLabel();
var t = e.seats ? e.seats[e.seatIndex] : null;
if (t && t.ready) {
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !0;
this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
}
e.numOfGames >= e.maxNumOfGames && e.maxNumOfGames > 0 && (this._final = !0);
}
},
applyGame: function(e, t, i, n, a, o, c, s) {
this.resetHintState();
this._cards = e instanceof Array ? e.slice() : [];
this._mySeat = null != t ? t : 0;
this._turn = null != i ? i : 0;
this._freePlay = null == n || !!n;
this._lastPlay = a || null;
this._deadline = c || 0;
this._over = !1;
this.restoreSettleBg();
this._selected = {};
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !1;
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.handArea.active = !0;
this._n.playArea.active = !0;
this.renderSeats();
this.renderHand();
this.renderLastPlay();
this.updateTurnUI();
this.updateRoundLabel();
this.updateActionBtns();
this._showHistoryIfEnabled();
this.checkAutoPass();
s && this._isFreshDeal() && this._playDealAnim();
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr.gpSeats;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i && 16 != (i.count || 0)) return !1;
}
return !0;
},
_playDealAnim: function() {
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("deal.mp3");
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 0)), t = [], i = 0, n = this, a = function(n, a, o) {
if (null != a && 0 != n.length) {
var c = a.convertToNodeSpaceAR(e);
o && n.sort(o);
for (var s = 0; s < n.length; ++s) {
var l = n[s], r = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
fx: r,
fy: h,
op: d
});
l.setPosition(c);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * s), cc.spawn(cc.moveTo(.15, cc.v2(r, h)), cc.fadeTo(.15, d))));
var g = .06 * s + .15;
g > i && (i = g);
}
}
}, o = [], c = null, s = 0; s < this._handSlots.length; ++s) {
var l = this._handSlots[s];
if (l && l.active && null != l._cardId) {
o.push(l);
c = l.parent;
}
}
a(o, c, function(e, t) {
return e.x - t.x;
});
for (var r = 0; r < this._oppSlots.length; ++r) {
var h = this._oppSlots[r];
if (h) {
for (var d = [], g = null, u = 0; u < h.length; ++u) {
var v = h[u];
if (v && v.active) {
d.push(v);
g = v.parent;
}
}
d.length > 0 && a(d, g, function(e, t) {
return e.x - t.x;
});
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var m = this._dealAnimId;
this.scheduleOnce(function() {
if (n._dealAnimId == m) {
n._dealAnimating = !1;
n._dealAnimNodes = null;
n._cards && n._cards.length > 0 && n.renderHand();
}
}, i + .05);
}
},
_cancelDealAnim: function() {
if (this._dealAnimating) {
this._dealAnimating = !1;
this._dealAnimId = (this._dealAnimId || 0) + 1;
for (var e = this._dealAnimNodes || [], t = 0; t < e.length; ++t) {
var i = e[t];
if (cc.isValid(i.node)) {
i.node.stopAllActions();
i.node.setPosition(i.fx, i.fy);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
onGpStart: function(e) {
if (e) {
e.conf && (this._gpConf = e.conf);
this._refreshTitle();
this._playHistory = [];
this._historyRound = 0;
this._showHistoryIfEnabled();
this._renderHistory();
var t = cc.vv.gameNetMgr, i = null != e.startSeat ? e.startSeat : null != e.turn ? e.turn : t.gpTurn;
this.applyGame(e.myCards, null != e.mySeat ? e.mySeat : t.gpMySeat, i, e.freePlay, e.lastPlay, e.seats, e.turnDeadline, !0);
}
},
onGpChupai: function(e) {
if (e) {
this.resetHintState();
this._lastPlay = {
seatIndex: e.seatIndex,
type: e.type,
key: e.key,
len: e.len,
bombLevel: e.bombLevel || 0,
pais: (e.pais || []).slice()
};
this._freePlay = !1;
this._selected = {};
this._cards = (cc.vv.gameNetMgr.gpMyCards || []).slice();
this._isHistoryEnabled() && this._addHistory({
round: this._historyRound,
seatIndex: e.seatIndex,
type: e.type,
pais: (e.pais || []).slice()
});
this.renderSeats();
this.renderHand();
this.renderLastPlay();
}
},
onGpTurn: function(e) {
if (e) {
var t = cc.vv.gameNetMgr;
this.resetHintState();
this._turn = e.turn;
this._freePlay = !!e.freePlay;
this._lastPlay = e.lastPlay || null;
this._deadline = e.turnDeadline || 0;
this._cards = (t.gpMyCards || []).slice();
this.renderSeats();
this.renderHand();
this.renderLastPlay();
this.updateTurnUI();
this.checkAutoPass();
}
},
onGpPass: function(e) {
if (e) {
this.resetHintState();
this.renderSeats();
}
},
onGpNewRound: function(e) {
if (e) {
this.resetHintState();
this._turn = e.turn;
this._freePlay = !0;
this._lastPlay = null;
this._deadline = e.turnDeadline || 0;
this._isHistoryEnabled() && this._historyNextRound();
this.renderSeats();
this.renderLastPlay();
this.updateTurnUI();
}
},
onNewGameBegin: function() {
this._final && (this._overRounds = []);
this._over = !1;
this._final = !1;
this._selected = {};
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.gameResult && (this._n.gameResult.active = !1);
this._n.prepareInfo.active = !1;
this._n.readyBtn.active = !1;
this._n.handArea.active = !0;
this._n.playArea.active = !0;
if (this._n.settleAgainBtn) {
var e = this._n.settleAgainBtn.getComponent(cc.Label);
if (e) {
e.enabled = !0;
e.string = "准备";
}
}
this.updateActionBtns();
},
isMyTurn: function() {
return !this._over && this._turn == this._mySeat;
},
onPlay: function() {
if (this.isMyTurn()) {
var e = [];
for (var t in this._selected) this._selected[t] && e.push(parseInt(t));
if (0 != e.length) {
this.resetHintState();
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("deal.mp3");
cc.vv.net.send("chupai", e);
} else this.showTip("请先选择要出的牌");
} else this.showTip("还没轮到你出牌");
},
onPass: function() {
if (this.isMyTurn()) {
this.resetHintState();
cc.vv.net.send("guo");
this._selected = {};
this.renderHand();
}
},
onSlotTouched: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this.isMyTurn() && !this._over) {
var t = e._cardId;
if (null != t) {
this._selected[t] = !this._selected[t];
e.y = this._selected[t] ? this._selectUpOffset : 0;
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("select.mp3");
this.updateTurnUI();
}
}
},
renderAll: function() {
this.renderHand();
this.renderLastPlay();
this.renderSeats();
this.updateRoundLabel();
this.updateTurnUI();
},
renderHand: function() {
this._cancelDealAnim();
var e = this._cards.slice(), t = this;
e.sort(function(e, i) {
var n = t.rankOf(e) - t.rankOf(i);
return 0 != n ? n : t.suitOf(e) - t.suitOf(i);
});
var i = e.length, n = this, a = e.map(function(e) {
var t = n.frameOf(e);
return e + "=" + (t ? t.name : "NULL");
});
console.log("[GP] renderHand N=" + i + " slots=" + this._handSlots.length + " 牌=" + a.join(" | "));
for (var o = 0; o < this._handSlots.length; ++o) {
var c = this._handSlots[o];
if (o < i) {
var s = e[o];
c._cardId = s;
c.getComponent(cc.Sprite).spriteFrame = this.frameOf(s);
c.active = !0;
c.x = 60 * (o - (i - 1) / 2);
c.y = this._selected[s] ? this._selectUpOffset : 0;
} else {
c._cardId = null;
c.active = !1;
}
}
0 == e.length && this.setStr(this._n.tipLabel, "");
},
renderLastPlay: function() {
var e = this._lastPlay, t = e && e.pais ? e.pais.slice() : [];
this._n.playArea && (this._n.playArea.active = !0);
this._n.cardsContainer && (this._n.cardsContainer.active = !0);
if (this._playAnimBusy) this._pendingRenderPais = t; else {
for (var i = !1, n = 0; n < this._playSlots.length; ++n) if (this._playSlots[n].active) {
i = !0;
break;
}
if (i) {
this._playAnimBusy = !0;
var a = this, o = this._n.cardsContainer;
if (o) cc.tween(o).to(.07, {
opacity: 0
}).call(function() {
a._fillPlaySlots(t);
cc.tween(o).to(.07, {
opacity: 255
}).call(function() {
a._playAnimBusy = !1;
if (null != a._pendingRenderPais) {
var e = a._pendingRenderPais;
a._pendingRenderPais = null;
a._playAnimBusy = !1;
a._lastPlay = {
pais: e
};
a.renderLastPlay();
}
}).start();
}).start(); else {
a._fillPlaySlots(t);
a._playAnimBusy = !1;
}
} else this._fillPlaySlots(t);
}
},
_fillPlaySlots: function(e) {
for (var t = [], i = 0; i < (e || []).length; ++i) {
var n = this.frameOf(e[i]);
t.push(e[i] + ":" + (n ? n.name : "NULL"));
}
console.log("[GP] fillPlaySlots slots=" + this._playSlots.length + " 牌=" + JSON.stringify(e) + " 帧=" + JSON.stringify(t));
for (var a = 0; a < this._playSlots.length; ++a) {
var o = this._playSlots[a];
if (a < e.length) {
var c = this.frameOf(e[a]);
o.getComponent(cc.Sprite).spriteFrame = c;
o.active = !0;
} else o.active = !1;
}
this.setStr(this._n.playOwnerLabel, "");
},
seatName: function(e, t) {
var i = t || (cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null);
if (i && i[e]) {
var n = i[e];
if (n.name) return n.name;
if (n.userid == cc.vv.userMgr.userId) return cc.vv.userMgr.userName || "我";
}
return e == this._mySeat ? "我" : "玩家" + (e + 1);
},
renderSeats: function() {
this._cancelDealAnim();
var e = cc.vv.gameNetMgr, t = e.gpSeats, i = e.seats, n = "begin" == e.gamestate && t && t.length > 0, a = n && t ? null != this._mySeat ? this._mySeat : e.gpMySeat : e.seatIndex;
(null == a || a < 0) && (a = 0);
var o = [], c = {};
o.push(a);
c[a] = !0;
var s = n ? t ? t.length : 0 : i ? i.length : 0;
s <= 0 && (s = this.maxPlayers || 2);
for (var l = 0; l < s && o.length < 3; ++l) if (!c[l]) {
o.push(l);
c[l] = !0;
}
this._seatMap = o;
for (var r = 0; r < this._seatViews.length; ++r) {
var h = this._seatViews[r];
if (h && h.root) {
var d = r < o.length ? o[r] : r;
if (d >= s) h.root.active = !1; else {
h.root.active = !0;
var g = d == a, u = "", v = 0, m = "", p = "";
if (n) {
var f = t[d];
if (f) {
u = f.name || (g ? "我" : "玩家" + (d + 1));
v = f.score || 0;
m = "剩" + (f.count || 0) + "张";
0 == f.count ? p = "已出完" : f.passed ? p = "不要" : d != this._turn || this._over || (p = "出牌中");
}
} else {
var _ = i ? i[d] : null;
if (_ && _.userid > 0) {
u = _.name || (g ? "我" : "玩家" + (d + 1));
v = _.score || 0;
m = _.ready ? "已准备" : "未准备";
p = g ? "我" : "";
} else {
u = "等待玩家";
m = "";
}
}
var C = "等待玩家" !== u;
h.name && this.setStr(h.name, u);
h.count && this.setStr(h.count, C ? "" + v : "");
h.remain && this.setStr(h.remain, m);
if (h.state) {
this.setStr(h.state, p);
h.state.color = d == this._turn && n && !this._over ? cc.color(255, 230, 90) : cc.color(200, 200, 200);
}
}
}
}
this.renderOppHands(t, n);
this.updateTurnUI();
},
renderOppHands: function(e, t) {
for (var i = cc.vv.gameNetMgr, n = e || (i ? i.gpSeats : null), a = this._seatMap || [], o = 1; o < this.maxPlayers; ++o) {
var c = this._oppSlots[o - 1];
if (c) for (var s = o < a.length ? a[o] : o, l = t && n && n[s] && n[s].count || 0, r = 0; r < c.length; ++r) c[r].active = r < l;
}
},
_blankSprite: function(e) {
if (null != e) {
var t = e.getComponent(cc.Sprite);
t && (t.spriteFrame = null);
}
},
_clearBoard: function() {
this._cards = [];
this._lastPlay = null;
this._selected = {};
var e, t = this._handSlots || [];
for (e = 0; e < t.length; ++e) {
t[e]._cardId = null;
this._blankSprite(t[e]);
t[e].active = !1;
}
var i = this._playSlots || [];
for (e = 0; e < i.length; ++e) {
this._blankSprite(i[e]);
i[e].active = !1;
}
var n = this._oppSlots || [];
for (e = 0; e < n.length; ++e) for (var a = n[e], o = 0; o < a.length; ++o) a[o].active = !1;
this._n.handArea && (this._n.handArea.active = !1);
this._n.playArea && (this._n.playArea.active = !1);
this._n.cardsContainer && (this._n.cardsContainer.active = !1);
this._n.countdownLabel && this.setStr(this._n.countdownLabel, "");
this._n.playOwnerLabel && this.setStr(this._n.playOwnerLabel, "");
this._n.tipLabel && this.setStr(this._n.tipLabel, "");
},
updateTurnUI: function() {
if (null != this._n.playBtn) {
var e = this.findNode(this.node, "ops"), t = this.findNode(this.node, "arrow");
if (cc.vv.gameNetMgr && "begin" == cc.vv.gameNetMgr.gamestate) {
if (e) {
e.active = !0;
e.opacity = 255;
}
t && (t.active = !0);
var i = this.isMyTurn();
console.log("[GP] updateTurnUI turn=", this._turn, "mySeat=", this._mySeat, "myTurn=", i, "freePlay=", this._freePlay);
var n = !1;
for (var a in this._selected) if (this._selected[a]) {
n = !0;
break;
}
this._n.playBtn.active = i;
this._n.playBtn.opacity = 255;
this._n.playBtn.zIndex = 999;
this.setBtnEnabled(this._n.playBtn, n);
this._n.passBtn.active = i && !this._freePlay;
if (this._n.passBtn) {
this._n.passBtn.opacity = 255;
this._n.passBtn.zIndex = 999;
}
if (this._n.hintBtn) {
this._n.hintBtn.opacity = 255;
this._n.hintBtn.zIndex = 999;
if (i && !this._freePlay && this._lastPlay) {
var o = this._playableCombos;
o || (o = this.collectPlayableCombos());
this.setBtnEnabled(this._n.hintBtn, o.length > 0);
} else this.setBtnEnabled(this._n.hintBtn, !1);
this._n.hintBtn.active = i;
}
this.updateArrowPointer();
i ? this.setStr(this._n.tipLabel, (this._freePlay, "请出牌")) : !this._over && this._turn >= 0 && this.setStr(this._n.tipLabel, "上家出牌中…");
} else {
e && (e.active = !1);
t && (t.active = !1);
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
this.setStr(this._n.tipLabel, "");
this.setStr(this._n.playOwnerLabel, "");
}
}
},
setBtnEnabled: function(e, t) {
if (e) {
e.getComponent(cc.Sprite);
var i = e.getChildByName("settleAgainBtnLabel") || e.getChildByName("lblTip") || null;
if (!i) for (var n = 0; n < e.children.length; ++n) if (e.children[n].getComponent(cc.Label)) {
i = e.children[n];
break;
}
if (t) {
e.opacity = 255;
e.interactable = !0;
if (i) {
var a = i.getComponent(cc.Label);
a && (a.color = cc.color(255, 255, 255));
}
} else {
e.opacity = 130;
e.interactable = !1;
if (i) {
var o = i.getComponent(cc.Label);
o && (o.color = cc.color(200, 200, 200));
}
}
}
},
updateArrowPointer: function() {
if (this._n.arrowPointer) {
var e = !this._over && this._turn >= 0;
this._n.arrow && (this._n.arrow.active = e);
if (e) {
for (var t, i = this._seatMap || [], n = 0, a = 0; a < i.length; ++a) if (i[a] === this._turn) {
n = a;
break;
}
t = this.maxPlayers >= 3 ? 0 === n ? 0 : 1 === n ? 1 : 3 : 0 === n ? 0 : 2;
var o = this._n.arrowPointer.children;
for (a = 0; a < o.length; ++a) o[a].active = a === t;
}
}
},
setArrowTime: function(e) {
this._n.arrowTime && this.setStr(this._n.arrowTime, e);
},
updateRoundLabel: function() {
var e = cc.vv.gameNetMgr;
if (null != this._n.roundLabel) {
var t = e.numOfGames || 0, i = e.maxNumOfGames || 0;
this.setStr(this._n.roundLabel, i > 0 ? "第" + t + "/" + i + "局" : "");
}
},
update: function() {
if (this._over || this._deadline <= 0) {
this.setArrowTime("");
this._n.countdownLabel && this.setStr(this._n.countdownLabel, "");
} else {
var e = Math.ceil((this._deadline - Date.now()) / 1e3);
e < 0 && (e = 0);
var t = String(e);
t.length < 2 && (t = "0" + t);
this.setArrowTime(t);
this.setStr(this._n.countdownLabel, String(e));
}
},
showTip: function(e) {
if (null != this._n.tipLabel) {
this.setStr(this._n.tipLabel, e || "");
this._lastTip = e || "";
}
},
setLabel: function(e, t) {
if (null != e) {
var i = e.getComponent(cc.Label);
i && (i.string = t);
}
},
setStr: function(e, t) {
if (null != e) {
var i = e.getComponent(cc.Label);
i && (i.string = t || "");
}
},
setBlackStr: function(e, t) {
if (null != e) {
e.color = cc.color(0, 0, 0, 255);
var i = e.getComponent(cc.Label);
if (i) {
i.string = t || "";
i._N$color && (i._N$color = cc.color(0, 0, 0, 255));
i.setColor && i.setColor(cc.color(0, 0, 0, 255));
}
}
},
showPrepare: function() {
this.restoreSettleBg();
this._clearBoard();
this._n.readyBtn.active = !0;
this._n.prepareInfo.active = !1;
this._n.handArea.active = !1;
this._n.playArea.active = !1;
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
this.setStr(this._n.countdownLabel, "");
this.setStr(this._n.tipLabel, "等待所有玩家准备后开始");
this._n.historyBtn && (this._n.historyBtn.active = !1);
this._n.historyPanel && (this._n.historyPanel.active = !1);
this.updateActionBtns();
},
onReady: function() {
cc.vv.net.send("ready");
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !0;
this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
this.setStr(this._n.tipLabel, "已准备，等待其他玩家…");
this.updateActionBtns();
},
onUserReady: function(e) {
if (e) {
this.renderSeats();
if (e.userid == cc.vv.userMgr.userId) {
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !0;
this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
}
this.updateActionBtns();
}
},
onSettleAgain: function() {
if (this._final) cc.vv.net.send("exit"); else {
this._n.settlePanel.active = !1;
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !0;
this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
this.restoreSettleBg();
this._over = !1;
this.updateActionBtns();
cc.vv.net.send("ready");
}
},
onSettleClose: function() {
this._n.settlePanel && (this._n.settlePanel.active = !1);
if (!this._final) {
this.setStr(this._n.tipLabel, "等待其他玩家准备…");
this.restoreSettleBg();
this._over = !1;
this.updateActionBtns();
cc.vv.net.send("ready");
}
},
onGameOver: function(e) {
if (e) {
var t = cc.vv.gameNetMgr;
this._over = !0;
this.updateActionBtns();
this.resetHintState();
var i = this.findNode(this.node, "ops");
i && (i.active = !1);
this.hideSettleBg();
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
this._n.arrow && (this._n.arrow.active = !1);
this.setStr(this._n.tipLabel, "");
this.setStr(this._n.countdownLabel, "");
for (var n = 0, a = 0; a < e.length; ++a) if (e[a].seatindex == cc.vv.gameNetMgr.seatIndex) {
n = e[a].delta || 0;
break;
}
cc.vv.audioMgr && (n > 0 ? cc.vv.audioMgr.playSFX("win.mp3") : n < 0 && cc.vv.audioMgr.playSFX("lose.mp3"));
var o = this;
setTimeout(function() {
o.updateActionBtns();
}, 0);
for (var c = [], s = [], l = 0; l < e.length; ++l) {
var r = e[l], h = r.name || "玩家" + (r.seatindex + 1), d = h + "：";
if (r.isWinner) d += "出完手牌  赢 +" + r.delta + "分"; else {
d += "剩" + r.remain + "张";
r.allClosed && (d += "（全关×2）");
d += "  " + r.delta + "分";
}
c.push(d);
s.push(h + " " + (null != r.totalscore ? r.totalscore : r.score));
}
c.push("");
c.push("总分：" + s.join("   "));
this._overRounds = this._overRounds || [];
for (var g = [], u = 0; u < e.length; ++u) {
var v = e[u];
g.push({
name: v.name || "玩家" + (v.seatindex + 1),
score: v.delta || 0
});
}
this._overRounds.push({
index: t.numOfGames,
scores: g
});
if (t.maxNumOfGames > 0 && t.numOfGames >= t.maxNumOfGames) this.onGameEnd({
roundHistory: this._overRounds
}); else {
this.setBlackStr(this._n.settleTitle, "本局结算");
this.setBlackStr(this._n.settleContent, c.join("\n"));
this._n.settleAgainBtn && (this._n.settleAgainBtn.active = !0);
this._n.settleExitBtn && (this._n.settleExitBtn.active = !1);
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.settlePanel.active = !0;
this._n.settleNewBtn && (this._n.settleNewBtn.active = !0);
this.setStr(this._n.tipLabel, "本局结束");
}
}
},
onGameEnd: function(e) {
this._final = !0;
for (var t = [], i = cc.vv.gameNetMgr.seats || [], n = 0; n < i.length; ++n) {
var a = i[n];
a && a.userid > 0 && t.push((a.name || "玩家") + " " + (a.score > 0 ? "+" + a.score : a.score));
}
var o = [ "最终总分：" + t.join("   ") ], c = e && e.roundHistory && e.roundHistory.length ? e.roundHistory : this._overRounds || [];
c.length && o.push("");
for (var s = 0; s < c.length; ++s) {
for (var l = c[s] || {}, r = [], h = l.scores || [], d = 0; d < h.length; ++d) {
var g = h[d] || {};
r.push((g.name || "玩家") + " " + (g.score > 0 ? "+" + g.score : g.score));
}
o.push("第" + (l.index || s + 1) + "局  " + r.join("   "));
}
var u = o.join("\n");
if (this._showFinalResult(o)) {
this._n.settlePanel && (this._n.settlePanel.active = !1);
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this.setStr(this._n.tipLabel, "整场结束");
} else if (null != this._n.finalSettlePanel) {
this._n.settlePanel.active = !1;
this.setBlackStr(this._n.finalSettleTitle, "整场结算");
this._fitSettleFont(this._n.finalSettleContent, o);
this.setBlackStr(this._n.finalSettleContent, u);
this._n.finalSettlePanel.active = !0;
this.setStr(this._n.tipLabel, "整场结束");
} else {
this._n.settleAgainBtn && (this._n.settleAgainBtn.active = !1);
this._n.settleCloseBtn && (this._n.settleCloseBtn.active = !1);
if (this._n.settleExitBtn) {
this._n.settleExitBtn.active = !0;
this._n.settleExitBtn.x = 0;
this._n.settleAgainBtn && (this._n.settleExitBtn.y = this._n.settleAgainBtn.y);
}
this.setBlackStr(this._n.settleTitle, "整场结算");
this._fitSettleFont(this._n.settleContent, o);
this.setBlackStr(this._n.settleContent, u);
this._n.settlePanel.active = !0;
this.setStr(this._n.tipLabel, "整场结束");
}
},
_showFinalResult: function(e) {
var t = this._n.gameResult;
if (null == t) return !1;
var i = t.getChildByName("resultList");
i && i.destroy();
for (var n = 0, a = 0; a < e.length; ++a) {
for (var o = 0, c = e[a] || "", s = 0; s < c.length; ++s) o += c.charCodeAt(s) > 255 ? 2 : 1;
o > n && (n = o);
}
var l = n > 0 ? Math.floor(860 / n) : 30, r = Math.floor(480 / Math.max(1, e.length) / 1.3);
l > r && (l = r);
l > 30 && (l = 30);
l < 14 && (l = 14);
var h = new cc.Node("resultList"), d = h.addComponent(cc.Label);
d.string = e.join("\n");
d.fontSize = l;
d.lineHeight = l + 10;
d.enableWrapText = !1;
d.overflow = cc.Label.Overflow.NONE;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.verticalAlign = cc.Label.VerticalAlign.CENTER;
h.color = cc.color(0, 0, 0, 255);
h.setPosition(0, 20);
t.addChild(h);
t.active = !0;
return !0;
},
_fitSettleFont: function(e, t) {
if (null != e) {
var i = e.getComponent(cc.Label);
if (i) {
for (var n = 0, a = 0; a < t.length; ++a) {
for (var o = 0, c = t[a] || "", s = 0; s < c.length; ++s) o += c.charCodeAt(s) > 255 ? 2 : 1;
o > n && (n = o);
}
var l = e.width > 0 ? e.width : e.parent ? .9 * e.parent.width : 630, r = n > 0 ? Math.floor(l / n) : 32;
r > 32 && (r = 32);
r < 14 && (r = 14);
i.fontSize = r;
i.lineHeight = r + 4;
}
}
},
onBtnSettings: function() {
this._n.settingsPanel && (this._n.settingsPanel.active = !this._n.settingsPanel.active);
},
onBtnChat: function() {
this._n.chatPanel && (this._n.chatPanel.active = !this._n.chatPanel.active);
},
onBtnVoice: function() {
this.showTip("语音功能开发中");
},
onBtnSettingsClose: function() {
this._n.settingsPanel && (this._n.settingsPanel.active = !1);
},
onBtnSettingsDissolve: function() {
this._n.settingsPanel && (this._n.settingsPanel.active = !1);
if ("begin" == cc.vv.gameNetMgr.gamestate) {
cc.vv.net.send("dissolve_request");
this.showTip("已发起解散申请，等待其他玩家同意");
} else cc.vv.net.send("dispress");
},
onBtnChatSend: function() {
if (this._n.iptChat) {
var e = this._n.iptChat.getComponent(cc.EditBox), t = e && e.string || "";
if ("" != t) {
cc.vv.net.send("chat", t);
e && (e.string = "");
this._n.chatPanel && (this._n.chatPanel.active = !1);
}
}
},
onTabQuick: function() {
this._n.quickchatlist && (this._n.quickchatlist.active = !0);
this._n.emojis && (this._n.emojis.active = !1);
},
onTabEmoji: function() {
this._n.quickchatlist && (this._n.quickchatlist.active = !1);
this._n.emojis && (this._n.emojis.active = !0);
},
onBtnChatClose: function() {
this._n.chatPanel && (this._n.chatPanel.active = !1);
},
hideSettleBg: function() {
this._settleHidden = [];
for (var e = [ "prepare", "infobar", "msg_set_bg" ], t = 0; t < e.length; ++t) {
var i = this.findNode(this.node, e[t]);
if (i && i.active) {
i.active = !1;
this._settleHidden.push(i);
}
}
for (var n = [ this._n.btnSettings, this._n.btnChat, this._n.btnVoice ], a = 0; a < n.length; ++a) n[a] && (n[a].active = !1);
this._n.prepareInfo && (this._n.prepareInfo.active = !1);
},
restoreSettleBg: function() {
for (var e = this._settleHidden || [], t = 0; t < e.length; ++t) e[t].active = !0;
this._settleHidden = [];
},
updateActionBtns: function() {
var e = cc.vv.gameNetMgr, t = "begin" != e.gamestate && !this._final, i = e.seats ? e.seats[e.seatIndex] : null, n = !(!i || !i.ready);
if (t) {
this._n.exitBtn && (this._n.exitBtn.active = !n);
this._n.dissolveBtn && (this._n.dissolveBtn.active = n);
} else {
this._n.exitBtn && (this._n.exitBtn.active = !1);
this._n.dissolveBtn && (this._n.dissolveBtn.active = !1);
}
var a = !this._over && !this._final;
this._n.btnSettings && (this._n.btnSettings.active = a);
this._n.btnChat && (this._n.btnChat.active = a);
this._n.btnVoice && (this._n.btnVoice.active = a);
if (!a) {
this._n.settingsPanel && (this._n.settingsPanel.active = !1);
this._n.chatPanel && (this._n.chatPanel.active = !1);
}
},
onExit: function() {
var e = this, t = function() {
if (e._final) {
e._n.gameResult && (e._n.gameResult.active = !1);
e._n.finalSettlePanel && (e._n.finalSettlePanel.active = !1);
e._n.settlePanel && (e._n.settlePanel.active = !1);
cc.vv.net.send("leave_room");
setTimeout(function() {
e._leaving || e.leaveRoom();
}, 800);
} else {
cc.vv.net.send("exit");
setTimeout(function() {
if (cc.isValid(e.node) && !e._leaving && null != cc.vv.gameNetMgr.roomId) {
cc.vv.gameNetMgr.clearRoomState && cc.vv.gameNetMgr.clearRoomState();
e.leaveRoom();
}
}, 2e3);
}
};
!this._final && cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "是否确定退出房间？", t, !0) : t();
},
onDissolve: function() {
var e = this, t = function() {
if ("begin" == cc.vv.gameNetMgr.gamestate) {
cc.vv.net.send("dissolve_request");
e.showTip("已发起解散申请，等待其他玩家同意");
} else cc.vv.net.send("dispress");
};
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "解散房间不扣房卡，是否确定解散？", t, !0) : t();
},
onDissolveNotice: function() {
if (null != this._n.dissolvePanel) {
this._n.dissolvePanel.active = !0;
this._n.dissolveLabel && this.setStr(this._n.dissolveLabel, "有玩家申请解散房间，是否同意？");
}
},
onDissolveAgree: function() {
cc.vv.net.send("dissolve_agree");
this._n.dissolvePanel.active = !1;
},
onDissolveReject: function() {
cc.vv.net.send("dissolve_reject");
this._n.dissolvePanel.active = !1;
}
});
cc._RF.pop();
}, {} ],
GameOverZP: [ function(e, t) {
"use strict";
cc._RF.push(t, "40144pIITVBiZLYFIIjZDZV", "GameOverZP");
cc.Class({
extends: cc.Component,
properties: {
_gameover: null,
_gameresult: null,
_seats: [],
_isGameEnd: !1,
_pingju: null,
_win: null,
_lose: null
},
onLoad: function() {
if (null != cc.vv && null != cc.vv.gameNetMgr.conf) {
"xzdd" == cc.vv.gameNetMgr.conf.type ? this._gameover = this.node.getChildByName("game_over") : this._gameover = this.node.getChildByName("game_over_xlch");
this._gameover.active = !1;
this._pingju = this._gameover.getChildByName("pingju");
this._win = this._gameover.getChildByName("win");
this._lose = this._gameover.getChildByName("lose");
this._gameover.x = 0;
this._gameover.setScale(.85);
for (var e = [ this._win, this._lose, this._pingju ], t = 0; t < e.length; ++t) {
var i = e[t];
i && (i.x = 0);
}
this._gameresult = this.node.getChildByName("game_result");
if (this._gameresult) {
this._gameresult.width = cc.winSize.width;
this._gameresult.x = 0;
var n = this._gameresult.getChildByName("Z_jiesuanditu");
if (n) {
n.width = cc.winSize.width;
n.x = 0;
}
var a = this._gameresult.getChildByName("GameEnd7");
if (a) {
a.width = cc.winSize.width;
a.x = 0;
var o = a.getComponent(cc.Sprite);
if (o && o.spriteFrame) {
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
o.type = cc.Sprite.Type.SLICED;
}
}
}
this._gameover.getChildByName("wanfa").getComponent(cc.Label).string = cc.vv.gameNetMgr.getWanfa();
for (var c = this._gameover.getChildByName("result_list"), s = 1; s <= 4; ++s) {
var l = "s" + s, r = c.getChildByName(l), h = {};
h.username = r.getChildByName("username").getComponent(cc.Label);
h.reason = r.getChildByName("reason").getComponent(cc.Label);
var d = r.getChildByName("fan");
null != d && (h.fan = d.getComponent(cc.Label));
h.score = r.getChildByName("score").getComponent(cc.Label);
h.hu = r.getChildByName("hu");
h.mahjongs = r.getChildByName("pai");
h.zhuang = r.getChildByName("zhuang");
h.hupai = r.getChildByName("hupai");
h._pengandgang = [];
this._seats.push(h);
}
var g = this;
this.node.on("game_over", function(e) {
g.onGameOver(e.detail);
});
this.node.on("game_end", function() {
g._isGameEnd = !0;
g._gameresult && (g._gameresult.active = !0);
g._gameover && (g._gameover.active = !1);
});
}
},
onGameOver: function(e) {
var t = cc.vv.gameNetMgr.conf.type;
"zp" == t || "zp4" == t || "wujin" == t || "zj" == t || "zj_bt" == t || "zj4" == t || "zj4_bt" == t ? this.onGameOver_ZJ(e) : "xzdd" == t ? this.onGameOver_XZDD(e) : this.onGameOver_XLCH(e);
},
onGameOver_ZJ: function(e) {
console.log(e);
if (e && 0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
for (var t = cc.vv.gameNetMgr.seatIndex, i = 0, n = 0; n < e.length; ++n) if (e[n] && e[n].userid == cc.vv.gameNetMgr.seats[t].userid) {
i = e[n].score;
break;
}
i > 0 ? this._win.active = !0 : i < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (n = 0; n < this._seats.length; ++n) {
var a = this._seats[n], o = e[n], c = a.username.node.parent;
if (o) {
c.active = !0;
for (var s = !1, l = [], r = a.hupai, h = 0; h < r.children.length; ++h) r.children[h].active = !1;
var d = 0, g = o.huinfo || [];
for (h = 0; h < g.length; ++h) {
var u = g[h];
s = s || u.ishupai;
if (u.ishupai) {
if (d < r.children.length) {
var v = r.children[d];
v.active = !0;
v.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", u.pai);
d++;
}
"zimo" == u.action ? l.push("自摸") : "hu" == u.action && l.push("接炮胡");
if (null != u.fan) {
l.push(u.fan + "台");
u.tailog && u.tailog.length && l.push("\n" + u.tailog.join("\n"));
}
} else "fangpao" == u.action && l.push("放炮");
}
a.hu.active = s;
var m = o.angangs || [], p = o.diangangs || [], f = o.wangangs || [], _ = o.pengs || [], C = o.chis || [];
m.length && l.push("暗杠x" + m.length);
p.length && l.push("明杠x" + p.length);
f.length && l.push("补杠x" + f.length);
a.username.string = cc.vv.gameNetMgr.seats[n] ? cc.vv.gameNetMgr.seats[n].name : "";
a.zhuang.active = cc.vv.gameNetMgr.button == n;
var y = cc.vv.gameNetMgr.button == n && cc.vv.gameNetMgr.laozhuang || 0;
this.updateSettleLaoZhuang(a, y);
a.reason.string = l.join("、");
o.score > 0 ? a.score.string = "+" + o.score : a.score.string = "" + o.score;
for (var b = 0; b < a.mahjongs.childrenCount; ++b) a.mahjongs.children[b].active = !1;
var N = (o.holds || []).slice();
"object" == typeof N && null != N.length || (N = []);
cc.vv.mahjongmgr.sortMJ(N);
var M = m.length + f.length + p.length, S = 3 * (_.length + M + C.length);
for (b = 0; b < N.length; ++b) {
var B = N[b], w = a.mahjongs.children[b + S];
if (null == w) break;
w.active = !0;
w.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", B);
}
for (b = 0; b < a._pengandgang.length; ++b) a._pengandgang[b].active = !1;
var A = 0;
for (b = 0; b < m.length; ++b) {
this.initPengAndGangs(a, A, m[b], "angang");
A++;
}
for (b = 0; b < p.length; ++b) {
this.initPengAndGangs(a, A, p[b], "diangang");
A++;
}
for (b = 0; b < f.length; ++b) {
this.initPengAndGangs(a, A, f[b], "wangang");
A++;
}
for (b = 0; b < _.length; ++b) {
var x = o.pengTiles && o.pengTiles[b] || null;
this.initPengAndGangs(a, A, _[b], "peng", x);
A++;
}
for (b = 0; b < C.length; ++b) {
var P = C[b];
if (P && P.length > 0) {
this.initChisGroup(a, A, P);
A++;
}
}
} else c.active = !1;
}
} else this._gameresult.active = !0;
},
updateSettleLaoZhuang: function(e, t) {
var i = e.zhuang;
if (i) {
var n = i.getChildByName("laozhuang_ex");
if (null == n) {
(n = new cc.Node("laozhuang_ex")).setContentSize(60, 22);
n.setPosition(0, -34);
i.addChild(n);
var a = n.addComponent(cc.Label);
a.fontSize = 18;
a.lineHeight = 22;
a.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.overflow = cc.Label.Overflow.NONE;
n.color = cc.color(255, 225, 120);
var o = n.addComponent(cc.LabelOutline);
o.color = cc.color(60, 30, 0);
o.width = 2;
}
var c = null != t && t >= 1;
n.active = c;
c && (n.getComponent(cc.Label).string = "老庄" + t);
}
},
onGameOver_XZDD: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], o = !1, c = a.angangs.length + a.wangangs.length + a.diangangs.length, s = a.numofgen, l = [], r = !1, h = 0; h < a.actions.length; ++h) {
var d = a.actions[h];
if ("zimo" == d.type || "ganghua" == d.type || "dianganghua" == d.type || "hu" == d.type || "gangpaohu" == d.type || "qiangganghu" == d.type || "chadajiao" == d.type) {
"7pairs" == a.pattern ? l.push("七对") : "l7pairs" == a.pattern ? l.push("龙七对") : "j7pairs" == a.pattern ? l.push("将七对") : "duidui" == a.pattern ? l.push("碰碰胡") : "jiangdui" == a.pattern && l.push("将对");
"zimo" == d.type ? l.push("自摸") : "ganghua" == d.type ? l.push("杠上花") : "dianganghua" == d.type ? l.push("点杠花") : "gangpaohu" == d.type ? l.push("杠炮胡") : "qiangganghu" == d.type ? l.push("抢杠胡") : "chadajiao" == d.type && (r = !0);
o = !0;
} else "fangpao" == d.type ? l.push("放炮") : "angang" == d.type ? l.push("暗杠") : "diangang" == d.type ? l.push("明杠") : "wangang" == d.type ? l.push("弯杠") : "fanggang" == d.type ? l.push("放杠") : "zhuanshougang" == d.type ? l.push("转手杠") : "beiqianggang" == d.type ? l.push("被抢杠") : "beichadajiao" == d.type && l.push("被查叫");
}
if (o) {
a.qingyise && l.push("清一色");
a.menqing && l.push("门清");
a.zhongzhang && l.push("中张");
a.jingouhu && l.push("金钩胡");
a.haidihu && l.push("海底胡");
a.tianhu && l.push("天胡");
a.dihu && l.push("地胡");
s > 0 && l.push("根x" + s);
r && l.push("查大叫");
}
for (var g = 0; g < 3; ++g) n.hu.children[g].active = !1;
a.huorder >= 0 && (n.hu.children[a.huorder].active = !0);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = l.join("、");
var u = 0;
o && (u = a.fan);
n.fan.string = u + "番";
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
var v = -1;
o && (v = a.holds.pop());
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
o && a.holds.push(v);
for (var m = 0; m < n.mahjongs.childrenCount; ++m) (f = n.mahjongs.children[m]).active = !1;
var p = 3 * (a.pengs.length + c);
for (m = 0; m < a.holds.length; ++m) {
var f, _ = a.holds[m];
(f = n.mahjongs.children[m + p]).active = !0;
f.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", _);
}
for (m = 0; m < n._pengandgang.length; ++m) n._pengandgang[m].active = !1;
var C = 0, y = a.angangs;
for (m = 0; m < y.length; ++m) {
var b = y[m];
this.initPengAndGangs(n, C, b, "angang");
C++;
}
for (y = a.diangangs, m = 0; m < y.length; ++m) {
b = y[m];
this.initPengAndGangs(n, C, b, "diangang");
C++;
}
for (y = a.wangangs, m = 0; m < y.length; ++m) {
b = y[m];
this.initPengAndGangs(n, C, b, "wangang");
C++;
}
var N = a.pengs;
if (N) for (m = 0; m < N.length; ++m) {
b = N[m];
this.initPengAndGangs(n, C, b, "peng");
C++;
}
}
} else this._gameresult.active = !0;
},
onGameOver_XLCH: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], o = !1, c = [], s = n.hupai, l = 0; l < s.children.length; ++l) s.children[l].active = !1;
var r = 0;
for (l = 0; l < a.huinfo.length; ++l) {
var h = a.huinfo[l];
o = o || h.ishupai;
if (h.ishupai && r < s.children.length) {
var d = s.children[r];
d.active = !0;
d.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", h.pai);
r++;
}
var g = "", u = "", v = a;
if (h.ishupai) "hu" == h.action ? g = "接炮胡" : "zimo" == h.action ? g = "自摸" : "ganghua" == h.action ? g = "杠上花" : "dianganghua" == h.action ? g = "点杠花" : "gangpaohu" == h.action ? g = "杠炮胡" : "qiangganghu" == h.action ? g = "抢杠胡" : "chadajiao" == h.action && (g = "查大叫"); else {
g = "fangpao" == h.action ? "放炮" : "gangpao" == h.action ? "杠上炮" : "beiqianggang" == h.action ? "被抢杠" : "被查大叫";
h = (v = e[h.target]).huinfo[h.index];
}
g += "(";
if ("7pairs" == h.pattern) {
g += "七对";
u = "、";
} else if ("l7pairs" == h.pattern) {
g += "龙七对";
u = "、";
} else if ("j7pairs" == h.pattern) {
g += "将七对";
u = "、";
} else if ("duidui" == h.pattern) {
g += "碰碰胡";
u = "、";
} else if ("jiangdui" == h.pattern) {
g += "将对";
u = "、";
}
if (h.haidihu) {
g += u + "海底胡";
u = "、";
}
if (h.tianhu) {
g += u + "天胡";
u = "、";
}
if (h.dihu) {
g += u + "地胡";
u = "、";
}
if (v.qingyise) {
g += u + "清一色";
u = "、";
}
if (v.menqing) {
g += u + "门清";
u = "、";
}
if (v.jingouhu) {
g += u + "金钩胡";
u = "、";
}
if (v.zhongzhang) {
g += u + "中张";
u = "、";
}
if (h.numofgen > 0) {
g += u + "根x" + h.numofgen;
u = "、";
}
"" == u && (g += "平胡");
g += "、" + h.fan + "番";
g += ")";
c.push(g);
}
n.hu.active = o;
a.angangs.length && c.push("暗杠x" + a.angangs.length);
a.diangangs.length && c.push("明杠x" + a.diangangs.length);
a.wangangs.length && c.push("巴杠x" + a.wangangs.length);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = c.join("、");
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
for (var m = 0; m < n.mahjongs.childrenCount; ++m) (_ = n.mahjongs.children[m]).active = !1;
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
var p = a.angangs.length + a.wangangs.length + a.diangangs.length, f = 3 * (a.pengs.length + p);
for (m = 0; m < a.holds.length; ++m) {
var _, C = a.holds[m];
(_ = n.mahjongs.children[m + f]).active = !0;
_.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", C);
}
for (m = 0; m < n._pengandgang.length; ++m) n._pengandgang[m].active = !1;
var y = 0, b = a.angangs;
for (m = 0; m < b.length; ++m) {
var N = b[m];
this.initPengAndGangs(n, y, N, "angang");
y++;
}
for (b = a.diangangs, m = 0; m < b.length; ++m) {
N = b[m];
this.initPengAndGangs(n, y, N, "diangang");
y++;
}
for (b = a.wangangs, m = 0; m < b.length; ++m) {
N = b[m];
this.initPengAndGangs(n, y, N, "wangang");
y++;
}
var M = a.pengs;
if (M) for (m = 0; m < M.length; ++m) {
N = M[m];
this.initPengAndGangs(n, y, N, "peng");
y++;
}
}
} else this._gameresult.active = !0;
},
initPengAndGangs: function(e, t, i, n, a) {
var o = null;
if (e._pengandgang.length <= t) {
o = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(o);
e.mahjongs.addChild(o);
} else (o = e._pengandgang[t]).active = !0;
for (var c = o.getComponentsInChildren(cc.Sprite), s = 0, l = 0; l < c.length; ++l) {
var r = c[l];
if ("gang" == r.node.name) {
var h = "peng" != n;
r.node.active = h;
r.node.scaleX = 1;
r.node.scaleY = 1;
if ("angang" == n) {
r.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
r.node.scaleX = 1.4;
r.node.scaleY = 1.4;
} else r.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", i);
} else {
var d = "peng" == n && a && s < a.length ? a[s] : i;
r.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", d);
s++;
}
}
o.x = 165 * t + 10 * t;
},
initChisGroup: function(e, t, i) {
var n = null;
if (e._pengandgang.length <= t) {
n = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(n);
e.mahjongs.addChild(n);
} else (n = e._pengandgang[t]).active = !0;
for (var a = i.slice().sort(function(e, t) {
return e - t;
}), o = n.getComponentsInChildren(cc.Sprite), c = 0, s = 0; s < o.length; ++s) {
var l = o[s];
if ("gang" == l.node.name) l.node.active = !1; else {
var r = c < a.length ? a[c] : a[a.length - 1];
l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", r);
c++;
}
}
n.x = 165 * t + 10 * t;
},
onBtnReadyClicked: function() {
console.log("onBtnReadyClicked");
this._isGameEnd ? this._gameresult.active = !0 : cc.vv.net.send("ready");
this._gameover.active = !1;
},
onBtnShareClicked: function() {
console.log("onBtnShareClicked");
}
});
cc._RF.pop();
}, {} ],
GameOver: [ function(e, t) {
"use strict";
cc._RF.push(t, "ce353SCfT5DTo9QXPqOipBU", "GameOver");
cc.Class({
extends: cc.Component,
properties: {
_gameover: null,
_gameresult: null,
_seats: [],
_isGameEnd: !1,
_pingju: null,
_win: null,
_lose: null
},
onLoad: function() {
if (null != cc.vv && null != cc.vv.gameNetMgr.conf) {
"xzdd" == cc.vv.gameNetMgr.conf.type ? this._gameover = this.node.getChildByName("game_over") : this._gameover = this.node.getChildByName("game_over_xlch");
this._gameover.active = !1;
this._pingju = this._gameover.getChildByName("pingju");
this._win = this._gameover.getChildByName("win");
this._lose = this._gameover.getChildByName("lose");
this._gameover.x = 0;
this._gameover.setScale(.85);
for (var e = [ this._win, this._lose, this._pingju ], t = 0; t < e.length; ++t) {
var i = e[t];
i && (i.x = 0);
}
this._gameresult = this.node.getChildByName("game_result");
if (this._gameresult) {
this._gameresult.width = cc.winSize.width;
this._gameresult.x = 0;
var n = this._gameresult.getChildByName("Z_jiesuanditu");
if (n) {
n.width = cc.winSize.width;
n.x = 0;
}
var a = this._gameresult.getChildByName("GameEnd7");
if (a) {
a.width = cc.winSize.width;
a.x = 0;
var o = a.getComponent(cc.Sprite);
if (o && o.spriteFrame) {
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
o.type = cc.Sprite.Type.SLICED;
}
}
}
this._gameover.getChildByName("wanfa").getComponent(cc.Label).string = cc.vv.gameNetMgr.getWanfa();
for (var c = this._gameover.getChildByName("result_list"), s = 1; s <= 4; ++s) {
var l = "s" + s, r = c.getChildByName(l), h = {};
h.username = r.getChildByName("username").getComponent(cc.Label);
h.reason = r.getChildByName("reason").getComponent(cc.Label);
var d = r.getChildByName("fan");
null != d && (h.fan = d.getComponent(cc.Label));
h.score = r.getChildByName("score").getComponent(cc.Label);
h.hu = r.getChildByName("hu");
h.mahjongs = r.getChildByName("pai");
h.zhuang = r.getChildByName("zhuang");
h.hupai = r.getChildByName("hupai");
h._pengandgang = [];
this._seats.push(h);
}
var g = this;
this.node.on("game_over", function(e) {
g.onGameOver(e.detail);
});
this.node.on("game_end", function() {
g._isGameEnd = !0;
if (g._autoReadyCb) {
g.unschedule(g._autoReadyCb);
g._autoReadyCb = null;
}
g._gameresult && (g._gameresult.active = !0);
g._gameover && (g._gameover.active = !1);
});
}
},
onGameOver: function(e) {
var t = cc.vv.gameNetMgr.conf.type;
"zj" == t || "zj_bt" == t || "zj4" == t || "zj4_bt" == t || "zj_lao" == t || "zj_zx" == t || "zj4_zx" == t ? this.onGameOver_ZJ(e) : "xzdd" == t ? this.onGameOver_XZDD(e) : this.onGameOver_XLCH(e);
},
onGameOver_ZJ: function(e) {
var t = cc.vv.gameNetMgr.conf ? cc.vv.gameNetMgr.conf.type : null;
console.log(e);
if (e && 0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
for (var i = cc.vv.gameNetMgr.seatIndex, n = 0, a = 0; a < e.length; ++a) if (e[a] && e[a].userid == cc.vv.gameNetMgr.seats[i].userid) {
n = e[a].score;
break;
}
n > 0 ? this._win.active = !0 : n < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (a = 0; a < this._seats.length; ++a) {
var o = this._seats[a], c = e[a], s = o.username.node.parent;
if (c) {
s.active = !0;
for (var l = !1, r = [], h = o.hupai, d = 0; d < h.children.length; ++d) h.children[d].active = !1;
var g = 0, u = c.huinfo || [];
for (d = 0; d < u.length; ++d) {
var v = u[d];
l = l || v.ishupai;
if (v.ishupai) {
if (g < h.children.length) {
var m = h.children[g];
m.active = !0;
m.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v.pai);
g++;
}
"zimo" == v.action ? r.push("自摸") : "hu" == v.action && r.push("接炮胡");
if ("zj_lao" == t) {
if (v.tailog && v.tailog.length) {
for (var p = [], f = 0; f < v.tailog.length; ++f) v.tailog[f].indexOf("×2") >= 0 && p.push(v.tailog[f]);
p.length && r.push(p.join("，"));
}
} else if (null != v.fan) {
r.push(v.fan + "台");
v.tailog && v.tailog.length && r.push("(" + v.tailog.join("，") + ")");
}
} else "fangpao" == v.action && r.push("放炮");
}
if ("zj_bt" == t) {
if (c.isBao) {
var _ = "";
0 === c.baoModeOfRound ? _ = "无财" : 1 === c.baoModeOfRound ? _ = "独财" : 2 === c.baoModeOfRound && (_ = "双财");
var C = "包家" + _;
c.baoTaiOfRound && (C += "包" + c.baoTaiOfRound + "台");
r.unshift(C);
}
var y = c.huBaseScore || 0, b = c.baoTaiScore || 0;
0 != y && r.push("胡牌分" + (y > 0 ? "+" : "") + y);
0 != b && r.push("包台分" + (b > 0 ? "+" : "") + b);
}
o.hu.active = l;
var N = c.angangs || [], M = c.diangangs || [], S = c.wangangs || [], B = c.pengs || [], w = c.chis || [];
N.length && r.push("暗杠x" + N.length);
M.length && r.push("明杠x" + M.length);
S.length && r.push("补杠x" + S.length);
o.username.string = cc.vv.gameNetMgr.seats[a] ? cc.vv.gameNetMgr.seats[a].name : "";
o.zhuang.active = cc.vv.gameNetMgr.button == a;
var A = cc.vv.gameNetMgr.button == a && cc.vv.gameNetMgr.laozhuang || 0;
this.updateSettleLaoZhuang(o, A);
o.reason.string = r.join("、");
c.score > 0 ? o.score.string = "+" + c.score : o.score.string = "" + c.score;
for (var x = 0; x < o.mahjongs.childrenCount; ++x) o.mahjongs.children[x].active = !1;
var P = (c.holds || []).slice();
"object" == typeof P && null != P.length || (P = []);
cc.vv.mahjongmgr.sortMJ(P);
var I = N.length + S.length + M.length, L = 3 * (B.length + I + w.length);
for (x = 0; x < P.length; ++x) {
var j = P[x], T = o.mahjongs.children[x + L];
if (null == T) break;
T.active = !0;
T.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", j);
}
for (x = 0; x < o._pengandgang.length; ++x) o._pengandgang[x].active = !1;
var O = 0;
for (x = 0; x < N.length; ++x) {
this.initPengAndGangs(o, O, N[x], "angang");
O++;
}
for (x = 0; x < M.length; ++x) {
this.initPengAndGangs(o, O, M[x], "diangang");
O++;
}
for (x = 0; x < S.length; ++x) {
this.initPengAndGangs(o, O, S[x], "wangang");
O++;
}
for (x = 0; x < B.length; ++x) {
var R = c.pengTiles && c.pengTiles[x] || null;
this.initPengAndGangs(o, O, B[x], "peng", R);
O++;
}
for (x = 0; x < w.length; ++x) {
var F = w[x];
if (F && F.length > 0) {
this.initChisGroup(o, O, F);
O++;
}
}
} else s.active = !1;
}
this.showSettleCaishen();
this.startAutoReadyTimer();
} else this._gameresult.active = !0;
},
showSettleCaishen: function() {
var e = cc.vv.gameNetMgr.conf || {};
if ("zj_zx" != e.type && "zj4_zx" != e.type) {
var t = null != e.caishen ? e.caishen : -1, i = null != e.caishen2 ? e.caishen2 : -1;
if (!(t < 0)) {
var n = this._gameover.getChildByName("settleCsArea");
if (n) {
n.active = !0;
var a = i >= 0 && i != t ? [ t, i ] : [ t ], o = n.getChildByName("csLab");
o && (o.active = !0);
for (var c = 0; c < 2; ++c) {
var s = n.getChildByName("cs" + c);
if (s) {
var l = s.getComponent(cc.Sprite);
if (c < a.length) {
s.active = !0;
l && (l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", a[c]));
} else s.active = !1;
}
}
} else console.log("[结算财神] 场景内未找到 settleCsArea 节点,跳过显示(请在结算弹窗下手动添加)");
}
}
},
startAutoReadyTimer: function() {
if (this._autoReadyCb) {
this.unschedule(this._autoReadyCb);
this._autoReadyCb = null;
}
if (!this._isGameEnd) {
var e = this;
this._autoReadyCb = function() {
e._autoReadyCb = null;
if (e._gameover && e._gameover.active) {
console.log("[结算]30秒未操作,自动准备下一局");
e.onBtnReadyClicked();
}
};
this.scheduleOnce(this._autoReadyCb, 30);
}
},
updateSettleLaoZhuang: function(e, t) {
var i = e.zhuang;
if (i) {
var n = i.getChildByName("laozhuang_ex");
if (null == n) {
(n = new cc.Node("laozhuang_ex")).setContentSize(60, 22);
n.setPosition(0, -34);
i.addChild(n);
var a = n.addComponent(cc.Label);
a.fontSize = 18;
a.lineHeight = 22;
a.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.overflow = cc.Label.Overflow.NONE;
n.color = cc.color(255, 225, 120);
var o = n.addComponent(cc.LabelOutline);
o.color = cc.color(60, 30, 0);
o.width = 2;
}
var c = null != t && t >= 1;
n.active = c;
c && (n.getComponent(cc.Label).string = "老庄" + t);
}
},
onGameOver_XZDD: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], o = !1, c = a.angangs.length + a.wangangs.length + a.diangangs.length, s = a.numofgen, l = [], r = !1, h = 0; h < a.actions.length; ++h) {
var d = a.actions[h];
if ("zimo" == d.type || "ganghua" == d.type || "dianganghua" == d.type || "hu" == d.type || "gangpaohu" == d.type || "qiangganghu" == d.type || "chadajiao" == d.type) {
"7pairs" == a.pattern ? l.push("七对") : "l7pairs" == a.pattern ? l.push("龙七对") : "j7pairs" == a.pattern ? l.push("将七对") : "duidui" == a.pattern ? l.push("碰碰胡") : "jiangdui" == a.pattern && l.push("将对");
"zimo" == d.type ? l.push("自摸") : "ganghua" == d.type ? l.push("杠上花") : "dianganghua" == d.type ? l.push("点杠花") : "gangpaohu" == d.type ? l.push("杠炮胡") : "qiangganghu" == d.type ? l.push("抢杠胡") : "chadajiao" == d.type && (r = !0);
o = !0;
} else "fangpao" == d.type ? l.push("放炮") : "angang" == d.type ? l.push("暗杠") : "diangang" == d.type ? l.push("明杠") : "wangang" == d.type ? l.push("弯杠") : "fanggang" == d.type ? l.push("放杠") : "zhuanshougang" == d.type ? l.push("转手杠") : "beiqianggang" == d.type ? l.push("被抢杠") : "beichadajiao" == d.type && l.push("被查叫");
}
if (o) {
a.qingyise && l.push("清一色");
a.menqing && l.push("门清");
a.zhongzhang && l.push("中张");
a.jingouhu && l.push("金钩胡");
a.haidihu && l.push("海底胡");
a.tianhu && l.push("天胡");
a.dihu && l.push("地胡");
s > 0 && l.push("根x" + s);
r && l.push("查大叫");
}
for (var g = 0; g < 3; ++g) n.hu.children[g].active = !1;
a.huorder >= 0 && (n.hu.children[a.huorder].active = !0);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = l.join("、");
var u = 0;
o && (u = a.fan);
n.fan.string = u + "番";
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
var v = -1;
o && (v = a.holds.pop());
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
o && a.holds.push(v);
for (var m = 0; m < n.mahjongs.childrenCount; ++m) (f = n.mahjongs.children[m]).active = !1;
var p = 3 * (a.pengs.length + c);
for (m = 0; m < a.holds.length; ++m) {
var f, _ = a.holds[m];
(f = n.mahjongs.children[m + p]).active = !0;
f.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", _);
}
for (m = 0; m < n._pengandgang.length; ++m) n._pengandgang[m].active = !1;
var C = 0, y = a.angangs;
for (m = 0; m < y.length; ++m) {
var b = y[m];
this.initPengAndGangs(n, C, b, "angang");
C++;
}
for (y = a.diangangs, m = 0; m < y.length; ++m) {
b = y[m];
this.initPengAndGangs(n, C, b, "diangang");
C++;
}
for (y = a.wangangs, m = 0; m < y.length; ++m) {
b = y[m];
this.initPengAndGangs(n, C, b, "wangang");
C++;
}
var N = a.pengs;
if (N) for (m = 0; m < N.length; ++m) {
b = N[m];
this.initPengAndGangs(n, C, b, "peng");
C++;
}
}
} else this._gameresult.active = !0;
},
onGameOver_XLCH: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], o = !1, c = [], s = n.hupai, l = 0; l < s.children.length; ++l) s.children[l].active = !1;
var r = 0;
for (l = 0; l < a.huinfo.length; ++l) {
var h = a.huinfo[l];
o = o || h.ishupai;
if (h.ishupai && r < s.children.length) {
var d = s.children[r];
d.active = !0;
d.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", h.pai);
r++;
}
var g = "", u = "", v = a;
if (h.ishupai) "hu" == h.action ? g = "接炮胡" : "zimo" == h.action ? g = "自摸" : "ganghua" == h.action ? g = "杠上花" : "dianganghua" == h.action ? g = "点杠花" : "gangpaohu" == h.action ? g = "杠炮胡" : "qiangganghu" == h.action ? g = "抢杠胡" : "chadajiao" == h.action && (g = "查大叫"); else {
g = "fangpao" == h.action ? "放炮" : "gangpao" == h.action ? "杠上炮" : "beiqianggang" == h.action ? "被抢杠" : "被查大叫";
h = (v = e[h.target]).huinfo[h.index];
}
g += "(";
if ("7pairs" == h.pattern) {
g += "七对";
u = "、";
} else if ("l7pairs" == h.pattern) {
g += "龙七对";
u = "、";
} else if ("j7pairs" == h.pattern) {
g += "将七对";
u = "、";
} else if ("duidui" == h.pattern) {
g += "碰碰胡";
u = "、";
} else if ("jiangdui" == h.pattern) {
g += "将对";
u = "、";
}
if (h.haidihu) {
g += u + "海底胡";
u = "、";
}
if (h.tianhu) {
g += u + "天胡";
u = "、";
}
if (h.dihu) {
g += u + "地胡";
u = "、";
}
if (v.qingyise) {
g += u + "清一色";
u = "、";
}
if (v.menqing) {
g += u + "门清";
u = "、";
}
if (v.jingouhu) {
g += u + "金钩胡";
u = "、";
}
if (v.zhongzhang) {
g += u + "中张";
u = "、";
}
if (h.numofgen > 0) {
g += u + "根x" + h.numofgen;
u = "、";
}
"" == u && (g += "平胡");
g += "、" + h.fan + "番";
g += ")";
c.push(g);
}
n.hu.active = o;
a.angangs.length && c.push("暗杠x" + a.angangs.length);
a.diangangs.length && c.push("明杠x" + a.diangangs.length);
a.wangangs.length && c.push("巴杠x" + a.wangangs.length);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = c.join("、");
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
for (var m = 0; m < n.mahjongs.childrenCount; ++m) (_ = n.mahjongs.children[m]).active = !1;
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
var p = a.angangs.length + a.wangangs.length + a.diangangs.length, f = 3 * (a.pengs.length + p);
for (m = 0; m < a.holds.length; ++m) {
var _, C = a.holds[m];
(_ = n.mahjongs.children[m + f]).active = !0;
_.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", C);
}
for (m = 0; m < n._pengandgang.length; ++m) n._pengandgang[m].active = !1;
var y = 0, b = a.angangs;
for (m = 0; m < b.length; ++m) {
var N = b[m];
this.initPengAndGangs(n, y, N, "angang");
y++;
}
for (b = a.diangangs, m = 0; m < b.length; ++m) {
N = b[m];
this.initPengAndGangs(n, y, N, "diangang");
y++;
}
for (b = a.wangangs, m = 0; m < b.length; ++m) {
N = b[m];
this.initPengAndGangs(n, y, N, "wangang");
y++;
}
var M = a.pengs;
if (M) for (m = 0; m < M.length; ++m) {
N = M[m];
this.initPengAndGangs(n, y, N, "peng");
y++;
}
}
} else this._gameresult.active = !0;
},
initPengAndGangs: function(e, t, i, n, a) {
var o = null;
if (e._pengandgang.length <= t) {
o = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(o);
e.mahjongs.addChild(o);
} else (o = e._pengandgang[t]).active = !0;
for (var c = o.getComponentsInChildren(cc.Sprite), s = 0, l = 0; l < c.length; ++l) {
var r = c[l];
if ("gang" == r.node.name) {
var h = "peng" != n;
r.node.active = h;
r.node.scaleX = 1;
r.node.scaleY = 1;
if ("angang" == n) {
r.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
r.node.scaleX = 1.4;
r.node.scaleY = 1.4;
} else r.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", i);
} else {
var d = "peng" == n && a && s < a.length ? a[s] : i;
r.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", d);
s++;
}
}
o.x = 165 * t + 10 * t;
},
initChisGroup: function(e, t, i) {
var n = null;
if (e._pengandgang.length <= t) {
n = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(n);
e.mahjongs.addChild(n);
} else (n = e._pengandgang[t]).active = !0;
for (var a = i.slice().sort(function(e, t) {
return e - t;
}), o = n.getComponentsInChildren(cc.Sprite), c = 0, s = 0; s < o.length; ++s) {
var l = o[s];
if ("gang" == l.node.name) l.node.active = !1; else {
var r = c < a.length ? a[c] : a[a.length - 1];
l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", r);
c++;
}
}
n.x = 165 * t + 10 * t;
},
onBtnReadyClicked: function() {
console.log("onBtnReadyClicked");
if (this._autoReadyCb) {
this.unschedule(this._autoReadyCb);
this._autoReadyCb = null;
}
this._isGameEnd ? this._gameresult.active = !0 : cc.vv.net.send("ready");
this._gameover.active = !1;
},
onBtnShareClicked: function() {
console.log("onBtnShareClicked");
}
});
cc._RF.pop();
}, {} ],
GameResultZP: [ function(e, t) {
"use strict";
cc._RF.push(t, "e7d3b7cEttCGaQ6+TuP+x4X", "GameResultZP");
cc.Class({
extends: cc.Component,
properties: {
_gameresult: null
},
onLoad: function() {
if (null != cc.vv) {
this._gameresult = this.node.getChildByName("game_result");
if (this._gameresult) {
var e = this._gameresult.getChildByName("GameEnd7");
e && e.setContentSize(880, e.getContentSize().height);
}
var t = cc.find("Canvas/game_result/btnClose"), i = cc.find("Canvas/game_result/btnShare");
i && cc.vv.utils.addClickEvent(i, this.node, "GameResultZP", "onBtnCloseClicked");
t && (t.active = !1);
var n = this;
this.node.on("game_end", function(e) {
var t = e.detail || {};
n.onGameEnd(t.endinfo, t.roundHistory);
});
}
},
signedNum: function(e) {
return (e = e || 0) > 0 ? "+" + e : "" + e;
},
renderList: function(e, t) {
if (null != this._gameresult) {
var i = this._gameresult, n = i.getChildByName("title");
n && (n.active = !1);
var a = i.getChildByName("seats");
a && (a.active = !1);
var o = i.getChildByName("resultList");
o && o.destroy();
var c = cc.vv.gameNetMgr.seats;
if (c) {
for (var s = -1, l = 0; l < c.length; ++l) c[l] && "number" == typeof c[l].score && c[l].score > s && (s = c[l].score);
var r = new cc.Node("resultList");
i.addChild(r);
var h = 220, d = cc.vv.gameNetMgr.seatIndex;
for (l = 0; l < c.length; ++l) {
var g = c[l];
if (g) {
var u = "number" == typeof g.score ? g.score : 0, v = (u > 0 && u == s ? "【大赢家】" : "") + (l === d ? "[自家] " : "[对家] ") + (g.name || "玩家") + "(" + g.userid + ")";
if (e && null != e[l]) {
var m = e[l];
v += "   自摸" + this.signedNum(m.numzimo) + "  接炮" + this.signedNum(m.numjiepao) + "  点炮" + this.signedNum(m.numdianpao) + "  暗杠" + this.signedNum(m.numangang) + "  明杠" + this.signedNum(m.numminggang) + "  查叫" + this.signedNum(m.numchadajiao);
}
v += "   总成绩:" + this.signedNum(u);
h -= this.addListRow(r, v, 28, h, u > 0 ? cc.color(40, 120, 40) : u < 0 ? cc.color(170, 40, 40) : cc.color(90, 90, 90));
}
}
if (t && t.length > 0) for (var p = d >= 0 && c[d] ? c[d].userid : -1, f = 0; f < t.length; ++f) {
for (var _ = t[f], C = 0, y = 0, b = "", N = 0, M = !1, S = 0; S < _.scores.length; ++S) {
var B = _.scores[S];
B.userid == p ? C = B.score : y = B.score;
if (null != B.tai) {
b = B.userid == p ? "自家" : "对家";
N = B.tai;
M = !!B.zimo;
}
}
var w = "第" + _.index + "局   自家" + this.signedNum(C) + "  对家" + this.signedNum(y);
"" != b && (w += "   " + b + "胡" + N + "台" + (M ? "(自摸)" : ""));
h -= this.addListRow(r, w, 22, h, C > 0 ? cc.color(34, 120, 34) : C < 0 ? cc.color(180, 40, 40) : cc.color(120, 120, 120));
}
}
}
},
addListRow: function(e, t, i, n, a) {
var o = new cc.Node("row"), c = o.addComponent(cc.Label);
c.string = t;
c.fontSize = i;
c.lineHeight = i + 10;
c.overflow = cc.Label.Overflow.NONE;
c.enableWrapText = !1;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.color = a || cc.color(90, 90, 90);
o.setPosition(0, n);
e.addChild(o);
return i + 14;
},
showTotalScore: function() {
this.renderList(null, null);
},
onGameEnd: function(e, t) {
null == this._gameresult && (this._gameresult = this.node.getChildByName("game_result"));
this._gameresult && (this._gameresult.active = !0);
t && t.length > 0 ? this.renderList(null, t) : e ? this.renderList(e, null) : this.showTotalScore();
},
onBtnCloseClicked: function() {
cc.vv && cc.vv.net && cc.vv.net.send && cc.vv.net.send("leave_room");
if (cc.vv.fromClubId) {
cc.vv.fromClub = !0;
cc.director.loadScene("club");
} else cc.director.loadScene("hall");
},
onBtnShareClicked: function() {
cc.vv.anysdkMgr.shareResult();
}
});
cc._RF.pop();
}, {} ],
GameResult: [ function(e, t) {
"use strict";
cc._RF.push(t, "da25b1xg2NHlrS/zlwhbBFd", "GameResult");
cc.Class({
extends: cc.Component,
properties: {
_gameresult: null
},
onLoad: function() {
if (null != cc.vv) {
this._gameresult = this.node.getChildByName("game_result");
if (this._gameresult) {
var e = this._gameresult.getChildByName("GameEnd7");
e && e.setContentSize(880, e.getContentSize().height);
}
var t = cc.find("Canvas/game_result/btnClose"), i = cc.find("Canvas/game_result/btnShare");
i && cc.vv.utils.addClickEvent(i, this.node, "GameResult", "onBtnCloseClicked");
t && (t.active = !1);
var n = this;
this.node.on("game_end", function(e) {
var t = e.detail || {};
n.onGameEnd(t.endinfo, t.roundHistory);
});
}
},
signedNum: function(e) {
return (e = e || 0) > 0 ? "+" + e : "" + e;
},
renderList: function(e, t) {
if (null != this._gameresult) {
var i = this._gameresult, n = i.getChildByName("title");
n && (n.active = !1);
var a = i.getChildByName("seats");
a && (a.active = !1);
var o = i.getChildByName("resultList");
o && o.destroy();
var c = cc.vv.gameNetMgr.seats;
if (c) {
for (var s = -1, l = 0; l < c.length; ++l) c[l] && "number" == typeof c[l].score && c[l].score > s && (s = c[l].score);
var r = new cc.Node("resultList");
i.addChild(r);
var h = [], d = cc.vv.gameNetMgr.seatIndex;
for (l = 0; l < c.length; ++l) {
var g = c[l];
if (g) {
var u = "number" == typeof g.score ? g.score : 0, v = (u > 0 && u == s ? "【大赢家】" : "") + (l === d ? "[自家] " : "[对家] ") + (g.name || "玩家") + "(" + g.userid + ")";
if (e && null != e[l]) {
var m = e[l];
v += "   自摸" + this.signedNum(m.numzimo) + "  接炮" + this.signedNum(m.numjiepao) + "  点炮" + this.signedNum(m.numdianpao) + "  暗杠" + this.signedNum(m.numangang) + "  明杠" + this.signedNum(m.numminggang) + "  查叫" + this.signedNum(m.numchadajiao);
}
v += "   总成绩:" + this.signedNum(u);
h.push({
text: v,
fontSize: 28,
color: u > 0 ? cc.color(40, 120, 40) : u < 0 ? cc.color(170, 40, 40) : cc.color(90, 90, 90)
});
}
}
if (t && t.length > 0) for (var p = d >= 0 && c[d] ? c[d].userid : -1, f = 0; f < t.length; ++f) {
for (var _ = t[f], C = 0, y = 0, b = "", N = 0, M = !1, S = !1, B = 0; B < _.scores.length; ++B) {
var w = _.scores[B];
w.userid == p ? C = w.score : y = w.score;
if (null != w.tai) {
b = w.userid == p ? "自家" : "对家";
N = w.tai;
M = !!w.zimo;
S = !!w.laozhuang;
}
}
var A = "第" + _.index + "局   自家" + this.signedNum(C) + "  对家" + this.signedNum(y);
"" != b && (A += "   " + b + "胡" + N + "台" + (M ? "(自摸)" : "") + (S ? "(老庄)" : ""));
h.push({
text: A,
fontSize: 22,
color: C > 0 ? cc.color(34, 120, 34) : C < 0 ? cc.color(180, 40, 40) : cc.color(120, 120, 120)
});
}
var x = 0;
for (l = 0; l < h.length; ++l) x += h[l].fontSize + 14;
var P = x / 2;
for (l = 0; l < h.length; ++l) P -= this.addListRow(r, h[l].text, h[l].fontSize, P, h[l].color);
}
}
},
addListRow: function(e, t, i, n, a) {
var o = new cc.Node("row"), c = o.addComponent(cc.Label);
c.string = t;
c.fontSize = i;
c.lineHeight = i + 10;
c.overflow = cc.Label.Overflow.NONE;
c.enableWrapText = !1;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.color = a || cc.color(90, 90, 90);
o.setPosition(0, n);
e.addChild(o);
return i + 14;
},
showTotalScore: function() {
this.renderList(null, null);
},
onGameEnd: function(e, t) {
null == this._gameresult && (this._gameresult = this.node.getChildByName("game_result"));
this._gameresult && (this._gameresult.active = !0);
t && t.length > 0 ? this.renderList(null, t) : e ? this.renderList(e, null) : this.showTotalScore();
},
onBtnCloseClicked: function() {
cc.vv && cc.vv.net && cc.vv.net.send && cc.vv.net.send("leave_room");
if (cc.vv.fromClubId) {
cc.vv.fromClub = !0;
cc.director.loadScene("club");
} else cc.director.loadScene("hall");
},
onBtnShareClicked: function() {
cc.vv.anysdkMgr.shareResult();
}
});
cc._RF.pop();
}, {} ],
HallHelp: [ function(e, t) {
"use strict";
cc._RF.push(t, "5cfd1dSLRZEroI+ezO6k+TV", "HallHelp");
var i = {
zj_zx: "自选麻将",
guanpai2: "诸暨关牌"
};
function n(e) {
return null == e ? "" : i[e.type] || e.name || e.type;
}
var a = {
zj: "2人诸暨麻将,开局翻出财神,财神可当任意牌使用。\n· 财神可吃、碰、杠(由后台开关控制)。\n· 按台数计分,需达到后台设置的起胡台数才能胡,台数越多分越高,超过封顶按封顶台数算。\n· 天胡、地胡、漏胡等由后台开关与台数配置决定。\n· 杠上开花、抢杠等按后台台数配置计分。",
zj_bt: "2人玩法,开局先叫包:选择无财/独财/双财并报出包几台,叫台大的一方成为包家,由包家从手牌中定财神。\n· 包家胡牌必须达到自己所包的台数,闲家胡牌只需达到后台最低起胡台数。\n· 同台数时大小顺序:无财 > 独财 > 双财。\n· 结算分两项:胡牌分按台数每台翻倍,包台分按所包台数每台翻倍。\n· 老庄时包台分翻倍。\n· 包家不包则推给闲家,闲家也不包时由庄家按所包台数硬包。",
zj_lao: "2人推倒胡玩法,没有台数门槛,胡牌即算。\n· 不做台数结算,只有后台开启的翻倍项(财吊、天胡、地胡等)参与计分。\n· 吃、碰、杠、点炮等规则与诸暨麻将一致。",
zj_zx: "2人玩法,开局不发财神。\n· 胡牌时自选财神方案:无财、独财或双财(双财为相连的两张)。\n· 选定方案后从手牌中选出对应的财神牌,定财神后即满足胡牌条件。\n· 仍需达到后台设置的起胡台数才能胡。\n· 无财、独财方案计分翻倍(后台配置)。",
zj4_zx: "4人玩法,规则与2人自选麻将一致,开局不发财神,胡牌时自选财神方案。",
guanpai2: "2人扑克玩法,先出完手牌的一方获胜。\n· 牌型:单张、对子、三张、顺子、炸弹(由后台开关控制)。\n· 2 不参与顺子;后台开启后 A 可作最小牌与 2 相连。\n· 首局由持有最小黑桃的一方先出,之后由上一局赢家先出。\n· 记牌器(历史出牌辅助)由后台开关控制。",
guanpai3: "3人扑克玩法,先出完手牌的一方获胜,规则与2人关牌一致。"
};
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {},
open: function(e) {
this.initView(e);
this.loadList();
},
initView: function(e) {
this._help = e;
this._games = [];
this._cur = -1;
this._items = [];
var t = this._help;
if (null != t) {
this._title = t.getChildByName("xzdd_title");
this._body = t.getChildByName("xzdd_help");
cc.isValid(this._listRoot) || (this._listRoot = t.getChildByName("helpList"));
if (null == this._listRoot) {
this._listRoot = new cc.Node("helpList");
this._listRoot.parent = t;
}
var i = this;
null == this._atlas && cc.resources.load("images/atlas/hall_ui", cc.SpriteAtlas, function(e, t) {
i._atlas = e ? null : t;
i.refreshItems();
});
}
},
loadList: function() {
var e = this;
cc.vv.http.sendRequest("/game_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (null != t && 0 == t.errcode) {
e._games = t.games || [];
e.renderList();
} else cc.vv.wc && cc.vv.wc.showError("玩法列表获取失败");
});
},
renderList: function() {
if (null != this._listRoot) {
for (var e = this._listRoot.childrenCount - 1; e >= 0; --e) {
var t = this._listRoot.children[e];
t._helpAutoCreated && this._listRoot.removeChild(t, !0);
}
var i = this._listRoot.children.slice();
this._items = [];
for (var a = 0; a < this._games.length; ++a) {
var o = i[a];
if (null == o) {
o = this.makeFallbackItem(a);
cc.log("[help] 场景缺少列表项节点,已用代码兜底:请在 help/helpList 下添加 item" + a);
}
var c = o.getChildByName("Label");
if (null == c) {
(c = new cc.Node("Label")).parent = o;
c.addComponent(cc.Label);
}
var s = c.getComponent(cc.Label);
null == s && (s = c.addComponent(cc.Label));
s.string = n(this._games[a]);
if (o._helpAutoCreated) {
s.fontSize = 22;
s.lineHeight = 26;
c.color = cc.color(255, 255, 255);
}
null == o.getComponent(cc.Button) && o.addComponent(cc.Button);
o.idx = a;
if (!o._helpBound) {
o._helpBound = !0;
var l = this;
o.on(cc.Node.EventType.TOUCH_END, function(e) {
return function() {
l.select(e.idx);
};
}(o));
}
this._items.push(o);
}
this.refreshItems();
this.select(0);
}
},
makeFallbackItem: function(e) {
var t = new cc.Node("item" + e);
t.parent = this._listRoot;
t._helpAutoCreated = !0;
t.setContentSize(150, 50);
t.setPosition(-255, 130 - 58 * e);
t.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
return t;
},
refreshItems: function() {
if (null != this._atlas && null != this._items) {
var e = this._atlas.getSpriteFrame("按钮-button1.png") || this._atlas.getSpriteFrame("按钮-button1");
if (null != e) {
for (var t = 0; t < this._items.length; ++t) {
var i = this._items[t].getComponent(cc.Sprite);
i && null == i.spriteFrame && (i.spriteFrame = e);
}
this.highlight();
}
}
},
select: function(e) {
var t = this._games[e];
if (null != t) {
cc.log("[help] select " + e + " " + t.type);
this._cur = e;
this._title && (this._title.getComponent(cc.Label).string = n(t));
this._body && (this._body.getComponent(cc.Label).string = a[t.type] || "该玩法暂无说明。");
this.highlight();
}
},
highlight: function() {
for (var e = 0; e < this._items.length; ++e) this._items[e].color = e == this._cur ? cc.color(255, 255, 255) : cc.color(165, 165, 165);
}
});
cc._RF.pop();
}, {} ],
History: [ function(e, t) {
"use strict";
cc._RF.push(t, "c9827792rdPc7BCe2FXpBCv", "History");
var i = {
ldh: "赖倒胡",
zj_lao: "诸暨赖倒胡",
zj_bt: "包麻将",
zj_zx: "自选麻将",
zj4_zx: "自选麻将(四人)",
zj: "翻财神",
zp: "翻财神",
zp4: "翻财神(四人)",
wujin: "五经",
guanpai2: "关牌",
guanpai3: "关牌"
};
function n(e) {
return null == e || e < 0 ? null : e < 9 ? "dot_" + (e + 1) : e < 18 ? "bamboo_" + (e - 8) : e < 27 ? "character_" + (e - 17) : 27 == e ? "red" : 28 == e ? "green" : 29 == e ? "white" : 30 == e ? "wind_east" : 31 == e ? "wind_west" : 32 == e ? "wind_south" : 33 == e ? "wind_north" : null;
}
function a(e) {
var t = n(e);
return null == t ? "?" : 0 == t.indexOf("dot_") ? t.substr(4) + "筒" : 0 == t.indexOf("bamboo_") ? t.substr(7) + "条" : 0 == t.indexOf("character_") ? t.substr(10) + "万" : {
red: "中",
green: "发",
white: "白",
wind_east: "东",
wind_west: "西",
wind_south: "南",
wind_north: "北"
}[t] || "?";
}
function o(e, t) {
return null == e || null == t ? null : e.getSpriteFrame(t) || e.getSpriteFrame(t + ".png") || e.getSpriteFrame(t + ".jpg");
}
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
this.initNodes();
},
initNodes: function() {
if (!this._inited) {
this._inited = !0;
this._root = "history" == this.node.name ? this.node : this.node.getChildByName("history");
this._rooms = [];
this._curRoom = null;
this._rp = null;
this._atlas = null;
this._atlasTried = !1;
this._ready = !1;
if (null != this._root) {
this._emptyTip = this._root.getChildByName("emptyTip");
this._viewlist = this._root.getChildByName("viewlist");
this._content = cc.find("view/content", this._viewlist);
if (null != this._content && 0 != this._content.childrenCount) {
this._ready = !0;
this._temp = this._content.children[0];
this._content.removeChild(this._temp);
this.clearItemEvents(this._temp);
var e = this, t = this._root.getChildByName("btn_back");
t && t.on(cc.Node.EventType.TOUCH_END, function() {
if (e._rp) e.closeReplay(); else if (null != e._curRoom) {
e._curRoom = null;
e.showRooms();
} else e._root.active = !1;
});
}
}
}
},
open: function() {
this.initNodes();
cc.log("[zhanji] open ready=" + this._ready);
if (this._ready) {
this._curRoom = null;
this.showRooms();
var e = this;
cc.log("[zhanji] request list, account=" + cc.vv.userMgr.account);
cc.vv.http.sendRequest("/get_replay_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
cc.log("[zhanji] list ret=" + JSON.stringify(t && t.errcode) + " n=" + (t && t.list ? t.list.length : -1));
if (null != t && 0 == t.errcode) {
e._rooms = t.list || [];
e.showRooms();
} else cc.vv.wc && cc.vv.wc.showError("战绩查询失败");
});
}
},
clearItemEvents: function(e) {
for (var t = e.getChildByName("btnOp"), i = [ e.getComponent(cc.Button), t ? t.getComponent(cc.Button) : null ], n = 0; n < i.length; ++n) i[n] && (i[n].clickEvents = []);
},
dateFormat: function(e) {
var t = new Date(1e3 * e);
function i(e) {
return e >= 10 ? e : "0" + e;
}
return i(t.getMonth() + 1) + "-" + i(t.getDate()) + " " + i(t.getHours()) + ":" + i(t.getMinutes());
},
typeName: function(e) {
return i[e] || e || "对局";
},
clearList: function() {
for (;this._content.childrenCount > 0; ) {
var e = this._content.children[this._content.childrenCount - 1];
this._content.removeChild(e, !0);
}
},
getItem: function(e) {
var t = null;
if (this._content.childrenCount > e) t = this._content.children[e]; else {
t = cc.instantiate(this._temp);
this._content.addChild(t);
}
var i = this;
if (!t._rpBound) {
t._rpBound = !0;
t.on(cc.Node.EventType.TOUCH_END, function() {
i.onRowClicked(t);
});
}
var n = t.getChildByName("btnOp");
if (n && !n._rpBound) {
n._rpBound = !0;
n.on(cc.Node.EventType.TOUCH_END, function() {
i.onRowClicked(t);
});
}
return t;
},
onRowClicked: function(e) {
var t = Date.now();
if (!(e._rpClickTime && t - e._rpClickTime < 200)) {
e._rpClickTime = t;
cc.log("[zhanji] click row idx=" + e.idx);
this.onItemClicked(e.idx);
}
},
setItemText: function(e, t, i, n, a, o, c) {
e.idx = c;
e.getChildByName("title").getComponent(cc.Label).string = t;
e.getChildByName("roomNo").getComponent(cc.Label).string = i;
e.getChildByName("time").getComponent(cc.Label).string = n;
for (var s = 0; s < 4; ++s) {
var l = e.getChildByName("info" + s);
null != l && (l.getComponent(cc.Label).string = a[s] || "");
}
var r = e.getChildByName("btnOp");
r.idx = c;
r.getChildByName("Label").getComponent(cc.Label).string = o;
},
showRooms: function() {
this.clearList();
for (var e = this._rooms, t = 0; t < e.length; ++t) {
var i = e[t], n = this.getItem(t);
this.setItemText(n, "" + (t + 1), "房间:" + i.roomid, this.dateFormat(i.create_time), [ this.typeName(i.type), "共" + i.games.length + "局", "", "" ], "详情", t);
}
this._emptyTip.active = 0 == e.length;
this._curRoom = null;
},
showGames: function(e) {
this.clearList();
for (var t = e.games || [], i = 0; i < t.length; ++i) {
var n = t[i], a = this.getItem(i);
this.setItemText(a, "第" + n.index + "局", "房间:" + e.roomid, this.dateFormat(n.create_time), [ this.typeName(e.type), "", "", "" ], "回放", i);
}
this._emptyTip.active = 0 == t.length;
this._curRoom = e;
},
onItemClicked: function(e) {
if (null == this._curRoom) {
var t = this._rooms[e];
if (null == t) return;
this.showGames(t);
} else {
var i = this._curRoom.games[e];
if (null == i) return;
this.playReplay(this._curRoom, i.index);
}
},
playReplay: function(e, t) {
var i = this;
cc.vv.http.sendRequest("/get_replay", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
uuid: e.uuid,
index: t
}, function(e) {
null != e && 0 == e.errcode ? i.buildReplay(e.replay) : cc.vv.wc && cc.vv.wc.showError("录像不存在或已过期");
});
},
loadAtlas: function(e) {
if (this._atlasTried) e(this._atlas); else {
this._atlasTried = !0;
var t = this;
cc.resources.load("images/MJ/my/Z_my", cc.SpriteAtlas, function(i, n) {
t._atlas = i ? null : n;
e(t._atlas);
});
}
},
tileFrame: function(e) {
if (null == this._atlas) return null;
var t = n(e);
return null == t ? null : o(this._atlas, "M_" + t);
},
makeTile: function(e, t, i, n) {
var o = new cc.Node("tile");
o.parent = e;
o.setContentSize(i, n);
var c = o.addComponent(cc.Sprite);
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var s = this.tileFrame(t);
if (s) c.spriteFrame = s; else {
o.removeComponent(c);
var l = o.addComponent(cc.Label);
l.string = a(t);
l.fontSize = Math.round(.5 * n);
l.lineHeight = n;
o.color = cc.color(20, 20, 20);
}
return o;
},
buildReplay: function(e) {
this.closeReplay();
var t = cc.find("Canvas"), i = cc.view.getVisibleSize(), n = new cc.Node("replayView");
n.parent = t;
n.setContentSize(i.width, i.height);
var a = new cc.Node("table");
a.parent = n;
a.setContentSize(i.width, i.height);
var c = a.addComponent(cc.Sprite);
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._bgSpr = c;
var s = this;
cc.resources.load("images/atlas/table_bg", cc.SpriteAtlas, function(e, t) {
!e && t && (c.spriteFrame = o(t, "背景可随意拉伸铺满"));
});
var l = {
root: n,
data: e,
players: e.players || [],
hands: {},
melds: {},
folds: {},
lastDiscard: null,
hu: null,
wall: e.start && e.start.numofmj || 0,
idx: 0,
elapsed: 0,
playing: !0,
speed: 1,
winner: -1
};
this._rp = l;
for (var r = 0; r < l.players.length; ++r) {
var h = l.players[r], d = e.hands && e.hands[h.userid];
!d && e.finalHands && (d = e.finalHands[h.userid]);
l.hands[h.userid] = (d || []).slice();
l.melds[h.userid] = [];
l.folds[h.userid] = [];
}
this.buildSeats(l, i);
this.buildControls(l, i);
var g = new cc.Node("result");
g.parent = n;
g.setPosition(0, i.height / 2 - 34);
var u = g.addComponent(cc.Label);
u.string = "";
u.fontSize = 26;
u.lineHeight = 32;
g.color = cc.color(255, 226, 120);
l.resultLabel = u;
this.refresh(l);
this.loadAtlas(function() {
s.refresh(l);
});
},
seatPos: function(e, t, i) {
return e.players.length <= 2 ? 0 == t ? cc.v2(0, .3 * -i.height) : cc.v2(0, .28 * i.height) : 0 == t ? cc.v2(0, .3 * -i.height) : 1 == t ? cc.v2(.3 * i.width, .02 * -i.height) : 2 == t ? cc.v2(0, .28 * i.height) : cc.v2(.3 * -i.width, .02 * -i.height);
},
handPos: function(e, t, i) {
return e.players.length <= 2 ? 0 == t ? cc.v2(0, .225 * -i.height) : cc.v2(0, .18 * i.height) : 0 == t ? cc.v2(0, .2 * -i.height) : 1 == t ? cc.v2(.16 * i.width, .02 * -i.height) : 2 == t ? cc.v2(0, .15 * i.height) : cc.v2(.16 * -i.width, .02 * -i.height);
},
foldPos: function(e, t, i) {
return e.players.length <= 2 ? 0 == t ? cc.v2(0, .05 * -i.height) : cc.v2(0, .06 * i.height) : 0 == t ? cc.v2(0, .07 * -i.height) : 1 == t ? cc.v2(.1 * i.width, .02 * -i.height) : 2 == t ? cc.v2(0, .06 * i.height) : cc.v2(.1 * -i.width, .02 * -i.height);
},
buildSeats: function(e, t) {
e.seatNodes = [];
e.handNodes = [];
e.foldNodes = [];
for (var i = 0; i < e.players.length; ++i) {
var n = e.players[i], a = new cc.Node("seat" + i);
a.parent = e.root;
var o = this.seatPos(e, i, t);
a.setPosition(o.x, o.y);
var c = new cc.Node("head");
c.parent = a;
c.setContentSize(60, 60);
c.addComponent(cc.Mask).type = cc.Mask.Type.ELLIPSE;
var s = new cc.Node("face");
s.parent = c;
s.setContentSize(60, 60);
s.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
if (n.userid) {
var l = s.addComponent("ImageLoader");
l && l.setUserID(n.userid);
}
var r = new cc.Node("name");
r.parent = a;
var h = e.players.length <= 2 ? 1 == i : 2 == i;
r.setPosition(0, h ? 42 : -46);
var d = r.addComponent(cc.Label);
d.string = n.name || "玩家" + (n.userid || "");
d.fontSize = 22;
d.lineHeight = 26;
r.color = cc.color(255, 255, 255);
var g = new cc.Node("hand");
g.parent = e.root;
var u = this.handPos(e, i, t);
g.setPosition(u.x, u.y);
e.handNodes.push(g);
var v = new cc.Node("fold");
v.parent = e.root;
var m = this.foldPos(e, i, t);
v.setPosition(m.x, m.y);
e.foldNodes.push(v);
e.seatNodes.push(a);
}
},
buildControls: function(e, t) {
var i = new cc.Node("ctrl");
i.parent = e.root;
i.setPosition(0, -t.height / 2 + 42);
e.ctrlBar = i;
var n = this, a = this.makeBtn(i, "退出", -260, 0, function() {
n.closeReplay();
});
e.exitBtn = a;
e.playBtn = this.makeBtn(i, "暂停", -70, 0, function() {
e.playing = !e.playing;
e.playBtn.getChildByName("Label").getComponent(cc.Label).string = e.playing ? "暂停" : "播放";
});
e.speedBtn = this.makeBtn(i, "1倍速", 60, 0, function() {
e.speed = 1 == e.speed ? 2 : 2 == e.speed ? 4 : 1;
e.speedBtn.getChildByName("Label").getComponent(cc.Label).string = e.speed + "倍速";
});
var o = new cc.Node("progress");
o.parent = i;
o.setPosition(210, 0);
var c = o.addComponent(cc.Label);
c.string = "";
c.fontSize = 20;
c.lineHeight = 26;
o.color = cc.color(255, 255, 255);
e.progLabel = c;
var s = new cc.Node("wall");
s.parent = i;
s.setPosition(340, 0);
var l = s.addComponent(cc.Label);
l.string = "剩余" + e.wall + "张";
l.fontSize = 20;
l.lineHeight = 26;
s.color = cc.color(255, 255, 255);
e.wallLabel = l;
},
makeBtn: function(e, t, i, n, a) {
var c = new cc.Node("btn");
c.parent = e;
c.setPosition(i, n);
c.setContentSize(110, 46);
var s = c.addComponent(cc.Sprite);
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, t) {
!e && t && cc.isValid(c) && (s.spriteFrame = o(t, "按钮-蓝"));
});
var l = new cc.Node("Label");
l.parent = c;
var r = l.addComponent(cc.Label);
r.string = t;
r.fontSize = 20;
r.lineHeight = 26;
l.color = cc.color(255, 255, 255);
c.on(cc.Node.EventType.TOUCH_END, a);
return c;
},
closeReplay: function() {
var e = this._rp;
if (null != e) {
this._rp = null;
e.root && cc.isValid(e.root) && e.root.destroy();
}
},
applyEvent: function(e, t) {
var i = t.d || {}, n = e.players, a = function(e) {
var t = n[e];
return t ? t.userid : null;
};
switch (t.e) {
case "game_mopai_push":
var o = a(i.si);
null != o && (null != i.holds && "number" != typeof i.holds && i.holds.slice ? e.hands[o] = i.holds.slice() : null != i.pai && i.pai >= 0 && e.hands[o] && e.hands[o].push(i.pai));
null != i.numofmj && (e.wall = i.numofmj);
break;

case "game_chupai_push":
var c = a(i.si);
if (null != c && null != i.pai) {
e.folds[c] && e.folds[c].push(i.pai);
var s = e.hands[c];
if (s) {
var l = s.indexOf(i.pai);
l >= 0 && s.splice(l, 1);
}
e.lastDiscard = {
uid: c,
pai: i.pai
};
}
break;

case "game_chupai_notify_push":
var r = function(e) {
for (var t = 0; t < n.length; ++t) if (n[t].userid == e) return n[t];
return null;
}(i.userId);
null != r && null != i.holds && null != i.holds.length && "number" != typeof i.holds && (e.hands[r.userid] = i.holds.slice());
break;

case "game_peng_push":
case "game_gang_push":
var h = a(i.si);
if (null != h && null != i.holds && "number" != typeof i.holds) {
e.hands[h] = i.holds.slice();
e.melds[h].push({
t: "game_peng_push" == t.e ? "peng" : "gang",
pai: i.pai
});
this.takeDiscard(e, i.pai);
}
break;

case "game_chi_push":
var d = a(i.si);
if (null != d && null != i.holds && "number" != typeof i.holds) {
e.hands[d] = i.holds.slice();
e.melds[d].push({
t: "chi",
pais: i.pais || []
});
for (var g = 0; g < (i.pais || []).length && !this.takeDiscard(e, i.pais[g]); ++g) ;
}
break;

case "game_hu_push":
e.winner = null != i.si ? i.si : -1;
e.hu = {
si: e.winner,
tai: i.tai || 0,
zimo: !!i.zimo
};
var u = a(e.winner);
if (null != u && !i.zimo && e.lastDiscard && e.lastDiscard.pai == i.pai) {
this.takeDiscard(e, i.pai);
e.hands[u] && e.hands[u].push(i.pai);
}
break;

case "game_over_push":
this.syncFinal(e, i.results || []);
e.playing = !1;
e.playBtn && (e.playBtn.getChildByName("Label").getComponent(cc.Label).string = "播放");
}
},
takeDiscard: function(e, t) {
if (null == e.lastDiscard || e.lastDiscard.pai != t) return !1;
var i = e.folds[e.lastDiscard.uid];
if (i) {
var n = i.lastIndexOf(t);
n >= 0 && i.splice(n, 1);
}
e.lastDiscard = null;
return !0;
},
syncFinal: function(e, t) {
for (var i = 0; i < t.length; ++i) {
var n = t[i], a = n.userid;
if (null != e.hands[a]) {
n.holds && (e.hands[a] = n.holds.slice());
n.folds && (e.folds[a] = n.folds.slice());
for (var o = [], c = n.chis || [], s = 0; s < c.length; ++s) o.push({
t: "chi",
pais: c[s]
});
for (var l = n.pengs || [], r = 0; r < l.length; ++r) o.push({
t: "peng",
pai: l[r]
});
for (var h = (n.angangs || []).concat(n.diangangs || []).concat(n.wangangs || []), d = 0; d < h.length; ++d) o.push({
t: "gang",
pai: h[d]
});
e.melds[a] = o;
var g = n.huinfo && n.huinfo[0];
if (g && g.ishupai && null == e.hu) {
e.hu = {
si: i,
tai: g.fan || 0,
zimo: "zimo" == g.action
};
e.winner = i;
}
}
}
},
refresh: function(e) {
if (null != e && cc.isValid(e.root)) {
for (var t = 0; t < e.players.length; ++t) {
var i = e.players[t].userid, n = e.handNodes[t];
n.removeAllChildren();
for (var a = (e.hands[i] || []).slice().sort(function(e, t) {
return e - t;
}), o = [], c = 0; c < a.length; ++c) o.push(a[c]);
for (var s = e.melds[i] || [], l = 0; l < s.length; ++l) {
var r = s[l], h = "chi" == r.t ? r.pais || [] : [ r.pai, r.pai, r.pai, r.pai ].slice(0, "peng" == r.t ? 3 : 4);
o.push(null);
for (var d = 0; d < h.length; ++d) o.push(h[d]);
}
for (var g = 0, u = 0; u < o.length; ++u) g += null == o[u] ? 22 : 52;
for (var v = -g / 2 + 25, m = 0; m < o.length; ++m) if (null != o[m]) {
this.makeTile(n, o[m], 50, 68).setPosition(v, 0);
v += 52;
} else v += 22;
var p = e.foldNodes[t];
p.removeAllChildren();
for (var f = e.folds[i] || [], _ = 0; _ < f.length; ++_) {
var C = Math.floor(_ / 8), y = _ % 8;
this.makeTile(p, f[_], 36, 48).setPosition(40 * y - 140, 52 * -C);
}
}
e.wallLabel && (e.wallLabel.string = "剩余" + e.wall + "张");
if (e.progLabel) {
var b = e.data.events ? e.data.events.length : 0;
e.progLabel.string = (e.idx > b ? b : e.idx) + "/" + b;
}
for (var N = 0; N < e.seatNodes.length; ++N) {
var M = e.seatNodes[N].getChildByName("name");
M && (M.color = N == e.winner ? cc.color(255, 210, 0) : cc.color(255, 255, 255));
}
if (e.resultLabel) {
var S = "";
if (e.hu && e.hu.si >= 0) {
var B = e.players[e.hu.si];
S = (B ? B.name || "玩家" + B.userid : "") + (e.hu.zimo ? " 自摸" : " 胡牌") + " " + e.hu.tai + "台";
}
e.resultLabel.string = S;
}
}
},
update: function(e) {
var t = this._rp;
if (null != t && t.playing && cc.isValid(t.root)) {
t.elapsed += 1e3 * e * t.speed;
for (var i = t.data.events || [], n = !1; t.idx < i.length && i[t.idx].t <= t.elapsed; ) {
this.applyEvent(t, i[t.idx]);
t.idx++;
n = !0;
}
n && this.refresh(t);
if (t.idx >= i.length && i.length > 0) {
t.playing = !1;
t.playBtn && (t.playBtn.getChildByName("Label").getComponent(cc.Label).string = "播放");
}
}
}
});
cc._RF.pop();
}, {} ],
HuanSanZhang: [ function(e, t) {
"use strict";
cc._RF.push(t, "361a9leeXxIEpx5zDk7amE+", "HuanSanZhang");
cc.Class({
extends: cc.Component,
properties: {
_huanpaitip: null,
_huanpaiArr: []
},
onLoad: function() {
this._huanpaitip = cc.find("Canvas/huansanzhang");
this._huanpaitip.active = cc.vv.gameNetMgr.isHuanSanZhang;
this._huanpaitip.active && this.showHuanpai(null == cc.vv.gameNetMgr.getSelfData().huanpais);
this.initHuaipaiInfo();
var e = cc.find("Canvas/huansanzhang/btn_ok");
e && cc.vv.utils.addClickEvent(e, this.node, "HuanSanZhang", "onHuanSanZhang");
var t = this;
this.node.on("game_huanpai", function() {
t._huanpaitip.active = !0;
t.showHuanpai(!0);
});
this.node.on("huanpai_notify", function(e) {
e.detail.seatindex == cc.vv.gameNetMgr.seatIndex && t.initHuaipaiInfo();
});
this.node.on("game_huanpai_over", function() {
t._huanpaitip.active = !1;
for (var e = 0; e < t._huanpaiArr.length; ++e) t._huanpaiArr[e].y = 0;
t._huanpaiArr = [];
t.initHuaipaiInfo();
});
this.node.on("game_huanpai_result", function() {
cc.vv.gameNetMgr.isHuanSanZhang = !1;
t._huanpaitip.active = !1;
for (var e = 0; e < t._huanpaiArr.length; ++e) t._huanpaiArr[e].y = 0;
t._huanpaiArr = [];
});
this.node.on("mj_clicked", function(e) {
var i = e.detail, n = t._huanpaiArr.indexOf(i);
if (-1 != n) {
i.y = 0;
t._huanpaiArr.splice(n, 1);
} else if (t._huanpaiArr.length < 3) {
t._huanpaiArr.push(i);
i.y = 15;
}
});
},
showHuanpai: function(e) {
this._huanpaitip.getChildByName("info").getComponent(cc.Label).string = "请选择三张一样花色的牌";
this._huanpaitip.getChildByName("btn_ok").getComponent(cc.Button).interactable = e;
this._huanpaitip.getChildByName("mask").active = !1;
},
initHuaipaiInfo: function() {
var e = cc.find("Canvas/game/huanpaiinfo"), t = cc.vv.gameNetMgr.getSelfData();
if (t && null != t.huanpais) {
e.active = !0;
for (var i = 0; i < t.huanpais.length; ++i) e.getChildByName("hp" + (i + 1)).getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t.huanpais[i]);
var n = e.getChildByName("hpm");
n.active = !0;
0 == cc.vv.gameNetMgr.huanpaimethod ? n.angle = -90 : 1 == cc.vv.gameNetMgr.huanpaimethod ? n.angle = 0 : 2 == cc.vv.gameNetMgr.huanpaimethod ? n.angle = -180 : n.active = !1;
} else e.active = !1;
},
onHuanSanZhang: function() {
if (3 == this._huanpaiArr.length) {
for (var e = null, t = 0; t < this._huanpaiArr.length; ++t) {
var i = this._huanpaiArr[t].mjId, n = cc.vv.mahjongmgr.getMahjongType(i);
if (null == e) e = n; else if (e != n) return;
}
var a = {
p1: this._huanpaiArr[0].mjId,
p2: this._huanpaiArr[1].mjId,
p3: this._huanpaiArr[2].mjId
};
this._huanpaitip.getChildByName("info").getComponent(cc.Label).string = "等待其他玩家选牌...";
this._huanpaitip.getChildByName("btn_ok").getComponent(cc.Button).interactable = !1;
this._huanpaitip.getChildByName("mask").active = !0;
cc.vv.net.send("huanpai", a);
}
}
});
cc._RF.pop();
}, {} ],
ImageLoader: [ function(e, t) {
"use strict";
cc._RF.push(t, "f253a+5EyVAOo5k1xv6A8v7", "ImageLoader");
function i(e, t, i) {
cc.assetManager.loadRemote(e, function(e, n) {
var a = new cc.SpriteFrame(n, cc.Rect(0, 0, n.width, n.height));
i(t, a);
});
}
function n(e, t) {
null == cc.vv.baseInfoMap && (cc.vv.baseInfoMap = {});
null != cc.vv.baseInfoMap[e] ? t(e, cc.vv.baseInfoMap[e]) : cc.vv.http.sendRequest("/base_info", {
userid: e
}, function(i) {
var n = null;
i.headimgurl && (n = i.headimgurl + ".jpg");
var a = {
name: i.name,
sex: i.sex,
url: n
};
cc.vv.baseInfoMap[e] = a;
t(e, a);
}, cc.vv.http.master_url);
}
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
this.setupSpriteFrame();
},
setUserID: function(e) {
if (e) {
null == cc.vv.images && (cc.vv.images = {});
var t = this;
n(e, function(n, a) {
a && a.url && i(a.url, e, function(e, i) {
t._spriteFrame = i;
t.setupSpriteFrame();
});
});
}
},
setupSpriteFrame: function() {
if (this._spriteFrame) {
var e = this.node.getComponent(cc.Sprite);
e && (e.spriteFrame = this._spriteFrame);
}
}
});
cc._RF.pop();
}, {} ],
JoinGameInput: [ function(e, t) {
"use strict";
cc._RF.push(t, "aebb2CDLFlBaLyTjW6mPofN", "JoinGameInput");
cc.Class({
extends: cc.Component,
properties: {
nums: {
default: [],
type: [ cc.Label ]
},
_inputIndex: 0
},
onLoad: function() {},
onEnable: function() {
this.onResetClicked();
},
onInputFinished: function(e) {
cc.vv.userMgr.enterRoom(e, function(t) {
if (0 == t.errcode) this.node.active = !1; else {
var i = "房间[" + e + "]不存在，请重新输入!";
4 == t.errcode ? i = "房间[" + e + "]已满!" : 2222 == t.errcode && (i = "房卡不足，无法进入房间");
cc.vv.wc.showError(i);
this.onResetClicked();
}
}.bind(this));
},
onInput: function(e) {
if (!(this._inputIndex >= this.nums.length)) {
this.nums[this._inputIndex].string = e;
this._inputIndex += 1;
if (this._inputIndex == this.nums.length) {
var t = this.parseRoomID();
console.log("ok:" + t);
this.onInputFinished(t);
}
}
},
onN0Clicked: function() {
this.onInput(0);
},
onN1Clicked: function() {
this.onInput(1);
},
onN2Clicked: function() {
this.onInput(2);
},
onN3Clicked: function() {
this.onInput(3);
},
onN4Clicked: function() {
this.onInput(4);
},
onN5Clicked: function() {
this.onInput(5);
},
onN6Clicked: function() {
this.onInput(6);
},
onN7Clicked: function() {
this.onInput(7);
},
onN8Clicked: function() {
this.onInput(8);
},
onN9Clicked: function() {
this.onInput(9);
},
onResetClicked: function() {
for (var e = 0; e < this.nums.length; ++e) this.nums[e].string = "";
this._inputIndex = 0;
},
onDelClicked: function() {
if (this._inputIndex > 0) {
this._inputIndex -= 1;
this.nums[this._inputIndex].string = "";
}
},
onCloseClicked: function() {
this.node.active = !1;
},
parseRoomID: function() {
for (var e = "", t = 0; t < this.nums.length; ++t) e += this.nums[t].string;
return e;
}
});
cc._RF.pop();
}, {} ],
Lodinglogin: [ function(e, t) {
"use strict";
cc._RF.push(t, "21586CBnz5KWat4e0A5CLFA", "Lodinglogin");
cc.loader && !cc.loader.loadResAll && cc.resources && (cc.loader.loadResAll = cc.resources.loadDir.bind(cc.resources));
cc.Class({
extends: cc.Component,
properties: {
_splash: null,
tipLabel: cc.Label,
_stateStr: "",
_progress: 0,
_targetProgress: 0,
_isLoading: !1
},
onLoad: function() {
console.log("[Lodinglogin] onLoad enter");
if (!cc.sys.isNative) {
var e = this.node.getComponent(cc.Canvas);
e.fitHeight = !0;
e.fitWidth = !1;
var t = this.node.getChildByName("bg");
if (t) {
var i = function() {
if (cc.isValid(t)) {
var e = t.getComponent(cc.Widget);
e && (e.enabled = !1);
var i = cc.view.getVisibleSize(), n = cc.view.getVisibleOrigin();
t.setContentSize(i.width, i.height);
t.setPosition(t.parent.convertToNodeSpaceAR(cc.v2(n.x + i.width / 2, n.y + i.height / 2)));
}
};
i();
this.scheduleOnce(i, 0);
cc.view.setResizeCallback(i);
}
}
this.initMgr();
this.tipLabel.string = this._stateStr;
this._splash = cc.find("Canvas/splash");
this._splash && (this._splash.active = !1);
},
start: function() {
console.log("[Lodinglogin] start enter");
this.checkVersion();
},
initMgr: function() {
cc.vv = {};
var t = e("UserMgr");
cc.vv.userMgr = new t();
var i = e("ReplayMgr");
cc.vv.replayMgr = new i();
cc.vv.http = e("HTTP");
cc.vv.global = e("Global");
cc.vv.net = e("Net");
var n = e("GameNetMgr");
cc.vv.gameNetMgr = new n();
cc.vv.gameNetMgr.initHandlers();
var a = e("AnysdkMgr");
cc.vv.anysdkMgr = new a();
cc.vv.anysdkMgr.init();
var o = e("VoiceMgr");
cc.vv.voiceMgr = new o();
cc.vv.voiceMgr.init();
var c = e("AudioMgr");
cc.vv.audioMgr = new c();
cc.vv.audioMgr.init();
var s = e("Utils");
cc.vv.utils = new s();
cc.args = this.urlParse();
},
urlParse: function() {
var e, t, i = {};
if (null == window.location) return i;
for (var n = window.location.href, a = n.indexOf("?"), o = (n = n.substr(a + 1)).split("&"), c = 0; c < o.length; c++) if ((a = o[c].indexOf("=")) > 0) {
e = o[c].substring(0, a);
t = o[c].substr(a + 1);
i[e] = t;
}
return i;
},
checkVersion: function() {
var e = this, t = function(t) {
if (null == t.version) console.log("error."); else {
cc.vv.SI = t;
t.version != cc.VERSION || e.startPreloading();
}
}, i = null, n = !1, a = function() {
e._stateStr = "正在连接服务器";
i = cc.vv.http.sendRequest("/get_serverinfo", null, function(e) {
i = null;
n = !0;
t(e);
});
setTimeout(o, 5e3);
}, o = function() {
if (!n) if (i) {
i.abort();
e._stateStr = "连接失败，即将重试";
setTimeout(function() {
a();
}, 5e3);
} else a();
};
o();
},
startPreloading: function() {
this._stateStr = "正在加载资源，请稍候";
this._isLoading = !0;
var e = this;
cc.loader.onProgress = function(t, i) {
if (e._isLoading) {
var n = t / i;
n > e._targetProgress && (e._targetProgress = n);
}
};
cc.loader.loadResAll("textures", function() {
e.onLoadComplete();
});
},
onLoadComplete: function() {
this._isLoading = !1;
this._progress = 1;
this._stateStr = "准备登陆";
cc.director.loadScene("login");
cc.loader.onComplete = null;
},
update: function(e) {
if (0 != this._stateStr.length) {
this.tipLabel.string = this._stateStr + " ";
if (this._isLoading) {
this._progress < this._targetProgress && (this._progress = Math.min(this._targetProgress, this._progress + .5 * e));
this.tipLabel.string += Math.floor(100 * this._progress) + "%";
} else for (var t = Math.floor(Date.now() / 1e3) % 4, i = 0; i < t; ++i) this.tipLabel.string += ".";
}
}
});
cc._RF.pop();
}, {
AnysdkMgr: void 0,
AudioMgr: void 0,
GameNetMgr: void 0,
Global: void 0,
HTTP: void 0,
Net: void 0,
ReplayMgr: void 0,
UserMgr: void 0,
Utils: void 0,
VoiceMgr: void 0
} ],
MJGameBMJ: [ function(e, t) {
"use strict";
cc._RF.push(t, "9a5abcvOl5OMp+8EZeUZUGh", "MJGameBMJ");
cc.Class({
extends: cc.Component,
properties: {
gameRoot: {
default: null,
type: cc.Node
},
prepareRoot: {
default: null,
type: cc.Node
},
_myMJArr: [],
_options: null,
_selectedMJ: null,
_chupaiSprite: [],
_mjcount: null,
_gamecount: null,
_hupaiTips: [],
_hupaiLists: [],
_playEfxs: [],
_opts: [],
_chiPanel: null,
_chiSelect: null,
_chiHint: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0
},
onLoad: function() {
var e = this.node.getComponent(cc.Canvas);
if (null != e) {
if (!cc.sys.isNative) {
e.fitHeight = !0;
e.fitWidth = !1;
for (var t = cc.director.getScene().getComponentsInChildren(cc.Camera), i = 0; i < t.length; i++) {
t[i].clearFlags = cc.Camera.ClearFlags.COLOR;
t[i].backgroundColor = cc.color(30, 18, 12);
}
}
if (cc.vv) {
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
}
},
initView: function() {
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var t = this._mjcount.node, i = this._gamecount.node;
this.scheduleOnce(function() {
cc.isValid(t) && cc.isValid(i) && t.setPosition(i.x - i.width / 2 - t.width / 2 - 12, i.y);
}, 0);
for (var n = e.getChildByName("myself").getChildByName("holds"), a = 0; a < n.children.length; ++a) {
var o = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(o);
o.spriteFrame = null;
}
var c = cc.view.getVisibleSize().width / 1280;
if (c < 1) {
n.scaleX *= c;
n.scaleY *= c;
}
var s = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < s; ++a) {
var l = cc.vv.mahjongmgr.getSide(a), r = e.getChildByName(l);
if (null != r) {
this._hupaiTips.push(r.getChildByName("HuPai"));
this._hupaiLists.push(r.getChildByName("hupailist"));
this._playEfxs.push(r.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(r.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = r.getChildByName("opt");
h.active = !1;
o = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: o
};
this._opts.push(d);
}
}
var g = e.getChildByName("ops");
this._options = g;
var u = g ? g.getChildByName("New Layout") : null;
if (u) {
var v = u.getComponent(cc.Button);
v && (v.enabled = !1);
u.active = !1;
}
this._baoPanel = g ? g.getChildByName("baoPanel") : null;
if (this._baoPanel) {
this._baoPanel.active = !1;
this._baoMode = 2;
this._baoTai = 2;
for (var m = [ {
name: "btnNoCai",
mode: 0
}, {
name: "btnDuCai",
mode: 1
}, {
name: "btnShuangCai",
mode: 2
} ], p = 0; p < m.length; ++p) this._bindBaoButton(this._baoPanel.getChildByName(m[p].name), m[p].mode, "onBaoModeClicked");
for (var f = 2; f <= 7; ++f) this._bindBaoButton(this._baoPanel.getChildByName("btnTai" + f), f, "onBaoTaiClicked");
this._bindBaoButton(this._baoPanel.getChildByName("btnNoBao"), 0, "onBaoNoBaoClicked");
}
this._csPanel = g ? g.getChildByName("csPanel") : null;
if (this._csPanel) {
this._csPanel.active = !1;
var _ = this._csPanel.getChildByName("btnSetCaishen");
_ && cc.vv.utils.addClickEvent(_, this.node, "MJGameBMJ", "onSetCaishenClicked");
}
this.hideOptions();
this.hideChupai();
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
initEventHandlers: function() {
cc.vv.gameNetMgr.dataEventHandler = this.node;
var e = cc.vv.gameNetMgr;
if ("begin" == e.gamestate && e.seats) {
for (var t = !1, i = 0; i < e.seats.length; ++i) {
var n = e.seats[i];
if (n && n.holds instanceof Array && n.holds.length > 0) {
t = !0;
break;
}
}
if (t) {
var a = this.node;
this.scheduleOnce(function() {
if (cc.isValid(a)) {
a.emit("game_num", {
detail: e.numOfGames
});
a.emit("mj_count", {
detail: null
});
a.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
a.emit("game_action", {
detail: t
});
}
}
}, 0);
}
}
var o = this.node;
this.scheduleOnce(function() {
if (cc.isValid(o)) {
e.waitBaoData && o.emit("bao_select", {
detail: e.waitBaoData
});
null != e.waitCaishenMode && o.emit("caishen_select", {
detail: {
mode: e.waitCaishenMode
}
});
}
}, 0);
var c = this;
this.node.on("game_start", function(e) {
var t = e && e.detail, i = cc.vv.gameNetMgr.conf, n = i && null != i.caishen ? parseInt(i.caishen) : -1, a = i && null != i.caishen2 ? parseInt(i.caishen2) : null, o = i && null != i.baoMode ? parseInt(i.baoMode) : -1, s = c.node.getChildByName("game"), l = s ? s.getChildByName("caishenTip") : null;
if (n < 0) {
c._curBaoMode = null;
c._caishen = null;
c._caishen2 = null;
c._csRetryCount = 0;
c._csRetryScheduled = !1;
c._clearBaoFlag();
if (l) {
var r = l.getChildByName("baoTaiLabel");
r && (r.active = !1);
0 !== o && (l.active = !1);
}
} else {
c._curBaoMode = o >= 0 ? o : null;
c._caishen = n;
c._caishen2 = a;
c._csRetryCount = 0;
c.scheduleOnce(function() {
if (cc.isValid(c.node)) {
c._showBaoInfo(t || {
baoTai: i ? i.baoTai : null,
baoMode: o,
baoSeatIndex: i ? i.baoSeatIndex : null
});
c.initCaishenTip();
}
}, 0);
}
c.onGameBeign(!0, t);
c.initCaishenTip();
});
this.node.on("game_begin", function() {
c.onGameBeign();
});
this.node.on("bao_select", function(e) {
c.onBaoSelect(e && e.detail);
});
this.node.on("bao_result", function(e) {
c.onBaoResult(e && e.detail);
});
this.node.on("caishen_select", function(e) {
c.onCaishenSelect(e && e.detail);
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
c.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && c.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || c.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? c.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && c.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
c.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = c._hupaiTips[i];
n.active = !0;
0 == i && c.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
c.initMopai(t, e.pai);
e.zimo ? c.playEfx(i, "play_zimo") : c.playEfx(i, "play_hu");
cc.vv.audioMgr.playSFX("nv/hu.mp3");
});
this.node.on("mj_count", function() {
c._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
c._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
c.gameRoot.active = !1;
c.prepareRoot.active = !0;
c.hideChiPanel();
});
this.node.on("game_chupai_notify", function(e) {
c.hideChupai();
c.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? c.initMahjongs() : c.initOtherMahjongs(i);
c.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
c.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? c.initMahjongs(!1, t) : c.initOtherMahjongs(t);
var n = c.getLocalIndex(t.seatindex);
c.playEfx(n, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
c.hideOptions();
});
this.node.on("gang_notify", function(e) {
c.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? c.initMahjongs(!1, t) : c.initOtherMahjongs(t);
var n = c.getLocalIndex(t.seatindex);
if ("wangang" == i) {
c.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
c.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
c.hideOptions();
});
this.node.on("chi_notify", function(e) {
c.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? c.initMahjongs(!1, t) : c.initOtherMahjongs(t);
var i = c.getLocalIndex(t.seatindex);
c.playEfx(i, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
c.hideOptions();
});
},
showChupai: function() {
var e = cc.vv.gameNetMgr.chupai;
if (e >= 0) {
var t = this.getLocalIndex(cc.vv.gameNetMgr.turn), i = this._chupaiSprite[t];
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
i.node.active = !0;
}
},
addOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var n = this._options.children[i];
if ("op" == n.name && 0 == n.active) {
n.active = !0;
n.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
var a = n.getChildByName(e);
a.active = !0;
a.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
i.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
var n = this.getChiButton(i);
if (n) {
n.active = !0;
n.pai = e;
}
return;
}
}
},
getChiButton: function(e) {
var t = e.getChildByName("btnChi");
if (t) {
if (!t._chiBound) {
t._chiBound = !0;
cc.vv.utils.addClickEvent(t, this.node, "MJGameBMJ", "onOptionClicked");
}
return t;
}
var i = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (i) {
t.setPosition(i.getPosition());
t.setContentSize(i.getContentSize());
t.scaleX = i.scaleX;
t.scaleY = i.scaleY;
}
var n = t.addComponent(cc.Sprite);
n.type = cc.Sprite.Type.SIMPLE;
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, i) {
if (!e && i && cc.isValid(t)) {
var n = t.getComponent(cc.Sprite);
n && (n.spriteFrame = i);
}
});
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, i) {
var n = i ? i.getSpriteFrame("mj_btn_chi.png") : null;
if (n && cc.isValid(t)) {
var a = t.getComponent(cc.Sprite);
a && (a.spriteFrame = n);
var o = t.getChildByName("btnLabel");
o && (o.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var o = a.addComponent(cc.Label);
o.string = "吃";
o.fontSize = 40;
o.lineHeight = 40;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameBMJ", "onOptionClicked");
t.active = !1;
return t;
},
enterChiSelect: function(e) {
this.cancelChiSelect();
this._chiSelect = {
pai: e,
tiles: []
};
var t = this.node.getChildByName("game") || this.node, i = t.getChildByName("chiHint");
this._chiHintBaked = !!i;
if (null == i) {
(i = new cc.Node("chiHint")).setPosition(0, -200);
t.addChild(i);
var n = i.addComponent(cc.Label);
n.string = "请选择两张手牌";
n.fontSize = 36;
n.lineHeight = 40;
n.overflow = cc.Label.Overflow.NONE;
i.color = cc.color(255, 220, 80);
var a = i.addComponent(cc.LabelOutline);
a.color = cc.color(60, 30, 0);
a.width = 3;
}
i.active = !0;
i.setPosition(0, -200);
this._chiHint = i;
},
cancelChiSelect: function() {
if (this._chiSelect) for (var e = 0; e < this._chiSelect.tiles.length; ++e) {
var t = this._chiSelect.tiles[e];
cc.isValid(t) && (t.y = 0);
}
this._chiSelect = null;
this._chiHint && cc.isValid(this._chiHint) && (this._chiHintBaked ? this._chiHint.active = !1 : this._chiHint.destroy());
this._chiHint = null;
},
hideOptions: function() {
if (null != this._options) {
for (var e = this._baoPanel && this._baoPanel.active || this._csPanel && this._csPanel.active, t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name) {
i.active = !1;
i.getChildByName("btnPeng").active = !1;
i.getChildByName("btnGang").active = !1;
i.getChildByName("btnHu").active = !1;
var n = i.getChildByName("btnChi");
n && (n.active = !1);
}
}
e || (this._options.active = !1);
this.hideChiPanel();
this.cancelChiSelect();
}
},
showAction: function(e) {
if (!(this._baoPanel && this._baoPanel.active || this._csPanel && this._csPanel.active)) {
this._options.active && this.hideOptions();
if (e && (e.hu || e.gang || e.peng || e.chi)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var t = 0; t < e.gangpai.length; ++t) {
var i = e.gangpai[t];
this.addOption("btnGang", i);
}
e.chi && this.addChiOption(e.pai);
var n = this._options.getChildByName("btnGuo");
n && (n.active = !0);
}
}
},
initWanfaLabel: function() {
var e = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
if (e) {
var t = e.getComponent(cc.Label);
t && (t.string = cc.vv.gameNetMgr.getWanfa());
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
if (null != t) {
var i = cc.vv.gameNetMgr.conf, n = -1;
null != this._curBaoMode ? n = this._curBaoMode : null != i && null != i.baoMode && (n = parseInt(i.baoMode));
var a = null != this._caishen ? this._caishen : i ? i.caishen : null, o = null != this._caishen2 ? this._caishen2 : i ? i.caishen2 : null, c = null != a && a >= 0, s = t.getChildByName("title"), l = s ? s.getComponent(cc.Label) : null, r = t.getChildByName("cs1"), h = t.getChildByName("cs2"), d = t.getChildByName("wu");
if (c) {
t.active = !0;
!l || "无财" !== l.string && 0 !== l.string.length || (l.string = "财神");
var g = function(e, t) {
var i = e.getComponent(cc.Sprite);
if (i) try {
var n = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
n && (i.spriteFrame = n);
} catch (e) {
console.warn("[caishenTip] 取牌面失败 pai=" + t, e);
}
}, u = null != o && o >= 0;
if (u) {
if (r) {
r.active = !0;
g(r, a);
}
if (h) {
h.active = !0;
g(h, o);
}
d && (d.active = !1);
} else {
r && (r.active = !1);
if (h) {
h.active = !0;
g(h, a);
}
if (d) {
var v = d.getComponent(cc.Label);
v && (v.string = "独");
d.active = !0;
}
}
var m = this, p = u && r ? r.getComponent(cc.Sprite) : null, f = h ? h.getComponent(cc.Sprite) : null;
if (null != p && null == p.spriteFrame || null != f && null == f.spriteFrame) {
cc.vv.mahjongmgr && cc.vv.mahjongmgr.bottomAtlas || console.warn("[caishenTip] bottomAtlas 未就绪, 等待重试");
null == this._csRetryCount && (this._csRetryCount = 0);
if (!this._csRetryScheduled && this._csRetryCount < 600) {
this._csRetryScheduled = !0;
var _ = a;
this.scheduleOnce(function() {
m._csRetryScheduled = !1;
if (cc.isValid(m.node) && (null == m._caishen || m._caishen === _)) {
m._csRetryCount++;
m.initCaishenTip();
var e = !p || null != p.spriteFrame, t = !f || null != f.spriteFrame;
e && t && (m._csRetryCount = 0);
}
}, 0);
}
} else this._csRetryCount = 0;
} else if (0 === n) {
t.active = !0;
l && (l.string = "无财");
r && (r.active = !1);
h && (h.active = !1);
if (d) {
var C = d.getComponent(cc.Label);
C && (C.string = "无财");
d.active = !0;
}
} else t.active = !1;
}
}
},
_showBaoInfo: function(e) {
if (e) {
var t = null != e.baoTai ? parseInt(e.baoTai) : this._baoTai || 0, i = null != e.baoMode ? parseInt(e.baoMode) : this._curBaoMode, n = ((0 === i ? "无财" : 1 === i ? "独财" : 2 === i ? "双财" : "") || "") + (t > 0 ? t + "台" : ""), a = cc.vv.gameNetMgr, o = null != e.baoSeatIndex ? parseInt(e.baoSeatIndex) : a && null != a.baoSeatIndex ? parseInt(a.baoSeatIndex) : -1, c = this.node.getChildByName("game"), s = c ? c.getChildByName("caishenTip") : null;
if (s) {
var l = s.getChildByName("baoTaiLabel");
if (l) {
var r = l.getComponent(cc.Label);
r && (r.string = n);
l.active = n.length > 0;
}
}
this._showBaoFlag(o);
}
},
_getBaoFlagNode: function(e) {
if (!e) return null;
var t = e.getChildByName("baoFlag");
if (t) return t;
for (var i = 0; i < e.children.length; ++i) {
var n = e.children[i];
if (n.getChildByName("baoFlag")) return n;
}
return null;
},
_showBaoFlag: function(e) {
null != e && (e = parseInt(e));
var t = this.node.getComponent("MJRoom");
if (t && t._seats2 && 0 !== t._seats2.length) {
for (var i = cc.vv.gameNetMgr, n = i.seats ? i.seats.length : t._seats2.length, a = null != i.seatIndex ? parseInt(i.seatIndex) : 0, o = 0; o < t._seats2.length; ++o) {
var c = t._seats2[o];
if (c && c.node) {
var s = this._getBaoFlagNode(c.node);
s && (s.active = !1);
}
}
if (!(null == e || e < 0)) {
var l = ((e - a) % n + n) % n, r = t._seats2[l];
if (r && r.node) {
var h = this._getBaoFlagNode(r.node);
h && (h.active = !0);
}
}
}
},
_clearBaoFlag: function() {
var e = this.node.getComponent("MJRoom");
if (e && e._seats2) for (var t = 0; t < e._seats2.length; ++t) {
var i = e._seats2[t];
if (i && i.node) {
var n = this._getBaoFlagNode(i.node);
n && (n.active = !1);
}
}
},
_bindBaoButton: function(e, t, i) {
if (e) {
e.pai = t;
cc.vv.utils.addClickEvent(e, this.node, "MJGameBMJ", i);
for (var n = e.children || [], a = 0; a < n.length; ++a) {
var o = n[a], c = o.getComponent(cc.Sprite);
if (c && c.spriteFrame) {
o.pai = t;
o.getComponent(cc.Button) || (o.addComponent(cc.Button).transition = cc.Button.Transition.NONE);
cc.vv.utils.addClickEvent(o, this.node, "MJGameBMJ", i);
}
}
}
},
_baoRank: function(e, t) {
return 10 * (e || 0) + (null == t ? 1 : 0 == t ? 2 : 1 == t ? 1 : 0);
},
onBaoSelect: function(e) {
if (e && this._baoPanel) {
cc.vv.gameNetMgr.waitBaoData = null;
if (e.seatIndex == cc.vv.gameNetMgr.seatIndex) {
this._hideWaitCaishenTip();
var t = this;
this.scheduleOnce(function() {
cc.isValid(t.node) && t._baoShow(e);
}, 0);
}
}
},
_baoShow: function(e) {
if (this._baoPanel) {
var t = e && null != e.currentRank ? e.currentRank : -1;
t < 0 && e && null != e.currentSeat && e.currentSeat >= 0 && null != e.currentTai && (t = this._baoRank(e.currentTai, e.currentMode));
this._baoCurRank = t;
this._baoForced = !(!e || !e.forced);
this._baoMode = 2;
this._baoTai = 2;
this._baoPanel.active = !0;
this._options.active = !0;
var i = this._options.getChildByName("op");
i && (i.active = !1);
var n = this._options.getChildByName("btnGuo");
n && (n.active = !1);
var a = this._baoPanel.getChildByName("lblTip");
if (a) {
var o = a.getComponent(cc.Label);
if (o) if (this._baoForced) o.string = "双方均未叫台，你被强制包，请选择包法（2台）"; else if (this._baoCurRank < 0) o.string = "请叫台"; else {
var c = Math.floor(this._baoCurRank / 10), s = this._baoCurRank % 10, l = 2 === s ? "无财" : 1 === s ? "独财" : "双财";
o.string = "对家叫" + l + c + "台";
}
}
this._refreshBaoButtons();
this._highlightBaoMode(this._baoPanel.getChildByName("btnShuangCai"));
}
},
_refreshBaoButtons: function() {
if (this._baoPanel) for (var e = null != this._baoCurRank ? this._baoCurRank : -1, t = 2; t <= 7; ++t) {
var i = this._baoPanel.getChildByName("btnTai" + t);
i && (this._baoForced ? i.active = 2 === t : i.active = this._baoRank(t, this._baoMode) > e);
}
},
_highlightBaoMode: function(e) {
for (var t = [ "btnNoCai", "btnDuCai", "btnShuangCai" ], i = 0; i < t.length; ++i) {
var n = this._baoPanel.getChildByName(t[i]);
if (n) {
var a = n === e ? 255 : 150;
n.opacity = a;
for (var o = n.children || [], c = 0; c < o.length; ++c) o[c].getComponent(cc.Sprite) && (o[c].opacity = a);
}
}
},
onBaoModeClicked: function(e) {
var t = e && (e.currentTarget || e.node || e.target) || null;
if (null != t) {
var i = null != t.pai ? parseInt(t.pai) : NaN;
isNaN(i) && t.name && (i = parseInt(t.name.replace(/[^0-9]/g, "")));
if (!isNaN(i)) {
this._baoMode = i;
var n = t.parent && t.parent !== this._baoPanel ? t.parent : t;
this._highlightBaoMode(n);
this._refreshBaoButtons();
}
}
},
onBaoTaiClicked: function(e) {
var t = e && (e.currentTarget || e.node || e.target) || null;
if (null != t) {
var i = null != t.pai ? parseInt(t.pai) : NaN;
isNaN(i) && t.name && (i = parseInt(t.name.replace(/[^0-9]/g, "")));
if (!isNaN(i)) {
this._baoTai = i;
cc.vv.net.send("bao", {
isBao: !0,
baoTai: this._baoTai,
baoTaiFee: 0,
caishenMode: this._baoMode
});
this._hideBaoPanel();
var n = [ "无财", "独财", "双财" ][this._baoMode] || "";
this._showWaitCaishenTip("你已叫" + n + this._baoTai + "台，等待对家决策");
}
}
},
onBaoNoBaoClicked: function() {
cc.vv.net.send("bao", {
isBao: !1
});
this._hideBaoPanel();
this._showWaitCaishenTip("你已放弃包，等待对家决策");
},
_hideBaoPanel: function() {
this._baoPanel && (this._baoPanel.active = !1);
var e = this._options ? this._options.getChildByName("btnGuo") : null;
e && (e.active = !0);
this._options && (this._options.active = !1);
},
onBaoResult: function(e) {
if (e) {
this._hideBaoPanel();
if (null != e.baoMode) {
this._curBaoMode = parseInt(e.baoMode);
if (cc.vv.gameNetMgr) {
cc.vv.gameNetMgr.baoMode = this._curBaoMode;
cc.vv.gameNetMgr.baoSeatIndex = e.baoSeatIndex;
cc.vv.gameNetMgr.baoTai = e.baoTai;
}
}
this._showBaoInfo(e);
if (null != e.caishen) {
this._hideWaitCaishenTip();
this._caishen = parseInt(e.caishen);
this._caishen2 = null != e.caishen2 ? parseInt(e.caishen2) : null;
this._hideCsPanel();
this.initCaishenTip();
this.initMahjongs(!1);
} else if (parseInt(e.baoSeatIndex) != cc.vv.gameNetMgr.seatIndex) {
var t = [ "无财", "独财", "双财" ][parseInt(e.baoMode)] || "";
this._showWaitCaishenTip("对家已包" + t + parseInt(e.baoTai) + "台，等待对家定财神");
} else this._hideWaitCaishenTip();
}
},
_showWaitCaishenTip: function(e) {
var t = cc.find("Canvas/tip_notice");
if (t) {
t.active = !0;
var i = t.getChildByName("info");
if (i) {
var n = i.getComponent(cc.Label);
n && (n.string = e);
}
}
},
_hideWaitCaishenTip: function() {
var e = cc.find("Canvas/tip_notice");
e && (e.active = !1);
},
onCaishenSelect: function(e) {
if (e) {
this._csMode = null != e.mode ? parseInt(e.mode) : 2;
this._csPai = null;
if (this._csPaiNode) {
this._csPaiNode.y = 0;
this._csPaiNode = null;
}
var t = this;
this.scheduleOnce(function() {
if (cc.isValid(t.node)) {
t._hideBaoPanel();
t._showCsPanel();
}
}, 0);
}
},
_showCsPanel: function() {
if (this._csPanel) {
this._csPanel.active = !0;
this._options.active = !0;
var e = this._options.getChildByName("op");
e && (e.active = !1);
var t = this._options.getChildByName("btnGuo");
t && (t.active = !1);
var i = this._csPanel.getChildByName("btnSetCaishen");
i && (i.active = !1);
}
},
_hideCsPanel: function() {
this._csPanel && (this._csPanel.active = !1);
if (this._csPaiNode) {
this._csPaiNode.y = 0;
this._csPaiNode = null;
}
this._csPai = null;
},
onSetCaishenClicked: function() {
if (!(null == this._csPai || this._csPai < 0)) {
cc.vv.net.send("caishen_select", {
pai: this._csPai
});
this._hideCsPanel();
}
},
playEfx: function(e, t) {
this._playEfxs[e].node.active = !0;
this._playEfxs[e].play(t);
},
onGameBeign: function(e) {
this._hideWaitCaishenTip();
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), o = this._hupaiTips[a];
o.active = n.hued;
if (n.hued) {
o.getChildByName("sprHu").active = !n.iszimo;
o.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var c = this.node.getChildByName("game");
this._clearBaoFlag();
var s = c.getChildByName("caishenTip");
if (s) {
var l = s.getChildByName("baoTaiLabel");
if (l) {
var r = l.getComponent(cc.Label);
r && (r.string = "");
l.active = !1;
}
}
var h = c.getChildByName("huanpaiinfo");
null != h && (h.active = !1);
var d = [ "right", "up", "left" ];
for (t = 0; t < d.length; ++t) {
var g = c.getChildByName(d[t]);
if (null != g) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) g.active = !1; else {
g.active = !0;
var u = g.getChildByName("holds");
for (i = 0; i < u.childrenCount; ++i) u.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var v = cc.vv.gameNetMgr.seats;
for (var t in v) {
n = v[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
e && this._isFreshDeal() && this._playDealAnim();
}
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i) {
if (i.folds instanceof Array && i.folds.length > 0) return !1;
if (i.pengs instanceof Array && i.pengs.length > 0) return !1;
if (i.chis instanceof Array && i.chis.length > 0) return !1;
if (i.angangs instanceof Array && i.angangs.length > 0) return !1;
if (i.diangangs instanceof Array && i.diangangs.length > 0) return !1;
if (i.wangangs instanceof Array && i.wangangs.length > 0) return !1;
if (i.hua instanceof Array && i.hua.length > 0) return !1;
}
}
return !0;
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, o) {
if (null != a && 0 != n.length) {
var c = a.convertToNodeSpaceAR(e);
n.sort(o);
for (var s = 0; s < n.length; ++s) {
var l = n[s], r = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: r,
y: h,
op: d
});
l.setPosition(c);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * s), cc.spawn(cc.moveTo(.15, cc.v2(r, h)), cc.fadeTo(.15, d))));
var g = .06 * s + .15;
g > i && (i = g);
}
}
}, a = [], o = null, c = 0; c < this._myMJArr.length; ++c) {
var s = this._myMJArr[c];
if (s && s.node && s.node.active && null != s.node.mjId) {
a.push(s.node);
o = s.node.parent;
}
}
n(a, o, function(e, t) {
return e.x - t.x;
});
for (var l = this.node.getChildByName("game"), r = cc.vv.gameNetMgr.seats || [], h = 0; h < r.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var g = cc.vv.mahjongmgr.getSide(d), u = l ? l.getChildByName(g) : null, v = u ? u.getChildByName("holds") : null;
if (null != v) {
for (var m = [], p = 0; p < v.childrenCount; ++p) {
var f = v.children[p];
f.active && m.push(f);
}
n(m, v, "up" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).x - e.convertToWorldSpaceAR(cc.v2(0, 0)).x;
} : "left" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).y - e.convertToWorldSpaceAR(cc.v2(0, 0)).y;
} : function(e, t) {
return e.convertToWorldSpaceAR(cc.v2(0, 0)).y - t.convertToWorldSpaceAR(cc.v2(0, 0)).y;
});
}
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var _ = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == _) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
}
}, i + .05);
}
},
_cancelDealAnim: function() {
if (this._dealAnimating) {
this._dealAnimating = !1;
this._dealAnimId = (this._dealAnimId || 0) + 1;
for (var e = this._dealAnimNodes || [], t = 0; t < e.length; ++t) {
var i = e[t];
if (cc.isValid(i.node)) {
i.node.stopAllActions();
i.node.setPosition(i.x, i.y);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
_findMJNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null; t && null == t.mjId && t.parent; ) t = t.parent;
return t;
},
_findBtnNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null, i = {
btnPeng: 1,
btnGang: 1,
btnHu: 1,
btnGuo: 1,
btnChi: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (null != this._csPanel && this._csPanel.active) {
var t = this._csPanel.getChildByName("btnSetCaishen"), i = this._findMJNode(e);
if (null == i || null == i.mjId) return;
for (var n = 0; n < this._myMJArr.length; ++n) if (i == this._myMJArr[n].node) {
if (this._csPaiNode == i) {
i.y = 0;
this._csPaiNode = null;
this._csPai = null;
t && (t.active = !1);
return;
}
this._csPaiNode && (this._csPaiNode.y = 0);
i.y = 15;
this._csPaiNode = i;
this._csPai = i.mjId;
t && (t.active = !0);
return;
}
} else if (this._chiSelect) {
var a = this._findMJNode(e);
if (null == a || null == a.mjId) return;
for (var o = 0; o < this._myMJArr.length; ++o) if (a == this._myMJArr[o].node) {
var c = this._chiSelect.tiles, s = c.indexOf(a);
if (-1 != s) {
c.splice(s, 1);
a.y = 0;
return;
}
if (c.length >= 2) return;
c.push(a);
a.y = 15;
if (2 == c.length) {
var l = c[0].mjId, r = c[1].mjId, h = this._chiSelect.pai;
c[0].y = 0;
c[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ l, r, h ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) if (null == cc.vv.gameNetMgr.waitCaishenMode) {
var d = this._findMJNode(e);
if (null != d) for (var g = 0; g < this._myMJArr.length; ++g) if (d == this._myMJArr[g].node) {
if (d == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
d.y = 15;
this._selectedMJ = d;
return;
}
} else console.log("[onMJClicked] 等待定财神,禁止出牌"); else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && (this._baoPanel && this._baoPanel.active ? console.log("[shoot] 叫台进行中,禁止出牌") : null == cc.vv.gameNetMgr.waitCaishenMode ? cc.vv.net.send("chupai", e) : console.log("[shoot] 等待定财神,禁止出牌"));
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? 13 - t : t;
},
initMopai: function(e, t) {
this._cancelDealAnim();
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = cc.vv.mahjongmgr.getSide(i), a = cc.vv.mahjongmgr.getFoldPre(i), o = this.node.getChildByName("game").getChildByName(n).getChildByName("holds"), c = this.getMJIndex(n, 13), s = o.children[c];
if (null != s) {
s.scaleX = 1;
s.scaleY = 1;
if (null == t) s.active = !1; else if (t >= 0) {
s.active = !0;
if ("up" == n) {
s.scaleX = .73;
s.scaleY = .73;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a, t);
} else if (null != t) {
s.active = !0;
if ("up" == n) {
s.scaleX = 1;
s.scaleY = 1;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(n);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), o = 0; o < n.childrenCount; ++o) {
var c = n.children[o];
c.scaleX = 1;
c.scaleY = 1;
c.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, o = a ? a.getChildByName("holds") : null;
if (null != o) {
var c = e.chis || [], s = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + c.length;
s *= 3;
for (var l = 0; l < s; ++l) {
var r = this.getMJIndex(i, l);
null != o.children[r] && (o.children[r].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (l = 0; l < d.length; ++l) {
r = this.getMJIndex(i, l + s);
if (null != o.children[r]) {
var g = o.children[r].getComponent(cc.Sprite);
if (null != g) {
if ("up" == i) {
g.node.scaleX = .73;
g.node.scaleY = .73;
}
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[l]);
}
}
}
this._hideUnusedHolds(i, o, s + d.length);
} else {
var u = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (l = s; l < s + u; ++l) {
r = this.getMJIndex(i, l);
var v = o.children[r];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, s + u);
}
}
}
}
},
_hideUnusedHolds: function(e, t, i) {
for (var n = i; n < 14; ++n) {
var a = this.getMJIndex(e, n);
null != t.children[a] && (t.children[a].active = !1);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var o = cc.vv.gameNetMgr.conf, c = o ? o.caishen : -1, s = o ? o.caishen2 : -1, l = [], r = [], h = 0; h < i.length; ++h) {
var d = i[h];
c >= 0 && d == c || null != s && s >= 0 && d == s ? l.push(d) : r.push(d);
}
cc.vv.mahjongmgr.sortMJ(r);
i.length = 0;
for (var g = 0; g < l.length; ++g) i.push(l[g]);
for (var u = 0; u < r.length; ++u) i.push(r[u]);
null != n && i.push(n);
return i;
},
initMahjongs: function(e, t) {
this._cancelDealAnim();
var i = t || this.getSelfSeatData();
console.log("[initMahjongs] allowMopai=", e, "forceSeatData=", !!t, "seatData.holds=", i ? "object" == typeof i.holds ? i.holds.length + ":" + JSON.stringify(i.holds) : i.holds : "null");
if (null != i && null != i.holds && "object" == typeof i.holds && null != i.holds.length) {
var n = this.sortHolds(i, e);
if (null != n) {
this._selectedMJ = null;
var a, o = i.chis || [], c = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + o.length), s = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (s = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (s = 0);
a = s > 0 ? .5 * s : 20;
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), r = this._myMJArr[c], h = r ? r.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", c, "holds.length=", n.length, "startSlot=", c, "endSlot=", c + n.length - 1);
for (var d = [], g = 0; g < n.length; ++g) {
var u = n[g];
if (null == (m = this._myMJArr[g + c]) || null == m.node) {
d.push("SLOT_" + (g + c) + "=NULL");
break;
}
m.node.mjId = u;
m.node.y = 0;
var v = l && g == n.length - 1;
s > 0 && (m.node.x = h + g * s + (v ? a : 0));
this.setSpriteFrameByMJID("M_", m, u);
d.push("SLOT_" + (g + c) + "=" + u);
}
console.log("[initMahjongs] render:", d.join("|"));
for (g = 0; g < c; ++g) if (null != (m = this._myMJArr[g]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
}
for (g = c + n.length; g < this._myMJArr.length; ++g) {
var m;
if (null != (m = this._myMJArr[g]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
},
getSelfSeatData: function() {
var e = cc.vv.gameNetMgr, t = e ? e.seats : null;
if (!t) return null;
var i = e.seatIndex;
if (null != i && i >= 0 && i < t.length && t[i]) return t[i];
var n = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != n) for (var a = 0; a < t.length; ++a) if (t[a] && t[a].userid == n) return t[a];
return null;
},
getLocalIndex: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
return (e - cc.vv.gameNetMgr.seatIndex + t) % t;
},
showChiPanel: function(e) {
this.hideChiPanel();
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 36 + 146 * e.length + 30 * (e.length - 1), n = new cc.Node("chiPanel");
n.setContentSize(i, 120);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 120);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -60, i, 120);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 26);
c.setPosition(0, 37);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择吃牌组合";
s.fontSize = 22;
s.lineHeight = 26;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = e[l], h = new cc.Node("chiItem" + l);
h.setContentSize(146, 66);
h.setPosition(91 + -i / 2 + 176 * l, -13);
n.addChild(h);
h.addComponent(cc.Button);
h.paiList = r;
cc.vv.utils.addClickEvent(h, this.node, "MJGameBMJ", "onChiItemClicked");
for (var d = 0; d < r.length; ++d) {
var g = new cc.Node("p" + d);
g.setContentSize(46, 66);
g.setPosition(50 * d - 50, 0);
h.addChild(g);
var u = g.addComponent(cc.Sprite);
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", r[d]);
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = n;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e.target.paiList;
t && cc.vv.net.send("chi", t);
this.hideChiPanel();
this.hideOptions();
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i) cc.vv.net.send("hu"); else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
this._hideWaitCaishenTip();
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameLDH: [ function(e, t) {
"use strict";
cc._RF.push(t, "85c5aNOTWNCFrgpYPdauSJ3", "MJGameLDH");
cc.Class({
extends: cc.Component,
properties: {
gameRoot: {
default: null,
type: cc.Node
},
prepareRoot: {
default: null,
type: cc.Node
},
_myMJArr: [],
_options: null,
_selectedMJ: null,
_chupaiSprite: [],
_mjcount: null,
_gamecount: null,
_hupaiTips: [],
_hupaiLists: [],
_playEfxs: [],
_opts: [],
_chiPanel: null,
_chiSelect: null,
_chiHint: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0
},
onLoad: function() {
var e = this.node.getComponent(cc.Canvas);
if (null != e) {
if (!cc.sys.isNative) {
e.fitHeight = !0;
e.fitWidth = !1;
for (var t = cc.director.getScene().getComponentsInChildren(cc.Camera), i = 0; i < t.length; i++) {
t[i].clearFlags = cc.Camera.ClearFlags.COLOR;
t[i].backgroundColor = cc.color(30, 18, 12);
}
}
if (cc.vv) {
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
}
},
initView: function() {
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var t = this._mjcount.node, i = this._gamecount.node;
this.scheduleOnce(function() {
cc.isValid(t) && cc.isValid(i) && t.setPosition(i.x - i.width / 2 - t.width / 2 - 12, i.y);
}, 0);
for (var n = e.getChildByName("myself").getChildByName("holds"), a = 0; a < n.children.length; ++a) {
var o = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(o);
o.spriteFrame = null;
}
var c = cc.view.getVisibleSize().width / 1280;
if (c < 1) {
n.scaleX *= c;
n.scaleY *= c;
}
var s = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < s; ++a) {
var l = cc.vv.mahjongmgr.getSide(a), r = e.getChildByName(l);
if (null != r) {
this._hupaiTips.push(r.getChildByName("HuPai"));
this._hupaiLists.push(r.getChildByName("hupailist"));
this._playEfxs.push(r.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(r.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = r.getChildByName("opt");
h.active = !1;
o = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: o
};
this._opts.push(d);
}
}
var g = e.getChildByName("ops");
this._options = g;
var u = g ? g.getChildByName("New Layout") : null;
if (u) {
var v = u.getComponent(cc.Button);
v && (v.enabled = !1);
u.active = !1;
}
this.hideOptions();
this.hideChupai();
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
initEventHandlers: function() {
cc.vv.gameNetMgr.dataEventHandler = this.node;
var e = cc.vv.gameNetMgr;
if ("begin" == e.gamestate && e.seats) {
for (var t = !1, i = 0; i < e.seats.length; ++i) {
var n = e.seats[i];
if (n && n.holds instanceof Array && n.holds.length > 0) {
t = !0;
break;
}
}
if (t) {
var a = this.node;
this.scheduleOnce(function() {
if (cc.isValid(a)) {
a.emit("game_num", {
detail: e.numOfGames
});
a.emit("mj_count", {
detail: null
});
a.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
a.emit("game_action", {
detail: t
});
}
}
}, 0);
}
}
var o = this;
this.node.on("game_start", function(e) {
try {
o.onGameBeign(!0, e && e.detail);
} catch (e) {
console.error("[LDH] onGameBeign error:", e);
}
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.audioMgr.playSFX("nv/hu.mp3");
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
},
showChupai: function() {
var e = cc.vv.gameNetMgr.chupai;
if (e >= 0) {
var t = this.getLocalIndex(cc.vv.gameNetMgr.turn), i = this._chupaiSprite[t];
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
i.node.active = !0;
}
},
addOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var n = this._options.children[i];
if ("op" == n.name && 0 == n.active) {
n.active = !0;
n.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
var a = n.getChildByName(e);
a.active = !0;
a.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
i.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
var n = this.getChiButton(i);
if (n) {
n.active = !0;
n.pai = e;
}
return;
}
}
},
getChiButton: function(e) {
var t = e.getChildByName("btnChi");
if (t) {
if (!t._chiBound) {
t._chiBound = !0;
cc.vv.utils.addClickEvent(t, this.node, "MJGameLDH", "onOptionClicked");
}
return t;
}
var i = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (i) {
t.setPosition(i.getPosition());
t.setContentSize(i.getContentSize());
t.scaleX = i.scaleX;
t.scaleY = i.scaleY;
}
var n = t.addComponent(cc.Sprite);
n.type = cc.Sprite.Type.SIMPLE;
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, i) {
if (!e && i && cc.isValid(t)) {
var n = t.getComponent(cc.Sprite);
n && (n.spriteFrame = i);
}
});
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, i) {
var n = i ? i.getSpriteFrame("mj_btn_chi.png") : null;
if (n && cc.isValid(t)) {
var a = t.getComponent(cc.Sprite);
a && (a.spriteFrame = n);
var o = t.getChildByName("btnLabel");
o && (o.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var o = a.addComponent(cc.Label);
o.string = "吃";
o.fontSize = 40;
o.lineHeight = 40;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameLDH", "onOptionClicked");
t.active = !1;
return t;
},
enterChiSelect: function(e) {
this.cancelChiSelect();
this._chiSelect = {
pai: e,
tiles: []
};
var t = this.node.getChildByName("game") || this.node, i = t.getChildByName("chiHint");
this._chiHintBaked = !!i;
if (null == i) {
(i = new cc.Node("chiHint")).setPosition(0, -200);
t.addChild(i);
var n = i.addComponent(cc.Label);
n.string = "请选择两张手牌";
n.fontSize = 36;
n.lineHeight = 40;
n.overflow = cc.Label.Overflow.NONE;
i.color = cc.color(255, 220, 80);
var a = i.addComponent(cc.LabelOutline);
a.color = cc.color(60, 30, 0);
a.width = 3;
}
i.active = !0;
i.setPosition(0, -200);
this._chiHint = i;
},
cancelChiSelect: function() {
if (this._chiSelect) for (var e = 0; e < this._chiSelect.tiles.length; ++e) {
var t = this._chiSelect.tiles[e];
cc.isValid(t) && (t.y = 0);
}
this._chiSelect = null;
this._chiHint && cc.isValid(this._chiHint) && (this._chiHintBaked ? this._chiHint.active = !1 : this._chiHint.destroy());
this._chiHint = null;
},
hideOptions: function() {
if (null != this._options) {
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
}
},
showAction: function(e) {
this._options.active && this.hideOptions();
if (e && (e.hu || e.gang || e.peng || e.chi)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var t = 0; t < e.gangpai.length; ++t) {
var i = e.gangpai[t];
this.addOption("btnGang", i);
}
e.chi && this.addChiOption(e.pai);
var n = this._options.getChildByName("btnGuo");
n && (n.active = !0);
}
},
initWanfaLabel: function() {
for (var e = [ "Canvas/infobar/wanfa", "Canvas/infobar/New Sprite/wanfa", "Canvas/infobar/infobar/wanfa" ], t = null, i = 0; i < e.length && !(t = cc.find(e[i])); ++i) ;
if (t) {
var n = t.getComponent(cc.Label);
n ? n.string = cc.vv.gameNetMgr.getWanfa() : console.warn("[initWanfaLabel] wanfa node has no cc.Label component");
} else {
console.warn("[initWanfaLabel] wanfa node NOT FOUND, tried:", e.join(" | "));
var a = cc.director.getScene();
a && function e(t, i) {
if (t) {
"wanfa" === t.name && console.warn("[initWanfaLabel] found wanfa at depth", i, "name=", t.name, "parent=", t.parent && t.parent.name);
for (var n = 0; n < t.children && n < 100; ++n) e(t.children[n], i + 1);
}
}(a, 0);
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
if (null != t) {
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
t.setSiblingIndex(t.parent.childrenCount - 1);
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
if (i) {
i.enabled = !0;
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
}
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var c = t.getChildByName("cs2");
if (c) {
var s = null != i.caishen2 && i.caishen2 >= 0;
c.active = s;
s && a(c, i.caishen2);
}
}
}
}
},
playEfx: function(e, t) {
this._playEfxs[e].node.active = !0;
this._playEfxs[e].play(t);
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), o = this._hupaiTips[a];
o.active = n.hued;
if (n.hued) {
o.getChildByName("sprHu").active = !n.iszimo;
o.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var c = this.node.getChildByName("game"), s = c.getChildByName("huanpaiinfo");
null != s && (s.active = !1);
var l = [ "right", "up", "left" ];
for (t = 0; t < l.length; ++t) {
var r = c.getChildByName(l[t]);
if (null != r) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) r.active = !1; else {
r.active = !0;
var h = r.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
e && this._isFreshDeal() && this._playDealAnim();
}
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i) {
if (i.folds instanceof Array && i.folds.length > 0) return !1;
if (i.pengs instanceof Array && i.pengs.length > 0) return !1;
if (i.chis instanceof Array && i.chis.length > 0) return !1;
if (i.angangs instanceof Array && i.angangs.length > 0) return !1;
if (i.diangangs instanceof Array && i.diangangs.length > 0) return !1;
if (i.wangangs instanceof Array && i.wangangs.length > 0) return !1;
if (i.hua instanceof Array && i.hua.length > 0) return !1;
}
}
return !0;
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, o) {
if (null != a && 0 != n.length) {
var c = a.convertToNodeSpaceAR(e);
n.sort(o);
for (var s = 0; s < n.length; ++s) {
var l = n[s], r = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: r,
y: h,
op: d
});
l.setPosition(c);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * s), cc.spawn(cc.moveTo(.15, cc.v2(r, h)), cc.fadeTo(.15, d))));
var g = .06 * s + .15;
g > i && (i = g);
}
}
}, a = [], o = null, c = 0; c < this._myMJArr.length; ++c) {
var s = this._myMJArr[c];
if (s && s.node && s.node.active && null != s.node.mjId) {
a.push(s.node);
o = s.node.parent;
}
}
n(a, o, function(e, t) {
return e.x - t.x;
});
for (var l = this.node.getChildByName("game"), r = cc.vv.gameNetMgr.seats || [], h = 0; h < r.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var g = cc.vv.mahjongmgr.getSide(d), u = l ? l.getChildByName(g) : null, v = u ? u.getChildByName("holds") : null;
if (null != v) {
for (var m = [], p = 0; p < v.childrenCount; ++p) {
var f = v.children[p];
f.active && m.push(f);
}
n(m, v, "up" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).x - e.convertToWorldSpaceAR(cc.v2(0, 0)).x;
} : "left" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).y - e.convertToWorldSpaceAR(cc.v2(0, 0)).y;
} : function(e, t) {
return e.convertToWorldSpaceAR(cc.v2(0, 0)).y - t.convertToWorldSpaceAR(cc.v2(0, 0)).y;
});
}
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var _ = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == _) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
}
}, i + .05);
}
},
_cancelDealAnim: function() {
if (this._dealAnimating) {
this._dealAnimating = !1;
this._dealAnimId = (this._dealAnimId || 0) + 1;
for (var e = this._dealAnimNodes || [], t = 0; t < e.length; ++t) {
var i = e[t];
if (cc.isValid(i.node)) {
i.node.stopAllActions();
i.node.setPosition(i.x, i.y);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
_findMJNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null; t && null == t.mjId && t.parent; ) t = t.parent;
return t;
},
_findBtnNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null, i = {
btnPeng: 1,
btnGang: 1,
btnHu: 1,
btnGuo: 1,
btnChi: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, c = n[1].mjId, s = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, c, s ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var l = this._findMJNode(e);
if (null != l) for (var r = 0; r < this._myMJArr.length; ++r) if (l == this._myMJArr[r].node) {
if (l == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
l.y = 15;
this._selectedMJ = l;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? 13 - t : t;
},
initMopai: function(e, t) {
this._cancelDealAnim();
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = cc.vv.mahjongmgr.getSide(i), a = cc.vv.mahjongmgr.getFoldPre(i), o = this.node.getChildByName("game").getChildByName(n).getChildByName("holds"), c = this.getMJIndex(n, 13), s = o.children[c];
if (null != s) {
s.scaleX = 1;
s.scaleY = 1;
if (null == t) s.active = !1; else if (t >= 0) {
s.active = !0;
if ("up" == n) {
s.scaleX = .73;
s.scaleY = .73;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a, t);
} else if (null != t) {
s.active = !0;
if ("up" == n) {
s.scaleX = 1;
s.scaleY = 1;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(n);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), o = 0; o < n.childrenCount; ++o) {
var c = n.children[o];
c.scaleX = 1;
c.scaleY = 1;
c.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, o = a ? a.getChildByName("holds") : null;
if (null != o) {
var c = e.chis || [], s = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + c.length;
s *= 3;
for (var l = 0; l < s; ++l) {
var r = this.getMJIndex(i, l);
null != o.children[r] && (o.children[r].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (l = 0; l < d.length; ++l) {
r = this.getMJIndex(i, l + s);
if (null != o.children[r]) {
var g = o.children[r].getComponent(cc.Sprite);
if (null != g) {
if ("up" == i) {
g.node.scaleX = .73;
g.node.scaleY = .73;
}
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[l]);
}
}
}
this._hideUnusedHolds(i, o, s + d.length);
} else {
var u = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (l = s; l < s + u; ++l) {
r = this.getMJIndex(i, l);
var v = o.children[r];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, s + u);
}
}
}
}
},
_hideUnusedHolds: function(e, t, i) {
for (var n = i; n < 14; ++n) {
var a = this.getMJIndex(e, n);
null != t.children[a] && (t.children[a].active = !1);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var o = cc.vv.gameNetMgr.conf, c = o ? o.caishen : -1, s = o ? o.caishen2 : -1, l = [], r = [], h = 0; h < i.length; ++h) {
var d = i[h];
c >= 0 && d == c || null != s && s >= 0 && d == s ? l.push(d) : r.push(d);
}
cc.vv.mahjongmgr.sortMJ(r);
i.length = 0;
for (var g = 0; g < l.length; ++g) i.push(l[g]);
for (var u = 0; u < r.length; ++u) i.push(r[u]);
null != n && i.push(n);
return i;
},
initMahjongs: function(e, t) {
this._cancelDealAnim();
var i = t || this.getSelfSeatData();
console.log("[initMahjongs] allowMopai=", e, "forceSeatData=", !!t, "seatData.holds=", i ? "object" == typeof i.holds ? i.holds.length + ":" + JSON.stringify(i.holds) : i.holds : "null");
if (null != i && null != i.holds && "object" == typeof i.holds && null != i.holds.length) {
var n = this.sortHolds(i, e);
if (null != n) {
this._selectedMJ = null;
var a, o = i.chis || [], c = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + o.length), s = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (s = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (s = 0);
a = s > 0 ? .5 * s : 20;
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), r = this._myMJArr[c], h = r ? r.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", c, "holds.length=", n.length, "startSlot=", c, "endSlot=", c + n.length - 1);
for (var d = [], g = 0; g < n.length; ++g) {
var u = n[g];
if (null == (m = this._myMJArr[g + c]) || null == m.node) {
d.push("SLOT_" + (g + c) + "=NULL");
break;
}
m.node.mjId = u;
m.node.y = 0;
var v = l && g == n.length - 1;
s > 0 && (m.node.x = h + g * s + (v ? a : 0));
this.setSpriteFrameByMJID("M_", m, u);
d.push("SLOT_" + (g + c) + "=" + u);
}
console.log("[initMahjongs] render:", d.join("|"));
for (g = 0; g < c; ++g) if (null != (m = this._myMJArr[g]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
}
for (g = c + n.length; g < this._myMJArr.length; ++g) {
var m;
if (null != (m = this._myMJArr[g]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
},
getSelfSeatData: function() {
var e = cc.vv.gameNetMgr, t = e ? e.seats : null;
if (!t) return null;
var i = e.seatIndex;
if (null != i && i >= 0 && i < t.length && t[i]) return t[i];
var n = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != n) for (var a = 0; a < t.length; ++a) if (t[a] && t[a].userid == n) return t[a];
return null;
},
getLocalIndex: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
return (e - cc.vv.gameNetMgr.seatIndex + t) % t;
},
showChiPanel: function(e) {
this.hideChiPanel();
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 36 + 146 * e.length + 30 * (e.length - 1), n = new cc.Node("chiPanel");
n.setContentSize(i, 120);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 120);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -60, i, 120);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 26);
c.setPosition(0, 37);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择吃牌组合";
s.fontSize = 22;
s.lineHeight = 26;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = e[l], h = new cc.Node("chiItem" + l);
h.setContentSize(146, 66);
h.setPosition(91 + -i / 2 + 176 * l, -13);
n.addChild(h);
h.addComponent(cc.Button);
h.paiList = r;
cc.vv.utils.addClickEvent(h, this.node, "MJGameLDH", "onChiItemClicked");
for (var d = 0; d < r.length; ++d) {
var g = new cc.Node("p" + d);
g.setContentSize(46, 66);
g.setPosition(50 * d - 50, 0);
h.addChild(g);
var u = g.addComponent(cc.Sprite);
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", r[d]);
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = n;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e.target.paiList;
t && cc.vv.net.send("chi", t);
this.hideChiPanel();
this.hideOptions();
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i) cc.vv.net.send("hu"); else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameWujin: [ function(e, t) {
"use strict";
cc._RF.push(t, "869fe/PjcBKHYmvzxX98Wdg", "MJGameWujin");
cc.Class({
extends: cc.Component,
properties: {
gameRoot: {
default: null,
type: cc.Node
},
prepareRoot: {
default: null,
type: cc.Node
},
_myMJArr: [],
_options: null,
_selectedMJ: null,
_chupaiSprite: [],
_mjcount: null,
_gamecount: null,
_hupaiTips: [],
_hupaiLists: [],
_playEfxs: [],
_opts: [],
_chiPanel: null,
_chiSelect: null,
_chiHint: null,
_huaAreas: [],
_youjinLabels: [],
_youjinPanel: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0
},
onLoad: function() {
var e = this.node.getComponent(cc.Canvas);
if (null != e) {
if (!cc.sys.isNative) {
e.fitHeight = !0;
e.fitWidth = !1;
for (var t = cc.director.getScene().getComponentsInChildren(cc.Camera), i = 0; i < t.length; i++) {
t[i].clearFlags = cc.Camera.ClearFlags.COLOR;
t[i].backgroundColor = cc.color(30, 18, 12);
}
}
if (cc.vv) {
for (var n = [ "NoticeTip", "GameOverZP", "PengGangs", "MJRoom", "TimePointer", "GameResultZP", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
}
},
initView: function() {
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var t = this._mjcount.node, i = this._gamecount.node;
this.scheduleOnce(function() {
cc.isValid(t) && cc.isValid(i) && t.setPosition(i.x - i.width / 2 - t.width / 2 - 12, i.y);
}, 0);
for (var n = e.getChildByName("myself").getChildByName("holds"), a = 0; a < n.children.length; ++a) {
var o = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(o);
o.spriteFrame = null;
}
var c = cc.view.getVisibleSize().width / 1280;
if (c < 1) {
n.scaleX *= c;
n.scaleY *= c;
}
var s = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < s; ++a) {
var l = cc.vv.mahjongmgr.getSide(a), r = e.getChildByName(l);
if (null != r) {
this._hupaiTips.push(r.getChildByName("HuPai"));
this._hupaiLists.push(r.getChildByName("hupailist"));
this._playEfxs.push(r.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(r.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = r.getChildByName("opt");
h.active = !1;
o = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: o
};
this._opts.push(d);
}
}
var g = e.getChildByName("ops");
this._options = g;
var u = g ? g.getChildByName("New Layout") : null;
if (u) {
var v = u.getComponent(cc.Button);
v && (v.enabled = !1);
u.active = !1;
}
this.hideOptions();
this.hideChupai();
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
initEventHandlers: function() {
cc.vv.gameNetMgr.dataEventHandler = this.node;
var e = cc.vv.gameNetMgr;
if ("begin" == e.gamestate && e.seats) {
for (var t = !1, i = 0; i < e.seats.length; ++i) {
var n = e.seats[i];
if (n && n.holds instanceof Array && n.holds.length > 0) {
t = !0;
break;
}
}
if (t) {
var a = this.node;
this.scheduleOnce(function() {
if (cc.isValid(a)) {
a.emit("game_num", {
detail: e.numOfGames
});
a.emit("mj_count", {
detail: null
});
a.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
a.emit("game_action", {
detail: t
});
}
}
}, 0);
}
}
var o = this;
this.node.on("game_start", function(e) {
o.onGameBeign(!0, e && e.detail);
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.audioMgr.playSFX("nv/hu.mp3");
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
o.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o.initHuaArea(t.si);
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && o.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
},
showChupai: function() {
var e = cc.vv.gameNetMgr.chupai;
if (e >= 0) {
var t = this.getLocalIndex(cc.vv.gameNetMgr.turn), i = this._chupaiSprite[t];
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
i.node.active = !0;
}
},
addOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var n = this._options.children[i];
if ("op" == n.name && 0 == n.active) {
n.active = !0;
n.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
var a = n.getChildByName(e);
a.active = !0;
a.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
i.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
var n = this.getChiButton(i);
if (n) {
n.active = !0;
n.pai = e;
}
return;
}
}
},
getChiButton: function(e) {
var t = e.getChildByName("btnChi");
if (t) {
if (!t._chiBound) {
t._chiBound = !0;
cc.vv.utils.addClickEvent(t, this.node, "MJGameWujin", "onOptionClicked");
}
return t;
}
var i = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (i) {
t.setPosition(i.getPosition());
t.setContentSize(i.getContentSize());
t.scaleX = i.scaleX;
t.scaleY = i.scaleY;
}
var n = t.addComponent(cc.Sprite);
n.type = cc.Sprite.Type.SIMPLE;
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, i) {
if (!e && i && cc.isValid(t)) {
var n = t.getComponent(cc.Sprite);
n && (n.spriteFrame = i);
}
});
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, i) {
var n = i ? i.getSpriteFrame("mj_btn_chi.png") : null;
if (n && cc.isValid(t)) {
var a = t.getComponent(cc.Sprite);
a && (a.spriteFrame = n);
var o = t.getChildByName("btnLabel");
o && (o.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var o = a.addComponent(cc.Label);
o.string = "吃";
o.fontSize = 40;
o.lineHeight = 40;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameWujin", "onOptionClicked");
t.active = !1;
return t;
},
getZpOpButton: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a) {
if (!a._zpBound) {
a._zpBound = !0;
cc.vv.utils.addClickEvent(a, this.node, "MJGameWujin", "onOptionClicked");
}
return a;
}
var o = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (o) {
a.setPosition(o.getPosition());
a.setContentSize(o.getContentSize());
a.scaleX = o.scaleX;
a.scaleY = o.scaleY;
}
var c = a.addComponent(cc.Sprite);
c.type = cc.Sprite.Type.SIMPLE;
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var s = new cc.Node("btnLabel");
a.addChild(s);
var l = s.addComponent(cc.Label);
l.string = i;
l.fontSize = n || 40;
l.lineHeight = l.fontSize;
l.overflow = cc.Label.Overflow.NONE;
l.enableWrapText = !1;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 255, 255);
s.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameWujin", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var o = this._options.children[a];
if ("op" == o.name && 0 == o.active) {
o.active = !0;
o.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var c = this.getZpOpButton(o, e, t, n);
c.active = !0;
c.pai = i;
return;
}
}
},
enterChiSelect: function(e) {
this.cancelChiSelect();
this._chiSelect = {
pai: e,
tiles: []
};
var t = this.node.getChildByName("game") || this.node, i = t.getChildByName("chiHint");
this._chiHintBaked = !!i;
if (null == i) {
(i = new cc.Node("chiHint")).setPosition(0, -200);
t.addChild(i);
var n = i.addComponent(cc.Label);
n.string = "请选择两张手牌";
n.fontSize = 36;
n.lineHeight = 40;
n.overflow = cc.Label.Overflow.NONE;
i.color = cc.color(255, 220, 80);
var a = i.addComponent(cc.LabelOutline);
a.color = cc.color(60, 30, 0);
a.width = 3;
}
i.active = !0;
i.setPosition(0, -200);
this._chiHint = i;
},
cancelChiSelect: function() {
if (this._chiSelect) for (var e = 0; e < this._chiSelect.tiles.length; ++e) {
var t = this._chiSelect.tiles[e];
cc.isValid(t) && (t.y = 0);
}
this._chiSelect = null;
this._chiHint && cc.isValid(this._chiHint) && (this._chiHintBaked ? this._chiHint.active = !1 : this._chiHint.destroy());
this._chiHint = null;
},
hideOptions: function() {
if (null != this._options) {
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
var n = t.getChildByName("btnQiangJin");
n && (n.active = !1);
var a = t.getChildByName("btnYouJin");
a && (a.active = !1);
var o = t.getChildByName("btnYouJinGo");
o && (o.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
this.hideYoujinPanel();
}
},
showAction: function(e) {
this._options.active && this.hideOptions();
var t = !!(e && e.youjin && e.youjin.length > 0);
if (e && (e.hu || e.gang || e.peng || e.chi || e.qiangjin || t || e.youjingo)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var i = 0; i < e.gangpai.length; ++i) {
var n = e.gangpai[i];
this.addOption("btnGang", n);
}
e.chi && this.addChiOption(e.pai);
e.qiangjin && this.addZpOption("btnQiangJin", "抢金", e.pai, 32);
t && this.addZpOption("btnYouJin", "游金", e.pai);
e.youjingo && this.addZpOption("btnYouJinGo", "继续游金", e.pai, 28);
var a = this._options.getChildByName("btnGuo");
a && (a.active = !0);
}
},
initWanfaLabel: function() {
var e = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
if (e) {
var t = e.getComponent(cc.Label);
t && (t.string = cc.vv.gameNetMgr.getWanfa());
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
if (null != t) {
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
i && (i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t));
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var c = t.getChildByName("cs2");
if (c) {
var s = null != i.caishen2 && i.caishen2 >= 0;
c.active = s;
s && a(c, i.caishen2);
}
}
}
}
},
_huaAreaPos: function(e) {
return "myself" == e ? cc.v2(-540, -230) : "up" == e ? cc.v2(430, 210) : "right" == e ? cc.v2(540, 40) : cc.v2(-540, 40);
},
getHuaArea: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e);
if (this._huaAreas[t] && cc.isValid(this._huaAreas[t])) return this._huaAreas[t];
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), o = this._huaAreaPos(i);
a.setPosition(o.x, o.y);
n.addChild(a);
this._huaAreas[t] = a;
return a;
},
initHuaArea: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e] : null;
if (null != t) {
var i = this.getHuaArea(e);
i.removeAllChildren();
var n = t.hua || [];
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, o = 0; o < n.length; ++o) {
var c = n[o], s = new cc.Node("hua" + o);
s.setContentSize(44, 64);
s.setPosition(48 * o + 22, 0);
i.addChild(s);
var l = s.addComponent(cc.Sprite);
l.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var r = c - 34, h = r >= 0 && r < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][r] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) l.spriteFrame = d; else {
var g = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
l.spriteFrame = g;
var u = new cc.Node("name");
s.addChild(u);
var v = u.addComponent(cc.Label);
v.string = r >= 0 && r < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][r] : "花";
v.fontSize = 26;
v.lineHeight = 28;
v.overflow = cc.Label.Overflow.NONE;
v.enableWrapText = !1;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.verticalAlign = cc.Label.VerticalAlign.CENTER;
u.color = cc.color(220, 40, 40);
u.setPosition(0, 0);
}
}
}
},
initAllHuaAreas: function() {
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) {
this.initHuaArea(t);
this.showYoujinLevel(t, e[t].youjinLevel || 0);
}
},
showYoujinLevel: function(e, t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = this._youjinLabels[i];
if (!n || !cc.isValid(n)) {
var a = cc.vv.mahjongmgr.getSide(i), o = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
o.parent.addChild(n);
var c = n.addComponent(cc.Label);
c.fontSize = 30;
c.lineHeight = 34;
c.overflow = cc.Label.Overflow.NONE;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var s = n.addComponent(cc.LabelOutline);
s.color = cc.color(80, 0, 0);
s.width = 2;
this._youjinLabels[i] = n;
}
var l = this.getHuaArea(e);
n.setPosition(l.x, l.y + 80);
if (t > 0) {
n.active = !0;
n.getComponent(cc.Label).string = [ "", "单游", "双游", "三游" ][t] || t + "游";
} else n.active = !1;
},
showYoujinPanel: function(e) {
this.hideYoujinPanel();
if (e && 0 != e.length) {
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 40 + 62 * e.length + 16 * (e.length - 1), n = new cc.Node("youjinPanel");
n.setContentSize(i, 146);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 146);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -73, i, 146);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 28);
c.setPosition(0, 49);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择一张牌宣告游金";
s.fontSize = 22;
s.lineHeight = 28;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = new cc.Node("yjItem" + l);
r.setContentSize(62, 90);
r.setPosition(51 + -i / 2 + 78 * l, -14);
n.addChild(r);
r.addComponent(cc.Button);
r.pai = e[l];
cc.vv.utils.addClickEvent(r, this.node, "MJGameWujin", "onYoujinItemClicked");
var h = r.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[l]);
h.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
this._youjinPanel = n;
}
},
hideYoujinPanel: function() {
this._youjinPanel && cc.isValid(this._youjinPanel) && this._youjinPanel.destroy();
this._youjinPanel = null;
},
onYoujinItemClicked: function(e) {
var t = e.target.pai;
null != t && cc.vv.net.send("youjin", t);
this.hideYoujinPanel();
this.hideOptions();
},
playEfx: function(e, t) {
this._playEfxs[e].node.active = !0;
this._playEfxs[e].play(t);
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), o = this._hupaiTips[a];
o.active = n.hued;
if (n.hued) {
o.getChildByName("sprHu").active = !n.iszimo;
o.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var c = this.node.getChildByName("game"), s = c.getChildByName("huanpaiinfo");
null != s && (s.active = !1);
var l = [ "right", "up", "left" ];
for (t = 0; t < l.length; ++t) {
var r = c.getChildByName(l[t]);
if (null != r) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) r.active = !1; else {
r.active = !0;
var h = r.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.initAllHuaAreas();
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
e && this._isFreshDeal() && this._playDealAnim();
}
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i) {
if (i.folds instanceof Array && i.folds.length > 0) return !1;
if (i.pengs instanceof Array && i.pengs.length > 0) return !1;
if (i.chis instanceof Array && i.chis.length > 0) return !1;
if (i.angangs instanceof Array && i.angangs.length > 0) return !1;
if (i.diangangs instanceof Array && i.diangangs.length > 0) return !1;
if (i.wangangs instanceof Array && i.wangangs.length > 0) return !1;
if (i.hua instanceof Array && i.hua.length > 0) return !1;
}
}
return !0;
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, o) {
if (null != a && 0 != n.length) {
var c = a.convertToNodeSpaceAR(e);
n.sort(o);
for (var s = 0; s < n.length; ++s) {
var l = n[s], r = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: r,
y: h,
op: d
});
l.setPosition(c);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * s), cc.spawn(cc.moveTo(.15, cc.v2(r, h)), cc.fadeTo(.15, d))));
var g = .06 * s + .15;
g > i && (i = g);
}
}
}, a = [], o = null, c = 0; c < this._myMJArr.length; ++c) {
var s = this._myMJArr[c];
if (s && s.node && s.node.active && null != s.node.mjId) {
a.push(s.node);
o = s.node.parent;
}
}
n(a, o, function(e, t) {
return e.x - t.x;
});
for (var l = this.node.getChildByName("game"), r = cc.vv.gameNetMgr.seats || [], h = 0; h < r.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var g = cc.vv.mahjongmgr.getSide(d), u = l ? l.getChildByName(g) : null, v = u ? u.getChildByName("holds") : null;
if (null != v) {
for (var m = [], p = 0; p < v.childrenCount; ++p) {
var f = v.children[p];
f.active && m.push(f);
}
n(m, v, "up" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).x - e.convertToWorldSpaceAR(cc.v2(0, 0)).x;
} : "left" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).y - e.convertToWorldSpaceAR(cc.v2(0, 0)).y;
} : function(e, t) {
return e.convertToWorldSpaceAR(cc.v2(0, 0)).y - t.convertToWorldSpaceAR(cc.v2(0, 0)).y;
});
}
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var _ = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == _) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
}
}, i + .05);
}
},
_cancelDealAnim: function() {
if (this._dealAnimating) {
this._dealAnimating = !1;
this._dealAnimId = (this._dealAnimId || 0) + 1;
for (var e = this._dealAnimNodes || [], t = 0; t < e.length; ++t) {
var i = e[t];
if (cc.isValid(i.node)) {
i.node.stopAllActions();
i.node.setPosition(i.x, i.y);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
_findMJNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null; t && null == t.mjId && t.parent; ) t = t.parent;
return t;
},
_findBtnNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null, i = {
btnPeng: 1,
btnGang: 1,
btnHu: 1,
btnGuo: 1,
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, c = n[1].mjId, s = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, c, s ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var l = this._findMJNode(e);
if (null != l) for (var r = 0; r < this._myMJArr.length; ++r) if (l == this._myMJArr[r].node) {
if (l == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
l.y = 15;
this._selectedMJ = l;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? 13 - t : t;
},
initMopai: function(e, t) {
this._cancelDealAnim();
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = cc.vv.mahjongmgr.getSide(i), a = cc.vv.mahjongmgr.getFoldPre(i), o = this.node.getChildByName("game").getChildByName(n).getChildByName("holds"), c = this.getMJIndex(n, 13), s = o.children[c];
if (null != s) {
s.scaleX = 1;
s.scaleY = 1;
if (null == t) s.active = !1; else if (t >= 0) {
s.active = !0;
if ("up" == n) {
s.scaleX = .73;
s.scaleY = .73;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a, t);
} else if (null != t) {
s.active = !0;
if ("up" == n) {
s.scaleX = 1;
s.scaleY = 1;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(n);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), o = 0; o < n.childrenCount; ++o) {
var c = n.children[o];
c.scaleX = 1;
c.scaleY = 1;
c.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, o = a ? a.getChildByName("holds") : null;
if (null != o) {
var c = e.chis || [], s = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + c.length;
s *= 3;
for (var l = 0; l < s; ++l) {
var r = this.getMJIndex(i, l);
null != o.children[r] && (o.children[r].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (l = 0; l < d.length; ++l) {
r = this.getMJIndex(i, l + s);
if (null != o.children[r]) {
var g = o.children[r].getComponent(cc.Sprite);
if (null != g) {
if ("up" == i) {
g.node.scaleX = .73;
g.node.scaleY = .73;
}
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[l]);
}
}
}
this._hideUnusedHolds(i, o, s + d.length);
} else {
var u = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (l = s; l < s + u; ++l) {
r = this.getMJIndex(i, l);
var v = o.children[r];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, s + u);
}
}
}
}
},
_hideUnusedHolds: function(e, t, i) {
for (var n = i; n < 14; ++n) {
var a = this.getMJIndex(e, n);
null != t.children[a] && (t.children[a].active = !1);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var o = cc.vv.gameNetMgr.conf, c = o ? o.caishen : -1, s = o ? o.caishen2 : -1, l = [], r = [], h = 0; h < i.length; ++h) {
var d = i[h];
c >= 0 && d == c || null != s && s >= 0 && d == s ? l.push(d) : r.push(d);
}
cc.vv.mahjongmgr.sortMJ(r);
i.length = 0;
for (var g = 0; g < l.length; ++g) i.push(l[g]);
for (var u = 0; u < r.length; ++u) i.push(r[u]);
null != n && i.push(n);
return i;
},
initMahjongs: function(e, t) {
this._cancelDealAnim();
var i = t || this.getSelfSeatData();
console.log("[initMahjongs] allowMopai=", e, "forceSeatData=", !!t, "seatData.holds=", i ? "object" == typeof i.holds ? i.holds.length + ":" + JSON.stringify(i.holds) : i.holds : "null");
if (null != i && null != i.holds && "object" == typeof i.holds && null != i.holds.length) {
var n = this.sortHolds(i, e);
if (null != n) {
this._selectedMJ = null;
var a, o = i.chis || [], c = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + o.length), s = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (s = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (s = 0);
a = s > 0 ? .5 * s : 20;
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), r = this._myMJArr[c], h = r ? r.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", c, "holds.length=", n.length, "startSlot=", c, "endSlot=", c + n.length - 1);
for (var d = cc.vv.gameNetMgr.conf, g = d ? d.caishen : -1, u = d ? d.caishen2 : -1, v = [], m = 0; m < n.length; ++m) {
var p = n[m];
if (null == (C = this._myMJArr[m + c]) || null == C.node) {
v.push("SLOT_" + (m + c) + "=NULL");
break;
}
C.node.mjId = p;
C.node.y = 0;
var f = l && m == n.length - 1;
s > 0 && (C.node.x = h + m * s + (f ? a : 0));
this.setSpriteFrameByMJID("M_", C, p);
var _ = g >= 0 && p == g || null != u && u >= 0 && p == u;
C.node.color = _ ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (m + c) + "=" + p);
}
console.log("[initMahjongs] render:", v.join("|"));
for (m = 0; m < c; ++m) if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
for (m = c + n.length; m < this._myMJArr.length; ++m) {
var C;
if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
},
getSelfSeatData: function() {
var e = cc.vv.gameNetMgr, t = e ? e.seats : null;
if (!t) return null;
var i = e.seatIndex;
if (null != i && i >= 0 && i < t.length && t[i]) return t[i];
var n = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != n) for (var a = 0; a < t.length; ++a) if (t[a] && t[a].userid == n) return t[a];
return null;
},
getLocalIndex: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
return (e - cc.vv.gameNetMgr.seatIndex + t) % t;
},
showChiPanel: function(e) {
this.hideChiPanel();
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 36 + 146 * e.length + 30 * (e.length - 1), n = new cc.Node("chiPanel");
n.setContentSize(i, 120);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 120);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -60, i, 120);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 26);
c.setPosition(0, 37);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择吃牌组合";
s.fontSize = 22;
s.lineHeight = 26;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = e[l], h = new cc.Node("chiItem" + l);
h.setContentSize(146, 66);
h.setPosition(91 + -i / 2 + 176 * l, -13);
n.addChild(h);
h.addComponent(cc.Button);
h.paiList = r;
cc.vv.utils.addClickEvent(h, this.node, "MJGameWujin", "onChiItemClicked");
for (var d = 0; d < r.length; ++d) {
var g = new cc.Node("p" + d);
g.setContentSize(46, 66);
g.setPosition(50 * d - 50, 0);
h.addChild(g);
var u = g.addComponent(cc.Sprite);
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", r[d]);
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = n;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e.target.paiList;
t && cc.vv.net.send("chi", t);
this.hideChiPanel();
this.hideOptions();
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i || "btnQiangJin" == i) cc.vv.net.send("hu"); else {
if ("btnYouJin" == i) {
var n = cc.vv.gameNetMgr.curaction, a = n && n.youjin ? n.youjin : this._lastYoujin || [];
this._lastYoujin = a;
this.showYoujinPanel(a);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameZJLAO: [ function(e, t) {
"use strict";
cc._RF.push(t, "5a27cg14QhP2qTfnlzcTacT", "MJGameZJLAO");
cc.Class({
extends: cc.Component,
properties: {
gameRoot: {
default: null,
type: cc.Node
},
prepareRoot: {
default: null,
type: cc.Node
},
_myMJArr: [],
_options: null,
_selectedMJ: null,
_chupaiSprite: [],
_mjcount: null,
_gamecount: null,
_hupaiTips: [],
_hupaiLists: [],
_playEfxs: [],
_opts: [],
_chiPanel: null,
_chiSelect: null,
_chiHint: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0
},
onLoad: function() {
var e = this.node.getComponent(cc.Canvas);
if (null != e) {
if (!cc.sys.isNative) {
e.fitHeight = !0;
e.fitWidth = !1;
for (var t = cc.director.getScene().getComponentsInChildren(cc.Camera), i = 0; i < t.length; i++) {
t[i].clearFlags = cc.Camera.ClearFlags.COLOR;
t[i].backgroundColor = cc.color(30, 18, 12);
}
}
if (cc.vv) {
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
}
},
initView: function() {
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var t = this._mjcount.node, i = this._gamecount.node;
this.scheduleOnce(function() {
cc.isValid(t) && cc.isValid(i) && t.setPosition(i.x - i.width / 2 - t.width / 2 - 12, i.y);
}, 0);
for (var n = e.getChildByName("myself").getChildByName("holds"), a = 0; a < n.children.length; ++a) {
var o = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(o);
o.spriteFrame = null;
}
for (a = 0; a < this._myMJArr.length; ++a) {
var c = this._myMJArr[a].node.getComponent(cc.Button);
if (null != c) {
var s = new cc.Component.EventHandler();
s.target = this.node;
s.component = "MJGameZJLAO";
s.handler = "onMJClicked";
s.customEventData = "";
c.clickEvents = [ s ];
}
}
var l = cc.view.getVisibleSize().width / 1280;
if (l < 1) {
n.scaleX *= l;
n.scaleY *= l;
}
var r = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < r; ++a) {
var h = cc.vv.mahjongmgr.getSide(a), d = e.getChildByName(h);
if (null != d) {
this._hupaiTips.push(d.getChildByName("HuPai"));
this._hupaiLists.push(d.getChildByName("hupailist"));
this._playEfxs.push(d.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(d.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var g = d.getChildByName("opt");
g.active = !1;
o = g.getChildByName("pai").getComponent(cc.Sprite);
var u = {
node: g,
sprite: o
};
this._opts.push(u);
}
}
var v = e.getChildByName("ops");
this._options = v;
var m = v ? v.getChildByName("New Layout") : null;
if (m) {
var p = m.getComponent(cc.Button);
p && (p.enabled = !1);
m.active = !1;
}
this.hideOptions();
this.hideChupai();
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
initEventHandlers: function() {
cc.vv.gameNetMgr.dataEventHandler = this.node;
var e = cc.vv.gameNetMgr;
if ("begin" == e.gamestate && e.seats) {
for (var t = !1, i = 0; i < e.seats.length; ++i) {
var n = e.seats[i];
if (n && n.holds instanceof Array && n.holds.length > 0) {
t = !0;
break;
}
}
if (t) {
var a = this.node;
this.scheduleOnce(function() {
if (cc.isValid(a)) {
a.emit("game_num", {
detail: e.numOfGames
});
a.emit("mj_count", {
detail: null
});
a.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
a.emit("game_action", {
detail: t
});
}
}
}, 0);
}
}
var o = this;
this.node.on("game_start", function(e) {
try {
o.onGameBeign(!0, e && e.detail);
} catch (e) {
console.error("[ZJLAO] onGameBeign error:", e);
}
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.audioMgr.playSFX("nv/hu.mp3");
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
},
showChupai: function() {
var e = cc.vv.gameNetMgr.chupai;
if (e >= 0) {
var t = this.getLocalIndex(cc.vv.gameNetMgr.turn), i = this._chupaiSprite[t];
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
i.node.active = !0;
}
},
addOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var n = this._options.children[i];
if ("op" == n.name && 0 == n.active) {
n.active = !0;
n.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
var a = n.getChildByName(e);
a.active = !0;
a.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
i.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
var n = this.getChiButton(i);
if (n) {
n.active = !0;
n.pai = e;
}
return;
}
}
},
getChiButton: function(e) {
var t = e.getChildByName("btnChi");
if (t) {
if (!t._chiBound) {
t._chiBound = !0;
cc.vv.utils.addClickEvent(t, this.node, "MJGameZJLAO", "onOptionClicked");
}
return t;
}
var i = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (i) {
t.setPosition(i.getPosition());
t.setContentSize(i.getContentSize());
t.scaleX = i.scaleX;
t.scaleY = i.scaleY;
}
var n = t.addComponent(cc.Sprite);
n.type = cc.Sprite.Type.SIMPLE;
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, i) {
if (!e && i && cc.isValid(t)) {
var n = t.getComponent(cc.Sprite);
n && (n.spriteFrame = i);
}
});
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, i) {
var n = i ? i.getSpriteFrame("mj_btn_chi.png") : null;
if (n && cc.isValid(t)) {
var a = t.getComponent(cc.Sprite);
a && (a.spriteFrame = n);
var o = t.getChildByName("btnLabel");
o && (o.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var o = a.addComponent(cc.Label);
o.string = "吃";
o.fontSize = 40;
o.lineHeight = 40;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameZJLAO", "onOptionClicked");
t.active = !1;
return t;
},
enterChiSelect: function(e) {
this.cancelChiSelect();
this._chiSelect = {
pai: e,
tiles: []
};
var t = this.node.getChildByName("game") || this.node, i = t.getChildByName("chiHint");
this._chiHintBaked = !!i;
if (null == i) {
(i = new cc.Node("chiHint")).setPosition(0, -200);
t.addChild(i);
var n = i.addComponent(cc.Label);
n.string = "请选择两张手牌";
n.fontSize = 36;
n.lineHeight = 40;
n.overflow = cc.Label.Overflow.NONE;
i.color = cc.color(255, 220, 80);
var a = i.addComponent(cc.LabelOutline);
a.color = cc.color(60, 30, 0);
a.width = 3;
}
i.active = !0;
i.setPosition(0, -200);
this._chiHint = i;
},
cancelChiSelect: function() {
if (this._chiSelect) for (var e = 0; e < this._chiSelect.tiles.length; ++e) {
var t = this._chiSelect.tiles[e];
cc.isValid(t) && (t.y = 0);
}
this._chiSelect = null;
this._chiHint && cc.isValid(this._chiHint) && (this._chiHintBaked ? this._chiHint.active = !1 : this._chiHint.destroy());
this._chiHint = null;
},
hideOptions: function() {
if (null != this._options) {
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
}
},
showAction: function(e) {
this._options.active && this.hideOptions();
if (e && (e.hu || e.gang || e.peng || e.chi)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var t = 0; t < e.gangpai.length; ++t) {
var i = e.gangpai[t];
this.addOption("btnGang", i);
}
e.chi && this.addChiOption(e.pai);
var n = this._options.getChildByName("btnGuo");
n && (n.active = !0);
}
},
initWanfaLabel: function() {
var e = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
if (e) {
var t = e.getComponent(cc.Label);
t && (t.string = cc.vv.gameNetMgr.getWanfa());
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
if (null != t) {
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
t.setSiblingIndex(t.parent.childrenCount - 1);
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
if (i) {
i.enabled = !0;
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
}
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var c = t.getChildByName("cs2");
if (c) {
var s = null != i.caishen2 && i.caishen2 >= 0;
c.active = s;
s && a(c, i.caishen2);
}
}
}
}
},
playEfx: function(e, t) {
this._playEfxs[e].node.active = !0;
this._playEfxs[e].play(t);
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), o = this._hupaiTips[a];
o.active = n.hued;
if (n.hued) {
o.getChildByName("sprHu").active = !n.iszimo;
o.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var c = this.node.getChildByName("game"), s = c.getChildByName("huanpaiinfo");
null != s && (s.active = !1);
var l = [ "right", "up", "left" ];
for (t = 0; t < l.length; ++t) {
var r = c.getChildByName(l[t]);
if (null != r) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) r.active = !1; else {
r.active = !0;
var h = r.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
e && this._isFreshDeal() && this._playDealAnim();
}
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i) {
if (i.folds instanceof Array && i.folds.length > 0) return !1;
if (i.pengs instanceof Array && i.pengs.length > 0) return !1;
if (i.chis instanceof Array && i.chis.length > 0) return !1;
if (i.angangs instanceof Array && i.angangs.length > 0) return !1;
if (i.diangangs instanceof Array && i.diangangs.length > 0) return !1;
if (i.wangangs instanceof Array && i.wangangs.length > 0) return !1;
if (i.hua instanceof Array && i.hua.length > 0) return !1;
}
}
return !0;
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, o) {
if (null != a && 0 != n.length) {
var c = a.convertToNodeSpaceAR(e);
n.sort(o);
for (var s = 0; s < n.length; ++s) {
var l = n[s], r = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: r,
y: h,
op: d
});
l.setPosition(c);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * s), cc.spawn(cc.moveTo(.15, cc.v2(r, h)), cc.fadeTo(.15, d))));
var g = .06 * s + .15;
g > i && (i = g);
}
}
}, a = [], o = null, c = 0; c < this._myMJArr.length; ++c) {
var s = this._myMJArr[c];
if (s && s.node && s.node.active && null != s.node.mjId) {
a.push(s.node);
o = s.node.parent;
}
}
n(a, o, function(e, t) {
return e.x - t.x;
});
for (var l = this.node.getChildByName("game"), r = cc.vv.gameNetMgr.seats || [], h = 0; h < r.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var g = cc.vv.mahjongmgr.getSide(d), u = l ? l.getChildByName(g) : null, v = u ? u.getChildByName("holds") : null;
if (null != v) {
for (var m = [], p = 0; p < v.childrenCount; ++p) {
var f = v.children[p];
f.active && m.push(f);
}
n(m, v, "up" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).x - e.convertToWorldSpaceAR(cc.v2(0, 0)).x;
} : "left" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).y - e.convertToWorldSpaceAR(cc.v2(0, 0)).y;
} : function(e, t) {
return e.convertToWorldSpaceAR(cc.v2(0, 0)).y - t.convertToWorldSpaceAR(cc.v2(0, 0)).y;
});
}
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var _ = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == _) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
}
}, i + .05);
}
},
_cancelDealAnim: function() {
if (this._dealAnimating) {
this._dealAnimating = !1;
this._dealAnimId = (this._dealAnimId || 0) + 1;
for (var e = this._dealAnimNodes || [], t = 0; t < e.length; ++t) {
var i = e[t];
if (cc.isValid(i.node)) {
i.node.stopAllActions();
i.node.setPosition(i.x, i.y);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
_findMJNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null; t && null == t.mjId && t.parent; ) t = t.parent;
return t;
},
_findBtnNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null, i = {
btnPeng: 1,
btnGang: 1,
btnHu: 1,
btnGuo: 1,
btnChi: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, c = n[1].mjId, s = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, c, s ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var l = this._findMJNode(e);
if (null != l) for (var r = 0; r < this._myMJArr.length; ++r) if (l == this._myMJArr[r].node) {
if (l == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
l.y = 15;
this._selectedMJ = l;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? 13 - t : t;
},
initMopai: function(e, t) {
this._cancelDealAnim();
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = cc.vv.mahjongmgr.getSide(i), a = cc.vv.mahjongmgr.getFoldPre(i), o = this.node.getChildByName("game").getChildByName(n).getChildByName("holds"), c = this.getMJIndex(n, 13), s = o.children[c];
if (null != s) {
s.scaleX = 1;
s.scaleY = 1;
if (null == t) s.active = !1; else if (t >= 0) {
s.active = !0;
if ("up" == n) {
s.scaleX = .73;
s.scaleY = .73;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a, t);
} else if (null != t) {
s.active = !0;
if ("up" == n) {
s.scaleX = 1;
s.scaleY = 1;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(n);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), o = 0; o < n.childrenCount; ++o) {
var c = n.children[o];
c.scaleX = 1;
c.scaleY = 1;
c.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, o = a ? a.getChildByName("holds") : null;
if (null != o) {
var c = e.chis || [], s = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + c.length;
s *= 3;
for (var l = 0; l < s; ++l) {
var r = this.getMJIndex(i, l);
null != o.children[r] && (o.children[r].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (l = 0; l < d.length; ++l) {
r = this.getMJIndex(i, l + s);
if (null != o.children[r]) {
var g = o.children[r].getComponent(cc.Sprite);
if (null != g) {
if ("up" == i) {
g.node.scaleX = .73;
g.node.scaleY = .73;
}
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[l]);
}
}
}
this._hideUnusedHolds(i, o, s + d.length);
} else {
var u = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (l = s; l < s + u; ++l) {
r = this.getMJIndex(i, l);
var v = o.children[r];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, s + u);
}
}
}
}
},
_hideUnusedHolds: function(e, t, i) {
for (var n = i; n < 14; ++n) {
var a = this.getMJIndex(e, n);
null != t.children[a] && (t.children[a].active = !1);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var o = cc.vv.gameNetMgr.conf, c = o ? o.caishen : -1, s = o ? o.caishen2 : -1, l = [], r = [], h = 0; h < i.length; ++h) {
var d = i[h];
c >= 0 && d == c || null != s && s >= 0 && d == s ? l.push(d) : r.push(d);
}
cc.vv.mahjongmgr.sortMJ(r);
i.length = 0;
for (var g = 0; g < l.length; ++g) i.push(l[g]);
for (var u = 0; u < r.length; ++u) i.push(r[u]);
null != n && i.push(n);
return i;
},
initMahjongs: function(e, t) {
this._cancelDealAnim();
var i = t || this.getSelfSeatData();
console.log("[initMahjongs] allowMopai=", e, "forceSeatData=", !!t, "seatData.holds=", i ? "object" == typeof i.holds ? i.holds.length + ":" + JSON.stringify(i.holds) : i.holds : "null");
if (null != i && null != i.holds && "object" == typeof i.holds && null != i.holds.length) {
var n = this.sortHolds(i, e);
if (null != n) {
this._selectedMJ = null;
var a, o = i.chis || [], c = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + o.length), s = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (s = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (s = 0);
a = s > 0 ? .5 * s : 20;
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), r = this._myMJArr[c], h = r ? r.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", c, "holds.length=", n.length, "startSlot=", c, "endSlot=", c + n.length - 1);
for (var d = [], g = 0; g < n.length; ++g) {
var u = n[g];
if (null == (m = this._myMJArr[g + c]) || null == m.node) {
d.push("SLOT_" + (g + c) + "=NULL");
break;
}
m.node.mjId = u;
m.node.y = 0;
var v = l && g == n.length - 1;
s > 0 && (m.node.x = h + g * s + (v ? a : 0));
this.setSpriteFrameByMJID("M_", m, u);
d.push("SLOT_" + (g + c) + "=" + u);
}
console.log("[initMahjongs] render:", d.join("|"));
for (g = 0; g < c; ++g) if (null != (m = this._myMJArr[g]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
}
for (g = c + n.length; g < this._myMJArr.length; ++g) {
var m;
if (null != (m = this._myMJArr[g]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
},
getSelfSeatData: function() {
var e = cc.vv.gameNetMgr, t = e ? e.seats : null;
if (!t) return null;
var i = e.seatIndex;
if (null != i && i >= 0 && i < t.length && t[i]) return t[i];
var n = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != n) for (var a = 0; a < t.length; ++a) if (t[a] && t[a].userid == n) return t[a];
return null;
},
getLocalIndex: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
return (e - cc.vv.gameNetMgr.seatIndex + t) % t;
},
showChiPanel: function(e) {
this.hideChiPanel();
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 36 + 146 * e.length + 30 * (e.length - 1), n = new cc.Node("chiPanel");
n.setContentSize(i, 120);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 120);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -60, i, 120);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 26);
c.setPosition(0, 37);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择吃牌组合";
s.fontSize = 22;
s.lineHeight = 26;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = e[l], h = new cc.Node("chiItem" + l);
h.setContentSize(146, 66);
h.setPosition(91 + -i / 2 + 176 * l, -13);
n.addChild(h);
h.addComponent(cc.Button);
h.paiList = r;
cc.vv.utils.addClickEvent(h, this.node, "MJGameZJLAO", "onChiItemClicked");
for (var d = 0; d < r.length; ++d) {
var g = new cc.Node("p" + d);
g.setContentSize(46, 66);
g.setPosition(50 * d - 50, 0);
h.addChild(g);
var u = g.addComponent(cc.Sprite);
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", r[d]);
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = n;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e.target.paiList;
t && cc.vv.net.send("chi", t);
this.hideChiPanel();
this.hideOptions();
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i) cc.vv.net.send("hu"); else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameZJZX: [ function(e, t) {
"use strict";
cc._RF.push(t, "9d93eTiWw9J7psIXQw8O3BB", "MJGameZJZX");
cc.Class({
extends: cc.Component,
properties: {
gameRoot: {
default: null,
type: cc.Node
},
prepareRoot: {
default: null,
type: cc.Node
},
_myMJArr: [],
_options: null,
_selectedMJ: null,
_chupaiSprite: [],
_mjcount: null,
_gamecount: null,
_hupaiTips: [],
_hupaiLists: [],
_playEfxs: [],
_opts: [],
_chiPanel: null,
_chiSelect: null,
_chiHint: null,
_huaAreas: [],
_youjinLabels: [],
_youjinPanel: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0,
_pendingPlans: null,
_caishenPlanPanel: null,
_countdownLabel: null,
_countdownId: null,
_countdownSec: 0
},
onLoad: function() {
try {
var e = this.node.getComponent(cc.Canvas);
if (null == e) return;
if (!cc.sys.isNative) {
e.fitHeight = !0;
e.fitWidth = !1;
for (var t = cc.director.getScene().getComponentsInChildren(cc.Camera), i = 0; i < t.length; i++) {
t[i].clearFlags = cc.Camera.ClearFlags.COLOR;
t[i].backgroundColor = cc.color(30, 18, 12);
}
}
if (!cc.vv) {
cc.director.loadScene("loading");
return;
}
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
this.initCaishenPlanPanel();
if (cc.vv.gameNetMgr.waitCaishenPlans && cc.vv.gameNetMgr.waitCaishenPlans.length > 0) {
this._pendingPlans = cc.vv.gameNetMgr.waitCaishenPlans;
cc.vv.gameNetMgr.waitCaishenPlans = null;
this.showCaishenPlanPanel();
}
cc.vv.audioMgr.playBGM("bgFight.mp3");
} catch (e) {
console.error("[ZJZX] onLoad CRASH:", e.message);
console.error(e.stack);
}
},
initView: function() {
this._selectedMJ = null;
this._chiSelect = null;
this._pendingPlans = null;
this._opts = [];
this._caishenPlanPanel && (this._caishenPlanPanel.active = !1);
this._chiHint && (this._chiHint.active = !1);
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var t = this.node.getChildByName("infobar");
if (t) {
this._countdownLabel = t.getChildByName("countdownLabel");
this._countdownLabel && !this._countdownLabel.getComponent(cc.Label) && this._countdownLabel.addComponent(cc.Label);
}
var i = this._mjcount.node, n = this._gamecount.node;
this.scheduleOnce(function() {
cc.isValid(i) && cc.isValid(n) && i.setPosition(n.x - n.width / 2 - i.width / 2 - 12, n.y);
}, 0);
for (var a = e.getChildByName("myself").getChildByName("holds"), o = 0; o < a.children.length; ++o) {
var c = a.children[o].getComponent(cc.Sprite);
this._myMJArr.push(c);
c.spriteFrame = null;
}
var s = cc.view.getVisibleSize().width / 1280;
if (s < 1) {
a.scaleX *= s;
a.scaleY *= s;
}
var l = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (o = 0; o < l; ++o) {
var r = cc.vv.mahjongmgr.getSide(o), h = e.getChildByName(r);
if (null != h) {
this._hupaiTips.push(h.getChildByName("HuPai"));
this._hupaiLists.push(h.getChildByName("hupailist"));
this._playEfxs.push(h.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(h.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var d = h.getChildByName("opt");
d.active = !1;
c = d.getChildByName("pai").getComponent(cc.Sprite);
var g = {
node: d,
sprite: c
};
this._opts.push(g);
}
}
var u = e.getChildByName("ops");
this._options = u;
if (u) for (var v = 0; v < u.childrenCount; ++v) {
var m = u.children[v];
if ("op" == m.name) {
var p = m.getChildByName("btnChi");
if (p) {
var f = p.getComponent(cc.Button);
f && 0 == f.clickEvents.length && cc.vv.utils.addClickEvent(p, this.node, "MJGameZJZX", "onOptionClicked");
}
}
}
var _ = u ? u.getChildByName("New Layout") : null;
if (_) {
var C = _.getComponent(cc.Button);
C && (C.enabled = !1);
_.active = !1;
}
this.hideOptions();
this.hideChupai();
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
initEventHandlers: function() {
cc.vv.gameNetMgr.dataEventHandler = this.node;
var e = cc.vv.gameNetMgr;
if ("begin" == e.gamestate && e.seats) {
for (var t = !1, i = 0; i < e.seats.length; ++i) {
var n = e.seats[i];
if (n && n.holds instanceof Array && n.holds.length > 0) {
t = !0;
break;
}
}
if (t) {
var a = this.node, o = this;
this.scheduleOnce(function() {
if (cc.isValid(a)) {
a.emit("game_num", {
detail: e.numOfGames
});
a.emit("mj_count", {
detail: null
});
a.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
a.emit("game_action", {
detail: t
});
}
if (e.waitCaishenPlans && e.waitCaishenPlans.length > 0) {
o._pendingPlans = e.waitCaishenPlans;
e.waitCaishenPlans = null;
o.showCaishenPlanPanel();
}
}
}, 0);
}
}
(o = this)._pendingPlans = null;
this.node.on("game_start", function(e) {
o.onGameBeign(!0, e && e.detail);
o.initCaishenTip();
cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex && o._startCountdown();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("bao_result", function() {
o.initCaishenTip();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o._stopCountdown();
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
if (0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex)) {
o._startCountdown();
o.initMahjongs(!0);
} else cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.audioMgr.playSFX("nv/hu.mp3");
});
this.node.on("game_caishen_plans", function(e) {
if ((e = e.detail) && e.plans && 0 !== e.plans.length) {
o._pendingPlans = e.plans;
o.showCaishenPlanPanel();
}
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
o.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o.initHuaArea(t.si);
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && o.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
},
showChupai: function() {
var e = cc.vv.gameNetMgr.chupai;
if (e >= 0) {
var t = this.getLocalIndex(cc.vv.gameNetMgr.turn), i = this._chupaiSprite[t];
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
i.node.active = !0;
}
},
addOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var n = this._options.children[i];
if ("op" == n.name && 0 == n.active) {
n.active = !0;
n.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
var a = n.getChildByName(e);
a.active = !0;
a.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
i.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
var n = this.getChiButton(i);
if (n) {
n.active = !0;
n.pai = e;
}
return;
}
}
},
getChiButton: function(e) {
var t = e.getChildByName("btnChi");
if (t) return t;
var i = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (i) {
t.setPosition(i.getPosition());
t.setContentSize(i.getContentSize());
t.scaleX = i.scaleX;
t.scaleY = i.scaleY;
}
var n = t.addComponent(cc.Sprite);
n.type = cc.Sprite.Type.SIMPLE;
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/atlas/other_a/btn_red3", cc.SpriteFrame, function(e, i) {
if (!e && i && cc.isValid(t)) {
var n = t.getComponent(cc.Sprite);
n && (n.spriteFrame = i);
}
});
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, i) {
var n = i ? i.getSpriteFrame("mj_btn_chi.png") : null;
if (n && cc.isValid(t)) {
var a = t.getComponent(cc.Sprite);
a && (a.spriteFrame = n);
var o = t.getChildByName("btnLabel");
o && (o.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var o = a.addComponent(cc.Label);
o.string = "吃";
o.fontSize = 40;
o.lineHeight = 40;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameZJZX", "onOptionClicked");
t.active = !1;
return t;
},
getZpOpButton: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a) return a;
var o = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (o) {
a.setPosition(o.getPosition());
a.setContentSize(o.getContentSize());
a.scaleX = o.scaleX;
a.scaleY = o.scaleY;
}
var c = a.addComponent(cc.Sprite);
c.type = cc.Sprite.Type.SIMPLE;
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/atlas/other_a/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var s = new cc.Node("btnLabel");
a.addChild(s);
var l = s.addComponent(cc.Label);
l.string = i;
l.fontSize = n || 40;
l.lineHeight = l.fontSize;
l.overflow = cc.Label.Overflow.NONE;
l.enableWrapText = !1;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 255, 255);
s.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameZJZX", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var o = this._options.children[a];
if ("op" == o.name && 0 == o.active) {
o.active = !0;
o.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var c = this.getZpOpButton(o, e, t, n);
c.active = !0;
c.pai = i;
return;
}
}
},
enterChiSelect: function(e) {
this.cancelChiSelect();
this._chiSelect = {
pai: e,
tiles: []
};
var t = this.node.getChildByName("game") || this.node, i = t.getChildByName("chiHint");
this._chiHintBaked = !!i;
if (null == i) {
(i = new cc.Node("chiHint")).setPosition(0, -200);
t.addChild(i);
var n = i.addComponent(cc.Label);
n.string = "请选择两张手牌";
n.fontSize = 36;
n.lineHeight = 40;
n.overflow = cc.Label.Overflow.NONE;
i.color = cc.color(255, 220, 80);
var a = i.addComponent(cc.LabelOutline);
a.color = cc.color(60, 30, 0);
a.width = 3;
}
i.active = !0;
i.setPosition(0, -200);
this._chiHint = i;
},
cancelChiSelect: function() {
if (this._chiSelect) for (var e = 0; e < this._chiSelect.tiles.length; ++e) {
var t = this._chiSelect.tiles[e];
cc.isValid(t) && (t.y = 0);
}
this._chiSelect = null;
this._chiHint && cc.isValid(this._chiHint) && (this._chiHintBaked ? this._chiHint.active = !1 : this._chiHint.destroy());
this._chiHint = null;
},
hideOptions: function() {
if (null != this._options) {
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
var n = t.getChildByName("btnQiangJin");
n && (n.active = !1);
var a = t.getChildByName("btnYouJin");
a && (a.active = !1);
var o = t.getChildByName("btnYouJinGo");
o && (o.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
this.hideYoujinPanel();
}
},
showAction: function(e) {
this.hideCaishenPlanPanel();
this._options.active && this.hideOptions();
var t = this._options.getChildByName("New Layout");
t && (t.active = !1);
var i = !!(e && e.youjin && e.youjin.length > 0);
if (e && (e.hu || e.gang || e.peng || e.chi || e.qiangjin || i || e.youjingo)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var n = 0; n < e.gangpai.length; ++n) {
var a = e.gangpai[n];
this.addOption("btnGang", a);
}
e.chi && this.addChiOption(e.pai);
e.qiangjin && this.addZpOption("btnQiangJin", "抢金", e.pai, 32);
i && this.addZpOption("btnYouJin", "游金", e.pai);
e.youjingo && this.addZpOption("btnYouJinGo", "继续游金", e.pai, 28);
var o = this._options.getChildByName("btnGuo");
o && (o.active = !0);
}
},
initWanfaLabel: function() {
var e = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
if (null != e) {
var t = e.getComponent(cc.Label);
t && (t.string = cc.vv.gameNetMgr.getWanfa());
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
null != t && (t.active = !1);
}
},
_huaAreaPos: function(e) {
return "myself" == e ? cc.v2(-540, -230) : "up" == e ? cc.v2(430, 210) : "right" == e ? cc.v2(540, 40) : cc.v2(-540, 40);
},
getHuaArea: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e);
if (this._huaAreas[t] && cc.isValid(this._huaAreas[t])) return this._huaAreas[t];
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), o = this._huaAreaPos(i);
a.setPosition(o.x, o.y);
n.addChild(a);
this._huaAreas[t] = a;
return a;
},
initHuaArea: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e] : null;
if (null != t) {
var i = this.getHuaArea(e);
i.removeAllChildren();
var n = t.hua || [];
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, o = 0; o < n.length; ++o) {
var c = n[o], s = new cc.Node("hua" + o);
s.setContentSize(44, 64);
s.setPosition(48 * o + 22, 0);
i.addChild(s);
var l = s.addComponent(cc.Sprite);
l.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var r = c - 34, h = r >= 0 && r < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][r] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) l.spriteFrame = d; else {
var g = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
l.spriteFrame = g;
var u = new cc.Node("name");
s.addChild(u);
var v = u.addComponent(cc.Label);
v.string = r >= 0 && r < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][r] : "花";
v.fontSize = 26;
v.lineHeight = 28;
v.overflow = cc.Label.Overflow.NONE;
v.enableWrapText = !1;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.verticalAlign = cc.Label.VerticalAlign.CENTER;
u.color = cc.color(220, 40, 40);
u.setPosition(0, 0);
}
}
}
},
initAllHuaAreas: function() {
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) {
this.initHuaArea(t);
this.showYoujinLevel(t, e[t].youjinLevel || 0);
}
},
showYoujinLevel: function(e, t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = this._youjinLabels[i];
if (!n || !cc.isValid(n)) {
var a = cc.vv.mahjongmgr.getSide(i), o = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
o.parent.addChild(n);
var c = n.addComponent(cc.Label);
c.fontSize = 30;
c.lineHeight = 34;
c.overflow = cc.Label.Overflow.NONE;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var s = n.addComponent(cc.LabelOutline);
s.color = cc.color(80, 0, 0);
s.width = 2;
this._youjinLabels[i] = n;
}
var l = this.getHuaArea(e);
n.setPosition(l.x, l.y + 80);
if (t > 0) {
n.active = !0;
n.getComponent(cc.Label).string = [ "", "单游", "双游", "三游" ][t] || t + "游";
} else n.active = !1;
},
showYoujinPanel: function(e) {
this.hideYoujinPanel();
if (e && 0 != e.length) {
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 40 + 62 * e.length + 16 * (e.length - 1), n = new cc.Node("youjinPanel");
n.setContentSize(i, 146);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 146);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -73, i, 146);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 28);
c.setPosition(0, 49);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择一张牌宣告游金";
s.fontSize = 22;
s.lineHeight = 28;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = new cc.Node("yjItem" + l);
r.setContentSize(62, 90);
r.setPosition(51 + -i / 2 + 78 * l, -14);
n.addChild(r);
r.addComponent(cc.Button);
r.pai = e[l];
cc.vv.utils.addClickEvent(r, this.node, "MJGameZJZX", "onYoujinItemClicked");
var h = r.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[l]);
h.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
this._youjinPanel = n;
}
},
hideYoujinPanel: function() {
this._youjinPanel && cc.isValid(this._youjinPanel) && this._youjinPanel.destroy();
this._youjinPanel = null;
},
onYoujinItemClicked: function(e) {
var t = e.target.pai;
null != t && cc.vv.net.send("youjin", t);
this.hideYoujinPanel();
this.hideOptions();
},
playEfx: function(e, t) {
this._playEfxs[e].node.active = !0;
this._playEfxs[e].play(t);
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), o = this._hupaiTips[a];
o.active = n.hued;
if (n.hued) {
o.getChildByName("sprHu").active = !n.iszimo;
o.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var c = this.node.getChildByName("game"), s = c.getChildByName("huanpaiinfo");
null != s && (s.active = !1);
var l = [ "right", "up", "left" ];
for (t = 0; t < l.length; ++t) {
var r = c.getChildByName(l[t]);
if (null != r) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) r.active = !1; else {
r.active = !0;
var h = r.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!1);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.initAllHuaAreas();
this.showChupai();
var g = this;
this.scheduleOnce(function() {
if (cc.isValid(g.node) && null != cc.vv.gameNetMgr.curaction) {
g.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
}, 0);
e && this._isFreshDeal() && this._playDealAnim();
}
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i) {
if (i.folds instanceof Array && i.folds.length > 0) return !1;
if (i.pengs instanceof Array && i.pengs.length > 0) return !1;
if (i.chis instanceof Array && i.chis.length > 0) return !1;
if (i.angangs instanceof Array && i.angangs.length > 0) return !1;
if (i.diangangs instanceof Array && i.diangangs.length > 0) return !1;
if (i.wangangs instanceof Array && i.wangangs.length > 0) return !1;
if (i.hua instanceof Array && i.hua.length > 0) return !1;
}
}
return !0;
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, o) {
if (null != a && 0 != n.length) {
var c = a.convertToNodeSpaceAR(e);
n.sort(o);
for (var s = 0; s < n.length; ++s) {
var l = n[s], r = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: r,
y: h,
op: d
});
l.setPosition(c);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * s), cc.spawn(cc.moveTo(.15, cc.v2(r, h)), cc.fadeTo(.15, d))));
var g = .06 * s + .15;
g > i && (i = g);
}
}
}, a = [], o = null, c = 0; c < this._myMJArr.length; ++c) {
var s = this._myMJArr[c];
if (s && s.node && s.node.active && null != s.node.mjId) {
a.push(s.node);
o = s.node.parent;
}
}
n(a, o, function(e, t) {
return e.x - t.x;
});
for (var l = this.node.getChildByName("game"), r = cc.vv.gameNetMgr.seats || [], h = 0; h < r.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var g = cc.vv.mahjongmgr.getSide(d), u = l ? l.getChildByName(g) : null, v = u ? u.getChildByName("holds") : null;
if (null != v) {
for (var m = [], p = 0; p < v.childrenCount; ++p) {
var f = v.children[p];
f.active && m.push(f);
}
n(m, v, "up" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).x - e.convertToWorldSpaceAR(cc.v2(0, 0)).x;
} : "left" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).y - e.convertToWorldSpaceAR(cc.v2(0, 0)).y;
} : function(e, t) {
return e.convertToWorldSpaceAR(cc.v2(0, 0)).y - t.convertToWorldSpaceAR(cc.v2(0, 0)).y;
});
}
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var _ = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == _) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
}
}, i + .05);
}
},
_cancelDealAnim: function() {
if (this._dealAnimating) {
this._dealAnimating = !1;
this._dealAnimId = (this._dealAnimId || 0) + 1;
for (var e = this._dealAnimNodes || [], t = 0; t < e.length; ++t) {
var i = e[t];
if (cc.isValid(i.node)) {
i.node.stopAllActions();
i.node.setPosition(i.x, i.y);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
_findMJNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null; t && null == t.mjId && t.parent; ) t = t.parent;
return t;
},
_findBtnNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null, i = {
btnPeng: 1,
btnGang: 1,
btnHu: 1,
btnGuo: 1,
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, c = n[1].mjId, s = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, c, s ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var l = this._findMJNode(e);
if (null != l) for (var r = 0; r < this._myMJArr.length; ++r) if (l == this._myMJArr[r].node) {
if (l == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
l.y = 15;
this._selectedMJ = l;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? 13 - t : t;
},
_startCountdown: function() {
this._stopCountdown();
var e = cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.chupaiTimeout || 15;
if (!(e <= 0)) {
this._countdownSec = e;
if (this._countdownLabel) {
var t = this._countdownLabel.getComponent(cc.Label);
t && (t.string = this._countdownSec + "s");
}
var i = this;
this._countdownId = setInterval(function() {
if (i.node && cc.isValid(i.node)) {
i._countdownSec--;
if (i._countdownLabel) {
var e = i._countdownLabel.getComponent(cc.Label);
e && (e.string = i._countdownSec > 0 ? i._countdownSec + "s" : "");
}
i._countdownSec <= 0 && i._stopCountdown();
} else i._stopCountdown();
}, 1e3);
}
},
_stopCountdown: function() {
if (this._countdownId) {
clearInterval(this._countdownId);
this._countdownId = null;
}
this._countdownSec = 0;
if (this._countdownLabel) {
var e = this._countdownLabel.getComponent(cc.Label);
e && (e.string = "");
}
},
initMopai: function(e, t) {
this._cancelDealAnim();
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = cc.vv.mahjongmgr.getSide(i), a = cc.vv.mahjongmgr.getFoldPre(i), o = this.node.getChildByName("game").getChildByName(n).getChildByName("holds"), c = this.getMJIndex(n, 13), s = o.children[c];
if (null != s) {
s.scaleX = 1;
s.scaleY = 1;
if (null == t) s.active = !1; else if (t >= 0) {
s.active = !0;
if ("up" == n) {
s.scaleX = .73;
s.scaleY = .73;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a, t);
} else if (null != t) {
s.active = !0;
if ("up" == n) {
s.scaleX = 1;
s.scaleY = 1;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(n);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), o = 0; o < n.childrenCount; ++o) {
var c = n.children[o];
c.scaleX = 1;
c.scaleY = 1;
c.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, o = a ? a.getChildByName("holds") : null;
if (null != o) {
var c = e.chis || [], s = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + c.length;
s *= 3;
for (var l = 0; l < s; ++l) {
var r = this.getMJIndex(i, l);
null != o.children[r] && (o.children[r].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (l = 0; l < d.length; ++l) {
r = this.getMJIndex(i, l + s);
if (null != o.children[r]) {
var g = o.children[r].getComponent(cc.Sprite);
if (null != g) {
if ("up" == i) {
g.node.scaleX = .73;
g.node.scaleY = .73;
}
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[l]);
}
}
}
this._hideUnusedHolds(i, o, s + d.length);
} else {
var u = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (l = s; l < s + u; ++l) {
r = this.getMJIndex(i, l);
var v = o.children[r];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, s + u);
}
}
}
}
},
_hideUnusedHolds: function(e, t, i) {
for (var n = i; n < 14; ++n) {
var a = this.getMJIndex(e, n);
null != t.children[a] && (t.children[a].active = !1);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var o = cc.vv.gameNetMgr.conf, c = o ? o.caishen : -1, s = o ? o.caishen2 : -1, l = [], r = [], h = 0; h < i.length; ++h) {
var d = i[h];
c >= 0 && d == c || null != s && s >= 0 && d == s ? l.push(d) : r.push(d);
}
cc.vv.mahjongmgr.sortMJ(r);
i.length = 0;
for (var g = 0; g < l.length; ++g) i.push(l[g]);
for (var u = 0; u < r.length; ++u) i.push(r[u]);
null != n && i.push(n);
return i;
},
initMahjongs: function(e, t) {
this._cancelDealAnim();
var i = t || this.getSelfSeatData();
console.log("[initMahjongs] allowMopai=", e, "forceSeatData=", !!t, "seatData.holds=", i ? "object" == typeof i.holds ? i.holds.length + ":" + JSON.stringify(i.holds) : i.holds : "null");
if (null != i && null != i.holds && "object" == typeof i.holds && null != i.holds.length) {
var n = this.sortHolds(i, e);
if (null != n) {
this._selectedMJ = null;
var a, o = i.chis || [], c = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + o.length), s = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (s = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (s = 0);
a = s > 0 ? .5 * s : 20;
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), r = this._myMJArr[c], h = r ? r.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", c, "holds.length=", n.length, "startSlot=", c, "endSlot=", c + n.length - 1);
for (var d = cc.vv.gameNetMgr.conf, g = d ? d.caishen : -1, u = d ? d.caishen2 : -1, v = [], m = 0; m < n.length; ++m) {
var p = n[m];
if (null == (C = this._myMJArr[m + c]) || null == C.node) {
v.push("SLOT_" + (m + c) + "=NULL");
break;
}
C.node.mjId = p;
C.node.y = 0;
var f = l && m == n.length - 1;
s > 0 && (C.node.x = h + m * s + (f ? a : 0));
this.setSpriteFrameByMJID("M_", C, p);
var _ = g >= 0 && p == g || null != u && u >= 0 && p == u;
C.node.color = _ ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (m + c) + "=" + p);
}
console.log("[initMahjongs] render:", v.join("|"));
for (m = 0; m < c; ++m) if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
for (m = c + n.length; m < this._myMJArr.length; ++m) {
var C;
if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
},
getSelfSeatData: function() {
var e = cc.vv.gameNetMgr, t = e ? e.seats : null;
if (!t) return null;
var i = e.seatIndex;
if (null != i && i >= 0 && i < t.length && t[i]) return t[i];
var n = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != n) for (var a = 0; a < t.length; ++a) if (t[a] && t[a].userid == n) return t[a];
return null;
},
getLocalIndex: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
return (e - cc.vv.gameNetMgr.seatIndex + t) % t;
},
showChiPanel: function(e) {
this.hideChiPanel();
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 36 + 146 * e.length + 30 * (e.length - 1), n = new cc.Node("chiPanel");
n.setContentSize(i, 120);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 120);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -60, i, 120);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 26);
c.setPosition(0, 37);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择吃牌组合";
s.fontSize = 22;
s.lineHeight = 26;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = e[l], h = new cc.Node("chiItem" + l);
h.setContentSize(146, 66);
h.setPosition(91 + -i / 2 + 176 * l, -13);
n.addChild(h);
h.addComponent(cc.Button);
h.paiList = r;
cc.vv.utils.addClickEvent(h, this.node, "MJGameZJZX", "onChiItemClicked");
for (var d = 0; d < r.length; ++d) {
var g = new cc.Node("p" + d);
g.setContentSize(46, 66);
g.setPosition(50 * d - 50, 0);
h.addChild(g);
var u = g.addComponent(cc.Sprite);
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", r[d]);
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = n;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e.target.paiList;
t && cc.vv.net.send("chi", t);
this.hideChiPanel();
this.hideOptions();
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
console.log("[ZJZX] onOptionClicked btn=" + (t ? t.name : "null"));
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i || "btnQiangJin" == i) {
this.hideOptions();
cc.vv.net.send("hu");
} else {
if ("btnYouJin" == i) {
var n = cc.vv.gameNetMgr.curaction, a = n && n.youjin ? n.youjin : this._lastYoujin || [];
this._lastYoujin = a;
this.showYoujinPanel(a);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
initCaishenPlanPanel: function() {
var e = this.node.getChildByName("caishenPlanPanel");
if (null == e) {
var t = this.node.getChildByName("game");
t && (e = t.getChildByName("caishenPlanPanel"));
}
if (e) {
this._caishenPlanPanel = e;
e.active = !1;
}
},
_mjIdToName: function(e) {
return null == e || e < 0 ? "?" : e < 9 ? [ "一万", "二万", "三万", "四万", "五万", "六万", "七万", "八万", "九万" ][e] : e < 18 ? [ "一筒", "二筒", "三筒", "四筒", "五筒", "六筒", "七筒", "八筒", "九筒" ][e - 9] : e < 27 ? [ "一条", "二条", "三条", "四条", "五条", "六条", "七条", "八条", "九条" ][e - 18] : e < 31 ? [ "东", "南", "西", "北" ][e - 27] : e < 34 ? [ "中", "发", "白" ][e - 31] : "?";
},
showCaishenPlanPanel: function() {
console.log("[ZJZX] showCaishenPlanPanel called! _pendingPlans=", JSON.stringify(this._pendingPlans));
if (!this._caishenPlanPanel) {
var e = this.node.getChildByName("caishenPlanPanel");
if (null == e) {
var t = this.node.getChildByName("game");
t && (e = t.getChildByName("caishenPlanPanel"));
}
console.log("[ZJZX] caishenPlanPanel lookup: root=", !!e, "this.node.name=", this.node.name);
if (e) this._caishenPlanPanel = e; else {
console.error("[ZJZX] caishenPlanPanel 节点不存在, 全场景搜索...");
for (var i = cc.find("Canvas").children, n = 0; n < i.length; n++) {
var a = i[n].getChildByName && i[n].getChildByName("caishenPlanPanel");
if (a) {
console.log("[ZJZX] 找到! 在 Canvas/" + i[n].name);
this._caishenPlanPanel = a;
break;
}
}
if (!this._caishenPlanPanel) {
console.error("[ZJZX] 全场景也找不到caishenPlanPanel!");
return;
}
}
}
var o = this._caishenPlanPanel;
console.log("[ZJZX] panel found, active=", o.active);
var c = [ "btnWuCai", "btnDanCai", "btnShuangCai", "btnReselect" ];
for (n = 0; n < c.length; ++n) {
var s = o.getChildByName(c[n]);
s && (s.active = !1);
}
var l = o.getChildByName("btnSetCaishen");
l && (l.active = !0);
o.active = !0;
var r = o.parent;
r && o.setSiblingIndex(r.childrenCount - 1);
var h = this._pendingPlans || [];
if (0 !== h.length) {
var d = h[0], g = o.getChildByName("taiLabel");
if (g) {
g.active = !0;
g.getComponent(cc.Label).string = "胡" + d.tai + "台";
}
var u = o.getChildByName("modeLabel");
if (u) {
u.active = !0;
u.getComponent(cc.Label).string = 0 === d.mode ? "无财" : 1 === d.mode ? "独财" : "双财";
}
var v = function(e, t) {
var i = o.getChildByName(e);
if (i) if (null == t || t < 0) i.active = !1; else {
i.active = !0;
i.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
}
};
if (0 === d.mode) {
v("csImg1", null);
v("csImg2", null);
} else if (1 === d.mode) {
v("csImg1", d.c1);
v("csImg2", null);
} else {
v("csImg1", d.c1);
v("csImg2", d.c2);
}
}
},
hideCaishenPlanPanel: function() {
this._caishenPlanPanel && (this._caishenPlanPanel.active = !1);
this._pendingPlans = null;
this._selectedMJ = null;
this._chiSelect = null;
this._chiHint && (this._chiHint.active = !1);
},
onSetCaishenClicked: function() {
var e = this._pendingPlans || [];
if (0 !== e.length) {
var t = e[0];
this.hideCaishenPlanPanel();
cc.vv.net.send("hu", {
c1: t.c1,
c2: t.c2,
mode: t.mode
});
}
},
onQihuClicked: function() {
this.hideCaishenPlanPanel();
cc.vv.net.send("guo");
},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameZP4: [ function(e, t) {
"use strict";
cc._RF.push(t, "1ceectQJ9RACq8HX8M4XEtm", "MJGameZP4");
cc.Class({
extends: cc.Component,
properties: {
gameRoot: {
default: null,
type: cc.Node
},
prepareRoot: {
default: null,
type: cc.Node
},
_myMJArr: [],
_options: null,
_selectedMJ: null,
_chupaiSprite: [],
_mjcount: null,
_gamecount: null,
_hupaiTips: [],
_hupaiLists: [],
_playEfxs: [],
_opts: [],
_chiPanel: null,
_chiSelect: null,
_chiHint: null,
_huaAreas: [],
_youjinLabels: [],
_youjinPanel: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0
},
onLoad: function() {
var e = this.node.getComponent(cc.Canvas);
if (null != e) {
if (!cc.sys.isNative) {
e.fitHeight = !0;
e.fitWidth = !1;
for (var t = cc.director.getScene().getComponentsInChildren(cc.Camera), i = 0; i < t.length; i++) {
t[i].clearFlags = cc.Camera.ClearFlags.COLOR;
t[i].backgroundColor = cc.color(30, 18, 12);
}
}
if (cc.vv) {
for (var n = [ "NoticeTip", "GameOverZP", "PengGangs", "MJRoom", "TimePointer", "GameResultZP", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
}
},
initView: function() {
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var t = this._mjcount.node, i = this._gamecount.node;
this.scheduleOnce(function() {
cc.isValid(t) && cc.isValid(i) && t.setPosition(i.x - i.width / 2 - t.width / 2 - 12, i.y);
}, 0);
for (var n = e.getChildByName("myself").getChildByName("holds"), a = 0; a < n.children.length; ++a) {
var o = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(o);
o.spriteFrame = null;
}
var c = cc.view.getVisibleSize().width / 1280;
if (c < 1) {
n.scaleX *= c;
n.scaleY *= c;
}
var s = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < s; ++a) {
var l = cc.vv.mahjongmgr.getSide(a), r = e.getChildByName(l);
if (null != r) {
this._hupaiTips.push(r.getChildByName("HuPai"));
this._hupaiLists.push(r.getChildByName("hupailist"));
this._playEfxs.push(r.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(r.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = r.getChildByName("opt");
h.active = !1;
o = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: o
};
this._opts.push(d);
}
}
var g = e.getChildByName("ops");
this._options = g;
var u = g ? g.getChildByName("New Layout") : null;
if (u) {
var v = u.getComponent(cc.Button);
v && (v.enabled = !1);
u.active = !1;
}
this.hideOptions();
this.hideChupai();
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
initEventHandlers: function() {
cc.vv.gameNetMgr.dataEventHandler = this.node;
var e = cc.vv.gameNetMgr;
if ("begin" == e.gamestate && e.seats) {
for (var t = !1, i = 0; i < e.seats.length; ++i) {
var n = e.seats[i];
if (n && n.holds instanceof Array && n.holds.length > 0) {
t = !0;
break;
}
}
if (t) {
var a = this.node;
this.scheduleOnce(function() {
if (cc.isValid(a)) {
a.emit("game_num", {
detail: e.numOfGames
});
a.emit("mj_count", {
detail: null
});
a.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
a.emit("game_action", {
detail: t
});
}
}
}, 0);
}
}
var o = this;
this.node.on("game_start", function(e) {
o.onGameBeign(!0, e && e.detail);
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.audioMgr.playSFX("nv/hu.mp3");
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
o.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o.initHuaArea(t.si);
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && o.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
},
showChupai: function() {
var e = cc.vv.gameNetMgr.chupai;
if (e >= 0) {
var t = this.getLocalIndex(cc.vv.gameNetMgr.turn), i = this._chupaiSprite[t];
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
i.node.active = !0;
}
},
addOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var n = this._options.children[i];
if ("op" == n.name && 0 == n.active) {
n.active = !0;
n.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
var a = n.getChildByName(e);
a.active = !0;
a.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
i.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
var n = this.getChiButton(i);
if (n) {
n.active = !0;
n.pai = e;
}
return;
}
}
},
getChiButton: function(e) {
var t = e.getChildByName("btnChi");
if (t) {
if (!t._chiBound) {
t._chiBound = !0;
cc.vv.utils.addClickEvent(t, this.node, "MJGameZP4", "onOptionClicked");
}
return t;
}
var i = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (i) {
t.setPosition(i.getPosition());
t.setContentSize(i.getContentSize());
t.scaleX = i.scaleX;
t.scaleY = i.scaleY;
}
var n = t.addComponent(cc.Sprite);
n.type = cc.Sprite.Type.SIMPLE;
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, i) {
if (!e && i && cc.isValid(t)) {
var n = t.getComponent(cc.Sprite);
n && (n.spriteFrame = i);
}
});
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, i) {
var n = i ? i.getSpriteFrame("mj_btn_chi.png") : null;
if (n && cc.isValid(t)) {
var a = t.getComponent(cc.Sprite);
a && (a.spriteFrame = n);
var o = t.getChildByName("btnLabel");
o && (o.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var o = a.addComponent(cc.Label);
o.string = "吃";
o.fontSize = 40;
o.lineHeight = 40;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameZP4", "onOptionClicked");
t.active = !1;
return t;
},
getZpOpButton: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a) {
if (!a._zpBound) {
a._zpBound = !0;
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP4", "onOptionClicked");
}
return a;
}
var o = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (o) {
a.setPosition(o.getPosition());
a.setContentSize(o.getContentSize());
a.scaleX = o.scaleX;
a.scaleY = o.scaleY;
}
var c = a.addComponent(cc.Sprite);
c.type = cc.Sprite.Type.SIMPLE;
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var s = new cc.Node("btnLabel");
a.addChild(s);
var l = s.addComponent(cc.Label);
l.string = i;
l.fontSize = n || 40;
l.lineHeight = l.fontSize;
l.overflow = cc.Label.Overflow.NONE;
l.enableWrapText = !1;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 255, 255);
s.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP4", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var o = this._options.children[a];
if ("op" == o.name && 0 == o.active) {
o.active = !0;
o.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var c = this.getZpOpButton(o, e, t, n);
c.active = !0;
c.pai = i;
return;
}
}
},
enterChiSelect: function(e) {
this.cancelChiSelect();
this._chiSelect = {
pai: e,
tiles: []
};
var t = this.node.getChildByName("game") || this.node, i = t.getChildByName("chiHint");
this._chiHintBaked = !!i;
if (null == i) {
(i = new cc.Node("chiHint")).setPosition(0, -200);
t.addChild(i);
var n = i.addComponent(cc.Label);
n.string = "请选择两张手牌";
n.fontSize = 36;
n.lineHeight = 40;
n.overflow = cc.Label.Overflow.NONE;
i.color = cc.color(255, 220, 80);
var a = i.addComponent(cc.LabelOutline);
a.color = cc.color(60, 30, 0);
a.width = 3;
}
i.active = !0;
i.setPosition(0, -200);
this._chiHint = i;
},
cancelChiSelect: function() {
if (this._chiSelect) for (var e = 0; e < this._chiSelect.tiles.length; ++e) {
var t = this._chiSelect.tiles[e];
cc.isValid(t) && (t.y = 0);
}
this._chiSelect = null;
this._chiHint && cc.isValid(this._chiHint) && (this._chiHintBaked ? this._chiHint.active = !1 : this._chiHint.destroy());
this._chiHint = null;
},
hideOptions: function() {
if (null != this._options) {
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
var n = t.getChildByName("btnQiangJin");
n && (n.active = !1);
var a = t.getChildByName("btnYouJin");
a && (a.active = !1);
var o = t.getChildByName("btnYouJinGo");
o && (o.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
this.hideYoujinPanel();
}
},
showAction: function(e) {
this._options.active && this.hideOptions();
var t = !!(e && e.youjin && e.youjin.length > 0);
if (e && (e.hu || e.gang || e.peng || e.chi || e.qiangjin || t || e.youjingo)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var i = 0; i < e.gangpai.length; ++i) {
var n = e.gangpai[i];
this.addOption("btnGang", n);
}
e.chi && this.addChiOption(e.pai);
e.qiangjin && this.addZpOption("btnQiangJin", "抢金", e.pai, 32);
t && this.addZpOption("btnYouJin", "游金", e.pai);
e.youjingo && this.addZpOption("btnYouJinGo", "继续游金", e.pai, 28);
var a = this._options.getChildByName("btnGuo");
a && (a.active = !0);
}
},
initWanfaLabel: function() {
var e = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
if (e) {
var t = e.getComponent(cc.Label);
t && (t.string = cc.vv.gameNetMgr.getWanfa());
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
if (null != t) {
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
i && (i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t));
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var c = t.getChildByName("cs2");
if (c) {
var s = null != i.caishen2 && i.caishen2 >= 0;
c.active = s;
s && a(c, i.caishen2);
}
}
}
}
},
_huaAreaPos: function(e) {
return "myself" == e ? cc.v2(-540, -230) : "up" == e ? cc.v2(430, 210) : "right" == e ? cc.v2(540, 40) : cc.v2(-540, 40);
},
getHuaArea: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e);
if (this._huaAreas[t] && cc.isValid(this._huaAreas[t])) return this._huaAreas[t];
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), o = this._huaAreaPos(i);
a.setPosition(o.x, o.y);
n.addChild(a);
this._huaAreas[t] = a;
return a;
},
initHuaArea: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e] : null;
if (null != t) {
var i = this.getHuaArea(e);
i.removeAllChildren();
var n = t.hua || [];
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, o = 0; o < n.length; ++o) {
var c = n[o], s = new cc.Node("hua" + o);
s.setContentSize(44, 64);
s.setPosition(48 * o + 22, 0);
i.addChild(s);
var l = s.addComponent(cc.Sprite);
l.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var r = c - 34, h = r >= 0 && r < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][r] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) l.spriteFrame = d; else {
var g = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
l.spriteFrame = g;
var u = new cc.Node("name");
s.addChild(u);
var v = u.addComponent(cc.Label);
v.string = r >= 0 && r < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][r] : "花";
v.fontSize = 26;
v.lineHeight = 28;
v.overflow = cc.Label.Overflow.NONE;
v.enableWrapText = !1;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.verticalAlign = cc.Label.VerticalAlign.CENTER;
u.color = cc.color(220, 40, 40);
u.setPosition(0, 0);
}
}
}
},
initAllHuaAreas: function() {
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) {
this.initHuaArea(t);
this.showYoujinLevel(t, e[t].youjinLevel || 0);
}
},
showYoujinLevel: function(e, t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = this._youjinLabels[i];
if (!n || !cc.isValid(n)) {
var a = cc.vv.mahjongmgr.getSide(i), o = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
o.parent.addChild(n);
var c = n.addComponent(cc.Label);
c.fontSize = 30;
c.lineHeight = 34;
c.overflow = cc.Label.Overflow.NONE;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var s = n.addComponent(cc.LabelOutline);
s.color = cc.color(80, 0, 0);
s.width = 2;
this._youjinLabels[i] = n;
}
var l = this.getHuaArea(e);
n.setPosition(l.x, l.y + 80);
if (t > 0) {
n.active = !0;
n.getComponent(cc.Label).string = [ "", "单游", "双游", "三游" ][t] || t + "游";
} else n.active = !1;
},
showYoujinPanel: function(e) {
this.hideYoujinPanel();
if (e && 0 != e.length) {
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 40 + 62 * e.length + 16 * (e.length - 1), n = new cc.Node("youjinPanel");
n.setContentSize(i, 146);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 146);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -73, i, 146);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 28);
c.setPosition(0, 49);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择一张牌宣告游金";
s.fontSize = 22;
s.lineHeight = 28;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = new cc.Node("yjItem" + l);
r.setContentSize(62, 90);
r.setPosition(51 + -i / 2 + 78 * l, -14);
n.addChild(r);
r.addComponent(cc.Button);
r.pai = e[l];
cc.vv.utils.addClickEvent(r, this.node, "MJGameZP4", "onYoujinItemClicked");
var h = r.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[l]);
h.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
this._youjinPanel = n;
}
},
hideYoujinPanel: function() {
this._youjinPanel && cc.isValid(this._youjinPanel) && this._youjinPanel.destroy();
this._youjinPanel = null;
},
onYoujinItemClicked: function(e) {
var t = e.target.pai;
null != t && cc.vv.net.send("youjin", t);
this.hideYoujinPanel();
this.hideOptions();
},
playEfx: function(e, t) {
this._playEfxs[e].node.active = !0;
this._playEfxs[e].play(t);
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), o = this._hupaiTips[a];
o.active = n.hued;
if (n.hued) {
o.getChildByName("sprHu").active = !n.iszimo;
o.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var c = this.node.getChildByName("game"), s = c.getChildByName("huanpaiinfo");
null != s && (s.active = !1);
var l = [ "right", "up", "left" ];
for (t = 0; t < l.length; ++t) {
var r = c.getChildByName(l[t]);
if (null != r) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) r.active = !1; else {
r.active = !0;
var h = r.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.initAllHuaAreas();
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
e && this._isFreshDeal() && this._playDealAnim();
}
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i) {
if (i.folds instanceof Array && i.folds.length > 0) return !1;
if (i.pengs instanceof Array && i.pengs.length > 0) return !1;
if (i.chis instanceof Array && i.chis.length > 0) return !1;
if (i.angangs instanceof Array && i.angangs.length > 0) return !1;
if (i.diangangs instanceof Array && i.diangangs.length > 0) return !1;
if (i.wangangs instanceof Array && i.wangangs.length > 0) return !1;
if (i.hua instanceof Array && i.hua.length > 0) return !1;
}
}
return !0;
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, o) {
if (null != a && 0 != n.length) {
var c = a.convertToNodeSpaceAR(e);
n.sort(o);
for (var s = 0; s < n.length; ++s) {
var l = n[s], r = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: r,
y: h,
op: d
});
l.setPosition(c);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * s), cc.spawn(cc.moveTo(.15, cc.v2(r, h)), cc.fadeTo(.15, d))));
var g = .06 * s + .15;
g > i && (i = g);
}
}
}, a = [], o = null, c = 0; c < this._myMJArr.length; ++c) {
var s = this._myMJArr[c];
if (s && s.node && s.node.active && null != s.node.mjId) {
a.push(s.node);
o = s.node.parent;
}
}
n(a, o, function(e, t) {
return e.x - t.x;
});
for (var l = this.node.getChildByName("game"), r = cc.vv.gameNetMgr.seats || [], h = 0; h < r.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var g = cc.vv.mahjongmgr.getSide(d), u = l ? l.getChildByName(g) : null, v = u ? u.getChildByName("holds") : null;
if (null != v) {
for (var m = [], p = 0; p < v.childrenCount; ++p) {
var f = v.children[p];
f.active && m.push(f);
}
n(m, v, "up" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).x - e.convertToWorldSpaceAR(cc.v2(0, 0)).x;
} : "left" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).y - e.convertToWorldSpaceAR(cc.v2(0, 0)).y;
} : function(e, t) {
return e.convertToWorldSpaceAR(cc.v2(0, 0)).y - t.convertToWorldSpaceAR(cc.v2(0, 0)).y;
});
}
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var _ = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == _) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
}
}, i + .05);
}
},
_cancelDealAnim: function() {
if (this._dealAnimating) {
this._dealAnimating = !1;
this._dealAnimId = (this._dealAnimId || 0) + 1;
for (var e = this._dealAnimNodes || [], t = 0; t < e.length; ++t) {
var i = e[t];
if (cc.isValid(i.node)) {
i.node.stopAllActions();
i.node.setPosition(i.x, i.y);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
_findMJNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null; t && null == t.mjId && t.parent; ) t = t.parent;
return t;
},
_findBtnNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null, i = {
btnPeng: 1,
btnGang: 1,
btnHu: 1,
btnGuo: 1,
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, c = n[1].mjId, s = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, c, s ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var l = this._findMJNode(e);
if (null != l) for (var r = 0; r < this._myMJArr.length; ++r) if (l == this._myMJArr[r].node) {
if (l == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
l.y = 15;
this._selectedMJ = l;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? 13 - t : t;
},
initMopai: function(e, t) {
this._cancelDealAnim();
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = cc.vv.mahjongmgr.getSide(i), a = cc.vv.mahjongmgr.getFoldPre(i), o = this.node.getChildByName("game").getChildByName(n).getChildByName("holds"), c = this.getMJIndex(n, 13), s = o.children[c];
if (null != s) {
s.scaleX = 1;
s.scaleY = 1;
if (null == t) s.active = !1; else if (t >= 0) {
s.active = !0;
if ("up" == n) {
s.scaleX = .73;
s.scaleY = .73;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a, t);
} else if (null != t) {
s.active = !0;
if ("up" == n) {
s.scaleX = 1;
s.scaleY = 1;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(n);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), o = 0; o < n.childrenCount; ++o) {
var c = n.children[o];
c.scaleX = 1;
c.scaleY = 1;
c.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, o = a ? a.getChildByName("holds") : null;
if (null != o) {
var c = e.chis || [], s = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + c.length;
s *= 3;
for (var l = 0; l < s; ++l) {
var r = this.getMJIndex(i, l);
null != o.children[r] && (o.children[r].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (l = 0; l < d.length; ++l) {
r = this.getMJIndex(i, l + s);
if (null != o.children[r]) {
var g = o.children[r].getComponent(cc.Sprite);
if (null != g) {
if ("up" == i) {
g.node.scaleX = .73;
g.node.scaleY = .73;
}
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[l]);
}
}
}
this._hideUnusedHolds(i, o, s + d.length);
} else {
var u = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (l = s; l < s + u; ++l) {
r = this.getMJIndex(i, l);
var v = o.children[r];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, s + u);
}
}
}
}
},
_hideUnusedHolds: function(e, t, i) {
for (var n = i; n < 14; ++n) {
var a = this.getMJIndex(e, n);
null != t.children[a] && (t.children[a].active = !1);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var o = cc.vv.gameNetMgr.conf, c = o ? o.caishen : -1, s = o ? o.caishen2 : -1, l = [], r = [], h = 0; h < i.length; ++h) {
var d = i[h];
c >= 0 && d == c || null != s && s >= 0 && d == s ? l.push(d) : r.push(d);
}
cc.vv.mahjongmgr.sortMJ(r);
i.length = 0;
for (var g = 0; g < l.length; ++g) i.push(l[g]);
for (var u = 0; u < r.length; ++u) i.push(r[u]);
null != n && i.push(n);
return i;
},
initMahjongs: function(e, t) {
this._cancelDealAnim();
var i = t || this.getSelfSeatData();
console.log("[initMahjongs] allowMopai=", e, "forceSeatData=", !!t, "seatData.holds=", i ? "object" == typeof i.holds ? i.holds.length + ":" + JSON.stringify(i.holds) : i.holds : "null");
if (null != i && null != i.holds && "object" == typeof i.holds && null != i.holds.length) {
var n = this.sortHolds(i, e);
if (null != n) {
this._selectedMJ = null;
var a, o = i.chis || [], c = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + o.length), s = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (s = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (s = 0);
a = s > 0 ? .5 * s : 20;
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), r = this._myMJArr[c], h = r ? r.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", c, "holds.length=", n.length, "startSlot=", c, "endSlot=", c + n.length - 1);
for (var d = cc.vv.gameNetMgr.conf, g = d ? d.caishen : -1, u = d ? d.caishen2 : -1, v = [], m = 0; m < n.length; ++m) {
var p = n[m];
if (null == (C = this._myMJArr[m + c]) || null == C.node) {
v.push("SLOT_" + (m + c) + "=NULL");
break;
}
C.node.mjId = p;
C.node.y = 0;
var f = l && m == n.length - 1;
s > 0 && (C.node.x = h + m * s + (f ? a : 0));
this.setSpriteFrameByMJID("M_", C, p);
var _ = g >= 0 && p == g || null != u && u >= 0 && p == u;
C.node.color = _ ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (m + c) + "=" + p);
}
console.log("[initMahjongs] render:", v.join("|"));
for (m = 0; m < c; ++m) if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
for (m = c + n.length; m < this._myMJArr.length; ++m) {
var C;
if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
},
getSelfSeatData: function() {
var e = cc.vv.gameNetMgr, t = e ? e.seats : null;
if (!t) return null;
var i = e.seatIndex;
if (null != i && i >= 0 && i < t.length && t[i]) return t[i];
var n = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != n) for (var a = 0; a < t.length; ++a) if (t[a] && t[a].userid == n) return t[a];
return null;
},
getLocalIndex: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
return (e - cc.vv.gameNetMgr.seatIndex + t) % t;
},
showChiPanel: function(e) {
this.hideChiPanel();
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 36 + 146 * e.length + 30 * (e.length - 1), n = new cc.Node("chiPanel");
n.setContentSize(i, 120);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 120);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -60, i, 120);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 26);
c.setPosition(0, 37);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择吃牌组合";
s.fontSize = 22;
s.lineHeight = 26;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = e[l], h = new cc.Node("chiItem" + l);
h.setContentSize(146, 66);
h.setPosition(91 + -i / 2 + 176 * l, -13);
n.addChild(h);
h.addComponent(cc.Button);
h.paiList = r;
cc.vv.utils.addClickEvent(h, this.node, "MJGameZP4", "onChiItemClicked");
for (var d = 0; d < r.length; ++d) {
var g = new cc.Node("p" + d);
g.setContentSize(46, 66);
g.setPosition(50 * d - 50, 0);
h.addChild(g);
var u = g.addComponent(cc.Sprite);
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", r[d]);
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = n;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e.target.paiList;
t && cc.vv.net.send("chi", t);
this.hideChiPanel();
this.hideOptions();
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i || "btnQiangJin" == i) cc.vv.net.send("hu"); else {
if ("btnYouJin" == i) {
var n = cc.vv.gameNetMgr.curaction, a = n && n.youjin ? n.youjin : this._lastYoujin || [];
this._lastYoujin = a;
this.showYoujinPanel(a);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameZP: [ function(e, t) {
"use strict";
cc._RF.push(t, "363304bbn1JJoRak2CpGBov", "MJGameZP");
cc.Class({
extends: cc.Component,
properties: {
gameRoot: {
default: null,
type: cc.Node
},
prepareRoot: {
default: null,
type: cc.Node
},
_myMJArr: [],
_options: null,
_selectedMJ: null,
_chupaiSprite: [],
_mjcount: null,
_gamecount: null,
_hupaiTips: [],
_hupaiLists: [],
_playEfxs: [],
_opts: [],
_chiPanel: null,
_chiSelect: null,
_chiHint: null,
_huaAreas: [],
_youjinLabels: [],
_youjinPanel: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0
},
onLoad: function() {
var e = this.node.getComponent(cc.Canvas);
if (null != e) {
if (!cc.sys.isNative) {
e.fitHeight = !0;
e.fitWidth = !1;
for (var t = cc.director.getScene().getComponentsInChildren(cc.Camera), i = 0; i < t.length; i++) {
t[i].clearFlags = cc.Camera.ClearFlags.COLOR;
t[i].backgroundColor = cc.color(30, 18, 12);
}
}
if (cc.vv) {
for (var n = [ "NoticeTip", "GameOverZP", "PengGangs", "MJRoom", "TimePointer", "GameResultZP", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
}
},
initView: function() {
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var t = this._mjcount.node, i = this._gamecount.node;
this.scheduleOnce(function() {
cc.isValid(t) && cc.isValid(i) && t.setPosition(i.x - i.width / 2 - t.width / 2 - 12, i.y);
}, 0);
for (var n = e.getChildByName("myself").getChildByName("holds"), a = 0; a < n.children.length; ++a) {
var o = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(o);
o.spriteFrame = null;
}
var c = cc.view.getVisibleSize().width / 1280;
if (c < 1) {
n.scaleX *= c;
n.scaleY *= c;
}
var s = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < s; ++a) {
var l = cc.vv.mahjongmgr.getSide(a), r = e.getChildByName(l);
if (null != r) {
this._hupaiTips.push(r.getChildByName("HuPai"));
this._hupaiLists.push(r.getChildByName("hupailist"));
this._playEfxs.push(r.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(r.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = r.getChildByName("opt");
h.active = !1;
o = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: o
};
this._opts.push(d);
}
}
var g = e.getChildByName("ops");
this._options = g;
var u = g ? g.getChildByName("New Layout") : null;
if (u) {
var v = u.getComponent(cc.Button);
v && (v.enabled = !1);
u.active = !1;
}
this.hideOptions();
this.hideChupai();
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
initEventHandlers: function() {
cc.vv.gameNetMgr.dataEventHandler = this.node;
var e = cc.vv.gameNetMgr;
if ("begin" == e.gamestate && e.seats) {
for (var t = !1, i = 0; i < e.seats.length; ++i) {
var n = e.seats[i];
if (n && n.holds instanceof Array && n.holds.length > 0) {
t = !0;
break;
}
}
if (t) {
var a = this.node;
this.scheduleOnce(function() {
if (cc.isValid(a)) {
a.emit("game_num", {
detail: e.numOfGames
});
a.emit("mj_count", {
detail: null
});
a.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
a.emit("game_action", {
detail: t
});
}
}
}, 0);
}
}
var o = this;
this.node.on("game_start", function(e) {
o.onGameBeign(!0, e && e.detail);
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.audioMgr.playSFX("nv/hu.mp3");
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
o.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o.initHuaArea(t.si);
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && o.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
o.hideOptions();
});
},
showChupai: function() {
var e = cc.vv.gameNetMgr.chupai;
if (e >= 0) {
var t = this.getLocalIndex(cc.vv.gameNetMgr.turn), i = this._chupaiSprite[t];
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
i.node.active = !0;
}
},
addOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var n = this._options.children[i];
if ("op" == n.name && 0 == n.active) {
n.active = !0;
n.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
var a = n.getChildByName(e);
a.active = !0;
a.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
i.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
var n = this.getChiButton(i);
if (n) {
n.active = !0;
n.pai = e;
}
return;
}
}
},
getChiButton: function(e) {
var t = e.getChildByName("btnChi");
if (t) {
if (!t._chiBound) {
t._chiBound = !0;
cc.vv.utils.addClickEvent(t, this.node, "MJGameZP", "onOptionClicked");
}
return t;
}
var i = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (i) {
t.setPosition(i.getPosition());
t.setContentSize(i.getContentSize());
t.scaleX = i.scaleX;
t.scaleY = i.scaleY;
}
var n = t.addComponent(cc.Sprite);
n.type = cc.Sprite.Type.SIMPLE;
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, i) {
if (!e && i && cc.isValid(t)) {
var n = t.getComponent(cc.Sprite);
n && (n.spriteFrame = i);
}
});
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, i) {
var n = i ? i.getSpriteFrame("mj_btn_chi.png") : null;
if (n && cc.isValid(t)) {
var a = t.getComponent(cc.Sprite);
a && (a.spriteFrame = n);
var o = t.getChildByName("btnLabel");
o && (o.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var o = a.addComponent(cc.Label);
o.string = "吃";
o.fontSize = 40;
o.lineHeight = 40;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameZP", "onOptionClicked");
t.active = !1;
return t;
},
getZpOpButton: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a) {
if (!a._zpBound) {
a._zpBound = !0;
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP", "onOptionClicked");
}
return a;
}
var o = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (o) {
a.setPosition(o.getPosition());
a.setContentSize(o.getContentSize());
a.scaleX = o.scaleX;
a.scaleY = o.scaleY;
}
var c = a.addComponent(cc.Sprite);
c.type = cc.Sprite.Type.SIMPLE;
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var s = new cc.Node("btnLabel");
a.addChild(s);
var l = s.addComponent(cc.Label);
l.string = i;
l.fontSize = n || 40;
l.lineHeight = l.fontSize;
l.overflow = cc.Label.Overflow.NONE;
l.enableWrapText = !1;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 255, 255);
s.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var o = this._options.children[a];
if ("op" == o.name && 0 == o.active) {
o.active = !0;
o.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var c = this.getZpOpButton(o, e, t, n);
c.active = !0;
c.pai = i;
return;
}
}
},
enterChiSelect: function(e) {
this.cancelChiSelect();
this._chiSelect = {
pai: e,
tiles: []
};
var t = this.node.getChildByName("game") || this.node, i = t.getChildByName("chiHint");
this._chiHintBaked = !!i;
if (null == i) {
(i = new cc.Node("chiHint")).setPosition(0, -200);
t.addChild(i);
var n = i.addComponent(cc.Label);
n.string = "请选择两张手牌";
n.fontSize = 36;
n.lineHeight = 40;
n.overflow = cc.Label.Overflow.NONE;
i.color = cc.color(255, 220, 80);
var a = i.addComponent(cc.LabelOutline);
a.color = cc.color(60, 30, 0);
a.width = 3;
}
i.active = !0;
i.setPosition(0, -200);
this._chiHint = i;
},
cancelChiSelect: function() {
if (this._chiSelect) for (var e = 0; e < this._chiSelect.tiles.length; ++e) {
var t = this._chiSelect.tiles[e];
cc.isValid(t) && (t.y = 0);
}
this._chiSelect = null;
this._chiHint && cc.isValid(this._chiHint) && (this._chiHintBaked ? this._chiHint.active = !1 : this._chiHint.destroy());
this._chiHint = null;
},
hideOptions: function() {
if (null != this._options) {
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
var n = t.getChildByName("btnQiangJin");
n && (n.active = !1);
var a = t.getChildByName("btnYouJin");
a && (a.active = !1);
var o = t.getChildByName("btnYouJinGo");
o && (o.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
this.hideYoujinPanel();
}
},
showAction: function(e) {
this._options.active && this.hideOptions();
var t = !!(e && e.youjin && e.youjin.length > 0);
if (e && (e.hu || e.gang || e.peng || e.chi || e.qiangjin || t || e.youjingo)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var i = 0; i < e.gangpai.length; ++i) {
var n = e.gangpai[i];
this.addOption("btnGang", n);
}
e.chi && this.addChiOption(e.pai);
e.qiangjin && this.addZpOption("btnQiangJin", "抢金", e.pai, 32);
t && this.addZpOption("btnYouJin", "游金", e.pai);
e.youjingo && this.addZpOption("btnYouJinGo", "继续游金", e.pai, 28);
var a = this._options.getChildByName("btnGuo");
a && (a.active = !0);
}
},
initWanfaLabel: function() {
var e = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
if (e) {
var t = e.getComponent(cc.Label);
t && (t.string = cc.vv.gameNetMgr.getWanfa());
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
if (null != t) {
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
i && (i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t));
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var c = t.getChildByName("cs2");
if (c) {
var s = null != i.caishen2 && i.caishen2 >= 0;
c.active = s;
s && a(c, i.caishen2);
}
}
}
}
},
_huaAreaPos: function(e) {
return "myself" == e ? cc.v2(-540, -230) : "up" == e ? cc.v2(430, 210) : "right" == e ? cc.v2(540, 40) : cc.v2(-540, 40);
},
getHuaArea: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e);
if (this._huaAreas[t] && cc.isValid(this._huaAreas[t])) return this._huaAreas[t];
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), o = this._huaAreaPos(i);
a.setPosition(o.x, o.y);
n.addChild(a);
this._huaAreas[t] = a;
return a;
},
initHuaArea: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e] : null;
if (null != t) {
var i = this.getHuaArea(e);
i.removeAllChildren();
var n = t.hua || [];
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, o = 0; o < n.length; ++o) {
var c = n[o], s = new cc.Node("hua" + o);
s.setContentSize(44, 64);
s.setPosition(48 * o + 22, 0);
i.addChild(s);
var l = s.addComponent(cc.Sprite);
l.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var r = c - 34, h = r >= 0 && r < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][r] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) l.spriteFrame = d; else {
var g = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
l.spriteFrame = g;
var u = new cc.Node("name");
s.addChild(u);
var v = u.addComponent(cc.Label);
v.string = r >= 0 && r < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][r] : "花";
v.fontSize = 26;
v.lineHeight = 28;
v.overflow = cc.Label.Overflow.NONE;
v.enableWrapText = !1;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.verticalAlign = cc.Label.VerticalAlign.CENTER;
u.color = cc.color(220, 40, 40);
u.setPosition(0, 0);
}
}
}
},
initAllHuaAreas: function() {
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) {
this.initHuaArea(t);
this.showYoujinLevel(t, e[t].youjinLevel || 0);
}
},
showYoujinLevel: function(e, t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = this._youjinLabels[i];
if (!n || !cc.isValid(n)) {
var a = cc.vv.mahjongmgr.getSide(i), o = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
o.parent.addChild(n);
var c = n.addComponent(cc.Label);
c.fontSize = 30;
c.lineHeight = 34;
c.overflow = cc.Label.Overflow.NONE;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var s = n.addComponent(cc.LabelOutline);
s.color = cc.color(80, 0, 0);
s.width = 2;
this._youjinLabels[i] = n;
}
var l = this.getHuaArea(e);
n.setPosition(l.x, l.y + 80);
if (t > 0) {
n.active = !0;
n.getComponent(cc.Label).string = [ "", "单游", "双游", "三游" ][t] || t + "游";
} else n.active = !1;
},
showYoujinPanel: function(e) {
this.hideYoujinPanel();
if (e && 0 != e.length) {
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 40 + 62 * e.length + 16 * (e.length - 1), n = new cc.Node("youjinPanel");
n.setContentSize(i, 146);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 146);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -73, i, 146);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 28);
c.setPosition(0, 49);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择一张牌宣告游金";
s.fontSize = 22;
s.lineHeight = 28;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = new cc.Node("yjItem" + l);
r.setContentSize(62, 90);
r.setPosition(51 + -i / 2 + 78 * l, -14);
n.addChild(r);
r.addComponent(cc.Button);
r.pai = e[l];
cc.vv.utils.addClickEvent(r, this.node, "MJGameZP", "onYoujinItemClicked");
var h = r.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[l]);
h.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
this._youjinPanel = n;
}
},
hideYoujinPanel: function() {
this._youjinPanel && cc.isValid(this._youjinPanel) && this._youjinPanel.destroy();
this._youjinPanel = null;
},
onYoujinItemClicked: function(e) {
var t = e.target.pai;
null != t && cc.vv.net.send("youjin", t);
this.hideYoujinPanel();
this.hideOptions();
},
playEfx: function(e, t) {
this._playEfxs[e].node.active = !0;
this._playEfxs[e].play(t);
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), o = this._hupaiTips[a];
o.active = n.hued;
if (n.hued) {
o.getChildByName("sprHu").active = !n.iszimo;
o.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var c = this.node.getChildByName("game"), s = c.getChildByName("huanpaiinfo");
null != s && (s.active = !1);
var l = [ "right", "up", "left" ];
for (t = 0; t < l.length; ++t) {
var r = c.getChildByName(l[t]);
if (null != r) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) r.active = !1; else {
r.active = !0;
var h = r.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.initAllHuaAreas();
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
e && this._isFreshDeal() && this._playDealAnim();
}
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i) {
if (i.folds instanceof Array && i.folds.length > 0) return !1;
if (i.pengs instanceof Array && i.pengs.length > 0) return !1;
if (i.chis instanceof Array && i.chis.length > 0) return !1;
if (i.angangs instanceof Array && i.angangs.length > 0) return !1;
if (i.diangangs instanceof Array && i.diangangs.length > 0) return !1;
if (i.wangangs instanceof Array && i.wangangs.length > 0) return !1;
if (i.hua instanceof Array && i.hua.length > 0) return !1;
}
}
return !0;
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, o) {
if (null != a && 0 != n.length) {
var c = a.convertToNodeSpaceAR(e);
n.sort(o);
for (var s = 0; s < n.length; ++s) {
var l = n[s], r = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: r,
y: h,
op: d
});
l.setPosition(c);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * s), cc.spawn(cc.moveTo(.15, cc.v2(r, h)), cc.fadeTo(.15, d))));
var g = .06 * s + .15;
g > i && (i = g);
}
}
}, a = [], o = null, c = 0; c < this._myMJArr.length; ++c) {
var s = this._myMJArr[c];
if (s && s.node && s.node.active && null != s.node.mjId) {
a.push(s.node);
o = s.node.parent;
}
}
n(a, o, function(e, t) {
return e.x - t.x;
});
for (var l = this.node.getChildByName("game"), r = cc.vv.gameNetMgr.seats || [], h = 0; h < r.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var g = cc.vv.mahjongmgr.getSide(d), u = l ? l.getChildByName(g) : null, v = u ? u.getChildByName("holds") : null;
if (null != v) {
for (var m = [], p = 0; p < v.childrenCount; ++p) {
var f = v.children[p];
f.active && m.push(f);
}
n(m, v, "up" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).x - e.convertToWorldSpaceAR(cc.v2(0, 0)).x;
} : "left" == g ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).y - e.convertToWorldSpaceAR(cc.v2(0, 0)).y;
} : function(e, t) {
return e.convertToWorldSpaceAR(cc.v2(0, 0)).y - t.convertToWorldSpaceAR(cc.v2(0, 0)).y;
});
}
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var _ = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == _) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
}
}, i + .05);
}
},
_cancelDealAnim: function() {
if (this._dealAnimating) {
this._dealAnimating = !1;
this._dealAnimId = (this._dealAnimId || 0) + 1;
for (var e = this._dealAnimNodes || [], t = 0; t < e.length; ++t) {
var i = e[t];
if (cc.isValid(i.node)) {
i.node.stopAllActions();
i.node.setPosition(i.x, i.y);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
_findMJNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null; t && null == t.mjId && t.parent; ) t = t.parent;
return t;
},
_findBtnNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null, i = {
btnPeng: 1,
btnGang: 1,
btnHu: 1,
btnGuo: 1,
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, c = n[1].mjId, s = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, c, s ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var l = this._findMJNode(e);
if (null != l) for (var r = 0; r < this._myMJArr.length; ++r) if (l == this._myMJArr[r].node) {
if (l == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
l.y = 15;
this._selectedMJ = l;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? 13 - t : t;
},
initMopai: function(e, t) {
this._cancelDealAnim();
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = cc.vv.mahjongmgr.getSide(i), a = cc.vv.mahjongmgr.getFoldPre(i), o = this.node.getChildByName("game").getChildByName(n).getChildByName("holds"), c = this.getMJIndex(n, 13), s = o.children[c];
if (null != s) {
s.scaleX = 1;
s.scaleY = 1;
if (null == t) s.active = !1; else if (t >= 0) {
s.active = !0;
if ("up" == n) {
s.scaleX = .73;
s.scaleY = .73;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a, t);
} else if (null != t) {
s.active = !0;
if ("up" == n) {
s.scaleX = 1;
s.scaleY = 1;
}
s.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(n);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), o = 0; o < n.childrenCount; ++o) {
var c = n.children[o];
c.scaleX = 1;
c.scaleY = 1;
c.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, o = a ? a.getChildByName("holds") : null;
if (null != o) {
var c = e.chis || [], s = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + c.length;
s *= 3;
for (var l = 0; l < s; ++l) {
var r = this.getMJIndex(i, l);
null != o.children[r] && (o.children[r].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (l = 0; l < d.length; ++l) {
r = this.getMJIndex(i, l + s);
if (null != o.children[r]) {
var g = o.children[r].getComponent(cc.Sprite);
if (null != g) {
if ("up" == i) {
g.node.scaleX = .73;
g.node.scaleY = .73;
}
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[l]);
}
}
}
this._hideUnusedHolds(i, o, s + d.length);
} else {
var u = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (l = s; l < s + u; ++l) {
r = this.getMJIndex(i, l);
var v = o.children[r];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, s + u);
}
}
}
}
},
_hideUnusedHolds: function(e, t, i) {
for (var n = i; n < 14; ++n) {
var a = this.getMJIndex(e, n);
null != t.children[a] && (t.children[a].active = !1);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var o = cc.vv.gameNetMgr.conf, c = o ? o.caishen : -1, s = o ? o.caishen2 : -1, l = [], r = [], h = 0; h < i.length; ++h) {
var d = i[h];
c >= 0 && d == c || null != s && s >= 0 && d == s ? l.push(d) : r.push(d);
}
cc.vv.mahjongmgr.sortMJ(r);
i.length = 0;
for (var g = 0; g < l.length; ++g) i.push(l[g]);
for (var u = 0; u < r.length; ++u) i.push(r[u]);
null != n && i.push(n);
return i;
},
initMahjongs: function(e, t) {
this._cancelDealAnim();
var i = t || this.getSelfSeatData();
console.log("[initMahjongs] allowMopai=", e, "forceSeatData=", !!t, "seatData.holds=", i ? "object" == typeof i.holds ? i.holds.length + ":" + JSON.stringify(i.holds) : i.holds : "null");
if (null != i && null != i.holds && "object" == typeof i.holds && null != i.holds.length) {
var n = this.sortHolds(i, e);
if (null != n) {
this._selectedMJ = null;
var a, o = i.chis || [], c = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + o.length), s = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (s = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (s = 0);
a = s > 0 ? .5 * s : 20;
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), r = this._myMJArr[c], h = r ? r.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", c, "holds.length=", n.length, "startSlot=", c, "endSlot=", c + n.length - 1);
for (var d = cc.vv.gameNetMgr.conf, g = d ? d.caishen : -1, u = d ? d.caishen2 : -1, v = [], m = 0; m < n.length; ++m) {
var p = n[m];
if (null == (C = this._myMJArr[m + c]) || null == C.node) {
v.push("SLOT_" + (m + c) + "=NULL");
break;
}
C.node.mjId = p;
C.node.y = 0;
var f = l && m == n.length - 1;
s > 0 && (C.node.x = h + m * s + (f ? a : 0));
this.setSpriteFrameByMJID("M_", C, p);
var _ = g >= 0 && p == g || null != u && u >= 0 && p == u;
C.node.color = _ ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (m + c) + "=" + p);
}
console.log("[initMahjongs] render:", v.join("|"));
for (m = 0; m < c; ++m) if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
for (m = c + n.length; m < this._myMJArr.length; ++m) {
var C;
if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
},
getSelfSeatData: function() {
var e = cc.vv.gameNetMgr, t = e ? e.seats : null;
if (!t) return null;
var i = e.seatIndex;
if (null != i && i >= 0 && i < t.length && t[i]) return t[i];
var n = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != n) for (var a = 0; a < t.length; ++a) if (t[a] && t[a].userid == n) return t[a];
return null;
},
getLocalIndex: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
return (e - cc.vv.gameNetMgr.seatIndex + t) % t;
},
showChiPanel: function(e) {
this.hideChiPanel();
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 36 + 146 * e.length + 30 * (e.length - 1), n = new cc.Node("chiPanel");
n.setContentSize(i, 120);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 120);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -60, i, 120);
o.fill();
o.stroke();
var c = new cc.Node("cap");
c.setContentSize(i, 26);
c.setPosition(0, 37);
n.addChild(c);
var s = c.addComponent(cc.Label);
s.string = "选择吃牌组合";
s.fontSize = 22;
s.lineHeight = 26;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
for (var l = 0; l < e.length; ++l) {
var r = e[l], h = new cc.Node("chiItem" + l);
h.setContentSize(146, 66);
h.setPosition(91 + -i / 2 + 176 * l, -13);
n.addChild(h);
h.addComponent(cc.Button);
h.paiList = r;
cc.vv.utils.addClickEvent(h, this.node, "MJGameZP", "onChiItemClicked");
for (var d = 0; d < r.length; ++d) {
var g = new cc.Node("p" + d);
g.setContentSize(46, 66);
g.setPosition(50 * d - 50, 0);
h.addChild(g);
var u = g.addComponent(cc.Sprite);
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", r[d]);
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = n;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e.target.paiList;
t && cc.vv.net.send("chi", t);
this.hideChiPanel();
this.hideOptions();
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i || "btnQiangJin" == i) cc.vv.net.send("hu"); else {
if ("btnYouJin" == i) {
var n = cc.vv.gameNetMgr.curaction, a = n && n.youjin ? n.youjin : this._lastYoujin || [];
this._lastYoujin = a;
this.showYoujinPanel(a);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJRoom: [ function(e, t) {
"use strict";
cc._RF.push(t, "9f0aeRoHPlBlp2qaYLq2unR", "MJRoom");
cc.Class({
extends: cc.Component,
properties: {
lblRoomNo: {
default: null,
type: cc.Label
},
_seats: [],
_seats2: [],
_inGame: !1,
_timeLabel: null,
_voiceMsgQueue: [],
_lastPlayingSeat: null,
_playingSeat: null,
_lastPlayTime: null,
_startBtn: null,
_startFrame: null,
_startReadyFrame: null,
_brickWall: null,
_brickStacks: null,
_bricks: [],
_brickFrame: null,
_brickGfx: null,
_brickCap: 0,
_brickX: 0,
_sioHandlers: null,
_leaving: !1
},
onLoad: function() {
if (null != cc.vv) {
this.initView();
this.initSeats();
this.initEventHandlers();
this.initStartButton();
this.applyCustomBtnSkins();
this.initBrickWall();
this.initNetExitListeners();
}
},
initView: function() {
var e = this.node.getChildByName("prepare"), t = e.getChildByName("btnBack");
if (t) {
t.scaleX = .9;
t.scaleY = .9;
}
for (var i = e.getChildByName("seats"), n = 0; n < i.children.length; ++n) this._seats.push(i.children[n].getComponent("Seat"));
this.refreshBtns();
this.lblRoomNo = cc.find("Canvas/infobar/Z_room_txt/New Label").getComponent(cc.Label);
this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
var a = cc.vv.gameNetMgr.roomId;
this.lblRoomNo.string = "房号:" + a;
var o = this.node.getChildByName("game"), c = cc.vv.mahjongmgr.is2Player() ? [ "myself", "up" ] : [ "myself", "right", "up", "left" ];
for (n = 0; n < c.length; ++n) {
var s = o.getChildByName(c[n]);
if (null != s) {
var l = s.getChildByName("seat");
null != l && this._seats2.push(l.getComponent("Seat"));
}
}
var r = cc.find("Canvas/prepare/btnWeichat");
r && cc.vv.utils.addClickEvent(r, this.node, "MJRoom", "onBtnWeichatClicked");
var h = cc.find("Canvas/typeTitle");
if (null != h) {
for (n = 0; n < h.children.length; ++n) h.children[n].active = !1;
if (cc.vv.gameNetMgr.conf) {
var d = cc.vv.gameNetMgr.conf.type;
null != d && "" != d || (d = "xzdd");
var g = h.getChildByName(d);
g && (g.active = !0);
}
}
},
refreshBtns: function() {
this.applySeatCount();
var e = this.node.getChildByName("prepare"), t = e.getChildByName("btnDissolve"), i = e.getChildByName("btnWeichat"), n = e.getChildByName("btnBack"), a = 0 == cc.vv.gameNetMgr.numOfGames, o = cc.vv.gameNetMgr.seats, c = o ? o[cc.vv.gameNetMgr.seatIndex] : null, s = !(!c || !c.ready);
t && (t.active = a && s);
i && (i.active = a);
n && (n.active = a && !s);
this.updateStartBtnState();
},
applySeatCount: function() {
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (e) {
for (var t = e.length, i = 0; i < this._seats.length; ++i) this._seats[i] && this._seats[i].node && (this._seats[i].node.active = i < t);
for (i = 0; i < this._seats2.length; ++i) this._seats2[i] && this._seats2[i].node && (this._seats2[i].node.active = i < t);
}
},
initStartButton: function() {
var e = this.node.getChildByName("prepare");
if (null != e) {
var t = e.getChildByName("btnStart"), i = null != t;
if (null == t) {
var n = e.getChildByName("btnBack") || e.getChildByName("btnDissolve");
if (null == n) return;
(t = cc.instantiate(n)).name = "btnStart";
e.addChild(t);
}
if (i) {
var a = t.getComponent(cc.Button);
a && a.clickEvents && 0 !== a.clickEvents.length || cc.vv.utils.addClickEvent(t, this.node, "MJRoom", "onBtnStartClicked");
} else {
var o = t.getComponent(cc.Widget);
o && t.removeComponent(o);
var c = t.getComponent(cc.Button);
if (c) {
c.transition = cc.Button.Transition.NONE;
c.clickEvents = [];
}
cc.vv.utils.addClickEvent(t, this.node, "MJRoom", "onBtnStartClicked");
this.retitleButton(t, "开始", 44);
t.setPosition(482, 98);
t.setScale(.5, .78);
}
this._startBtn = t;
this._startBtn.active = 0 == cc.vv.gameNetMgr.numOfGames;
}
},
onBtnStartClicked: function() {
var e = cc.vv.gameNetMgr.seats, t = e ? e[cc.vv.gameNetMgr.seatIndex] : null;
if (!t || !t.ready) {
cc.vv.net.send("ready");
t && (t.ready = !0);
this.updateStartBtnState();
}
},
_applyBtnFrame: function(e, t) {
var i = e.getComponent(cc.Sprite);
if (i) {
i.spriteFrame = t;
i.type = cc.Sprite.Type.SIMPLE;
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
var n = e.getChildByName("btnLabel");
n && (n.active = !1);
},
updateStartBtnState: function() {
var e = this._startBtn;
if (null != e) {
var t = "begin" != cc.vv.gameNetMgr.gamestate, i = cc.vv.gameNetMgr.seats, n = i ? i[cc.vv.gameNetMgr.seatIndex] : null, a = !(!n || !n.ready);
e.active = t && !a;
var o = e.getComponent(cc.Button);
o && (o.interactable = !0);
}
},
applyCustomBtnSkins: function() {
var e = this.node.getChildByName("prepare");
if (null != e) {
var t = this, i = function(e, i) {
var n = t._atlasCache = t._atlasCache || {}, a = n["images/atlas/game_ui"];
a ? i(a.getSpriteFrame(e)) : cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(t, o) {
if (!t && o) {
n["images/atlas/game_ui"] = o;
a = o;
}
i(a ? a.getSpriteFrame(e) : null);
});
};
i("mj_btn_start.png", function(e) {
if (e) {
t._startFrame = e;
t.updateStartBtnState();
}
});
i("mj_btn_ready.png", function(e) {
if (e) {
t._startReadyFrame = e;
t.updateStartBtnState();
}
});
var n = e.getChildByName("btnBack");
n && i("mj_btn_back.png", function(e) {
e && cc.isValid(n) && t._applyBtnFrame(n, e);
});
var a = e.getChildByName("btnDissolve");
a && i("mj_btn_dissolve.png", function(e) {
e && cc.isValid(a) && t._applyBtnFrame(a, e);
});
}
},
retitleButton: function(e, t, i) {
if (null != e) {
if (e.getComponent(cc.Sprite)) {
var n = e;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(n)) {
var i = n.getComponent(cc.Sprite);
if (i) {
i.spriteFrame = t;
i.type = cc.Sprite.Type.SIMPLE;
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
});
}
i = i || 40;
var a = e.getChildByName("btnLabel");
if (null == a) {
a = new cc.Node("btnLabel");
e.addChild(a);
}
var o = a.getComponent(cc.Label);
null == o && (o = a.addComponent(cc.Label));
o.string = t;
o.fontSize = i;
o.lineHeight = i;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
}
},
initBrickWall: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("brickWall");
if (null != t) {
this._brickWall = t;
this._brickBuilt = !0;
t.zIndex = -1;
this._brickCap = 72;
this._brickLeft = [];
this._brickRight = [];
for (var i = 0; i < 36; ++i) {
var n = (i < 10 ? "0" : "") + i;
this._brickLeft.push(t.getChildByName("L" + n));
this._brickRight.push(t.getChildByName("R" + n));
}
this._brickCaps = {
farL: t.getChildByName("capFarL"),
farR: t.getChildByName("capFarR"),
nearL: t.getChildByName("capNearL"),
nearR: t.getChildByName("capNearR")
};
this.refreshBrickWall();
} else this._brickBuilt = !1;
}
},
refreshBrickWall: function() {
if (this._brickBuilt) {
var e = cc.vv.gameNetMgr.numOfMJ;
(null == e || e < 0) && (e = 0);
(e = Math.max(0, e - 26)) > this._brickCap && (e = this._brickCap);
for (var t = Math.max(0, e - 36), i = Math.min(e, 36), n = 0; n < 36; ++n) {
this._brickLeft[n] && (this._brickLeft[n].active = n < t);
this._brickRight[n] && (this._brickRight[n].active = n < i);
}
var a = this._brickCaps;
a.farL && (a.farL.active = t > 0);
a.farR && (a.farR.active = i > 0);
a.nearL && (a.nearL.active = t > 0);
a.nearR && (a.nearR.active = i > 0);
}
},
_logSeatPayload: function(e, t) {
null != t ? console.log("[notify]" + e, "seatindex=" + t.seatindex, "userid=" + t.userid, "holds=" + JSON.stringify(t.holds), "pengs=" + JSON.stringify(t.pengs || []), "chis=" + JSON.stringify(t.chis || []), "angangs=" + JSON.stringify(t.angangs || []), "diangangs=" + JSON.stringify(t.diangangs || []), "wangangs=" + JSON.stringify(t.wangangs || [])) : console.log("[notify]" + e + " seatData=null");
},
initNetExitListeners: function() {
var e = cc.vv.net ? cc.vv.net.sio : null;
if (e && e.on && !this._sioHandlers) {
var t = this, i = function() {
console.log("[room] dispress_push:返回大厅");
t.leaveToHall();
}, n = function(e) {
var i = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != i && e == i) {
console.log("[room] exit_notify_push(自己已被移出房间):返回大厅");
t.leaveToHall();
}
}, a = function() {
console.log("[room] game_all_over_push:显示本次游戏总分数");
t.showTotalScorePanel(null);
}, o = function(e) {
if (e && (1 == e.final || e.endinfo)) {
console.log("[room] game_over_push(final):显示本次游戏总分数");
t.showTotalScorePanel(e);
}
}, c = function() {
console.log("[room] exit_result:退出成功,返回大厅/俱乐部");
t.leaveToHall();
};
e.on("dispress_push", i);
e.on("exit_notify_push", n);
e.on("game_all_over_push", a);
e.on("game_over_push", o);
e.on("exit_result", c);
this._sioHandlers = {
sio: e,
listeners: [ i, n, a, o, c ]
};
}
},
showTotalScorePanel: function(e) {
var t = this.node.getChildByName("game_result");
t && (t.active = !0);
var i = this.node.getChildByName("game_over");
i && (i.active = !1);
var n = this.node.getChildByName("game_over_xlch");
n && (n.active = !1);
var a = this.node.getComponent("GameResult");
if (null != a) {
var o = e || {};
a.onGameEnd ? a.onGameEnd(o.endinfo || null, o.roundHistory || null) : a.showTotalScore && a.showTotalScore();
}
},
leaveToHall: function() {
if (!this._leaving) {
var e = cc.director.getScene ? cc.director.getScene() : null, t = e && e.name ? e.name : "";
if ("hall" != t && "club" != t) {
this._leaving = !0;
cc.vv.gameNetMgr && (cc.vv.gameNetMgr._ignoreDisconnectOnce = !0);
if (cc.vv.fromClubId) {
cc.vv.fromClub = !0;
cc.director.loadScene("club");
} else cc.director.loadScene("hall");
}
}
},
initEventHandlers: function() {
var e = this;
this.node.on("new_user", function(t) {
e.initSingleSeat(t.detail);
});
this.node.on("user_state_changed", function(t) {
e.initSingleSeat(t.detail);
e.refreshBtns();
});
this.node.on("game_begin", function() {
e.refreshBtns();
e.initSeats();
});
this.node.on("game_num", function() {
e.refreshBtns();
});
this.node.on("game_huanpai", function() {
for (var t in e._seats2) e._seats2[t].refreshXuanPaiState();
});
this.node.on("huanpai_notify", function(t) {
var i = t.detail.seatindex, n = cc.vv.gameNetMgr.getLocalIndex(i);
e._seats2[n].refreshXuanPaiState();
});
this.node.on("game_huanpai_over", function() {
for (var t in e._seats2) e._seats2[t].refreshXuanPaiState();
});
this.node.on("voice_msg", function(t) {
t = t.detail;
e._voiceMsgQueue.push(t);
e.playVoice();
});
this.node.on("chat_push", function(t) {
t = t.detail;
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.sender), n = cc.vv.gameNetMgr.getLocalIndex(i), a = e._inGame ? e._seats2[n] : e._seats[n];
a && a.chat(t.content);
});
this.node.on("quick_chat_push", function(t) {
t = t.detail;
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.sender), n = cc.vv.gameNetMgr.getLocalIndex(i), a = t.content, o = cc.vv.chat.getQuickChatInfo(a), c = e._inGame ? e._seats2[n] : e._seats[n];
c && c.chat(o.content);
cc.vv.audioMgr.playSFX(o.sound);
});
this.node.on("emoji_push", function(t) {
t = t.detail;
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.sender), n = cc.vv.gameNetMgr.getLocalIndex(i);
console.log(t);
var a = e._inGame ? e._seats2[n] : e._seats[n];
a && a.emoji(t.content);
});
this.node.on("game_start", function() {
e.refreshBrickWall();
});
this.node.on("mj_count", function() {
e.refreshBrickWall();
});
this.node.on("game_mopai", function() {
e.refreshBrickWall();
});
this.node.on("game_start", function() {
e._inGame = !0;
var t = cc.vv.gameNetMgr.seats;
if (t) {
for (var i = 0; i < t.length; ++i) e._logSeatPayload("game_start seat" + i, t[i]);
e.initSeats();
}
});
this.node.on("peng_notify", function(t) {
e._logSeatPayload("peng_notify", t.detail);
});
this.node.on("chi_notify", function(t) {
e._logSeatPayload("chi_notify", t.detail);
});
this.node.on("gang_notify", function(t) {
e._logSeatPayload("gang_notify", t.detail ? t.detail.seatData : null);
});
this.node.on("game_chupai_notify", function(t) {
e._logSeatPayload("chupai_notify", t.detail ? t.detail.seatData : null);
});
this.node.on("game_mopai", function(t) {
var i = t.detail;
if (null != i) {
var n = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[i.seatIndex] : null;
e._logSeatPayload("game_mopai seat" + i.seatIndex, n);
}
});
},
initSeats: function() {
this.applySeatCount();
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) this.initSingleSeat(e[t]);
},
initSingleSeat: function(e) {
this.applySeatCount();
var t = cc.vv.gameNetMgr.getLocalIndex(e.seatindex), i = !e.online, n = e.seatindex == cc.vv.gameNetMgr.button;
console.log("isOffline:" + i);
this._seats[t].setInfo(e.name, e.score);
this._seats[t].setReady(e.ready);
this._seats[t].setOffline(i);
this._seats[t].setID(e.userid);
this._seats[t].voiceMsg(!1);
this._seats2[t].setInfo(e.name, e.score);
this._seats2[t].setZhuang(n);
this._seats[t].setZhuang(n);
var a = cc.vv.gameNetMgr.laozhuang || 0;
this._seats[t].setLaoZhuang(n ? a : 0);
this._seats2[t].setLaoZhuang(n ? a : 0);
this._seats2[t].setOffline(i);
this._seats2[t].setID(e.userid);
this._seats2[t].voiceMsg(!1);
this._seats2[t].refreshXuanPaiState();
},
onBtnSettingsClicked: function() {
cc.vv.popupMgr.showSettings();
},
onBtnBackClicked: function() {
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "是否确定退出房间？", function() {
cc.vv.net.send("exit");
}, !0) : cc.vv.net.send("exit");
},
onBtnChatClicked: function() {},
onBtnWeichatClicked: function() {
cc.vv.gameNetMgr.conf.type;
},
onBtnDissolveClicked: function() {
var e = function() {
cc.vv.gameNetMgr && "begin" == cc.vv.gameNetMgr.gamestate ? cc.vv.net.send("dissolve_request") : cc.vv.net.send("dispress");
};
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "解散房间不扣房卡，是否确定解散？", e, !0) : e();
},
onBtnExit: function() {
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "是否确定退出房间？", function() {
cc.vv.net.send("exit");
}, !0) : cc.vv.net.send("exit");
},
playVoice: function() {
if (null == this._playingSeat && this._voiceMsgQueue.length) {
console.log("playVoice2");
var e = this._voiceMsgQueue.shift(), t = cc.vv.gameNetMgr.getSeatIndexByID(e.sender), i = cc.vv.gameNetMgr.getLocalIndex(t);
this._playingSeat = i;
this._seats[i].voiceMsg(!0);
this._seats2[i].voiceMsg(!0);
var n = JSON.parse(e.content);
console.log(n.msg.length);
cc.vv.voiceMgr.writeVoice("voicemsg.amr", n.msg);
cc.vv.voiceMgr.play("voicemsg.amr");
this._lastPlayTime = Date.now() + n.time;
}
},
update: function() {
var e = Math.floor(Date.now() / 1e3 / 60);
if (this._lastMinute != e) {
this._lastMinute = e;
var t = new Date(), i = t.getHours();
i = i < 10 ? "0" + i : i;
var n = t.getMinutes();
n = n < 10 ? "0" + n : n;
this._timeLabel.string = i + ":" + n;
}
if (null != this._lastPlayTime) {
if (Date.now() > this._lastPlayTime + 200) {
this.onPlayerOver();
this._lastPlayTime = null;
}
} else this.playVoice();
},
onPlayerOver: function() {
cc.vv.audioMgr.resumeAll();
console.log("onPlayCallback:" + this._playingSeat);
var e = this._playingSeat;
this._playingSeat = null;
this._seats[e].voiceMsg(!1);
this._seats2[e].voiceMsg(!1);
},
onDestroy: function() {
cc.vv.voiceMgr.stop();
if (this._sioHandlers && this._sioHandlers.sio) {
for (var e = this._sioHandlers.sio, t = this._sioHandlers.listeners || [], i = 0; i < t.length; ++i) e.removeListener ? e.removeListener(t[i]) : e.off && e.off(t[i]);
this._sioHandlers = null;
}
}
});
cc._RF.pop();
}, {} ],
NoticeTip: [ function(e, t) {
"use strict";
cc._RF.push(t, "0aafcQ/RJxAE7C7z3tIXJ4F", "NoticeTip");
cc.Class({
extends: cc.Component,
properties: {
_guohu: null,
_info: null,
_guohuTime: -1
},
onLoad: function() {
this._guohu = cc.find("Canvas/tip_notice");
this._guohu.active = !1;
this._info = cc.find("Canvas/tip_notice/info").getComponent(cc.Label);
var e = this;
this.node.on("push_notice", function(t) {
t = t.detail;
e._guohu.active = !0;
e._guohuTime = t.time;
e._info.string = t.info;
});
},
update: function(e) {
if (this._guohuTime > 0) {
this._guohuTime -= e;
this._guohuTime < 0 && (this._guohu.active = !1);
}
}
});
cc._RF.pop();
}, {} ],
PengGangs: [ function(e, t) {
"use strict";
cc._RF.push(t, "594e6upScRAKqdCYJ7LQDR6", "PengGangs");
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
if (cc.vv) {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("myself");
if (null != t) {
var i = t.getChildByName("penggangs");
if (null != i) {
var n = cc.view.getVisibleSize().width / 1280;
if (n < 1) {
i.scaleX *= n;
i.scaleY *= n;
}
var a = this;
this.node.on("peng_notify", function(e) {
e = e.detail;
a.onPengGangChanged(e);
});
this.node.on("gang_notify", function(e) {
e = e.detail;
a.onPengGangChanged(e.seatData);
});
this.node.on("chi_notify", function(e) {
e = e.detail;
a.onPengGangChanged(e);
});
this.node.on("game_start", function() {
a.onGameBein();
a.scheduleOnce(function() {
if (cc.isValid(a.node)) try {
var e = cc.vv.gameNetMgr.seats;
for (var t in e) a.onPengGangChanged(e[t]);
} catch (e) {
cc.warn("[PengGangs] 重连副露重绘失败: " + (e && e.message ? e.message : e));
}
}, 0);
});
var o = cc.vv.gameNetMgr.seats;
for (var c in o) this.onPengGangChanged(o[c]);
}
}
}
}
},
onGameBein: function() {
this.hideSide("myself");
this.hideSide("right");
this.hideSide("up");
this.hideSide("left");
},
hideSide: function(e) {
var t = this.node.getChildByName("game");
if (null != t) {
var i = t.getChildByName(e);
if (null != i) {
var n = i.getChildByName("penggangs");
if (n) for (var a = 0; a < n.childrenCount; ++a) n.children[a].active = !1;
}
}
},
onPengGangChanged: function(e) {
if (null != e && (null != e.angangs || null != e.diangangs || null != e.wangangs || null != e.pengs || null != e.chis)) {
var t = e.seatindex;
if (null == t && null != e.userid) for (var i = cc.vv.gameNetMgr.seats || [], n = 0; n < i.length; ++n) if (i[n] && i[n].userid == e.userid) {
t = n;
break;
}
if (null != t) {
var a = cc.vv.gameNetMgr.getLocalIndex(t), o = cc.vv.mahjongmgr.getSide(a), c = cc.vv.mahjongmgr.getFoldPre(a);
console.log("onPengGangChanged" + a);
var s = this.node.getChildByName("game");
if (null != s) {
var l = s.getChildByName(o);
if (null != l) {
var r = l.getChildByName("penggangs");
if (null != r) {
for (var h = 0; h < r.childrenCount; ++h) r.children[h].active = !1;
var d = 0, g = e.angangs || [];
for (h = 0; h < g.length; ++h) {
var u = g[h];
this.initPengAndGangs(r, o, c, d, u, "angang");
d++;
}
for (g = e.diangangs || [], h = 0; h < g.length; ++h) {
u = g[h];
this.initPengAndGangs(r, o, c, d, u, "diangang");
d++;
}
for (g = e.wangangs || [], h = 0; h < g.length; ++h) {
u = g[h];
this.initPengAndGangs(r, o, c, d, u, "wangang");
d++;
}
var v = e.pengs || [];
for (h = 0; h < v.length; ++h) {
u = v[h];
var m = e.pengTiles && e.pengTiles[h] || null;
this.initPengAndGangs(r, o, c, d, u, "peng", m);
d++;
}
var p = e.chis || [];
for (h = 0; h < p.length; ++h) {
this.initChis(r, o, c, d, p[h]);
d++;
}
}
}
}
}
}
},
initChis: function(e, t, i, n, a) {
var o = null;
if (e.childrenCount <= n) {
o = "left" == t || "right" == t ? cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft) : cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e.addChild(o);
} else (o = e.children[n]).active = !0;
if ("left" == t) o.y = -75 * n; else if ("right" == t) {
o.y = 75 * n;
o.zIndex = -n;
} else o.x = "myself" == t ? 165 * n + 10 * n : -165 * n;
for (var c = o.getComponentsInChildren(cc.Sprite), s = 0, l = 0; l < c.length; ++l) {
var r = c[l];
if ("gang" == r.node.name) r.node.active = !1; else {
var h = s < a.length ? a[s] : a[a.length - 1];
r.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, h);
s++;
}
}
},
initPengAndGangs: function(e, t, i, n, a, o, c) {
var s = null;
if (e.childrenCount <= n) {
s = "left" == t || "right" == t ? cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft) : cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e.addChild(s);
} else (s = e.children[n]).active = !0;
if ("left" == t) s.y = -75 * n; else if ("right" == t) {
s.y = 75 * n;
s.zIndex = -n;
} else s.x = "myself" == t ? 165 * n + 10 * n : -165 * n;
for (var l = s.getComponentsInChildren(cc.Sprite), r = 0, h = 0; h < l.length; ++h) {
var d = l[h];
if ("gang" == d.node.name) {
var g = "peng" != o;
d.node.active = g;
d.node.scaleX = 1;
d.node.scaleY = 1;
if ("angang" == o) {
d.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(t);
if ("myself" == t || "up" == t) {
d.node.scaleX = 1.4;
d.node.scaleY = 1.4;
}
} else d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, a);
} else {
var u = "peng" == o && c && r < c.length ? c[r] : a;
d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, u);
r++;
}
}
}
});
cc._RF.pop();
}, {} ],
PopupMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "fa18412m3RFrZAD6LACvsmD", "PopupMgr");
cc.Class({
extends: cc.Component,
properties: {
_popuproot: null,
_settings: null,
_dissolveNotice: null,
_endTime: -1,
_extraInfo: null,
_noticeLabel: null
},
onLoad: function() {
if (null != cc.vv) {
cc.vv.popupMgr = this;
this._popuproot = cc.find("Canvas/popups");
this._settings = cc.find("Canvas/popups/settings");
this._dissolveNotice = cc.find("Canvas/popups/dissolve_notice");
this._noticeLabel = this._dissolveNotice.getChildByName("info").getComponent(cc.Label);
this.closeAll();
this.addBtnHandler("settings/btn_close");
this.addBtnHandler("settings/btn_sqjsfj");
this.addBtnHandler("dissolve_notice/btn_agree");
this.addBtnHandler("dissolve_notice/btn_reject");
this.addBtnHandler("dissolve_notice/btn_ok");
var e = this;
this.node.on("dissolve_notice", function(t) {
var i = t.detail;
e.showDissolveNotice(i);
});
this.node.on("dissolve_cancel", function() {
e.closeAll();
});
}
},
start: function() {
cc.vv.gameNetMgr.dissoveData && this.showDissolveNotice(cc.vv.gameNetMgr.dissoveData);
},
addBtnHandler: function(e) {
var t = cc.find("Canvas/popups/" + e);
this.addClickEvent(t, this.node, "PopupMgr", "onBtnClicked");
},
addClickEvent: function(e, t, i, n) {
var a = new cc.Component.EventHandler();
a.target = t;
a.component = i;
a.handler = n;
e.getComponent(cc.Button).clickEvents.push(a);
},
onBtnClicked: function(e) {
this.closeAll();
var t = e.target.name;
"btn_agree" == t ? cc.vv.net.send("dissolve_agree") : "btn_reject" == t ? cc.vv.net.send("dissolve_reject") : "btn_sqjsfj" == t && (cc.vv.gameNetMgr && "begin" == cc.vv.gameNetMgr.gamestate ? cc.vv.net.send("dissolve_request") : cc.vv.net.send("exit_release"));
},
closeAll: function() {
this._fitPopupRoot();
this._popuproot.active = !1;
this._settings.active = !1;
this._dissolveNotice.active = !1;
},
_fitPopupRoot: function() {
if (this._popuproot) {
var e = cc.view.getVisibleSize(), t = cc.view.getVisibleOrigin();
this._popuproot.setContentSize(e.width, e.height);
this._popuproot.setPosition(this._popuproot.parent.convertToNodeSpaceAR(cc.v2(t.x + e.width / 2, t.y + e.height / 2)));
}
},
showSettings: function() {
this.closeAll();
this._popuproot.active = !0;
this._settings.active = !0;
},
showDissolveRequest: function() {
this.closeAll();
this._popuproot.active = !0;
},
showDissolveNotice: function(e) {
this._endTime = Date.now() / 1e3 + e.time;
this._extraInfo = "";
for (var t = 0; t < e.states.length; ++t) {
var i = e.states[t], n = cc.vv.gameNetMgr.seats[t].name;
this._extraInfo += i ? "\n[已同意] " + n : "\n[待确认] " + n;
}
this.closeAll();
this._popuproot.active = !0;
this._dissolveNotice.active = !0;
},
update: function() {
if (this._endTime > 0) {
var e = this._endTime - Date.now() / 1e3;
e < 0 && (this._endTime = -1);
var t = Math.floor(e / 60), i = Math.ceil(e - 60 * t), n = "";
t > 0 && (n += t + "分");
this._noticeLabel.string = n + i + "秒后房间将自动解散" + this._extraInfo;
}
}
});
cc._RF.pop();
}, {} ],
RadioButton: [ function(e, t) {
"use strict";
cc._RF.push(t, "9bb5aKN2AhO9rc9uB+nKZnL", "RadioButton");
cc.Class({
extends: cc.Component,
properties: {
target: cc.Node,
sprite: cc.SpriteFrame,
checkedSprite: cc.SpriteFrame,
checked: !1,
groupId: -1
},
onLoad: function() {
if (null != cc.vv) {
if (null == cc.vv.radiogroupmgr) {
var t = e("RadioGroupMgr");
cc.vv.radiogroupmgr = new t();
cc.vv.radiogroupmgr.init();
}
console.log(typeof cc.vv.radiogroupmgr.add);
cc.vv.radiogroupmgr.add(this);
this.refresh();
}
},
refresh: function() {
var e = this.target.getComponent(cc.Sprite);
this.checked ? e.spriteFrame = this.checkedSprite : e.spriteFrame = this.sprite;
},
check: function(e) {
this.checked = e;
this.refresh();
},
onClicked: function() {
cc.vv.radiogroupmgr.check(this);
},
onDestroy: function() {
cc.vv && cc.vv.radiogroupmgr && cc.vv.radiogroupmgr.del(this);
}
});
cc._RF.pop();
}, {
RadioGroupMgr: "RadioGroupMgr"
} ],
RadioGroupMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "c78ccvLg3JLFb+ds06R6ds7", "RadioGroupMgr");
cc.Class({
extends: cc.Component,
properties: {
_groups: null
},
init: function() {
this._groups = {};
},
add: function(e) {
var t = e.groupId, i = this._groups[t];
if (null == i) {
i = [];
this._groups[t] = i;
}
i.push(e);
},
del: function(e) {
var t = e.groupId, i = this._groups[t];
if (null != i) {
var n = i.indexOf(e);
-1 != n && i.splice(n, 1);
0 == i.length && delete this._groups[t];
}
},
check: function(e) {
var t = e.groupId, i = this._groups[t];
if (null != i) for (var n = 0; n < i.length; ++n) {
var a = i[n];
a == e ? a.check(!0) : a.check(!1);
}
}
});
cc._RF.pop();
}, {} ],
ReConnect: [ function(e, t) {
"use strict";
cc._RF.push(t, "92090ZoIYtGWYDJARih2HLV", "ReConnect");
cc.Class({
extends: cc.Component,
properties: {
_reconnect: null,
_lblTip: null,
_lastPing: 0
},
onLoad: function() {
this._reconnect = cc.find("Canvas/reconnect");
this._lblTip = cc.find("Canvas/reconnect/tip").getComponent(cc.Label);
var e = this, t = function() {
console.log("[reconnect] 无法回到原牌局,返回来源页");
cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState();
cc.vv.userMgr.oldRoomId = null;
cc.vv.wc && cc.vv.wc.hide && cc.vv.wc.hide();
cc.director.loadScene("club");
}, i = function e() {
cc.vv.net.test(function(i) {
i ? null != (n = cc.vv.userMgr.oldRoomId) ? cc.vv.userMgr.enterRoom(n, function(e) {
null != e && 0 === e.errcode || t();
}) : t() : setTimeout(e, 3e3);
var n;
});
};
this.node.on("disconnect", function t() {
e.node.off("disconnect", t);
e._reconnect.active = !0;
i();
});
},
update: function() {
if (this._reconnect.active) {
var e = Math.floor(Date.now() / 1e3) % 4;
this._lblTip.string = "与服务器断开连接，正在尝试重连";
for (var t = 0; t < e; ++t) this._lblTip.string += ".";
}
}
});
cc._RF.pop();
}, {} ],
ReplayCtrl: [ function(e, t) {
"use strict";
cc._RF.push(t, "cd404pxLQVL243CPrY7hRC9", "ReplayCtrl");
cc.Class({
extends: cc.Component,
properties: {
_nextPlayTime: 1,
_replay: null,
_isPlaying: !0
},
onLoad: function() {
if (null != cc.vv) {
this._replay = cc.find("Canvas/replay");
this._replay.active = cc.vv.replayMgr.isReplay();
}
},
onBtnPauseClicked: function() {
this._isPlaying = !1;
},
onBtnPlayClicked: function() {
this._isPlaying = !0;
},
onBtnBackClicked: function() {
cc.vv.replayMgr.clear();
cc.vv.gameNetMgr.reset();
cc.vv.gameNetMgr.roomId = null;
cc.vv.fromClub = !0;
cc.director.loadScene("club");
},
update: function(e) {
if (cc.vv && this._isPlaying && 1 == cc.vv.replayMgr.isReplay() && this._nextPlayTime > 0) {
this._nextPlayTime -= e;
this._nextPlayTime < 0 && (this._nextPlayTime = cc.vv.replayMgr.takeAction());
}
}
});
cc._RF.pop();
}, {} ],
Seat: [ function(e, t) {
"use strict";
cc._RF.push(t, "0a655J0tGxFP5NzRxNN4E+I", "Seat");
cc.Class({
extends: cc.Component,
properties: {
_sprIcon: null,
_zhuang: null,
_ready: null,
_offline: null,
_lblName: null,
_lblScore: null,
_scoreBg: null,
_nddayingjia: null,
_voicemsg: null,
_chatBubble: null,
_emoji: null,
_lastChatTime: -1,
_userName: "",
_score: 0,
_dayingjia: !1,
_isOffline: !1,
_isReady: !1,
_isZhuang: !1,
_userId: null
},
onLoad: function() {
if (null != cc.vv) {
this._sprIcon = this.node.getChildByName("icon").getComponent("ImageLoader");
this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
var e = this.node.getChildByName("icon");
e && this._lblName && (this._lblName.node.width = e.width + 16);
if (this._lblName) {
this._lblName.fontSize = Math.min(this._lblName.fontSize, 18);
this._lblName.lineHeight = this._lblName.fontSize + 2;
this._lblName.enableWrapText = !1;
this._lblName.overflow = cc.Label.Overflow.CLAMP;
}
this._lblScore = this.node.getChildByName("score").getComponent(cc.Label);
this._voicemsg = this.node.getChildByName("voicemsg");
this._xuanpai = this.node.getChildByName("xuanpai");
this.refreshXuanPaiState();
this._voicemsg && (this._voicemsg.active = !1);
this._sprIcon && this._sprIcon.getComponent(cc.Button) && cc.vv.utils.addClickEvent(this._sprIcon, this.node, "Seat", "onIconClicked");
this._offline = this.node.getChildByName("offline");
this._ready = this.node.getChildByName("ready");
this._zhuang = this.node.getChildByName("zhuang");
this._zhuang && (this._zhuang.active = !1);
this._scoreBg = this.node.getChildByName("Z_money_frame");
this._nddayingjia = this.node.getChildByName("dayingjia");
this._chatBubble = this.node.getChildByName("ChatBubble");
if (null != this._chatBubble) {
this._chatBubble.active = !1;
var t = this._chatBubble.getChildByName("New Label");
t && (t.active = !1);
}
this._emoji = this.node.getChildByName("emoji");
null != this._emoji && (this._emoji.active = !1);
this.refresh();
this._sprIcon && this._userId && this._sprIcon.setUserID(this._userId);
}
},
onIconClicked: function() {
var e = this._sprIcon.node.getComponent(cc.Sprite);
if (null != this._userId && this._userId > 0) {
var t = cc.vv.gameNetMgr.getSeatByID(this._userId), i = 0;
if (cc.vv.baseInfoMap) {
var n = cc.vv.baseInfoMap[this._userId];
n && (i = n.sex);
}
cc.vv.userinfoShow.show(t.name, t.userid, e, i, t.ip);
}
},
refresh: function() {
null != this._lblName && (this._lblName.string = this._userName);
null != this._lblScore && (this._lblScore.string = this._score);
null != this._nddayingjia && (this._nddayingjia.active = 1 == this._dayingjia);
this._offline && (this._offline.active = this._isOffline && "" != this._userName);
this._ready && (this._ready.active = this._isReady);
this._zhuang && (this._zhuang.active = this._isZhuang);
this.node.active = null != this._userName && "" != this._userName;
},
setInfo: function(e, t, i) {
this._userName = e;
this._score = t;
null == this._score && (this._score = 0);
this._dayingjia = i;
null != this._scoreBg && (this._scoreBg.active = null != this._score);
null != this._lblScore && (this._lblScore.node.active = null != this._score);
this.refresh();
},
setZhuang: function(e) {
this._isZhuang = e;
null == this._zhuang && (this._zhuang = this.node.getChildByName("zhuang"));
this._zhuang && (this._zhuang.active = e);
},
setLaoZhuang: function(e) {
var t = this.node.getChildByName("laozhuang");
if (null == t) {
var i = this.node.getChildByName("icon"), n = i ? i.x + 28 : 34, a = i ? i.y + 28 : 34;
(t = new cc.Node("laozhuang")).setContentSize(90, 22);
t.setPosition(n, a - 24);
this.node.addChild(t);
var o = t.addComponent(cc.Label);
o.fontSize = 18;
o.lineHeight = 22;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.overflow = cc.Label.Overflow.NONE;
t.color = cc.color(255, 225, 120);
var c = t.addComponent(cc.LabelOutline);
c.color = cc.color(60, 30, 0);
c.width = 2;
}
var s = null != e && e >= 1;
t.active = s;
if (s) {
var l = t.getComponent(cc.Label);
l && (l.string = "老庄" + e);
}
},
setReady: function(e) {
this._isReady = e;
this._ready && (this._ready.active = this._isReady);
},
setID: function(e) {
var t = this.node.getChildByName("id");
t && (t.getComponent(cc.Label).string = "ID:" + e);
this._userId = e;
this._sprIcon && this._sprIcon.setUserID(e);
},
setOffline: function(e) {
this._isOffline = e;
this._offline && (this._offline.active = this._isOffline && "" != this._userName);
},
chat: function(e) {
if (null != this._chatBubble && null != this._emoji) {
this._emoji.active = !1;
this._chatBubble.active = !0;
var t = new cc.Color(255, 255, 255, 255), i = this._chatBubble.getChildByName("New Label");
(function e(t) {
for (var n = t === i, a = t.getComponents(cc.Label), o = 0; o < a.length; o++) a[o].enabled = !1;
if (!n) {
for (var c = t.getComponents(cc.LabelOutline), s = 0; s < c.length; s++) c[s].enabled = !1;
for (var l = t.getComponents(cc.LabelShadow), r = 0; r < l.length; r++) l[r].enabled = !1;
}
for (var h = 0; h < t.children.length; h++) e(t.children[h]);
})(this._chatBubble);
if (i) {
i.active = !0;
var n = i.getComponent(cc.Label);
if (n) {
n.enabled = !0;
n.string = e;
n.node.color = t;
n.color = t;
}
}
var a = this._chatBubble.getChildByName("chatbg_ld");
if (a) {
a.active = !0;
var o = a.getComponent(cc.Sprite);
o && !o.spriteFrame && cc.loader.loadRes("images/chat/chat_backbg", cc.SpriteFrame, function(e, t) {
!e && o && (o.spriteFrame = t);
});
}
this._lastChatTime = 3;
}
},
emoji: function(e) {
if (null != this._emoji && null != this._emoji) {
console.log(e);
this._chatBubble.active = !1;
this._emoji.active = !0;
this._emoji.getComponent(cc.Animation).play(e);
this._lastChatTime = 3;
}
},
voiceMsg: function(e) {
this._voicemsg && (this._voicemsg.active = e);
},
refreshXuanPaiState: function() {
if (null != this._xuanpai) {
this._xuanpai.active = cc.vv.gameNetMgr.isHuanSanZhang;
if (0 != cc.vv.gameNetMgr.isHuanSanZhang) {
this._xuanpai.getChildByName("xz").active = !1;
this._xuanpai.getChildByName("xd").active = !1;
var e = cc.vv.gameNetMgr.getSeatByID(this._userId);
e && (null == e.huanpais ? this._xuanpai.getChildByName("xz").active = !0 : this._xuanpai.getChildByName("xd").active = !0);
}
}
},
update: function(e) {
if (this._lastChatTime > 0) {
this._lastChatTime -= e;
if (this._lastChatTime < 0) {
this._chatBubble.active = !1;
this._emoji.active = !1;
this._emoji.getComponent(cc.Animation).stop();
}
}
}
});
cc._RF.pop();
}, {} ],
TimePointer: [ function(e, t) {
"use strict";
cc._RF.push(t, "2cec180dg5FbZBjz0vSx8X6", "TimePointer");
cc.Class({
extends: cc.Component,
properties: {
_arrow: null,
_pointer: null,
_timeLabel: null,
_time: -1,
_alertTime: -1
},
onLoad: function() {
var e = this.node.getChildByName("game");
this._arrow = e.getChildByName("arrow");
this._pointer = this._arrow.getChildByName("pointer");
this._timeLabel = this._arrow.getChildByName("lblTime").getComponent(cc.Label);
this._timeLabel.string = "00";
this.initPointer();
var t = this;
this.node.on("game_begin", function() {
t.startTurn();
});
this.node.on("game_start", function() {
t.startTurn();
});
this.node.on("game_chupai", function() {
t.startTurn();
});
this.node.on("game_mopai", function() {
t.startTurn();
});
},
startTurn: function() {
this.initPointer();
if (this._arrow.active) {
var e = cc.vv.gameNetMgr.chupaiTimeout;
(null == e || e <= 0) && (e = 15);
this._time = e;
this._alertTime = 3;
}
},
initPointer: function() {
if (null != cc.vv) {
var e = cc.vv.gameNetMgr.turn;
this._arrow.active = "begin" == cc.vv.gameNetMgr.gamestate && e >= 0;
if (this._arrow.active) {
var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = 0;
"right" == i ? n = 1 : "up" == i ? n = 2 : "left" == i && (n = 3);
for (var a = 0; a < this._pointer.children.length; ++a) this._pointer.children[a].active = a == n;
}
}
},
update: function(e) {
if (this._time > 0) {
this._time -= e;
if (this._alertTime > 0 && this._time < this._alertTime) {
cc.vv.audioMgr.playSFX("timeup_alarm.mp3");
this._alertTime = -1;
}
var t = "";
this._time < 0 && (this._time = 0);
var i = Math.ceil(this._time);
i < 10 && (t = "0");
this._timeLabel.string = t + i;
}
}
});
cc._RF.pop();
}, {} ],
UserInfoShow: [ function(e, t) {
"use strict";
cc._RF.push(t, "28240nr0jlB963YFZ4XkuUL", "UserInfoShow");
cc.Class({
extends: cc.Component,
properties: {
_userinfo: null
},
onLoad: function() {
if (null != cc.vv) {
this._userinfo = cc.find("Canvas/userinfo");
this._userinfo.active = !1;
cc.vv.utils.addClickEvent(this._userinfo, this.node, "UserInfoShow", "onClicked");
cc.vv.userinfoShow = this;
}
},
show: function(e, t, i, n, a) {
if (null != t && t > 0) {
this._userinfo.active = !0;
this._userinfo.getChildByName("icon").getComponent(cc.Sprite).spriteFrame = i.spriteFrame;
this._userinfo.getChildByName("name").getComponent(cc.Label).string = e;
this._userinfo.getChildByName("ip").getComponent(cc.Label).string = "IP: " + a.replace("::ffff:", "");
this._userinfo.getChildByName("id").getComponent(cc.Label).string = "ID: " + t;
var o = this._userinfo.getChildByName("sex_female");
o.active = !1;
var c = this._userinfo.getChildByName("sex_male");
c.active = !1;
1 == n ? c.active = !0 : 2 == n && (o.active = !0);
}
},
onClicked: function() {
this._userinfo.active = !1;
}
});
cc._RF.pop();
}, {} ],
Voice: [ function(e, t) {
"use strict";
cc._RF.push(t, "edcddHQ8s1Jw48/UaWN7x7O", "Voice");
cc.Class({
extends: cc.Component,
properties: {
_lastTouchTime: null,
_voice: null,
_volume: null,
_voice_failed: null,
_lastCheckTime: -1,
_timeBar: null,
_failedTimer: null,
MAX_TIME: 15e3,
FAILED_TIP_MS: 2e3
},
onLoad: function() {
this._voice = cc.find("Canvas/voice");
this._voice.active = !1;
this._voice_failed = cc.find("Canvas/voice/voice_failed");
this._voice_failed.active = !1;
this._timeBar = cc.find("Canvas/voice/time");
this._timeBar.scaleX = 0;
this._volume = cc.find("Canvas/voice/volume");
for (var e = 1; e < this._volume.children.length; ++e) this._volume.children[e].active = !1;
(t = cc.find("Canvas/voice/voice_failed/btn_ok")) && cc.vv.utils.addClickEvent(t, this.node, "Voice", "onBtnOKClicked");
var t, i = this;
if (t = cc.find("Canvas/btn_voice")) {
t.on(cc.Node.EventType.TOUCH_START, function() {
console.log("cc.Node.EventType.TOUCH_START");
i._clearFailedTimer();
cc.vv.voiceMgr.prepare("record.amr");
i._lastTouchTime = Date.now();
i._voice.active = !0;
i._voice_failed.active = !1;
});
t.on(cc.Node.EventType.TOUCH_MOVE, function() {
console.log("cc.Node.EventType.TOUCH_MOVE");
});
t.on(cc.Node.EventType.TOUCH_END, function() {
console.log("cc.Node.EventType.TOUCH_END");
if (Date.now() - i._lastTouchTime < 1e3) {
i._voice_failed.active = !0;
cc.vv.voiceMgr.cancel();
i._scheduleFailedAutoClose();
} else i.onVoiceOK();
i._lastTouchTime = null;
});
t.on(cc.Node.EventType.TOUCH_CANCEL, function() {
console.log("cc.Node.EventType.TOUCH_CANCEL");
cc.vv.voiceMgr.cancel();
i._lastTouchTime = null;
i._voice.active = !1;
});
}
},
onVoiceOK: function() {
if (null != this._lastTouchTime) {
cc.vv.voiceMgr.release();
var e = Date.now() - this._lastTouchTime, t = cc.vv.voiceMgr.getVoiceData("record.amr");
cc.vv.net.send("voice_msg", {
msg: t,
time: e
});
}
this._voice.active = !1;
},
onBtnOKClicked: function() {
this._clearFailedTimer();
this._voice.active = !1;
},
_clearFailedTimer: function() {
if (this._failedTimer) {
clearTimeout(this._failedTimer);
this._failedTimer = null;
}
},
_scheduleFailedAutoClose: function() {
var e = this;
this._clearFailedTimer();
this._failedTimer = setTimeout(function() {
e._failedTimer = null;
e._voice_failed.active = !1;
e._voice.active = !1;
}, this.FAILED_TIP_MS);
},
update: function() {
if (1 == this._voice.active && 0 == this._voice_failed.active && Date.now() - this._lastCheckTime > 300) {
for (var e = 0; e < this._volume.children.length; ++e) this._volume.children[e].active = !1;
var t = cc.vv.voiceMgr.getVoiceLevel(7);
t >= 1 && t <= 7 && (this._volume.children[t - 1].active = !0);
this._lastCheckTime = Date.now();
}
if (this._lastTouchTime) {
var i = Date.now() - this._lastTouchTime;
if (i >= this.MAX_TIME) {
this.onVoiceOK();
this._lastTouchTime = null;
} else {
var n = i / this.MAX_TIME;
this._timeBar.scaleX = 1 - n;
}
}
}
});
cc._RF.pop();
}, {} ],
clubScene: [ function(e, t) {
"use strict";
cc._RF.push(t, "47d77SErCFJl7fxgisdblQt", "clubScene");
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
console.log("[club] onLoad fired, cc.vv=", !!cc.vv);
if (cc.vv) {
var e = cc.find("Canvas"), t = e.getChildByName("clubPage"), i = e.getChildByName("wfPage");
if (cc.vv.fromClubId) {
t && (t.active = !1);
i && (i.active = !1);
this._clubBackToDetail(cc.vv.fromClubId);
} else {
t && (t.active = !0);
i && (i.active = !1);
this.openClubPanel();
}
} else cc.director.loadScene("loading");
},
_clubPaintRect: function(e, t, i, n, a, o) {
e.fillColor = n;
e.rect(-t / 2, -i / 2, t, i);
e.fill();
e.strokeColor = a;
e.lineWidth = o;
e.rect(-t / 2, -i / 2, t, i);
e.stroke();
},
openClubPanel: function() {
null == this._clubPanel && this._clubBuildPanel();
this._clubPanel.active = !0;
this._clubLayoutPage();
this._clubState = null;
this._clubListArea && (this._clubListArea.active = !1);
this._clubClearList();
this._clubRefreshList();
},
_clubBuildPanel: function() {
var e = this, t = cc.find("Canvas");
if (null != t) {
var i = t.getChildByName("clubPage");
if (i) {
this._clubBaked = !0;
this._clubPanel = i;
this._clubPageBg = i.getChildByName("clubBg");
if (this._clubPageBg) {
var n = this._clubPageBg.getComponent(cc.Canvas);
n && n.destroy();
var a = this._clubPageBg.getComponent(cc.Sprite);
a && (a.sizeMode = cc.Sprite.SizeMode.CUSTOM);
}
this._clubMask = i.getChildByName("mask");
this._clubCloseBtn = i.getChildByName("btn_close");
this._clubBtnMine = i.getChildByName("btnMine");
this._clubBtnCreate = i.getChildByName("btnCreate");
this._clubBtnJoin = i.getChildByName("btnJoin");
this._clubListArea = i.getChildByName("listArea");
for (var o = [ this._clubBtnMine, this._clubBtnCreate, this._clubBtnJoin ], c = 0; c < o.length; ++c) if (o[c]) {
o[c]._clubW = o[c].width;
o[c]._clubH = o[c].height;
}
if (!i._clubBound) {
i._clubBound = !0;
this._clubMask && this._clubMask.on(cc.Node.EventType.TOUCH_START, function() {});
if (this._clubCloseBtn) {
var s = this._clubCloseBtn.getComponent(cc.Button);
s && (s.clickEvents = []);
this._clubCloseBtn.on(cc.Node.EventType.TOUCH_END, function() {
e._clubClosePanel();
});
}
this._clubBtnMine && this._clubBtnMine.on(cc.Node.EventType.TOUCH_END, function() {
e._clubShowMine();
e._clubRefreshList();
});
this._clubBtnCreate && this._clubBtnCreate.on(cc.Node.EventType.TOUCH_END, function() {
e._clubShowCreate();
});
this._clubBtnJoin && this._clubBtnJoin.on(cc.Node.EventType.TOUCH_END, function() {
e._clubShowJoin();
});
this._clubBindBakedPopups(i);
}
this._clubLayoutPage();
}
}
},
_clubBindBakedPopups: function(e) {
var t = this, i = function(e, i) {
if (e && !e._clubBound) {
e._clubBound = !0;
var n = e.getChildByName("close");
n && n.on(cc.Node.EventType.TOUCH_END, function() {
t._clubShowMine();
});
if (i) {
var a = e.getChildByName("PopupScene20"), o = a ? a.getChildByName("New Label") : null;
if (o) {
var c = o.getComponent(cc.Label);
c && (c.string = "请输入俱乐部ID");
}
var s = e.getComponent("JoinGameInput");
if (s) {
t._clubJoinComp = s;
s.onInputFinished = function(e) {
t._clubDoJoin(e);
};
}
}
}
};
i(e.getChildByName("clubCreateWin"), !1);
i(e.getChildByName("clubJoinWin"), !0);
},
_clubStretchPopupDim: function(e) {
if (e) {
var t = e.getChildByName("New Layout");
if (t) {
var i = cc.view.getVisibleSize();
t.setContentSize(i.width, i.height);
t.setPosition(0, 0);
}
}
},
_clubLayoutPage: function() {
var e = this._clubPanel;
if (e) {
var t = cc.view.getVisibleSize(), i = cc.view.getVisibleOrigin();
e.setContentSize(t.width, t.height);
e.setPosition(e.parent.convertToNodeSpaceAR(cc.v2(i.x + t.width / 2, i.y + t.height / 2)));
if (this._clubPageBg) {
this._clubPageBg.setContentSize(t.width, t.height);
this._clubPageBg.setPosition(0, 0);
}
this._clubMask && this._clubMask.setContentSize(t.width, t.height);
}
},
_clubPaintBtn: function() {},
_clubRefreshBtnFrames: function() {},
_clubFind: function(e, t) {
if (!e) return null;
if (e.name === t) return e;
for (var i = e.children, n = 0; n < i.length; n++) {
var a = this._clubFind(i[n], t);
if (a) return a;
}
return null;
},
_clubPaintRow: function(e, t) {
e._selected = t;
var i = e._iconSp, n = i ? t && e._iconSel ? e._iconSel : e._iconNormal : null;
if (i && n) {
i.spriteFrame = n;
i.node.setContentSize(e.width, e.height);
} else {
var a = e.getChildByName("bg");
if (a) {
var o = a.getComponent(cc.Graphics);
if (o) {
o.clear();
this._clubPaintRect(o, e.width, e.height, t ? cc.color(96, 78, 150) : cc.color(52, 42, 84), t ? cc.color(255, 200, 90) : cc.color(120, 100, 170), 2);
}
}
}
},
_loadAtlasFrame: function(e, t, i) {
var n = this._atlasCache = this._atlasCache || {}, a = function(e) {
i(e && e.getSpriteFrame(t) || null);
};
n[e] ? a(n[e]) : cc.resources.load(e, cc.SpriteAtlas, function(t, i) {
!t && i && (n[e] = i);
a(n[e]);
});
},
_clubAddRow: function(e, t, i, n, a, o, c) {
var s = this;
o = o || 760;
var l = new cc.Node("row" + t);
l.setContentSize(o, 68);
var r = e.height ? e.height / 2 - 34 : 110;
l.setPosition(0, r - 73 * t);
e.addChild(l);
var h = -o / 2 + 20, d = 26, g = 0, u = cc.Label.HorizontalAlign.LEFT;
if (c) {
h = 0;
d = 24;
g = .5;
u = cc.Label.HorizontalAlign.CENTER;
var v = new cc.Node("bgimg");
v.setContentSize(o, 68);
l.addChild(v);
var m = v.addComponent(cc.Sprite);
m.sizeMode = cc.Sprite.SizeMode.CUSTOM;
m.type = cc.Sprite.Type.SIMPLE;
l._iconSp = m;
s._loadAtlasFrame("images/atlas/hall_ui", "club_game.png", function(e) {
if (e && cc.isValid(v)) {
l._iconNormal = e;
if (!l._selected || !l._iconSel) {
m.spriteFrame = e;
v.setContentSize(o, 68);
}
}
});
s._loadAtlasFrame("images/atlas/hall_ui", "club_game_on.png", function(e) {
if (e && cc.isValid(v)) {
l._iconSel = e;
if (l._selected) {
m.spriteFrame = e;
v.setContentSize(o, 68);
}
}
});
}
var p = new cc.Node("l");
p.anchorX = g;
p.setContentSize(.5 === g ? o : o - (h + o / 2) - 70, 68);
p.setPosition(h, 0);
l.addChild(p);
var f = p.addComponent(cc.Label);
f.string = i;
f.fontSize = d;
f.lineHeight = 68;
f.horizontalAlign = u;
f.verticalAlign = cc.Label.VerticalAlign.CENTER;
f.overflow = cc.Label.Overflow.NONE;
p.color = cc.color(0, 0, 0);
if (null != n && "" != n) {
var _ = new cc.Node("s");
_.anchorX = 1;
_.setContentSize(100, 68);
_.setPosition(o / 2 - 20, 0);
l.addChild(_);
var C = _.addComponent(cc.Label);
C.string = n;
C.fontSize = 24;
C.lineHeight = 68;
C.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
C.verticalAlign = cc.Label.VerticalAlign.CENTER;
_.color = cc.color(0, 0, 0);
}
a && l.on(cc.Node.EventType.TOUCH_END, function() {
s._clubScrollMoved ? s._clubScrollMoved = !1 : a(l);
});
return l;
},
_clubMakeScrollBox: function(e, t, i, n) {
var a = this, o = this._clubFind(e, "box");
if (o) {
var c = this._clubFind(o, "view"), s = c ? this._clubFind(c, "content") : null, l = c ? c.width : 0, r = c ? c.height : 0;
if (s) {
var h = s.getChildByName("rowTpl");
s.removeAllChildren();
h && s.addChild(h);
}
this._clubScroll = {
view: c,
content: s,
vw: l,
vh: r
};
if (c && !o._clubScrollBound) {
o._clubScrollBound = !0;
var d = 0, g = 0;
c.on(cc.Node.EventType.TOUCH_START, function(e) {
d = e.getLocation().y;
g = a._clubScroll && a._clubScroll.content ? a._clubScroll.content.y : 0;
a._clubScrollMoved = !1;
});
c.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
var t = a._clubScroll;
if (t && t.content && !(t.content.height <= t.vh)) {
var i = e.getLocation().y - d;
Math.abs(i) > 6 && (a._clubScrollMoved = !0);
var n = (t.vh - t.content.height) / 2, o = (t.content.height - t.vh) / 2;
t.content.y = Math.max(n, Math.min(o, g + i));
}
});
c.on(cc.Node.EventType.TOUCH_CANCEL, function() {
a._clubScrollMoved = !1;
});
}
return s;
}
var u = new cc.Node("box");
u.setContentSize(t, i);
e.addChild(u);
var v = new cc.Node("bg");
v.setContentSize(t, i);
u.addChild(v);
var m = v.addComponent(cc.Sprite);
m.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._clubLoadBg4(function(e) {
if (e) {
m.spriteFrame = e;
m.type = cc.Sprite.Type.SLICED;
}
});
var p = t - 44, f = i - 44, _ = new cc.Node("view");
_.setContentSize(p, f);
u.addChild(_);
var C = _.addComponent(cc.Mask);
cc.Mask.Type && null != cc.Mask.Type.RECT && (C.type = cc.Mask.Type.RECT);
var y = new cc.Node("content");
y.setContentSize(p, Math.max(f, n));
y.setPosition(0, (f - y.height) / 2);
_.addChild(y);
this._clubScroll = {
view: _,
content: y,
vw: p,
vh: f
};
var b = 0, N = 0;
_.on(cc.Node.EventType.TOUCH_START, function(e) {
b = e.getLocation().y;
N = y.y;
a._clubScrollMoved = !1;
});
_.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
if (!(y.height <= f)) {
var t = e.getLocation().y - b;
Math.abs(t) > 6 && (a._clubScrollMoved = !0);
var i = (f - y.height) / 2, n = (y.height - f) / 2;
y.y = Math.max(i, Math.min(n, N + t));
}
});
_.on(cc.Node.EventType.TOUCH_CANCEL, function() {
a._clubScrollMoved = !1;
});
return y;
},
_clubLoadBg4: function(e) {
if (this._clubBg4Frame) e(this._clubBg4Frame); else {
var t = this, i = function(i) {
if (i) {
i.insetLeft = 26;
i.insetRight = 26;
i.insetTop = 26;
i.insetBottom = 26;
t._clubBg4Frame = i;
e(i);
} else e(null);
};
cc.resources.load("images/other/bg4", cc.SpriteFrame, function(t, n) {
!t && n ? i(n) : e(null);
});
}
},
_clubClearList: function() {
this._clubScroll = null;
if (this._clubBaked) {
if (this._clubDetailFullBg && cc.isValid(this._clubDetailFullBg)) {
var e = this._clubDetailFullBg.getComponent(cc.Graphics);
e && e.clear();
}
if (this._clubListArea) {
var t = this._clubFind(this._clubListArea, "games");
if (t) {
var i = t.getChildByName("gameRowTpl"), n = t.getChildByName("emptyTip"), a = t.getChildByName("samptext");
t.removeAllChildren();
a && t.addChild(a);
i && t.addChild(i);
if (n) {
t.addChild(n);
n.active = !1;
}
}
var o = this._clubFind(this._clubListArea, "tablesView"), c = o ? o.getChildByName("tables") : null;
c && c.removeAllChildren();
var s = this._clubFind(this._clubListArea, "box"), l = s ? s.getChildByName("view") : null, r = l ? l.getChildByName("content") : null;
if (r) {
var h = r.getChildByName("rowTpl"), d = r.getChildByName("emptyTip");
r.removeAllChildren();
h && r.addChild(h);
if (d) {
r.addChild(d);
d.active = !1;
}
}
}
} else {
this._clubDetailBgNode && cc.isValid(this._clubDetailBgNode) && this._clubDetailBgNode.destroy();
this._clubDetailBgNode = null;
this._clubDetailFullBg && cc.isValid(this._clubDetailFullBg) && this._clubDetailFullBg.destroy();
this._clubDetailFullBg = null;
this._clubListArea && this._clubListArea.removeAllChildren();
}
},
_clubRefreshList: function() {
var e = this;
cc.vv.http.sendRequest("/club_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (0 === t.errcode) {
e._myClubs = t.clubs || [];
if ("mine" === e._clubState) {
e._clubSetTop();
e._clubRenderMine();
}
} else cc.vv.wc.showError(t.errmsg || "获取俱乐部失败");
});
},
_clubSetTop: function() {},
_clubShowMine: function() {
this._clubCloseJoinWin();
this._clubCloseCreateWin();
this._clubCloseBtn && (this._clubCloseBtn.active = !0);
this._clubState = "mine";
this._clubListArea && (this._clubListArea.active = !0);
this._clubSetTop();
this._clubRenderMine();
},
_clubRenderMine: function() {
var e = this;
this._clubClearList();
var t = this._clubListArea;
if (t) {
var i = this._myClubs || [], n = Math.min(t.width || 880, 920), a = (t.height || 460) - 10, o = i.length > 0 ? i.length : 1;
this._clubMakeScrollBox(t, n, a, 80 * o + 20);
var c = this._clubScroll ? this._clubScroll.content : t;
if (c) {
var s = c.getChildByName("rowTpl");
s && (s.active = !1);
var l = c.getChildByName("emptyTip");
l && (l.active = 0 == i.length);
if (0 != i.length) {
var r = s ? s.height : 68, h = r + 5, d = c.height / 2 - r / 2;
i.forEach(function(t, i) {
var n = s ? cc.instantiate(s) : new cc.Node("row" + i);
n.active = !0;
n.setPosition(0, d - i * h);
c.addChild(n);
var a = n.getChildByName("name");
if (a) {
var o = a.getComponent(cc.Label);
o && (o.string = t.name || "");
}
var l = n.getChildByName("sub");
if (l) {
var r = l.getComponent(cc.Label);
r && (r.string = (t.member_count || 0) + "人");
}
n.on(cc.Node.EventType.TOUCH_END, function() {
e._clubScrollMoved ? e._clubScrollMoved = !1 : e._wfOpenDetail(t);
});
});
}
}
}
},
_clubShowCreate: function() {
this._clubClearList();
this._clubCloseJoinWin();
var e = this._clubPanel ? this._clubPanel.getChildByName("clubCreateWin") : null;
if (e) {
this._clubCreateWin = e;
this._clubStretchPopupDim(e);
e.active = !0;
}
},
_clubShowJoin: function() {
this._clubClearList();
this._clubCloseCreateWin();
var e = this._clubPanel ? this._clubPanel.getChildByName("clubJoinWin") : null;
if (e) {
this._clubJoinWin = e;
this._clubStretchPopupDim(e);
e.active = !0;
}
},
_clubDoJoin: function(e) {
var t = this, i = parseInt(e);
i > 0 ? cc.vv.http.sendRequest("/club_join", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: i
}, function(e) {
if (0 !== e.errcode) if (4 !== e.errcode) if (3 !== e.errcode) {
cc.vv.wc.showError(e.errmsg || "加入失败");
t._clubJoinComp && t._clubJoinComp.onResetClicked && t._clubJoinComp.onResetClicked();
} else {
cc.vv.wc.showError("没有此ID的俱乐部");
t._clubJoinComp && t._clubJoinComp.onResetClicked && t._clubJoinComp.onResetClicked();
} else {
t._clubJoinWin && (t._clubJoinWin.active = !1);
t._clubShowMine();
t._clubRefreshList();
} else {
t._clubJoinWin && (t._clubJoinWin.active = !1);
cc.vv.wc.showError("已加入俱乐部「" + e.name + "」");
t._clubShowMine();
t._clubRefreshList();
}
}) : cc.vv.wc.showError("请输入正确的俱乐部ID");
},
_clubCloseJoinWin: function() {
this._clubJoinWin && (this._clubJoinWin.active = !1);
},
_clubCloseCreateWin: function() {
this._clubCreateWin && (this._clubCreateWin.active = !1);
},
_clubBackToDetail: function(e) {
var t = this;
cc.vv.http.sendRequest("/club_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(i) {
if (0 === i.errcode) {
t._myClubs = i.clubs || [];
for (var n = null, a = 0; a < t._myClubs.length; a++) if (t._myClubs[a].id == e) {
n = t._myClubs[a];
break;
}
n ? t._wfOpenDetail(n) : t.openClubPanel();
} else t.openClubPanel();
});
},
_wfOpenDetail: function(e) {
this._wfPanel && this._wfClose();
var t = cc.find("Canvas");
if (t) {
cc.view.getVisibleSize(), cc.view.getVisibleOrigin();
var i = t.getChildByName("wfPage");
if (i) {
i.active = !0;
var n = i.getChildByName("mask");
n && (i._clubBound || n.on(cc.Node.EventType.TOUCH_START, function() {}));
i._clubBound = !0;
var a = i.getChildByName("listArea");
this._wfPanel = i;
this._wfBaked = !0;
this._wfSaved = {
panel: this._clubPanel,
area: this._clubListArea,
closeBtn: this._clubCloseBtn,
baked: this._clubBaked
};
this._clubBaked = !0;
this._clubPanel = i;
this._clubListArea = a;
this._clubCloseBtn = null;
this._wfSaved.panel && (this._wfSaved.panel.active = !1);
this._clubDetailBgNode = i.getChildByName("detailBgImg");
this._clubDetailFullBg = i.getChildByName("detailFullBg");
this._clubOpenDetail(e);
}
}
},
_wfBack: function() {
cc.vv.fromClubId = null;
cc.vv.fromClub = !1;
this._wfClose();
this.openClubPanel();
this._clubShowMine();
},
_wfClose: function() {
this._clubStopTableWatch();
var e = this._wfSaved;
this._wfPanel && cc.isValid(this._wfPanel) && (this._wfBaked ? this._wfPanel.active = !1 : this._wfPanel.destroy());
this._wfBaked = !1;
this._wfPanel = null;
this._clubDetailBgNode = null;
this._clubDetailFullBg = null;
this._clubBackBtn = null;
this._clubTablesNode = null;
this._clubGameRows = null;
if (e) {
this._clubPanel = e.panel;
this._clubListArea = e.area;
this._clubCloseBtn = e.closeBtn;
this._clubBaked = e.baked;
this._wfSaved = null;
}
this._clubState = null;
},
_clubOpenDetail: function(e) {
var t = this;
this._clubCur = e;
this._clubCurGame = null;
this._clubState = "detail";
this._clubSetTop(!0, e.name);
cc.vv.http.sendRequest("/club_games", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: e.id
}, function(e) {
if (0 === e.errcode) {
t._clubGames = e.games || [];
t._clubRenderDetail();
} else cc.vv.wc.showError(e.errmsg || "获取玩法失败");
});
},
_clubRenderDetail: function() {
var e = this;
this._clubClearList();
var t = this._clubListArea, i = (t.height, cc.view.getVisibleSize(), this._clubPanel.getChildByName("detailBgImg"));
this._clubDetailBgNode = i;
var n = this._clubPanel.getChildByName("detailFullBg");
this._clubDetailFullBg = n;
n.getComponent(cc.Graphics).clear();
this._clubCloseBtn && (this._clubCloseBtn.active = !1);
var a = this._clubFind(t, "btnBack");
if (a) {
a._clubW = a.width;
a._clubH = a.height;
if (!a._clubBound) {
a._clubBound = !0;
a.on(cc.Node.EventType.TOUCH_END, function() {
e._wfBack();
});
}
this._clubBackBtn = a;
}
var o = this._clubFind(t, "clubName");
if (o) {
var c = o.getComponent(cc.Label), s = this._clubCur || {}, l = s.name || s.club_name || s.clubName || "";
c && l && (c.string = l);
o.active = !0;
o.color = new cc.Color(0, 0, 0, 255);
if (a && o.parent) {
var r = a.convertToWorldSpaceAR(cc.v2((1 - a.anchorX) * a.width, 0)), h = o.parent.convertToNodeSpaceAR(r);
o.x = h.x + 30 + o.anchorX * o.width;
}
}
var d = this._clubFind(t, "clubGems"), g = function(e) {
if (cc.isValid(d)) {
var t = d.getComponent(cc.Label);
t && (t.string = String(null == e ? 0 : e));
}
};
d && g(cc.vv.userMgr.gems);
cc.vv.http.sendRequest("/get_user_status", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (t && null != t.gems) {
cc.vv.userMgr.gems = Number(t.gems);
e._gemsCache = {
gems: cc.vv.userMgr.gems,
at: Date.now()
};
g(cc.vv.userMgr.gems);
}
});
var u = this._clubFind(t, "games");
if (u) {
var v = u.getChildByName("gameRowTpl"), m = u.getChildByName("emptyTip"), p = u.getChildByName("samptext");
u.removeAllChildren();
p && u.addChild(p);
if (v) {
u.addChild(v);
v.active = !1;
}
m && u.addChild(m);
this._clubGameRows = [];
var f = this._clubGames || [], _ = v ? v.height : 68, C = _ + 5, y = u.height / 2 - _ / 2 - 130, b = u.getChildByName("emptyTip");
b && (b.active = 0 == f.length);
f.forEach(function(t, i) {
var n = v ? cc.instantiate(v) : new cc.Node("row" + i);
n.active = !0;
n.setPosition(0, y - i * C);
u.addChild(n);
var a = n.getChildByName("l");
if (a) {
a.setContentSize(n.width, n.height);
a.setPosition(0, 0);
var o = a.getComponent(cc.Label);
if (o) {
o.string = t.name || "";
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.overflow = cc.Label.Overflow.SHRINK;
}
}
var c = n.getChildByName("bgimg");
if (c) {
var s = c.getComponent(cc.Sprite);
n._iconSp = s;
n._iconNormal = s ? s.spriteFrame : null;
n._iconSel = null;
cc.resources.load("images/club/game_btn_normal", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(c)) {
n._iconNormal = t;
n._selected || (s.spriteFrame = t);
}
});
cc.resources.load("images/club/game_btn_pressed", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(c)) {
n._iconSel = t;
n._selected && (s.spriteFrame = t);
}
});
}
n.on(cc.Node.EventType.TOUCH_END, function() {
e._clubScrollMoved ? e._clubScrollMoved = !1 : e._clubSelectGame(t, n);
});
e._clubGameRows.push(n);
});
var N = this._clubFind(t, "tablesView");
if (N) {
var M = N.width;
this._clubTablesNode = N.getChildByName("tables");
this._clubTablesNode.removeAllChildren();
if (!N._clubBound) {
N._clubBound = !0;
var S = 0, B = 0;
N.on(cc.Node.EventType.TOUCH_START, function(t) {
S = t.getLocation().y;
B = e._clubTablesNode ? e._clubTablesNode.y : 0;
e._clubTablesScrollMoved = !1;
});
N.on(cc.Node.EventType.TOUCH_MOVE, function(t) {
if (e._clubTablesNode) {
var i = N.height, n = e._clubTablesNode.height;
if (!(n <= i)) {
var a = t.getLocation().y - S;
Math.abs(a) > 6 && (e._clubTablesScrollMoved = !0);
var o = i / 2, c = n - i / 2;
e._clubTablesNode.y = Math.max(o, Math.min(c, B + a));
}
}
});
N.on(cc.Node.EventType.TOUCH_CANCEL, function() {
e._clubTablesScrollMoved = !1;
});
}
var w = this._clubTableCardPrefab, A = 260, x = 1;
if (w && w.data) {
A = w.data.width || 260;
x = null != w.data.scaleX ? w.data.scaleX : 1;
}
var P = (M - 20 - 24) / (4 * A);
P > 1 && (P = 1);
this._clubTableCols = 4;
this._clubTableScale = x * P;
if (!this._clubCurGame && f.length > 0) {
var I = cc.vv.lastGameType, L = null;
if (I) for (var j = 0; j < f.length; ++j) if ((f[j].game_type || f[j].type) == I) {
L = f[j];
break;
}
this._clubCurGame = L || f[0];
}
for (var T = 0; T < this._clubGameRows.length; ++T) this._clubPaintRow(this._clubGameRows[T], f[T] === this._clubCurGame);
this._clubCurGame ? this._clubLoadTables() : this._clubAddRow(this._clubTablesNode, 0, "← 请先选择左侧玩法", "", null, 520);
}
}
},
_clubSelectGame: function(e, t) {
this._clubCurGame = e;
for (var i = 0; i < this._clubGameRows.length; ++i) this._clubPaintRow(this._clubGameRows[i], this._clubGameRows[i] === t);
this._clubLoadTables();
},
_clubMaxPlayers: function(e) {
if (e) {
var t = e.max_players || e.maxPlayers;
if (t) return parseInt(t);
}
var i = this._clubCurGame && this._clubCurGame.game_type ? this._clubCurGame.game_type : "";
return 0 === i.indexOf("zj4") || 0 === i.indexOf("zp4") || "wujin" == i ? 4 : 2;
},
_clubAddTableCard: function(e, t, i) {
var n = this, a = this._clubTableCols || 3, o = t % a, c = Math.floor(t / a), s = this._clubTableCardPrefab;
if (s) {
var l = this._clubTableScale || 1, r = (s.data && s.data.width || 260) * l, h = (s.data && s.data.height || 210) * l, d = -(a * r + 8 * (a - 1)) / 2 + r / 2, g = -10 - h / 2, u = cc.instantiate(s);
u.setScale(l, l);
u.setPosition(d + o * (r + 8), g - c * (h + 8));
e.addChild(u);
for (var v = [ "L", "R", "T", "B" ], m = this._clubMaxPlayers(i), p = [ i.user_id0 || 0, i.user_id1 || 0, i.user_id2 || 0, i.user_id3 || 0 ], f = [], _ = 0; _ < 4; _++) {
var C = u.getChildByName("seat" + _);
if (C) if (_ >= m) C.active = !1; else {
C._side = v[_];
var y = C.getChildByName("chara");
y && (y.active = !1);
f.push(C);
this._clubSetSeat(C, p[_] || 0);
}
}
this._clubTableCardMap || (this._clubTableCardMap = {});
var b = {
card: u,
slots: f,
uids: p
};
this._clubTableCardMap[i.id] = b;
i.roomid && (this._clubTableCardMap["r_" + i.roomid] = b);
var N = u.getChildByName("n");
if (N) {
var M = N.getComponent(cc.Label);
M && (M.string = (i.name || "") + "号桌");
}
var S = {};
try {
S = JSON.parse(i.conf) || {};
} catch (e) {}
var B = this._clubCurGame || {}, w = B.difen_options || [], A = B.jushu_options || [], x = "number" == typeof S.difen && null != w[S.difen] ? w[S.difen] : S.difen, P = "number" == typeof S.jushuxuanze && null != A[S.jushuxuanze] ? A[S.jushuxuanze] : S.jushuxuanze, I = u.getChildByName("c");
if (I) {
var L = I.getComponent(cc.Label);
L && (L.string = "底分" + (null != x ? x : "-") + "  局数" + (null != P ? P : "-"));
}
var j = u.getChildByName("btnClear");
if (j) {
j.active = !!i.can_clear;
if (i.can_clear) {
j.off(cc.Node.EventType.TOUCH_END);
j.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubClearTable(i);
});
}
}
u.on(cc.Node.EventType.TOUCH_END, function() {
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubEnterTable(i);
});
return u;
}
cc.resources.load("prefabs/club_table_card", cc.Prefab, function(e, t) {
if (!e && t) {
n._clubTableCardPrefab = t;
n._clubTablesNode && cc.isValid(n._clubTablesNode) && n._clubLoadTables();
} else console.log("[俱乐部]牌桌prefab加载失败", e);
});
},
_clubShowConfirm: function(e, t, i) {
var n = cc.find("Canvas/alert");
if (n) {
var a = this;
if (!this._clubAlertBound) {
this._clubAlertBound = !0;
var o = n.getChildByName("btn_ok"), c = n.getChildByName("btn_cancel");
o && o.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
var e = a._clubAlertOk;
a._clubAlertOk = null;
e && e();
});
c && c.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
a._clubAlertOk = null;
});
}
var s = cc.find("Canvas/alert/title"), l = cc.find("Canvas/alert/content");
s && (s = s.getComponent(cc.Label)) && (s.string = e);
l && (l = l.getComponent(cc.Label)) && (l.string = t);
this._clubAlertOk = i;
n.active = !0;
} else i && i();
},
_clubClearTable: function(e) {
var t = this;
this._clubShowConfirm("清空牌桌", "确定清空「" + (e.name || "") + "号桌」?将解散房间并踢出所有玩家", function() {
cc.vv.wc.show("正在清空牌桌");
cc.vv.http.sendRequest("/club_clear_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
tableid: e.id
}, function(e) {
cc.vv.wc.hide();
if (0 === e.errcode) {
t._clubTablesSig = null;
t._clubLoadTables();
} else cc.vv.wc.showError(e.errmsg || "清空失败");
});
});
},
_clubApplyFrame: function(e, t) {
if (e && cc.isValid(e)) {
var i = e.width, n = e.height, a = e.getComponent(cc.Sprite);
a || (a = e.addComponent(cc.Sprite));
a.sizeMode = cc.Sprite.SizeMode.CUSTOM;
0 !== t.indexOf("club_female") ? this._loadAtlasFrame("images/atlas/club_ui", t + ".png", function(t) {
if (t && cc.isValid(e)) {
var a = e.getComponent(cc.Sprite);
if (a) {
a.sizeMode = cc.Sprite.SizeMode.CUSTOM;
a.spriteFrame = t;
e.setContentSize(i, n);
}
}
}) : cc.resources.load("images/club/" + t, cc.SpriteFrame, function(t, a) {
if (!t && a && cc.isValid(e)) {
var o = e.getComponent(cc.Sprite);
if (o) {
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
o.spriteFrame = a;
e.setContentSize(i, n);
}
}
});
}
},
_clubSetSeat: function(e, t) {
if (e && cc.isValid(e)) {
t = t || 0;
if (e._uid !== t) {
e._uid = t;
var i = e.getChildByName("chara");
if (i) if (t <= 0) {
i.active = !1;
var n = e.getChildByName("nick");
n && (n.active = !1);
} else {
var a = this, o = function(t) {
if (cc.isValid(i)) {
var n, o = t && 2 === Number(t.sex), c = e._side || "L";
n = "R" === c || "B" === c ? o ? "club_female_r" : "club_male_r" : o ? "club_female_l" : "club_male_l";
a._clubApplyFrame(i, n);
i.active = !0;
var s = e.getChildByName("nick");
if (!s) {
var l = (s = new cc.Node("nick")).addComponent(cc.Label);
l.fontSize = 13;
l.lineHeight = 16;
l.overflow = cc.Label.Overflow.CLAMP;
s.setContentSize(130, 16);
s.color = cc.Color.WHITE;
e.addChild(s);
}
s.getComponent(cc.Label).string = t && t.name || "";
s.setPosition(0, i.y + i.height / 2 + 10);
s.active = !0;
}
};
cc.vv.baseInfoMap && null != cc.vv.baseInfoMap[t] && null != cc.vv.baseInfoMap[t].sex ? o(cc.vv.baseInfoMap[t]) : cc.vv.http.sendRequest("/base_info", {
userid: t
}, function(e) {
var i = {
name: e && e.name || "",
sex: e ? e.sex : null,
url: e && e.headimgurl ? e.headimgurl + ".jpg" : null
};
null == cc.vv.baseInfoMap && (cc.vv.baseInfoMap = {});
cc.vv.baseInfoMap[t] = i;
o(i);
}, cc.vv.http.master_url);
}
}
}
},
_clubStartTableWatch: function() {
this._clubCur && this._clubCur.id && this._clubSubConnect(this._clubCur.id);
},
_clubStopTableWatch: function() {
this._clubSubStop();
},
_clubSubConnect: function(e) {
var t = this;
if (e > 0) if (this._clubSubSio && this._clubSubClubId === e) this._clubSubEmit(); else {
this._clubSubStop();
this._clubSubClubId = e;
cc.vv.http.sendRequest("/club_subscribe_info", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: e
}, function(i) {
null != i && 0 === i.errcode && i.ip && i.port ? t._clubSubClubId === e && t._clubSubOpen(i.ip + ":" + i.port) : console.log("[俱乐部订阅]获取游戏服地址失败,静默降级为HTTP拉取");
});
}
},
_clubSubOpen: function(e) {
var t = this;
if ("undefined" != typeof window && null != window.io) {
var i = null;
try {
i = window.io.connect(e, {
reconnection: !0,
reconnectionDelay: 3e3,
"force new connection": !0,
transports: [ "websocket", "polling" ]
});
} catch (e) {
console.log("[俱乐部订阅]连接异常:" + (e && e.message));
return;
}
this._clubSubSio = i;
i.on("connect", function() {
t._clubSubEmit();
});
i.on("connect_error", function() {});
i.on("club_update", function(e) {
t._clubSubOnUpdate(e);
});
}
},
_clubSubEmit: function() {
var e = this._clubSubSio;
if (e && this._clubSubClubId) {
var t = this._clubCurGame && this._clubCurGame.game_type ? this._clubCurGame.game_type : null;
e.emit("club_subscribe", {
clubid: this._clubSubClubId,
game_type: t
});
}
},
_clubSubOnUpdate: function(e) {
if (this._clubPanel && this._clubPanel.active && "detail" === this._clubState && this._clubCurGame) if (e && (0 === e.player_count || e.seats && 0 === e.seats.length)) {
var t = e.roomid && this._clubTableCardMap ? this._clubTableCardMap["r_" + e.roomid] : null;
if (t) {
for (var i = 0; i < t.slots.length; ++i) this._clubSetSeat(t.slots[i], 0);
if (t.uids) for (var n = 0; n < t.uids.length; ++n) t.uids[n] = 0;
delete this._clubTableCardMap["r_" + e.roomid];
}
this._clubTablesSig = null;
this._clubLoadTables();
} else if (e && e.roomid && this._clubTableCardMap && this._clubTableCardMap["r_" + e.roomid]) {
for (var a = this._clubTableCardMap["r_" + e.roomid], o = e.seats || [], c = [], s = 0; s < a.slots.length; ++s) c.push(0);
for (var l = 0; l < o.length; ++l) {
var r = o[l].seatindex;
r >= 0 && r < c.length && (c[r] = o[l].userid || 0);
}
for (var h = 0; h < a.slots.length; ++h) this._clubSetSeat(a.slots[h], c[h]);
} else this._clubLoadTables();
},
_clubSubStop: function() {
var e = this._clubSubSio;
if (e) try {
e.off && e.off("club_update");
e.disconnect();
} catch (e) {}
this._clubSubSio = null;
this._clubSubClubId = null;
},
_clubLoadTables: function() {
this._clubStartTableWatch();
var e = this;
cc.vv.http.sendRequest("/club_tables", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id,
game_type: this._clubCurGame.game_type
}, function(t) {
if (0 === t.errcode) {
for (var i = t.tables || [], n = "", a = 0; a < i.length; ++a) n += (i[a].id || "") + ":" + (i[a].player_count || 0) + ":" + (i[a].user_id0 || 0) + "," + (i[a].user_id1 || 0) + "," + (i[a].user_id2 || 0) + "," + (i[a].user_id3 || 0) + ",";
if (!(n === e._clubTablesSig && e._clubTablesNode && e._clubTablesNode.childrenCount > 0)) {
e._clubTablesSig = n;
e._clubTableCardMap = {};
e._clubTablesNode.removeAllChildren();
e._clubTablesNode.y = e._clubTablesNode.parent.height / 2;
var o = 210;
e._clubTableCardPrefab && e._clubTableCardPrefab.data && (o = (e._clubTableCardPrefab.data.height || 210) * (e._clubTableCardPrefab.data.scaleX || 1));
o *= e._clubTableScale || 1;
var c = e._clubTableCols || 1, s = Math.ceil(i.length / c), l = Math.max(e._clubTablesNode.parent.height, 10 + s * o + 12 * Math.max(0, s - 1) + 10);
e._clubTablesNode.setContentSize(e._clubTablesNode.width, l);
0 != i.length ? i.forEach(function(t, i) {
e._clubAddTableCard(e._clubTablesNode, i, t);
}) : e._clubAddRow(e._clubTablesNode, 0, "暂无桌面(管理员后台添加)", "", null, 520);
}
} else cc.vv.wc.showError(t.errmsg || "获取桌面失败");
});
},
_clubEnterTable: function(e) {
var t = this, i = cc.vv.wc, n = Date.now(), a = this._gemsCache, o = function(n) {
t._gemsCache = {
gems: n,
at: Date.now()
};
n > 0 ? t._doEnterTable(e) : i.showError("房卡不足，无法进入桌面");
};
if (a && n - a.at < 5e3) o(a.gems); else {
i.show("正在进入「" + e.name + "」");
cc.vv.http.sendRequest("/get_user_status", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(e) {
var t = e && null != e.gems ? Number(e.gems) : 0;
o(t);
});
}
},
_doEnterTable: function(e) {
var t = this, i = cc.vv.wc;
i.show("正在进入「" + e.name + "」");
console.log("[进入房间]请求桌面 tableid=" + e.id + " name=" + e.name);
var n = setTimeout(function() {
cc.vv.wc === i && i.showError("进入房间失败,请重试(服务未响应)");
}, 12e3);
cc.vv.http.sendRequest("/club_enter_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
tableid: e.id
}, function(e) {
try {
if (null == e || 0 !== e.errcode) {
console.log("[进入房间]失败:" + (e ? e.errcode + " " + e.errmsg : "无响应"));
clearTimeout(n);
i.showError(e && e.errmsg ? e.errmsg : "进入桌面失败");
return;
}
console.log("[进入房间]成功 roomid=" + e.roomid + " ip=" + e.ip + ":" + e.port);
clearTimeout(n);
t._clubPanel && (t._clubPanel.active = !1);
t._clubStopTableWatch();
cc.vv.fromClub = !0;
cc.vv.fromClubId = t._clubCur ? t._clubCur.id : null;
cc.vv.gameNetMgr.connectGameServer(e);
} catch (e) {
console.log("[进入房间]异常:" + (e && e.message));
clearTimeout(n);
i.showError("进入房间异常:" + (e && e.message));
}
});
},
_clubClosePanel: function() {
this._clubStopTableWatch();
cc.director.loadScene("hall");
},
onDestroy: function() {
this._clubStopTableWatch();
}
});
cc._RF.pop();
}, {} ],
createrole: [ function(e, t) {
"use strict";
cc._RF.push(t, "47a6fr2HmhKia0QntyDcy1s", "createrole");
cc.Class({
extends: cc.Component,
properties: {
inputName: cc.EditBox
},
onRandomBtnClicked: function() {
var e = [ "上官", "欧阳", "东方", "端木", "独孤", "司马", "南宫", "夏侯", "诸葛", "皇甫", "长孙", "宇文", "轩辕", "东郭", "子车", "东阳", "子言", "雀圣", "赌侠", "赌圣", "稳赢", "不输", "好运", "自摸", "有钱", "土豪" ], t = Math.floor(Math.random() * (e.length - 1));
this.inputName.string = "YB" + e[t];
},
onLoad: function() {
if (!cc.sys.isNative) {
var e = this.node.getComponent(cc.Canvas);
e.fitHeight = !0;
e.fitWidth = !1;
var t = this.node.getChildByName("bg");
if (t) {
var i = function() {
if (cc.isValid(t)) {
var e = t.getComponent(cc.Widget);
e && (e.enabled = !1);
var i = cc.view.getVisibleSize(), n = cc.view.getVisibleOrigin();
t.setContentSize(i.width, i.height);
t.setPosition(t.parent.convertToNodeSpaceAR(cc.v2(n.x + i.width / 2, n.y + i.height / 2)));
}
};
i();
this.scheduleOnce(i, 0);
cc.view.setResizeCallback(i);
}
}
this.onRandomBtnClicked();
},
onBtnConfirmClicked: function() {
var e = this.inputName.string;
if ("" != e) {
console.log(e);
cc.vv.userMgr.create(e);
} else console.log("invalid name.");
}
});
cc._RF.pop();
}, {} ],
hall: [ function(e, t) {
"use strict";
cc._RF.push(t, "a63d9t3AuBKVLfInT9JAVaH", "hall");
e("Net"), e("Global");
cc.Class({
extends: cc.Component,
properties: {
createRoomWin: cc.Node,
settingsWin: cc.Node,
helpWin: cc.Node,
xiaoxiWin: cc.Node,
zhanjiWin: cc.Node,
btnJoinGame: cc.Node,
btnReturnGame: cc.Node,
joinGameWin: cc.Node,
notice: {
default: null,
type: cc.Label
},
lblName: cc.Label,
lblMoney: cc.Label,
lblGems: cc.Label
},
initNetHandlers: function() {},
onLoad: function() {
if (cc.vv) {
cc.vv.fromClub = !1;
cc.vv.fromClubId = null;
}
var e = this.node.getComponent(cc.Canvas);
e.fitHeight = !0;
e.fitWidth = !1;
var t = this.node.getChildByName("global"), i = t ? t.getChildByName("main") : null, n = i ? i.getChildByName("bg") : this.node.getChildByName("bg"), a = i ? i.getChildByName("user") : null, o = a ? a.getChildByName("用户栏-底") : null, c = null;
if (n) {
var s = function() {
if (cc.isValid(n)) {
if (null == c && cc.isValid(o) && a) {
var e = o.x - o.width * o.anchorX;
c = {};
for (var t = 0; t < a.children.length; t++) {
var i = a.children[t];
i !== o && (c[i.name] = i.x - i.width * i.anchorX - e);
}
}
var s = n.getComponent(cc.Widget);
s && (s.enabled = !1);
var l = cc.view.getVisibleSize(), r = cc.view.getVisibleOrigin();
n.setContentSize(l.width, l.height);
n.setPosition(n.parent.convertToNodeSpaceAR(cc.v2(r.x + l.width / 2, r.y + l.height / 2)));
if (cc.isValid(o)) {
var h = o.getComponent(cc.Widget);
h && (h.enabled = !1);
o.setContentSize(l.width, o.height);
var d = o.parent.convertToNodeSpaceAR(cc.v2(r.x + l.width / 2, 0));
o.setPosition(d.x, o.y);
for (var g = o.x - o.width * o.anchorX, u = 0; u < a.children.length; u++) {
var v = a.children[u];
if (v !== o) {
var m = c[v.name];
if (null != m) {
var p = v.getComponent(cc.Widget);
p && (p.enabled = !1);
v.x = g + m + v.width * v.anchorX;
}
}
}
}
}
};
s();
this.scheduleOnce(s, 0);
cc.view.setResizeCallback(s);
}
if (cc.vv) {
this.initLabels();
cc.log("roomid", cc.vv.gameNetMgr.roomId);
if (null == cc.vv.gameNetMgr.roomId) {
this.btnJoinGame && (this.btnJoinGame.active = !0);
this.btnReturnGame && (this.btnReturnGame.active = !1);
} else {
this.btnJoinGame && (this.btnJoinGame.active = !1);
this.btnReturnGame && (this.btnReturnGame.active = !0);
}
var l = cc.vv.userMgr.oldRoomId;
cc.log("roomold", l);
if (null != l) {
cc.vv.userMgr.oldRoomId = null;
cc.vv.userMgr.enterRoom(l);
}
cc.vv.audioMgr.playBGM("bgMain.mp3");
this.initButtonHandler("Canvas/global/main/menu/btn_setting");
this.initButtonHandler("Canvas/global/main/menu/btn_help");
this.initButtonHandler("Canvas/global/main/menu/btn_xiaoxi");
this.initButtonHandler("Canvas/global/main/menu/btn_zhanji");
this.initButtonHandler("Canvas/global/main/menu/菜单-商城");
this.sanitizeEvents(this.node);
this.helpWin.addComponent("OnBack");
this.helpWin.setScale(.88);
this.xiaoxiWin.addComponent("OnBack");
if (this.zhanjiWin && null == this.node.getComponent("History")) try {
this.node.addComponent("History");
} catch (e) {
cc.log("[zhanji] History 组件挂载失败:" + (e && e.message));
}
cc.vv.userMgr.notice || (cc.vv.userMgr.notice = {
version: null,
msg: "数据请求中..."
});
this.notice.string = cc.vv.userMgr.notice.msg;
this.refreshInfo();
this.refreshNotice();
this.initClub();
} else cc.director.loadScene("loading");
},
refreshInfo: function() {
var e = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
};
cc.vv.http.sendRequest("/get_user_status", e, function(e) {
0 !== e.errcode ? console.log(e.errmsg) : null != e.gems && (this.lblGems.string = e.gems);
}.bind(this));
},
refreshNotice: function() {
var e = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
type: "notice",
version: cc.vv.userMgr.notice.version
};
cc.vv.http.sendRequest("/get_message", e, function(e) {
if (0 !== e.errcode) console.log(e.errmsg); else {
cc.vv.userMgr.notice.version = e.version;
cc.vv.userMgr.notice.msg = e.msg;
this.notice.string = e.msg;
}
}.bind(this));
},
initButtonHandler: function(e) {
var t = cc.find(e);
if (null != t) {
this.sanitizeEvents(t);
var i = this;
t.on(cc.Node.EventType.TOUCH_END, function() {
cc.isValid(t) && i.onBtnClicked({
target: t
});
});
} else cc.log("[hall] 未找到按钮:" + e);
},
sanitizeEvents: function(e) {
if (null != e) for (var t = e.getComponentsInChildren(cc.Button), i = 0; i < t.length; ++i) {
var n = t[i].clickEvents;
if (null != n && 0 != n.length) {
for (var a = [], o = 0; o < n.length; ++o) {
var c = n[o];
null != c && null != c.target && (c._componentId ? cc.js._getClassById(c._componentId) && a.push(c) : c.component && cc.js.getClassByName(c.component) && a.push(c));
}
t[i].clickEvents = a;
}
}
},
openHelp: function() {
if (null != this.helpWin) {
this.helpWin.active = !0;
var e = this.node.getComponent("HallHelp");
if (null == e) try {
e = this.node.addComponent("HallHelp");
} catch (e) {
cc.log("[help] HallHelp 组件挂载失败:" + (e && e.message));
}
e && e.open(this.helpWin);
}
},
onBtnClicked: function(e) {
cc.log("[hall] click:" + e.target.name);
"btn_setting" == e.target.name ? this.settingsWin.active = !0 : "btn_help" == e.target.name ? this.openHelp() : "btn_xiaoxi" == e.target.name ? this.xiaoxiWin.active = !0 : "btn_zhanji" == e.target.name ? this.openZhanji() : "菜单-商城" == e.target.name && this.onJoinGameClicked();
},
initLabels: function() {
this.lblName.string = cc.vv.userMgr.userName + " (ID:" + cc.vv.userMgr.userId + ")";
this.lblName.node.color = cc.color(0, 0, 0);
this.lblMoney.string = cc.vv.userMgr.coins;
this.lblGems.string = cc.vv.userMgr.gems;
},
onJoinGameClicked: function() {
this.joinGameWin.active = !0;
},
openZhanji: function() {
if (null != this.zhanjiWin) {
this.zhanjiWin.active = !0;
var e = this.node.getComponent("History");
if (null == e) try {
e = this.node.addComponent("History");
} catch (e) {
cc.log("[zhanji] History 组件挂载失败:" + (e && e.message));
}
cc.log("[zhanji] open, history=" + (null != e) + " active=" + this.zhanjiWin.active);
e ? e.open() : cc.log("[zhanji] History 组件加载失败");
}
},
onReturnGameClicked: function() {
cc.director.loadScene(cc.vv.gameNetMgr.getGameScene());
},
onCreateRoomClicked: function() {
if (null == cc.vv.gameNetMgr.roomId) {
console.log("onCreateRoomClicked");
this.createRoomWin.active = !0;
} else cc.vv.wc.showError("房间已经创建!\n必须解散当前房间才能创建新的房间");
},
update: function(e) {
var t = this.notice.node.x;
(t -= 120 * e) + this.notice.node.width < -360 && (t = 600);
this.notice.node.x = t;
if (cc.vv && null != cc.vv.userMgr.roomData) {
cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
cc.vv.userMgr.roomData = null;
}
},
initClub: function() {
var e = cc.find("Canvas/content/clubEntryBtn");
if (e && !e._clubBound) {
e._clubBound = !0;
e.on(cc.Node.EventType.TOUCH_END, function() {
cc.director.loadScene("club");
});
}
}
});
cc._RF.pop();
}, {
Global: void 0,
Net: void 0
} ],
login: [ function(e, t) {
"use strict";
cc._RF.push(t, "bbf1b43cW9Ovacibb4rBF7T", "login");
String.prototype.format = function(e) {
if (arguments.length > 0) {
var t = this;
if (1 == arguments.length && "object" == typeof e) for (var i in e) {
var n = new RegExp("({" + i + "})", "g");
t = t.replace(n, e[i]);
} else for (var a = 0; a < arguments.length; a++) {
if (null == arguments[a]) return "";
n = new RegExp("({[" + a + "]})", "g");
t = t.replace(n, arguments[a]);
}
return t;
}
return this;
};
cc.Class({
extends: cc.Component,
properties: {
_mima: null,
_mimaIndex: 0
},
onLoad: function() {
if (!cc.sys.isNative) {
var e = this.node.getComponent(cc.Canvas);
e.fitHeight = !0;
e.fitWidth = !1;
var t = this.node.getChildByName("bg");
if (!t) {
var i = this.node.getChildByName("global"), n = i ? i.getChildByName("image") : null;
t = n ? n.getChildByName("bg") : null;
}
if (t) {
var a = function() {
if (cc.isValid(t)) {
var e = t.getComponent(cc.Widget);
e && (e.enabled = !1);
var i = cc.view.getVisibleSize(), n = cc.view.getVisibleOrigin();
t.setContentSize(i.width, i.height);
t.setPosition(t.parent.convertToNodeSpaceAR(cc.v2(n.x + i.width / 2, n.y + i.height / 2)));
}
};
a();
this.scheduleOnce(a, 0);
cc.view.setResizeCallback(a);
}
}
if (cc.vv) {
this._initPreloadUI();
cc.vv.net.addHandler("push_need_create_role", function() {
console.log("onLoad:push_need_create_role");
cc.director.loadScene("createrole");
});
cc.vv.audioMgr.playBGM("bgMain.mp3");
this._mima = [ "A", "A", "B", "B", "A", "B", "A", "B", "A", "A", "A", "B", "B", "B" ];
cc.find("Canvas/global/button/btn_yk").active = !0;
var o = cc.find("Canvas/global/button/button1");
if (o) {
o.active = !(cc.vv.SI && 0 === cc.vv.SI.wxlogin);
cc.vv.utils.addClickEvent(o, this.node, "login", "onBtnWechatClicked");
}
} else cc.director.loadScene("loading");
},
onBtnWechatClicked: function() {
cc.vv.audioMgr.playSFX("button.mp3");
cc.sys.isNative ? cc.vv.anysdkMgr.login() : cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("微信登录仅支持APP端,请使用游客登录");
},
start: function() {},
_initPreloadUI: function() {
var e = this, t = cc.find("Canvas/global/button");
if (t) {
t.active = !1;
this._loginBtnRoot = t;
}
var i = this.node.getChildByName("preloadUI");
this._preloadBaked = !!i;
if (null == i) {
i = new cc.Node("preloadUI");
this.node.addChild(i);
i.setPosition(0, -140);
var n = new cc.Node("tip");
n.setPosition(0, 34);
i.addChild(n);
var a = n.addComponent(cc.Label);
a.string = "资源加载中...";
a.fontSize = 24;
a.lineHeight = 30;
var o = new cc.Node("barBg");
o.setContentSize(520, 24);
i.addChild(o);
var c = new cc.Node("barFill");
c.setPosition(-250, 0);
i.addChild(c);
var s = new cc.Node("pct");
s.setPosition(0, -34);
i.addChild(s);
var l = s.addComponent(cc.Label);
l.string = "0%";
l.fontSize = 22;
l.lineHeight = 26;
}
i.active = !0;
i.setPosition(0, -140);
var r = i.getChildByName("barBg");
r.setContentSize(520, 30);
if (null == r.getComponent(cc.Sprite)) {
var h = r.getComponent(cc.Graphics) || r.addComponent(cc.Graphics);
h.clear();
h.fillColor = cc.color(0, 0, 0, 160);
h.roundRect(-260, -12, 520, 24, 12);
h.fill();
h.strokeColor = cc.color(255, 215, 120);
h.lineWidth = 2;
h.roundRect(-260, -12, 520, 24, 12);
h.stroke();
}
var d = i.getChildByName("barFill");
this._loadFillNode = d;
this._loadFillSprite = d.getComponent(cc.Sprite);
this._loadFill = this._loadFillSprite ? null : d.getComponent(cc.Graphics) || d.addComponent(cc.Graphics);
null == this._loadFillSprite && d.setPosition(-250, 0);
this._loadFillW = 520;
this._loadPct = i.getChildByName("pct").getComponent(cc.Label);
this._drawLoadProgress(0);
var g = [ "images", "textures", "sounds", "prefabs" ], u = {}, v = 0;
g.forEach(function(t) {
u[t] = {
c: 0,
t: 0
};
cc.resources.loadDir(t, function(i, n) {
u[t].c = i;
u[t].t = n;
var a = 0, o = 0;
for (var c in u) {
a += u[c].c;
o += u[c].t;
}
e._drawLoadProgress(o > 0 ? a / o : 0);
}, function(i) {
i && console.log("[预载]目录加载失败:" + t, i);
++v >= g.length && e._onAllResLoaded();
});
});
},
_drawLoadProgress: function(e) {
this._loadMaxP = Math.max(this._loadMaxP || 0, e);
e = this._loadMaxP;
if (this._loadFillSprite) this._loadFillNode.width = Math.max(.01, this._loadFillW * e); else if (this._loadFill) {
var t = this._loadFill;
t.clear();
var i = Math.max(.01, this._loadFillW * e);
t.fillColor = cc.color(220, 60, 60);
t.roundRect(0, -8, i, 16, 8);
t.fill();
}
this._loadPct && (this._loadPct.string = Math.floor(100 * e) + "%");
},
_onAllResLoaded: function() {
this._drawLoadProgress(1);
var e = this.node.getChildByName("preloadUI");
e && (this._preloadBaked ? e.active = !1 : e.destroy());
this._loginBtnRoot && (this._loginBtnRoot.active = !0);
},
onBtnQuickStartClicked: function() {
cc.vv.userMgr.guestAuth();
cc.vv.audioMgr.playSFX("button.mp3");
},
onBtnMIMAClicked: function(e) {
if (this._mima[this._mimaIndex] == e.target.name) {
this._mimaIndex++;
this._mimaIndex == this._mima.length && (cc.find("Canvas/global/button/btn_yk").active = !0);
} else {
console.log("oh ho~~~");
this._mimaIndex = 0;
}
}
});
cc._RF.pop();
}, {} ],
setting: [ function(e, t) {
"use strict";
cc._RF.push(t, "ca48dCjc1lMDKZsoTXRVIYT", "setting");
cc.Class({
extends: cc.Component,
properties: {
_btnYXOpen: null,
_btnYXClose: null,
_btnYYOpen: null,
_btnYYClose: null
},
onLoad: function() {
if (null != cc.vv) {
this._btnYXOpen = this.node.getChildByName("yinxiao").getChildByName("btn_yx_open");
this._btnYXClose = this.node.getChildByName("yinxiao").getChildByName("btn_yx_close");
this._btnYYOpen = this.node.getChildByName("yinyue").getChildByName("btn_yy_open");
this._btnYYClose = this.node.getChildByName("yinyue").getChildByName("btn_yy_close");
this.initButtonHandler(this.node.getChildByName("btn_close"));
this.initButtonHandler(this.node.getChildByName("btn_exit"));
this.initButtonHandler(this._btnYXOpen);
this.initButtonHandler(this._btnYXClose);
this.initButtonHandler(this._btnYYOpen);
this.initButtonHandler(this._btnYYClose);
var e = this.node.getChildByName("yinxiao").getChildByName("progress");
cc.vv.utils.addSlideEvent(e, this.node, "setting", "onSlided");
e = this.node.getChildByName("yinyue").getChildByName("progress");
cc.vv.utils.addSlideEvent(e, this.node, "setting", "onSlided");
this.refreshVolume();
}
},
onSlided: function(e) {
"yinxiao" == e.node.parent.name ? cc.vv.audioMgr.setSFXVolume(e.progress) : "yinyue" == e.node.parent.name && cc.vv.audioMgr.setBGMVolume(e.progress);
this.refreshVolume();
},
initButtonHandler: function(e) {
cc.vv.utils.addClickEvent(e, this.node, "setting", "onBtnClicked");
},
refreshVolume: function() {
this._btnYXClose.active = cc.vv.audioMgr.sfxVolume > 0;
this._btnYXOpen.active = !this._btnYXClose.active;
var e = this.node.getChildByName("yinxiao"), t = 430 * cc.vv.audioMgr.sfxVolume;
(i = e.getChildByName("progress")).getComponent(cc.Slider).progress = cc.vv.audioMgr.sfxVolume;
i.getChildByName("progress").width = t;
this._btnYYClose.active = cc.vv.audioMgr.bgmVolume > 0;
this._btnYYOpen.active = !this._btnYYClose.active;
var i, n = this.node.getChildByName("yinyue");
t = 430 * cc.vv.audioMgr.bgmVolume;
(i = n.getChildByName("progress")).getComponent(cc.Slider).progress = cc.vv.audioMgr.bgmVolume;
i.getChildByName("progress").width = t;
},
onBtnClicked: function(e) {
if ("btn_close" == e.target.name) this.node.active = !1; else if ("btn_exit" == e.target.name) cc.director.loadScene("login"); else if ("btn_yx_open" == e.target.name) {
cc.vv.audioMgr.setSFXVolume(1);
this.refreshVolume();
} else if ("btn_yx_close" == e.target.name) {
cc.vv.audioMgr.setSFXVolume(0);
this.refreshVolume();
} else if ("btn_yy_open" == e.target.name) {
cc.vv.audioMgr.setBGMVolume(1);
this.refreshVolume();
} else if ("btn_yy_close" == e.target.name) {
cc.vv.audioMgr.setBGMVolume(0);
this.refreshVolume();
}
}
});
cc._RF.pop();
}, {} ],
"use_v2.0.x_cc.Toggle_event": [ function(e, t) {
"use strict";
cc._RF.push(t, "3d3c7POKptBGaKR0drSDSkI", "use_v2.0.x_cc.Toggle_event");
cc.Toggle && (cc.Toggle._triggerEventInScript_check = !0);
cc._RF.pop();
}, {} ]
}, {}, [ "use_v2.0.x_cc.Toggle_event", "clubScene", "createrole", "GPGame", "CheckBox", "CreateRoom", "HallHelp", "JoinGameInput", "hall", "setting", "Lodinglogin", "login", "Alert", "Chat", "DingQue", "Folds", "GameOver", "GameOverZP", "GameResult", "GameResultZP", "History", "HuanSanZhang", "ImageLoader", "MJGameBMJ", "MJGameLDH", "MJGameWujin", "MJGameZJLAO", "MJGameZJZX", "MJGameZP", "MJGameZP4", "MJRoom", "NoticeTip", "PengGangs", "PopupMgr", "RadioButton", "RadioGroupMgr", "ReConnect", "ReplayCtrl", "Seat", "TimePointer", "UserInfoShow", "Voice" ]);