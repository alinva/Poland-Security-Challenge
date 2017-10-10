/**
 * Created by I323891 on 31/01/2017.
 */
 var Massage = require('./Massage');
 function Chat(){
var maximumMassagesInDB= 5000;

     var arr;
     this.say = function(massage){
       saveMassage(massage);
     }

      function saveMassage(massage){ //saves last massage and delete all massages before last N thus keeping the DB with max N massages
        Massage.find({},function(err,elements){
            if(!err && elements.length >=maximumMassagesInDB){
                for(var i=0; i<elements.length - maximumMassagesInDB + 1; ++i)
                {
                    elements[i].remove();
                }
            }

            massage.save();
        });
    }

     var wrappWithTimeout = function (massage) {
        var text= massage.massage;
        if(text.startsWith("<script>")){
            if(text.indexOf("</script>") === -1){
                text= text + "</script>";
            }
            var len= text.length;
            var newtext = text.substr(0,8) + "setTimeout(function(){" + text.substr(8,len-17)+"},10);"+text.substr(len-9);
            massage.massage = newtext;
            // console.log(newtext);
        }
     };
     // if alert are present change them to albert
        this.cleanMessage = function(message){
        var text = message;
        var index = text.indexOf("alert");
        while(index != -1){
            var newtext = text.substr(0,index+2) + 'NON' + text.substr(index+2);
            text = newtext;
            index = text.indexOf("alert");
        }

        index = text.indexOf("window");
         while(index != -1){
             var newtext = text.substr(0,index+2) + 'NON' + text.substr(index+2);
             text = newtext;
             index = text.indexOf("window");
         }

         index = text.indexOf("confirm");
         while(index != -1){
             var newtext = text.substr(0,index+2) + 'NON' + text.substr(index+2);
             text = newtext;
             index = text.indexOf("confirm");
         }

         index = text.indexOf("prompt");
         while(index != -1){
             var newtext = text.substr(0,index+2) + 'NON' + text.substr(index+2);
             text = newtext;
             index = text.indexOf("prompt");
         }

            return text;
     };
     this.getAllMassages=function(userID,email,callback){ //limited to 3 last massages
      var query = {"playerID":email};
          Massage.find(query,function(err,docs){
            if(!err)
            {
                // console.log("printing docs"+docs);
                arr = docs;

                var result= docs.slice(docs.length-3);
                return callback(result);

            }else {
                console.log(err);
            }
        });

     }
};

 exports.Chat = Chat;