function myFunction() {
  var array1 = splitTest();
  Logger.log(array1);
  for(var i=0;i<array1.length;i++) {
    Logger.log(array1[i].substr(0,2));
  }
}

function splitTest() {
  var array1 = [{}];
  var string1 = "1a This is a test, 2a This is another test";
  
  array1 = string1.split(", ");
  return array1;
}
