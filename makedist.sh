# Packages the app into a windows binary.

if [ ! -d "dist" ]; then
    echo "This script expects a dist directory which contains the node-webkit files for packaging to exist."
    echo "See also: https://github.com/rogerwang/node-webkit/wiki/How-to-package-and-distribute-your-apps"
    echo ""
    echo "Aborting."
    exit -1
fi

zip -r dist/3D-printroom.nw index.html js css img node_modules package.json README.md testfiles main.js
cat dist/nw.exe dist/3D-printroom.nw > dist/3D-Printroom.exe 
chmod +x dist/3D-Printroom.exe
cd dist
zip -r 3D-Printroom-distribution.zip 3D-Printroom.exe *.dll nw.pak
cd ..