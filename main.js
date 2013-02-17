global.$ = $;

//TODO Globals OUT!!
thingiurlbase = "js/thingiview";

var sourcefolder_view = require('sourcefolder_view');
var targetfolder_view = require('targetfolder_view');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var events = require('events');
var util = require('util');

global.fileCache = global.fileCache || [];

$(document).ready(function() {

  if (!Modernizr.draganddrop) {
    $('#message').html("Your browser cannot handle drag and drop.");
  }

  var ui = new UI();

  
  var toggleButtons   = '<div class="btnTogglerLeft"></div>'
              + '<div class="btnTogglerCenter"></div>'
              + '<div class="btnTogglerRight"></div>';


  var uiLayout = $('#container').layout({
    minSize:          100,
    //stateManagement__enabled: true,
    west__size:         .5,
    west__childOptions: {
      minSize:        50,
      south__size:      .5
    },
    spacing_open:         0,
    spacing_closed:         0,
    west__spacing_closed:     8,
    west__spacing_open:       8,
    west__togglerLength_closed:   105,
    west__togglerLength_open:   105,
    west__togglerContent_closed:  toggleButtons, 
    west__togglerContent_open:    toggleButtons,


    center__childOptions: {
      center__onresize_end: $.proxy(ui.resizeViewers, ui),
      minSize:        50,
      south__size:      .5
    }
  });

  uiLayout.togglers.west
      // UN-BIND DEFAULT TOGGLER FUNCTIONALITY
      .unbind("click")
      // BIND CUSTOM WEST METHODS
      .find(".btnTogglerLeft") .click( maximizeCenter ).attr("title", "Maximize Left").end()
      .find(".btnTogglerCenter") .click( maximizeBoth ).attr("title", "Maximize Center").end()
      .find(".btnTogglerRight").click( maximizeWest ).attr("title", "Maximize Right").end()
    ;

  function maximizeCenter (evt) { uiLayout.close("west"); evt.stopPropagation(); };
  function maximizeBoth (evt) { uiLayout.sizePane("west", "50%"); uiLayout.open("west"); evt.stopPropagation(); };
  function maximizeWest (evt) { uiLayout.sizePane("west", "100%"); uiLayout.open("west"); evt.stopPropagation(); };

  viewsLayout = $("#views-container").layout({
    center__paneSelector: ".ui-layout-center"
  });

  foldersLayout = $("#folders-container").layout({
    center__paneSelector: ".ui-layout-center"
  });

  ui.setUiLayout(uiLayout);
  ui.setViewsLayout(viewsLayout);
  ui.setFoldersLayout(foldersLayout);

  var sourceFolder = new sourcefolder_view.SourceFolder($('#sourcefilelist'));
  var targetFolder = new targetfolder_view.TargetFolder($('#derivativefilelist'));

  var folderDropZone = document.getElementById("sourcedircontainer");

  sourceFolder.on('clickFile', _.bind(targetFolder.showDerivatives, targetFolder) );

  sourceFolder.on('dblclickFile', function(filePath){
    fs.readFile(filePath, function(err, fileContents) {
      if (err) throw err;

      ui.viewSource(filePath, fileContents);

    });
  });

  targetFolder.on('dblclickFile', function(filename,filePath){
    fs.readFile(filePath, function(err, fileContents) {
      if (err) throw err;

      ui.viewGcode(fileContents.toString());
    });
  });


  function handleDragEnter(e) {
    folderDropZone.classList.add('over');
  }

  function handleDragLeave(e) {
    folderDropZone.classList.remove('over');
  }

  function handleFolderDrop(e) {
     if (e.stopPropagation) {
      e.stopPropagation();
    }
    e.preventDefault();
    folderDropZone.classList.remove('over');

    var path = e.dataTransfer.files[0].path;

    sourceFolder.open(path);

    return false; 
  };

  
  folderDropZone.addEventListener('drop', handleFolderDrop, false);
  folderDropZone.addEventListener('dragenter', handleDragEnter, false)
  folderDropZone.addEventListener('dragleave', handleDragLeave, false);

  folderDropZone.ondragover = function(e) {
      e.preventDefault();
  };

   folderDropZone.ondragend = function(e) {
      folderDropZone.classList.remove('over');
  };

  //testing
  sourceFolder.open("testfiles");
  ui.resizeViewers();

});

