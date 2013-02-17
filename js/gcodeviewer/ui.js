unction error(msg) {
  alert('Error: ' + msg);
}

function loadFile(path, callback /* function(contents) */) { 
  $.get(path, null, callback, 'text').error(function() { error("loading file") });
}

var scene = null;
var object = new THREE.Object3D();  

function openGCodeFromPath(path) {
  if (object) {
    scene.remove(object);
  }
  loadFile(path, function(gcode) {
    object = createObjectFromGCode(gcode);
    scene.add(object);
  });
}

function openGCodeFromText(gcode) {
  if (object) {
    scene.remove(object);
  }
  object = createObjectFromGCode(gcode);
  scene.add(object);
}


$(function() {

  // Drop files from desktop onto main page to import them.
  $('#gcodeviewer').on('dragover', function(event) {
    event.stopPropagation();
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'copy'
  }).on('drop', function(event) {
    event.stopPropagation();
    event.preventDefault();
    var files = event.originalEvent.dataTransfer.files;
    if (files.length > 0) {
      var reader = new FileReader();
      reader.onload = function() {
        openGCodeFromText(reader.result);
      };
      reader.readAsText(files[0]);
    }
  });

  scene = createScene($('#gcodeviewer'));

  scene.add(object);
  
});
