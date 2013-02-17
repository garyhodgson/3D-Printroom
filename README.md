# 3D Printroom

**Warning: Work in Progress!**

## Synopsis
A [node-webkit](https://github.com/rogerwang/node-webkit) application that acts as a simple 3D printer file explorer.

## Grand Plan

Using file explorers to manage 3D printer files is a bit clunky. There are no previews and the metadata held in most gcode files is not visible. This leads to long filenames consisting of some key attributes, e.g. ```directdrive_bowden_holder.PLA.slow_PLA_prusa.0.24.gcode```.  Once a folder contains more than a few files it becomes tricky to manage.

This app is a little side project which attempts to address this problem, inspired by Adobe Lightroom (which does an admirable job of organising photos).  Rather than attempt a modification of Windows Explorer to handle 3D printer files I decided to make something more portable.  I chose node-webkit so I could develop with web tech and still use node.js in order to access local filesystems.

## Screen shot

![screenshot](https://dl.dropbox.com/u/22464622/3D-Printroom/screenshot.png)

## Features

* STL preview
* Gcode preview
* Gcode attribute display (Slic3r only)

## Future Features

* Ad-hoc collections
* Remember & browse folders
* Folder sync
* Additional metadata, e.g. ratings, comments
* Send to slicer
* Send to printer host


## Running
At this stage the best bet is to follow the hacking instructions below and run the latest version using node-webkit directly.  If you want to simply play with a version there is a Windows binary here: [3D-Printroom-distribution.zip](https://dl.dropbox.com/u/22464622/3D-Printroom/3D-Printroom-distribution.zip). (Linux and Mac will have to sadly follow the hacking instructions below.)

* Download and extract zip file.
* Double click 3D-Printroom.exe.
* An example folder is already included.
* Drag and Drop a folder containing your STL and Gcode files to the top left window.

## Hacking
* Clone the project.
* Install node-webkit.
* Install the node dependencies.
  * humanize
  * jade
  * moment
  * nstore
  * underscore
* Run with ```nw.exe --disable-application-cache 3D-Printroom``` (where '3D-Printroom' is the project folder)

## Credits
* [Thingiview.js](https://github.com/tbuser/thingiview.js)
* [Gcode-Viewer](https://github.com/joewalnes/gcode-viewer)
* [Node-webkit](https://github.com/rogerwang/node-webkit)

## License
[GPLv3](http://www.example.com/licenses/gpl.html)