function UI(){
  events.EventEmitter.call(this);
  this.gcodeView = new GcodeView($('#gcodeviewer'));
  this.sourceView = new SourceView($('#sourceviewer'));
  var self = this;

  this.sourceView.on('toggleSourceView', function(e){
    self.uiLayout.toggle("west");
    self.viewsLayout.toggle("south");
  });

  this.gcodeView.on('toggleGcodeView', function(e){
    asd = self.viewsLayout
    self.uiLayout.toggle("west");
    self.viewsLayout.toggle("south");
  });
}

util.inherits(UI, events.EventEmitter);


UI.prototype.setUiLayout = function(layout){
  this.uiLayout = layout;
}
UI.prototype.setViewsLayout = function(layout){
  this.viewsLayout = layout;
}
UI.prototype.setFoldersLayout = function(layout){
  this.foldersLayout = layout;
}

UI.prototype.viewGcode = function(text){
  $.proxy(this.gcodeView.display, this.gcodeView, text)();
}

UI.prototype.viewSource = function(filename, text){
  $.proxy(this.sourceView.display, this.sourceView, filename, text)();
}


UI.prototype.resizeViewers = function(){
  this.gcodeView.resize();
  this.sourceView.resize();
}

function GcodeView(jquery_element){
  events.EventEmitter.call(this);
  this.element = jquery_element;
  this.scene = this.createGcodeScene(this.element);
  this.gcodeObject = new THREE.Object3D();  

  var self = this;

  this.element.dblclick(function(e){
    self.emit('toggleGcodeView');
  })
}

util.inherits(GcodeView, events.EventEmitter);

GcodeView.prototype.display = function(gcodeText){
    if (this.gcodeObject) {
      this.scene.remove(this.gcodeObject);
    }
    this.gcodeObject = createObjectFromGCode(gcodeText);
    this.scene.add(this.gcodeObject);
};

GcodeView.prototype.resize = function(gcodeText){
    var w = this.element.width();
    var h = this.element.height();
    this.gcodeRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.controls.handleResize();
  };

GcodeView.prototype.createGcodeScene = function(element) {

  var _gcodeView = this;

  // Renderer
  this.gcodeRenderer = new THREE.WebGLRenderer({clearColor:0x000000, clearAlpha: 1});
  
  this.gcodeRenderer.setSize(element.width(), element.height());
  element.append(this.gcodeRenderer.domElement);
  this.gcodeRenderer.clear();

  // Scene
  this.scene = new THREE.Scene(); 

  // Lights...
  [[0,0,1,  0xFFFFCC],
   [0,1,0,  0xFFCCFF],
   [1,0,0,  0xCCFFFF],
   [0,0,-1, 0xCCCCFF],
   [0,-1,0, 0xCCFFCC],
   [-1,0,0, 0xFFCCCC]].forEach(function(position) {
    var light = new THREE.DirectionalLight(position[3]);
    light.position.set(position[0], position[1], position[2]).normalize();
    _gcodeView.scene.add(light);
  });

  // Camera...
  var fov    = 45,
      aspect = element.width() / element.height(),
      near   = 1,
      far    = 10000;
  this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    
  this.camera.position.z = 300;
  this.scene.add(this.camera);
  this.controls = new THREE.TrackballControls(this.camera, element.get(0));

  // Action!
  function render() {
    _gcodeView.controls.update();
    _gcodeView.gcodeRenderer.render(_gcodeView.scene, _gcodeView.camera);

    requestAnimationFrame(render); // And repeat...
  }
  render();
  return this.scene;
}



function SourceView(container){
  events.EventEmitter.call(this);
 
  this.thingiview = new Thingiview(container.get(0).id);
  this.thingiview.setObjectColor('#C0D8F0');
  this.thingiview.setBackgroundColor('#000');
  this.thingiview.initScene();
  this.thingiview.setCameraView('iso');

  var self = this;

  container.dblclick(function(e){
    self.emit('toggleSourceView');
  })
}

util.inherits(SourceView, events.EventEmitter);

SourceView.prototype.display = function(filename, fileContents){

    if (fileContents.slice(0,5).toString().match(/^solid/)) {
      this.thingiview.loadSTLString(fileContents.toString());
    } else {
      this.thingiview.loadSTLBinary(fileContents.toString('binary'));
    }
};

SourceView.prototype.resize = function(gcodeText){
    this.thingiview.onContainerResize();
};