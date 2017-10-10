function Mailer() {


    var send = require('gmail-send')({
        user: 'sap.cyberchallenge@gmail.com',               // Your GMail account used to send emails
        pass: 'CyberShit2017',             // Application-specific password
        // you also may set array of recipients:
        // [ 'user1@gmail.com', 'user2@gmail.com' ]
        // from:   '"User" <user@gmail.com>', // from: by default equals to user
        // replyTo:'user@gmail.com'           // replyTo: by default undefined
        // html:    '<b>html text text</b>'
    });
this.sendTo=function(emailAddress,code){
// Override any default option and send email
    send({
        subject: 'CyberChallenge2017',
        to: emailAddress,
        text:'Congrats! Your code is: ' + code,
        html:'<div style=\"background: #000;\">' +

        '<div style="width: 50%;margin:auto">'+
        '<img src=\"https://knowledge.insead.edu/sites/www.insead.edu/files/styles/w_650/public/styles/panoramic/public/images/2016/04/gilles_hilary_the_professionalisation_of_cyber_criminals.jpg?itok=rvLwaLOo\">'+
        '</div>' +'<div style="position:absolute; color:#ffffff;font-size: 300%; margin-top: -10%; margin-left:25%">Your Level code is: ' +
        code +
        '</div>'+
        '</div>'
    }, function (err, res) {
        console.log('#####  Mail Status: error:', err, '; res:', res);
    });

    }
}
exports.Mailer = Mailer;