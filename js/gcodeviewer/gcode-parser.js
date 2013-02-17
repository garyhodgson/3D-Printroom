/**
 * Parses a string of gcode instructions, and invokes handlers for
 * each type of command.
 *
 * Special handler:
 *   'default': Called if no other handler matches.
 */
function GCodeParser(handlers) {
  this.handlers = handlers || {};
}

GCodeParser.prototype.parseLine = function(text, info) {
  text = text.replace(/;.*$/, '').trim(); // Remove ; style comments
  if (text) {
    var tokens = text.split(' ');
    if (tokens) {
      var cmd = tokens[0];
      var args = {
        'cmd': cmd
      };
      tokens.splice(1).forEach(function(token) {
        var key = token[0].toLowerCase();
        var value = parseFloat(token.substring(1));
        args[key] = value;
      });
      var handler = this.handlers[tokens[0]] || this.handlers['default'];
      if (handler) {
        return handler(args, info);
      }
    }
  }
};

GCodeParser.prototype.parse = function(gcode) {
  var lines = gcode.split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (this.parseLine(lines[i], i) === false) {
      break;
    }
  }
};

GCodeParser.prototype.parseLineBjd = function(gcode, info) {
  var params = "G|M|E|F|H|I|J|K|P|R|S|T|X|Y|Z"; // supported command parameters
  var i = 0, index = 0;
  
  
  while (i < gcode.length) {
    if (gcode.substring(i, i+1).search(params) == 0) {
      index = gcode.substring(i+1).search(params);
      if (index != -1) {
        gcodeParam = gcode.substring(i, i+index+1);       
        i++;
      }
      else {
        gcodeParam = gcode.substring(i);         
        i = gcode.length;  //this will end the while loop
      }
      
      if (! args) { // must be the first parameter
        var args = {
          'cmdType': gcodeParam[0],  // typically G or M
          'cmdNumber': parseFloat(gcodeParam.substring(1)) // this make G1 and G01 equivelent
        };
      }
      else {
        var key = gcodeParam[0].toLowerCase();
        var value = parseFloat(gcodeParam.substring(1));
        args[key] = value;
      }
    }
    i++;
  }
  //console.log(args);
  var handler = this.handlers['parsLine'];
      if (handler) {
        return handler(args, info);
    }
};

GCodeParser.prototype.parseBjd = function(gcode) {

    //Fugly but valid g-code N110G17M03(start motor)G0X0Y0Z0
  
  //var gcode = testForm.output.value //"; comment\nN100G1X1Y1Z1\nN200g2X46 (Hmmm)\n;comm 2\nm03G12G1x5y5z5";
  var commands = "G|M|S";
  var index;
  var gcodeLine = "";
  
  
    
  // clean up gcode
  gcode = gcode.toUpperCase();
  gcode = gcode.replace(/;.*\n/g,""); //remove semicolon style comments
  gcode = gcode.replace(/\(.*\)/g,""); //remove parenthesis style comments
  gcode = gcode.replace(/%/g,""); //remove percent signs ..used as end of file??
  gcode = gcode.replace(/N[0-9]*/g,"");  // remove line numbers 
  gcode = gcode.replace(/\s+/g,""); // remove white space
  
  var i = 0;
  
  while (i < gcode.length -1) {
    if (gcode.substring(i, i+1).search(commands) == 0)
    {
      index = gcode.substring(i+1).search(commands);
      if (index != -1)
      {
        gcodeLine = gcode.substring(i, i+index+1);
        i++;
      }
      else
      {
         gcodeLine = gcode.substring(i);
         i = gcode.length;
      }     
      this.parseLineBjd(gcodeLine,0);
    }
    else
      i++;
  }
  
};



