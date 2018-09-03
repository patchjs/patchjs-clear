// drag

function Drag(opts) {
  this.opts = {
    target: '',
    container: 'body',
    ondrag: function () {}
  };

  for (var p in opts) {
    this.opts[p] = opts[p];
  }

  this.init();
  this.addEvent();
}

Drag.prototype.init = function () {
  this.target = typeof this.opts.target === 'string' ? document.querySelector(this.opts.target) : this.opts.target;

  this.startX = this.startY = 0;
  this.offsetX = this.offsetY = 0;
  this.offsetTop = this.target.offsetTop;
  this.offsetLeft = this.target.offsetLeft;
};

Drag.prototype.addEvent = function () {
  
  var startHandler = function (e) {
    this.startY = e.targetTouches[0].pageY;
    this.startX = e.targetTouches[0].pageX;
  }.bind(this);

  var moveHandler = function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.offsetY = e.changedTouches[0].pageY - this.startY;
    this.offsetX = e.changedTouches[0].pageX - this.startX;
    this.target.style.cssText += 'left:' + (this.offsetLeft + this.offsetX) + 'px;' + 'top:' + (this.offsetTop + this.offsetY) + 'px';
  }.bind(this);

  var endHandler = function (e) {
    this.offsetLeft += this.offsetX;
    this.offsetTop += this.offsetY;
  }.bind(this);

  this.target.addEventListener('touchstart', startHandler);
  this.target.addEventListener('touchmove', moveHandler);
  this.target.addEventListener('touchend', endHandler);
};

;(function () {
  var debug = {
    init : function () {
    	var node = document.createElement('div');
      node.id = 'patchjs-clear';
      var width = 60, height = 40;
      var metaEl = document.querySelector('meta[name="viewport"]');
      if (metaEl) {
        var content = metaEl.getAttribute('content');
        if (content) {
          contentArray = content.split(',');
          for(var i = 0, len = contentArray.length; i < len; i++){
            if (/^initial-scale/.test(contentArray[i])) {
              var scale = contentArray[i].split('=')[1];
              width = width / scale;
              height = height / scale;
            }
          }
        }
      }
    	node.style.cssText = 'background: #000;color: #fff;position: absolute;top: 50%;left: 50%;opacity: 0.5;border-radius: 50%;text-align: center;transform:translate(-50%, 50%);-webkit-transform:translate(-50%, 50%);width:' + width + 'px;height:' + height + 'px;line-height:' + height + 'px';
      var textNode = document.createTextNode('Clear');
      node.appendChild(textNode);
      node.addEventListener('click', function (e) {
        this.clearCache(function () {
          location.reload();
          console.log('clear Patch.js cache.');
        });
        e.preventDefault();
      }.bind(this), false);
      document.body.appendChild(node);

      //drag 
      new Drag({
        target: '#patchjs-clear'
      });
    },
    clearCache : function (callback) {
      // clear localstorage.
      for (var p in localStorage) {
        if (/^patchjs-/.test(p)) {
          localStorage.removeItem(p);
        }
      }

      //clear web sql database.
      var db;
      try {
        db = 'openDatabase' in window ?  window.openDatabase('patchjsdb', '1.0', 'patchjs database', 4 * 1024 * 1024) : null;
      } catch (e) {
        db = null;
      }
      if (db) {
        db.transaction(function (tx) {
          tx.executeSql('drop table if exists assets');
        });
      }

      //clear indexdb.
      var openReq = window.indexedDB.open("patchjsdb");
      openReq.onsuccess = function(e) {
        db = e.target.result;
        if (db.objectStoreNames.contains('assets')) {
          var transaction = db.transaction(['assets'], 'readwrite');
          var objectStore = transaction.objectStore('assets');
          objectStore.clear();
        }
      };

      callback();
    }
  };

  debug.init();
})();