// new property service GLOBAL
// see: https://developers.google.com/apps-script/reference/properties/
var SCRIPT_PROP = PropertiesService.getScriptProperties();

var ss = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"))

var me = Session.getActiveUser().getEmail();

/********************** SETUP ****************************/
// Store the active sheet ID
// Run only once when a new sheet is started.
/*********************************************************/
function setup() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty("key", sheet.getId());
}

/********************** GET SCRIPT URL *******************/
// Get base URL to serve multiple HTML templates
// http://stackoverflow.com/questions/15668119/linking-to-another-html-page-in-google-apps-script/16697525#16697525
/*********************************************************/

function getScriptUrl() {
 var url = ScriptApp.getService().getUrl();
 return url;
}

/********************** doGet ****************************/
// Serve the web app
// Get "home page", or a requested page.
// Expects a 'page' parameter in querystring.
// @param {event} e Event passed to doGet, with querystring
// @returns {String/html} Html to be served
// http://stackoverflow.com/questions/15668119/linking-to-another-html-page-in-google-apps-script/16697525#16697525
/*********************************************************/
function doGet(e) {
  Logger.log( Utilities.jsonStringify(e) );
  if (!e.parameter.page) {
    // When no specific page requested, return "home page"
    return HtmlService.createTemplateFromFile("index").evaluate().setTitle("Elkhart PD");
  }
  
  // else, use page parameter to pick an html file from the script
  return HtmlService.createTemplateFromFile(e.parameter['page']).evaluate();
}

/********************** include **************************/
// Include templated content
/*********************************************************/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

/************************ recordData *********************************/
// Post a form submission to a Google Sheet
// Store multiple registrations in an array in the formObject and split at the end
// This stores data as multiple rows rather than multiple columns
// Modified from a Martin Hawksey tutorial
// https://github.com/mhawksey/html-form-send-email-via-google-script-without-server
/*********************************************************************/

function recordData(formObject) {    
  try {
    var ss = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = ss.getSheetByName("allRegs");
    var sessions = ss.getSheetByName("allSessions").getRange(2,1,(ss.getSheetByName('allSessions').getLastRow())-1,ss.getSheetByName('allSessions').getLastColumn()).getValues();
    var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow()+1;
    var rows = [];
    var classes = [];
    
    var msg = [];
    
    formObject.code = formObject.code.filter(Boolean);
    
    // condiditon if the class is not limited registration
    
    if(typeof formObject.wkshp === "string") {

      classes.push(formObject.wkshp);
            
      for(var i=0; i<classes.length; i++) {
        
        for(var j=0; j<sessions.length; j++) {
          
          if(classes[i] == sessions[j][12]) {
          
          if(formObject.code == sessions[j][11]) {            
            
            var row = [new Date(), formObject[headers[1]], formObject[headers[2]], formObject[headers[3]], formObject[headers[4]], classes[0]];
            rows.push(row);
            
            sheet.getRange(nextRow,1,rows.length,6).setValues(rows);
            
            msg.push("Registration for " + sessions[j][3] + " was successful.");
            
          } else {
            msg.push("The code you submitted for " + sessions[j][3] + " was incorrect. Please refresh and try again.");
          }
        }
      }
    }
    } else {
          //First, split the codes into an array of strings
          for(var i=0; i<formObject.wkshp.length; i++) {
            
            for(var j=0; j<sessions.length; j++) {
              
              if(formObject.wkshp[i] == sessions[j][12]) {
                                                  
                  if(formObject.code[i] == sessions[j][11]) {
                    
                    var row = [new Date(), formObject[headers[1]], formObject[headers[2]], formObject[headers[3]], formObject[headers[4]], formObject.wkshp[i]]
                    rows.push(row);
                    msg.push("Registration for " + sessions[j][3] + " was successful.");
                  } else {
                    msg.push("<p class='err'>The registration code for <b>" + sessions[j][3] + "</b> is incorrect. Please try again.</p>");
                  }
                }
              }
            }
          } 
      // calInvite(rows);
      for(var i=0; i<rows.length;i++) {
        sheet.getRange(nextRow,1,rows.length,6).setValues(rows);
      }
      calInvite(rows);
    return msg;
  }
  catch(msg) {
    return msg;
  } 
  finally {
    return msg;
  }
}

