
PCDviewer.PointCloudOctreeGeometry = function(){
    PCDviewer.PointCloudOctree.lru = PCDviewer.PointCloudOctree.lru || new LRU();

	this.numNodesLoading = 0;
}

PCDviewer.PointCloudOctreeGeometryNode = function(name, pcoGeometry, boundingBox){
	this.name = name;
	this.index = parseInt(name.charAt(name.length-1));
	this.pcoGeometry = pcoGeometry;
	this.boundingBox = boundingBox;
	this.children = {};
	this.numPoints = 0;
	this.level = null;
	this.hasXYZ = true;
    this.hasIntensity = false;
    this.hasRGB = false;
    this.hasClass = false;
    this.hasRetain = false;
    //this.existence = true;
}

PCDviewer.PointCloudOctreeGeometryNode.prototype.addChild = function(child){
	this.children[child.index] = child;
	child.parent = this;
}

PCDviewer.PointCloudOctreeGeometryNode.prototype.load = function(url){
	if(this.loading === true/* || this.pcoGeometry.numNodesLoading > 3*/){
		return 0;
	}
	
    //  Here, the number of points is unknown, so numpoints is always 0.
	if(PCDviewer.PointCloudOctree.lru.numPoints/* + this.numPoints*/ >= PCDviewer.pointLoadLimit)
    {
        PCDviewer.PointCloudOctree.disposeLeastRecentlyUsed2(PCDviewer.PointCountOfNode/*this.numPoints*/);
	}

//	var pointsnumber = 0;
	var node = this;
    var node_url = url;//url + "/" + node.name + ".lasdb";
    this.pcoGeometry.numNodesLoading++;
    this.loading = true;
    if(1)
    {
    //node.pcdLoad(node_url);
        try
        {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', node_url, true);
            xhr.responseType = 'arraybuffer';
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
            xhr.onreadystatechange = function() 
            {
                if (xhr.readyState == 4) 
                {
                    if (xhr.status == 200 || xhr.status == 0) {
                        var buffer = xhr.response;
                        if ( buffer == null ) 
                        {
                            //node.existence = false;
                            //node.pcoGeometry.numNodesLoading-- ;
                            //node.loading = false;
                        }
                        else
                        {
                            node.bufferLoaded(buffer);
                            //console.log(node.numPoints);    //  这里 this 是指 xmlhttprequest, 注意
                        }
                    } 
                    else 
                    {
                        console.log('Failed to load file! HTTP status: ' + xhr.status + ", file: " + node_url);
                    }
                }
            };
            xhr.send(null);
        }
        catch(e){
            console.log("Failed to load file: " + e);
        }
    }

//    return pointsnumber === undefined ? 0 : pointsnumber;
}

PCDviewer.PointCloudOctreeGeometryNode.prototype.pcdLoad = function(node_url){
    var loader = new THREE.PCDLoader();
    loader.load(node_url, function (geometry) {
        var geometry = geometry;
        geometry.boundingBox = this.boundingBox;
        this.geometry = geometry;
        this.numPoints = geometry.numpoints;
        this.loaded = true;
        this.loading = false;
        //this.pcoGeometry.numNodesLoading--;

        } );
}

PCDviewer.PointCloudOctreeGeometryNode.prototype.bufferLoaded = function(buffer){
	//console.log("loaded: " + this.name);
    var little_endian = true;
    var headerlength = 8;

    console.log(buffer);

    this.parseHeader(new DataView(buffer,0,headerlength),little_endian);

	var geometry = new THREE.BufferGeometry();
	
	var positions = new Float32Array(this.numPoints*3);
	var colors = new Float32Array(this.numPoints*3);
    var Intensity,RGB,Class,Retain,Height;
    if(this.hasRetain) Retain = new Float64Array(this.numPoints);
    if(this.hasIntensity) Intensity = new Uint16Array(this.numPoints);
    if(this.hasRGB) RGB = new Uint16Array(this.numPoints*3);
    if(this.hasClass) Class = new Int32Array(this.numPoints);
	var color = new THREE.Color();
	var body = new DataView(buffer,headerlength);
	//var fView = new Float32Array(buffer);
	//var uiView = new Uint8Array(buffer);
    var _minx,_miny,_minz,_maxx,_maxy,_maxz;
    _minx = _maxx = this.binaryRead( body, 0, "F", "4", little_endian )[0];
    _miny = _maxy = this.binaryRead( body, 4, "F", "4", little_endian )[0];
    _minz = _maxz = this.binaryRead( body, 8, "F", "4", little_endian )[0];
    var result, loc = 0;
	for(var i = 0; i < this.numPoints; i++)
    {
        result = this.binaryReadElement( body, loc, little_endian );
        loc += result[ 1 ];
        var element = result[ 0 ];
        positions[3*i] = element.x;
        positions[3*i+1] = element.y;
        positions[3*i+2] = element.z;
        if(element.x < _minx) _minx = element.x;
        if(element.x > _maxx) _maxx = element.x;
        if(element.y < _miny) _miny = element.y;
        if(element.y > _maxy) _maxy = element.y;
        if(element.z < _minz) _minz = element.z;
        if(element.z > _maxz) _maxz = element.z;
/*      var a = "#";
        color.setStyle(a += element.rgb.toString(16));
        colors[3*i] = color.r;
        colors[3*i+1] = color.g;
        colors[3*i+2] = color.b;
*/
        if(this.hasRetain){
            Retain[i] = element.retain;
        }
        if(this.hasIntensity){
            Intensity[i] = element.intensity;
        }
        if(this.hasRGB){
            RGB[3*i] = element.r;
            RGB[3*i+1] = element.g;
            RGB[3*i+2] = element.b;
        }
        if(this.hasClass){
            Class[i] = element.class;
        }

        colors[3*i] = 0;
        colors[3*i+1] = 0;
        colors[3*i+2] = 0;
	}
	//console.log("[minx,miny,minz] = [" + _minx + "," + _miny + "," + _minz + "]\n");
    //console.log("[maxx,maxy,maxz] = [" + _maxx + "," + _maxy + "," + _maxz + "]");
	geometry.addAttribute('position', new THREE.Float32Attribute(positions, 3));
	geometry.addAttribute('color', new THREE.Float32Attribute(colors, 3));
    //geometry.attributes.color.dynamic = true;
    if(this.hasRetain){
        geometry.addAttribute('retain', new THREE.Float32Attribute(Retain, 1));
    }
    if(this.hasIntensity){
        geometry.addAttribute('intensity', new THREE.Float32Attribute(Intensity, 1));
    }
    if(this.hasRGB){
        geometry.addAttribute('RGB', new THREE.Float32Attribute(RGB, 3));
    }
    if(this.hasClass){
        geometry.addAttribute('class', new THREE.Float32Attribute(Class, 1));
    }
    this.boundingBox = new THREE.Box3(new THREE.Vector3(_minx,_miny,_minz),new THREE.Vector3(_maxx,_maxy,_maxz));
	geometry.boundingBox = this.boundingBox;
	this.geometry = geometry;
	this.loaded = true;
	this.loading = false;
	this.pcoGeometry.numNodesLoading--;
    return this.numPoints;
}

