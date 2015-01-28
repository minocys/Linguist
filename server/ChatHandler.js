var db = require('../db/db.js');
var Rooms = require('../db/models/Room.js');
var translator = require('./translator.js');

var ChatHandler = function(){};

//translate/emit message
ChatHandler.prototype.prepareMessage = function(msg, callback){
  if(msg.room ===''){
    msg.room = 'lobby';
  }
  Rooms.findOne({room: msg.room}, function(err, room){
    if (err){
      console.log(err, ' error finding room!');
    }
    translator.translate(msg, room, function(err, results){
      if(err){
        console.log('error translating: ', err);
      }
      msg.translations = results;
      callback(msg);
    });
  });
};


// accepts strings as arguments
ChatHandler.prototype.joinRoom = function(joinRoom, lang){
  Rooms.findOne({room: joinRoom}, function(err, room){
    if(err){
      console.log(err, 'error finding room to join!');
    }
    // if room doesn't exist, make new one
    if(room === null){
      var language = {};
      language[lang] = 1;
      room = new Rooms({
        room: joinRoom,
        lang: language,
        connections: 1
      }) 
    } else {
      // If language exists in room, add 1 to user counter
      // else initiate new language property to 1
      room.lang[lang] = (room.lang[lang] > 0) ? room.lang[lang] + 1 : 1;
      room.markModified('lang');
      room.connections++;
    }
    room.save();
  });
};

// accepts strings as arguments
ChatHandler.prototype.leaveRoom = function(leaveRoom, lang){
  Rooms.findOne({room: leaveRoom}, function(err, room){
    if(err){
      console.log('FATAL: error finding room to leave!');
    }
    //subtract connection counter
    room.connections--;
    if(room.connections === 0){
      //delete room if no users left:
      room.remove();
    } else {
      //remove language counter 
      room.lang[lang]--;
      room.markModified('lang');
      room.save();
    }
  });
};


module.exports = new ChatHandler();
