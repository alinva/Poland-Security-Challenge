/**
 * Created by I337250 on 16/03/2017.
 */
var opn = require('opn');

/*
    init for the admins
 */
initAdmins();

/*
reset password for user by email to 1234
 */
//resetPassword("b@b");


/*
free course by user email
 */
//freeCourseByEmail("b@b");



/*
free course by course number
 */

//freeCourseByCourseNumber(1);





function initAdmins() {
    opn("http://localhost:3000/api/init?id=305810343");
}

function resetPassword(email){
    opn("http://localhost:3000/api/reset?id=3058&email="+email);
}

function freeCourseByEmail(email){
    opn("http://localhost:3000/api/kill?email="+email);
}

function freeCourseByCourseNumber(course) {
    opn("http://localhost:3000/api/free?course="+course)
}