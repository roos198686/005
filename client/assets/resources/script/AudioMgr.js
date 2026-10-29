cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        bgmVolume:1.0,
        sfxVolume:1.0,
        
        bgmAudioID:-1,
    },

    // use this for initialization
    init: function () {
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if(t != null){
            this.bgmVolume = parseFloat(t);    
        }
        
        var t = cc.sys.localStorage.getItem("sfxVolume");
        if(t != null){
            this.sfxVolume = parseFloat(t);    
        }
        
        cc.game.on(cc.game.EVENT_HIDE, function () {
            console.log("cc.audioEngine.pauseAll");
            cc.audioEngine.pauseAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function () {
            console.log("cc.audioEngine.resumeAll");
            cc.audioEngine.resumeAll();
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    
    //通过resources加载AudioClip,避免cc.url.raw弃用及"Wrong type of AudioClip"错误
    _loadClip:function(url, cb){
        var tryLoad = function(path){
            cc.resources.load(path, cc.AudioClip, function(err, clip){
                if(err || !clip){
                    if(path.toLowerCase().endsWith('.mp3')){ tryLoad(path.substring(0,path.length-4)+".wav"); return; }
                    if(!path.includes('.')){ tryLoad(path+".mp3"); return; }
                    console.log("[AudioMgr]加载失败:", url); return;
                }
                cb(clip);
            });
        };
        tryLoad("sounds/" + url);
    },
    
    playBGM(url){
        var self = this;
        this._loadClip(url, function(clip){
            if(self.bgmAudioID >= 0){
                cc.audioEngine.stop(self.bgmAudioID);
            }
            self.bgmAudioID = cc.audioEngine.play(clip,true,self.bgmVolume);
        });
    },
    
    playSFX(url){
        var self = this;
        if(this.sfxVolume > 0){
            this._loadClip(url, function(clip){
                cc.audioEngine.play(clip,false,self.sfxVolume);
            });
        }
    },
    
    setSFXVolume:function(v){
        if(this.sfxVolume != v){
            cc.sys.localStorage.setItem("sfxVolume",v);
            this.sfxVolume = v;
        }
    },
    
    setBGMVolume:function(v,force){
        if(this.bgmAudioID >= 0){
            if(v > 0){
                cc.audioEngine.resume(this.bgmAudioID);
            }
            else{
                cc.audioEngine.pause(this.bgmAudioID);
            }
            //cc.audioEngine.setVolume(this.bgmAudioID,this.bgmVolume);
        }
        if(this.bgmVolume != v || force){
            cc.sys.localStorage.setItem("bgmVolume",v);
            this.bgmVolume = v;
            cc.audioEngine.setVolume(this.bgmAudioID,v);
        }
    },
    
    pauseAll:function(){
        cc.audioEngine.pauseAll();
    },
    
    resumeAll:function(){
        cc.audioEngine.resumeAll();
    }
});
