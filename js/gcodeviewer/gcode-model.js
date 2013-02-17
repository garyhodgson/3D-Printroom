function createObjectFromGCode(gcode) {
  //    GCode descriptions come from:
  //    http://reprap.org/wiki/G-code
  //    http://en.wikipedia.org/wiki/G-code
  //    SprintRun source code
  
  
  geometry = new THREE.Geometry();
  
  var units = "mm"; // default to mm but can change in G20 or G21
  
  /* printer use G1 for all moves so it is tricky to determine non cut/extrude moves
  for both printers and routers.  G92 E0 is used to reset the filament lenght on printers
  so we will use that to set a printer flag
  */  
  var isPrinterGcode = false; 
  
  function getAngle(p1, p2) {  // retun the angle when going from p1 to p2
  var deltaX = p2.x - p1.x;
  var deltaY = p2.y - p1.y;
  
  if (deltaX != 0) {      // prevent div by 0
    // it helps to know what quadrant you are in
    if (deltaX > 0 && deltaY >= 0)  // 0 - 90
      return Math.atan(deltaY/deltaX);
    else if (deltaX < 0 && deltaY >= 0) // 90 to 180
      return Math.PI - Math.abs(Math.atan(deltaY/deltaX));
    else if (deltaX < 0 && deltaY < 0) // 180 - 270
      return Math.PI + Math.abs(Math.atan(deltaY/deltaX));
    else if (deltaX > 0 && deltaY < 0) // 270 - 360
        return Math.PI * 2 - Math.abs(Math.atan(deltaY/deltaX));
  }
  else {
    //
    if (deltaY > 0) {   // 90 deg
      return Math.PI / 2.0;
    }
    else {          // 270 deg
      return Math.PI * 3.0 / 2.0;
    }
  }
  
  }
  
  var lastLine = {x:0, y:0, z:0, e:0, f:0, extruding:false};
 
  
  var bbbox = { min: { x:100000,y:100000,z:100000 }, max: { x:-100000,y:-100000,z:-100000 } };
  var cutMaterial = new THREE.LineBasicMaterial({
            opacity: 0.8,
            transparent: true,
            linewidth: 10,
            vertexColors: THREE.FaceColors });
  var rapidMaterial = new THREE.LineBasicMaterial({
            opacity: 0.8,
            transparent: true,
            linewidth: 10,
            vertexColors: THREE.FaceColors });
  var cutColor = new THREE.Color(0xffffff );
  var rapidColor = new THREE.Color(0x0000ff );
  var arcColor = new THREE.Color(0xff0000 );
  
  
  function addSegment(p1, p2) {
    
        geometry.vertices.push(new THREE.Vector3(p1.x, p1.y, p1.z));
        geometry.vertices.push(new THREE.Vector3(p2.x, p2.y, p2.z));
        geometry.colors.push(p2.extruding ? cutColor : rapidColor);
        geometry.colors.push(p2.extruding ? cutColor : rapidColor);
    
        if (p2.extruding) {
      bbbox.min.x = Math.min(bbbox.min.x, p2.x);
      bbbox.min.y = Math.min(bbbox.min.y, p2.y);
      bbbox.min.z = Math.min(bbbox.min.z, p2.z);
      bbbox.max.x = Math.max(bbbox.max.x, p2.x);
      bbbox.max.y = Math.max(bbbox.max.y, p2.y);
      bbbox.max.z = Math.max(bbbox.max.z, p2.z);
    }
    
  }
  
  function addArc(p1, p2, center, isCw) {
    
    var numPoints = 24;  // TO DO....could this be dynamic or user selectable?    
    var radius;
    var lineStart = p1;
    var lineEnd = p2;
    var sweep;
    
    //use pythag theorum...to get the radius
    radius = Math.pow(Math.pow(p1.x - center.x, 2.0) + Math.pow(p1.y - center.y, 2.0), 0.5);
  
    var startAngle = getAngle(center, p1);
    //console.log("strt",   startAngle);
    var endAngle = getAngle(center, p2);
    //console.log("end",    endAngle);
    
    // if it ends at 0 it really should end at 360
    if (endAngle == 0)
      endAngle = Math.PI * 2;
    
    if (!isCw && endAngle < startAngle)
      sweep = ((Math.PI * 2 - startAngle) + endAngle);
    else if (isCw && endAngle > startAngle)
      sweep = ((Math.PI * 2 - endAngle) + startAngle);
    else
      sweep = Math.abs(endAngle - startAngle);
    
    //console.log("sweep",sweep);
    //console.log("end ang",endAngle);
  
    for(i=0; i<=numPoints; i++)
    {
    
      if (isCw)
        var angle = (startAngle - i * sweep/numPoints);
      else
        var angle = (startAngle + i * sweep/numPoints);
      
      //console.log("ang",angle);
      
      if (angle >= Math.PI * 2)
        angle = angle - Math.PI * 2;
      
      var x = Math.cos(angle) * radius;
      var y = Math.sin(angle) * radius;
      
      lineEnd.x = center.x + x;
      lineEnd.y = center.y + y;
      
      geometry.vertices.push(new THREE.Vector3(lineStart.x, lineStart.y, lineStart.z));
        
      if (i == numPoints) { // last point goes to the end
        geometry.vertices.push(new THREE.Vector3(p2.x, p2.y, p2.z));
        
      }
      else {
        geometry.vertices.push(new THREE.Vector3(lineEnd.x, lineEnd.y, lineEnd.z));
        
      }

      geometry.colors.push(arcColor);
      geometry.colors.push(arcColor);
      
      lineStart.x = lineEnd.x;
      lineStart.y = lineEnd.y;
      
    }
    
    
        //TO DO: deal with bounding box
    
  }
  
  // add counter clockwise arc 
  function addCcwArc(p1, p2, center) {
    
    var numPoints = 24;  // TO DO....could this be dynamic or user selectable?    
    var radius;
    var lineStart = p1;
    var lineEnd = p2;
    
    //use pythag theorum...to get the radius
    radius = Math.pow(Math.pow(p1.x - center.x, 2.0) + Math.pow(p1.y - center.y, 2.0), 0.5);
  
    var startAngle = getAngle(center, p1);    
    var endAngle = getAngle(center, p2);
    
    // if it ends at 0 it really should end at 360
    if (endAngle == 0)
      endAngle = Math.PI * 2;
    
    var sweep = endAngle - startAngle;
  
    for(i=0; i<=numPoints; i++)
    {
      var angle = (startAngle + i * sweep/numPoints);
      
      if (angle >= Math.PI *2)
        angle = angle - Math.PI * 2;
      else if (angle < 0)
        angle = angle + Math.PI * 2;  // angle is less than 0 so it subtracts
        
      
      var x = Math.cos(angle) * radius;
      var y = Math.sin(angle) * radius;
      
      lineEnd.x = center.x + x;
      lineEnd.y = center.y + y;
      
      geometry.vertices.push(new THREE.Vector3(lineStart.x, lineStart.y, lineStart.z));
        
      if (i == numPoints) { // last point goes to the end
        geometry.vertices.push(new THREE.Vector3(p2.x, p2.y, p2.z));
        
      }
      else {
        geometry.vertices.push(new THREE.Vector3(lineEnd.x, lineEnd.y, lineEnd.z));
        
      }

      geometry.colors.push(arcColor);
      geometry.colors.push(arcColor);
      
      lineStart.x = lineEnd.x;
      lineStart.y = lineEnd.y;
      
    }
    
    
        //TO DO: deal with bounding box
    
  }
    
    var relative = false;
  function delta(v1, v2) {
    return relative ? v2 : v2 - v1;
  }
  function absolute (v1, v2) {
    return relative ? v1 + v2 : v2;
  }
  


  var parser = new GCodeParser({    
    
    'default': function(args, info) {
      console.error('Unknown command:', args.cmd, args, info);
    },
  
  'parsLine': function (args) {
    if (args.cmdType == "G") {
      switch (args.cmdNumber) {
        case 0:  // G0 rapid linear move
        case 1:  // G1 cut move 
          var newLine = {
            x: args.x !== undefined ? absolute(lastLine.x, args.x) : lastLine.x,
            y: args.y !== undefined ? absolute(lastLine.y, args.y) : lastLine.y,
            z: args.z !== undefined ? absolute(lastLine.z, args.z) : lastLine.z,
            e: args.e !== undefined ? args.e : 0,
            f: args.f !== undefined ? absolute(lastLine.f, args.f) : lastLine.f,
          };
          
          if (args.cmdNumber == 0)
            newLine.extruding = false;
          else
            if (isPrinterGcode)
            {
              newLine.extruding = (args.e > 0);
            }
            else
            {
              newLine.extruding = true;
            }
            
            
          
          addSegment(lastLine, newLine);
          lastLine = newLine;
          
          break;
        case 2:  // CW Arc
        case 3:  // CCW Arc
          //console.log("Do G2");
          var endPoint = {
            x: args.x !== undefined ? args.x : lastLine.x,
            y: args.y !== undefined ? args.y : lastLine.y,
            z: args.z !== undefined ? args.z : lastLine.z,    
            };
            
            // the center point is offset from the start point by args I and J
            var center = {
            x: lastLine.x + args.i,
            y: lastLine.y + args.j,
            z: lastLine.z,
            };
            
            //addArc(lastLine, endPoint, center, true);
            addArc(lastLine, endPoint, center, (args.cmdNumber == "2") ? true : false);
            lastLine = endPoint;
          break;
        case 20: // units inch
          units = "inch"
          break;
        case 21: // units mm
          units = "mm"
          break;
        case 90:
          relative = false;
          break;
        case 91:
          relative = true;
          break;
        case 92:  // zero machine coordinates
          
          if (args.e !== undefined && args.e == 0) {
            isPrinterGcode = true; 
            }
          break;  
        default:        
          //console.log("do unknown command G" + args.cmdNumber);
          break;
        
      }
    }
    else if (args.cmdType == "M") {
    }
    else if (args.cmdType == "S") {
    }
    else {
      console.log("Unknown cmd type: " + args.cmdType);
    }
    
  
  },
  
  });

  parser.parseBjd(gcode);  // in gcode-parser.js

  //console.log("Layer Count", layers.count());

  var object = new THREE.Object3D();
  
  object.add(new THREE.Line(geometry, cutMaterial, THREE.LinePieces));
  

  var radius = 1,
    segments = 16,
    rings = 16;
  
  
  if (units == "mm")
    radius = 1;
  else
    radius = .039;
  //radius = (units == "mm") ? 1 : 2;
  
var sphereMaterial =
  new THREE.MeshLambertMaterial(
    {
      color: 0x00CC00
    });

// put a sphere at 0,0,0  
var sphere = new THREE.Mesh(

  new THREE.SphereGeometry(
    radius,
    segments,
    rings),

  sphereMaterial);
    
  sphere.position.x = 0;
  sphere.position.y = 0;
  sphere.position.z = 0;

// add the sphere to the scene
object.add(sphere);

  //console.log("bbox ", bbbox);

  // Center
  var scale = 3; // TODO: Auto size

  var center = new THREE.Vector3(
      bbbox.min.x + ((bbbox.max.x - bbbox.min.x) / 2),
      bbbox.min.y + ((bbbox.max.y - bbbox.min.y) / 2),
      bbbox.min.z + ((bbbox.max.z - bbbox.min.z) / 2));
  //console.log("center ", center);
  
  object.position = center.multiplyScalar(-scale);

  object.scale.multiplyScalar(scale);
  
  return object;
}