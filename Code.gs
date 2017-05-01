// new property service GLOBAL
// see: https://developers.google.com/apps-script/reference/properties/
var SCRIPT_PROP = PropertiesService.getScriptProperties();

var ss = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"))

var user = Session.getActiveUser().getEmail();

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
  return HtmlService.createTemplateFromFile(e.parameter['page']).evaluate().setTitle("Admin Portal");
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
    
    Logger.log(formObject.wkshp);
    // condiditon if the class is not limited registration
    
    Logger.log(typeof formObject.wkshp === "string");
    if(typeof formObject.wkshp === "string") {

      classes.push(formObject.wkshp);
            
      for(var i=0; i<classes.length; i++) {
        
        for(var j=0; j<sessions.length; j++) {
          
          if(classes[i] == sessions[j][12]) {
          
          Logger.log("Matched " + classes[0] + " with " + sessions[j][12]);
            Logger.log("The code needs to be: " + sessions[j][11] + ", the code was " + formObject.code);
          if(formObject.code == sessions[j][11]) {            
            
            var row = [new Date(), formObject[headers[1]], formObject[headers[2]], formObject[headers[3]], formObject[headers[4]], classes[0]];
            rows.push(row);
            
            msg.push("Registration for " + sessions[j][3] + " was successful.");
            
          } else {
            msg.push("The code you submitted for " + sessions[j][3] + " was incorrect. Please refresh and try again.");
          }
        }
      }
    } 
    } else {
      Logger.log("The Object contains an array, open it and iterate");
          //First, split the codes into an array of strings
          for(var i=0; i<formObject.wkshp.length; i++) {
            
            Logger.log(formObject.wkshp);
            Logger.log(formObject.code);
            
            for(var j=0; j<sessions.length; j++) {
              
              if(formObject.wkshp[i] == sessions[j][12]) {
                
                  Logger.log(sessions[j][12] + " needs a code, " + sessions[j][11]);
                                  
                  Logger.log("The session needs " + sessions[j][11] + ", it received " + formObject.code[i]);
                  if(formObject.code[i] == sessions[j][11]) {
                    
                    Logger.log("They matched, pushing to the sheet");
                    var row = [new Date(), formObject[headers[1]], formObject[headers[2]], formObject[headers[3]], formObject[headers[4]], formObject.wkshp[i]]
                    rows.push(row);
                    msg.push("Registration for " + sessions[j][3] + " was successful.");
                  } else {
                    Logger.log("It didn't match. Needed " + sessions[j][11] + " and got " + formObject.code[i]);
                    msg.push("<p class='err'>The registration code for <b>" + sessions[j][3] + "</b> is incorrect. Please try again.</p>");
                  }
                }
              }
            }
          } 
      for(var i=0; i<rows.length;i++) {
        sheet.getRange(nextRow,1,rows.length,6).setValues(rows);
      }
    return msg;
  }
  catch(msg) {
    Logger.log(msg);
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
    if(data[i][1].toString() == user) {
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
    Logger.log(cats);
    // Check for URLs in the registration description   
    var newText = val[4].replace(/((http|https)\:\/\/[a-zA-Z0-9\-\.\/]+[a-zA-Z])/g,'<a href="$1">$1</a>');
      
    // Comparitors
     // var suffix = ((val[1].getHours()+11) % 12 + 1) >= 12 ? "PM":"AM";
     var hours = (((val[0].getHours()+11) % 12 + 1));
     var date = (val[0].getMonth()+1) + "/" + val[0].getDate() + "/" + val[0].getFullYear();
     var id = val[11];
         // Build the objects
     if(usrRegIds.indexOf(id) !== -1) {
        usrRegs.push({
         date: date, 
          time: hours + ":" + ('0'+val[1].getMinutes()).slice(-2),
          title: val[2],
          desc: newText,
          cat: cats.toString(),
          type: val[8],
          location: val[9],
          hash: val[11]
       });
     } else {
       allSessionsFiltered.push({
         date: date,
         time: hours + ":" + ('0'+val[1].getMinutes()).slice(-2),
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
      
  var returnObj = { usrRegIds: usrRegs.sort(function(a,b) { return new Date(a.date) - new Date(b.date) }), allSessions: allSessionsFiltered.sort(function(a,b) { return new Date(a.date) - new Date(b.date) }) }

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
  
  cal.createEvent(title, start, end, {location: loc, description: desc})
}

/*************************** EMAIL ADMIN *****************************/
// Send a monthly update email to principals with teachers who
// have completed trainin
// return Object {}
/*********************************************************************/

function emailAdmins() {
  var me = Session.getEffectiveUser().getEmail();
  
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
    sessions[0].wkshps.push({"id":sessionData[j][12], "title":sessionData[j][3],"teachers":[]})
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

/*************************** EMAIL REMINDERS ************************************/
// return Object email
/********************************************************************************/

function emailReminders() {
// Get the data and compare to today
  var data = sheet.getSheetByName("allRegs").getDataRange().getValues();
  var today = new Date();
  var monday = new Date();
  monday.setDate(monday.getDate(monday) + 4);
  
  var stringMonday = (monday.getMonth() +1) + "/" + monday.getDate() + "/" + monday.getFullYear();
  
  var emails = [];

// Loop through each row and find the following Monday
  for(var i=1;i<data.length;i++) {
    var array = [];
    array.push(data[i][1]);
    for(var j=5;j<data[i].length;j++) {
      if(data[i][j] == "") {
        break;
      } else { 
        array.push(data[i][j]);
      }
    }
    for(var d=1;d<array.length;d++) {
      //Logger.log(array[0]);
      if(array[d] == stringMonday) {
        emails.push(array[0]);
      }
    }
  }
    
  Logger.log(emails);
    
  for(var e=0;e<emails.length;e++) {
    var message = {
          to: emails[e],
          replyTo: "instructional-tech@elkhart.k12.in.us",
          subject: "Monday workshop reminder",
          htmlBody: 
               "<p>This is a reminder that you are scheduled for a workshop Monday afternoon at the administration building.</p>" +
               "<p>If you cannot make the class, please <a href='https://script.google.com/a/macros/elkhart.k12.in.us/s/AKfycby3BrJ2zIvH51edgSRNaVnv-NWdJW8aiUl_GTAoyDhlku54WRk/exec'>cancel your registration on the signup website</a>.</p>" +
               "<p>If you have questions, you can email <a href='mailto:instructional-tech@elkhart.k12.in.us'>instructional-tech@elkhart.k12.in.us</a>.</p>" +
               "<p>Thanks, and we'll see you on Monday,</p>" +
               "<p>Brian, Kat, & Wes</p>"
          }
    MailApp.sendEmail(message);
    }
}
 