/********************** makeID() **************************************/
// Generate random, unique ID to test against for validation
/**********************************************************************/

function makeId() {
  var ss = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"))
  var sheet = ss.getSheetByName("allSessions");
  var data = sheet.getDataRange().getValues();
  
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  
  for(var j=1;j<data.length; j++) {
    var hash = "";
    if(data[j][12] == "") {
      for(var i=0;i<5;i++) {
        hash += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      sheet.getRange(j+1,13).setValue(hash);
    }
    if(!(data[j][11])) {
      sheet.getRange(j+1, 12).setValue("Code");
    }
  }
}

/********************** cancelRegistration ****************************/
// Remove a user's registration
/**********************************************************************/
function cancelRegistration(formObject) {
  var ss = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
  var sheet = ss.getSheetByName('allRegs');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  
  for(var i=1; i<data.length;i++) {
    if(data[i][1].toString() == me) {
      for(var j=0;j<data[i].length;j++) {
       // Logger.log(formObject[headers[j]]);
        var formDate = formObject.class;
        var regDate = data[i][j+5];

        if(regDate === formDate) {
          sheet.getRange((i+1),(j+6)).setValue("000");
        }
      }
    }
  }
}

/****************** GET CURRENT USER REGISTRATIONS ***************************/
// return Array - dates linked to user account
/*****************************************************************************/

function getUsrRegs() {
  var ss = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
  var usr = Session.getActiveUser().getEmail();
  var sheet = ss.getSheetByName("allRegs");
  
  var data = sheet.getDataRange().getValues();
  //Logger.log(usr);
  var usrRegIds = [];
  
  for(var i=0; i<data.length;i++) {
    // Logger.log(usr === data[i][1]);
    if(data[i][1] === usr) {
        if(data[i][5] === '') {
          break;
        } else {
          usrRegIds.push(data[i][5]);
        }
    }
  }
//  Logger.log("User registrations: " + usrRegIds);
  return usrRegIds;
}

/******************** getRegCounts *********************************/
// @param Object {Sessions}
// return String "available" - # of registrations remaining for each workshop
/*******************************************************************/

function getRegCounts(sessions) {
  
  // Get the workshops
  Logger.log("running sessions counts")
  // Logger.log(sessions);
  var allSessions = ss.getSheetByName("allSessions");
  var allSessionsData = allSessions.getRange(2,2,allSessions.getLastRow()-1, allSessions.getLastColumn()).getValues();
  
  // get the registrations
  var allRegs = ss.getSheetByName("allRegs");
  var allRegsData = allRegs.getDataRange().getValues();
    
  // start the sessions loop
  for(var i=0; i<sessions.length; i++) {
        
    // Start the sessions loop
    for(var j=0; j<allSessionsData.length; j++) {
      
      var id = allSessionsData[j][11];
                  
      // match the session dates to find the max seats
      if(sessions[i].hash === id) {
       // Logger.log("Matched. Pushing " + allSessionsData[j][5] + " to seats.");
        sessions[i].seats = allSessionsData[j][5];
      } 
    }
  }
  
  // Reopen the sessions loop to get the current counts
  for(var i=0; i<sessions.length; i++) {
    
    // Get the current registrations array
    for(var j=0; j<allRegsData.length; j++) {
        
      // Logger.log(allRegsData[j][5]);
        if(sessions[i].hash == allRegsData[j][5]) {
          --sessions[i].seats;
        }
      }
    }
  //Logger.log(sessions);
  // Return the updated array
  return sessions;
}

/********************** getWorkshops **************************/
// @param Array registrations: current workshops linked to signed in user
// return available workshops
/**************************************************************/
function getWorkshops() {
  
  // get the user registrations array
  var usrRegIds = getUsrRegs();
    
  // Load the spreadsheet for comparisons
  var sheet = ss.getSheetByName("allSessions");
  
  // Get the entire workshop list from the spreadsheet and store in an array
  var allSessionsData = sheet.getRange(2,2,sheet.getLastRow()-1, sheet.getLastColumn()).getValues();
  
//  Logger.log(allSessionsData);
  
  // Array to hold user registration objects
  var usrRegs = [];
  
  // Create an array to hold classes available to the user
  var allSessionsFiltered = [];
  
  // Object to hold data to display
  var returnObj = {};
      
  // Get all data for user registered workshops 
  allSessionsData.filter(function(val) {
    var cats = [];
    var str = val[6].split(",");
    for(var k=0; k<str.length;k++) {
      cats.push(str[k].substr(0,3).trim());
    }

    // Check for URLs in the registration description   
    var newText = val[4].replace(/((http|https)\:\/\/[a-zA-Z0-9\-\.\/]+[a-zA-Z])/g,'<a href="$1">$1</a>');
      
    // Comparitors
     var theDate = new Date(val[0]);
//     Logger.log(theDate.getMinutes());
     var hours = ((theDate.getHours()+11) % 12 + 1);
     var date = (theDate.getMonth()+1) + "/" + theDate.getDate() + "/" + theDate.getFullYear();
     var id = val[11];
         // Build the objects
     if(usrRegIds.indexOf(id) !== -1) {
        usrRegs.push({
          date: theDate, 
          time: theDate.toLocaleString(),
          title: val[2],
          desc: newText,
          cat: cats.toString(),
          type: val[8],
          location: val[9],
          hash: val[11]
       });
     } else {
       allSessionsFiltered.push({
         date: theDate,
         time: theDate.toLocaleString(),
         title: val[2],
         desc: newText,
         cat: cats,
         seats: "",
         type: val[8],
         location: val[9],
         lock: val[7],
         code: val[10],
         hash: val[11],
         who: val[3]
       });
     }
  });
  
  getRegCounts(allSessionsFiltered);
      
  var returnObj = { usrRegIds: usrRegs.sort(function(a,b) { return a.date - b.date }), allSessions: allSessionsFiltered.sort(function(a,b) { return a.date - b.date }) }
  
  Logger.log(returnObj);
  return JSON.stringify(returnObj);
}

/*************************** PUSH TO CALENDAR **********************************/
// Push form submissions for workshops to a district calendar
// Triggered by Form Submit
/*******************************************************************************/

function pushToCalendar() {
  var cal = CalendarApp.getCalendarById('elkhart.k12.in.us_j2gh78bk5e5bje6n6k19ijr2j8@group.calendar.google.com');
  var sheet = ss.getSheetByName("allSessions");
  var prompt = "You can register for all available PD courses <b><a href='https://script.google.com/a/macros/elkhart.k12.in.us/s/AKfycbxJ-0TfrRHUmFkhavhY1uAJHvn0KYspr4J0QeLrh61fE5tRs8IS/exec' target='_blank'>on the registration website</a></b>."
  
  var data = sheet.getRange(sheet.getLastRow(),1,1, sheet.getLastColumn()).getValues();
  
  var title = data[0][3];
  var start = new Date(data[0][1]);
  var end = new Date(data[0][2]);
  var loc = data[0][10];
  var desc = data[0][5] + "<br /><br >" + prompt;
  
  Logger.log(data[0][3] + " " + new Date(data[0][1]) + " " + new Date(data[0][2]));
  
  cal.createEvent(title, start, end, {location: loc, description: desc, sendInvites: true})
}

/*************************** CHECK IF ADMIN *************************/
// Check for the user account against the admin roster
// return true
/********************************************************************/

function checkAdmin() {
  var user = Session.getActiveUser().getEmail();
  var adminSheet = ss.getSheetByName('admins');
  var adminData = adminSheet.getRange(1,5,adminSheet.getLastRow(),1).getValues();

  if(adminData.toString().indexOf(user) > -1) {
    Logger.log(true);
    return true;
  }
}

function checkPresenter() {
  var user = Session.getActiveUser().getEmail();
  var allSessions = ss.getSheetByName('allSessions');
  var sessionsData = allSessions.getRange(2, 14, allSessions.getLastRow(), 1).getValues();
  
  Logger.log(sessionsData);
  
  if(sessionsData.toString().indexOf(user) > -1) {
    Logger.log(true);
    return true;
  } else {
    Logger.log(false);
    return false;
  }
}

/*************************** ADMIN DASH *****************************/
// Build an Admin Dashboard
// return Object {}
/*********************************************************************/

function adminDash() {  
  var regData = ss.getSheetByName('allRegs').getDataRange().getValues();
  var adminData = ss.getSheetByName('admins').getDataRange().getValues();
  var sessionData = ss.getSheetByName('allSessions').getDataRange().getValues();
  
  // Initialize the Object
  var sessions = [];
  
  // Loop and set the school key at the top level
  for(var i=0; i<adminData.length; i++) {
    if(adminData[i][4] == me) {
      sessions.push({"school":adminData[i][0], "wkshps":[]});
    }
  }
  Logger.log(sessions);
  
  for(var j=0;j<sessionData.length;j++) {
    var date = new Date(sessionData[j][1]);
    sessions[0].wkshps.push({"id":sessionData[j][12], "date":(date.getMonth() +1) + "/" + date.getDate() + "/" + date.getFullYear(), "title":sessionData[j][3],"teachers":[]})
  }
  
  for(var k=0; k<regData.length;k++) {
    for(var w=0;w<sessions[0].wkshps.length;w++) {
      if(regData[k][4] == sessions[0].school && regData[k][5] == sessions[0].wkshps[w].id) {
        sessions[0].wkshps[w].teachers.push(regData[k][2] + " " + regData[k][3]);
      }
    }
  }
  Logger.log(sessions);
  
  return JSON.stringify(sessions);
}

/*************************** CALENDAR REMINDER **********************************/
// Find the session and match to a Calendar Event.
// Invite the registrant to the event via GAS API
/********************************************************************************/

//function calInvite(sessions) {
//  var regData = ss.getSheetByName('allRegs').getDataRange().getValues();
//  var allSessions = ss.getSheetByName('allSessions').getDataRange().getValues();
//  
//  var calId = CalendarApp.getCalendarById('elkhart.k12.in.us_j2gh78bk5e5bje6n6k19ijr2j8@group.calendar.google.com');
//  
////  Logger.log(sessions);
//  
//  for(var i=0; i<sessions.length; i++) {
//    for(var j=0; j<allSessions.length; j++) {
//      var date = new Date(allSessions[j][1]);
//      var stringDate = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
//      if(allSessions[j][12] == sessions[i][5]) {
//        sessions[i].push(allSessions[j][1], allSessions[j][3]);
//      }
//    }
//    var events = calId.getEventsForDay(sessions[i][6], {search: sessions[i][7] });
//    events[i].addGuest(sessions[i][1]).addEmailReminder(60);
//  }      
//}

/*************************** PRESENTER PORTAL **********************************/
// Get the logged-in presenter's session information
// Display on a hidden page.
/********************************************************************************/

function presenterDash() {
  var me = Session.getActiveUser().getEmail();
  var allSessions = ss.getSheetByName('allSessions').getDataRange().getValues();
  
  var sessions = [];
  
  // get sessions I present
  for(var i=0; i<allSessions.length;i++) {
    if(allSessions[i][13].toString() == me) {
      var date = new Date(allSessions[i][1]);
      sessions.push({
        id: allSessions[i][12],
        title: allSessions[i][3],
        date: (date.getMonth() +1) + "/" + date.getDate() + "/" + date.getFullYear(),
        teachers: []
      });
    }
  }
  
  var allRegs = ss.getSheetByName('allRegs').getDataRange().getValues();
  
  // get the teachers for each sessions
  for(var i=0; i<sessions.length; i++) {
    for(var j=0; j<allRegs.length; j++) {
      if(allRegs[j][5] == sessions[i].id) {
        sessions[i].teachers.push(allRegs[j][2] +  " " + allRegs[j][3]);
      }
    }
  }
  return JSON.stringify(sessions);
  
}