PCDviewer.PointCloudOctreeGeometryNode.prototype.dispose = function(){
	delete this.geometry;
	this.loaded = false;
	
	//console.log("dispose: " + this.name);
}

PCDviewer.PointCloudOctreeGeometryNode.prototype.parseHeader = function(headerDataView,little_endian){
    var pointFormat = headerDataView.getUint32( 0 ,little_endian);
    pointFormat = pointFormat.toString(2);
    if(pointFormat & 0x02){
        this.hasIntensity = true;
    };
    if(pointFormat & 0x04){
        this.hasRGB = true;
    };
    if(pointFormat & 0x08){
        this.hasClass = true;
    };
    if(pointFormat & 0x10){
        this.hasRetain = true;
    };
    var _numPoints = headerDataView.getUint32(4,little_endian);
    this.numPoints = _numPoints === undefined ? 0 : _numPoints;
}

PCDviewer.PointCloudOctreeGeometryNode.prototype.binaryReadElement = function(dataview, at, little_endian){

    var element = {
        x:undefined,
        y:undefined,
        z:undefined,
        retain:undefined,
        intensity:undefined,
        r:undefined,
        g:undefined,
        b:undefined,
        class:undefined
    };
    var result, read = 0;

    result = this.binaryRead( dataview, at + read, "F", "4", little_endian );
    element.x = result[ 0 ];
    read += result[ 1 ];

    result = this.binaryRead( dataview, at + read, "F", "4", little_endian );
    element.y = result[ 0 ];
    read += result[ 1 ];

    result = this.binaryRead( dataview, at + read, "F", "4", little_endian );
    element.z = result[ 0 ];
    read += result[ 1 ];
    if(this.hasRetain) {
        result = this.binaryRead( dataview, at + read, "U", "8", little_endian );
        element.retain = result[ 0 ];
        read += result[ 1 ];
    }
    if(this.hasIntensity) {
        result = this.binaryRead( dataview, at + read, "U", "2", little_endian );
        element.intensity = result[ 0 ];
        read += result[ 1 ];
    }
    if(this.hasRGB) {
        result = this.binaryRead( dataview, at + read, "U", "2", little_endian );
        element.r = result[ 0 ];
        read += result[ 1 ];

        result = this.binaryRead( dataview, at + read, "U", "2", little_endian );
        element.g = result[ 0 ];
        read += result[ 1 ];

        result = this.binaryRead( dataview, at + read, "U", "2", little_endian );
        element.b = result[ 0 ];
        read += result[ 1 ];
    }
    if(this.hasClass) {
        result = this.binaryRead( dataview, at + read, "U", "4", little_endian );
        element.class = result[ 0 ];
        read += result[ 1 ];
    }

    return [ element, read ];
}

PCDviewer.PointCloudOctreeGeometryNode.prototype.binaryRead = function(dataview, at, TYPE, SIZE, little_endian){

    switch ( SIZE ) {

        // corespondences for non-specific length types here match rply:
        case "1":
            if(TYPE == "I")
                return [ dataview.getInt8( at ), 1 ];
            else
                return [ dataview.getUint8( at ), 1 ];
            break;

        case "2":
            if(TYPE == "I")
                return [ dataview.getInt16( at, little_endian ), 2 ];
            else
                return [ dataview.getUint16( at, little_endian ), 2 ];
            break;

        case "4":
            if(TYPE == "I")
                return [ dataview.getInt32( at, little_endian ), 4 ];
            if(TYPE == "U")
                return [ dataview.getUint32( at, little_endian ), 4 ];
            if(TYPE == "F")
                return [ dataview.getFloat32( at, little_endian ), 4 ];
            break;

        case "8":
            return [ dataview.getFloat64( at, little_endian ), 8 ];
            break;

        default:
            console.log('what\'s wrong!!');
    }

}

