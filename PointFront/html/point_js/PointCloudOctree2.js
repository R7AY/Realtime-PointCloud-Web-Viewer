

/**
 * Stands in place for invisible or unloaded octree nodes.
 * If a proxy node becomes visible and its geometry has not been loaded,
 * loading will begin.
 * If it is visible and the geometry has been loaded, the proxy node will 
 * be replaced with a point cloud node (THREE.PointCloud as of now)
 */
PCDviewer.PointCloudOctreeProxyNode = function(geometryNode){
	THREE.Object3D.call( this );    
	
	this.geometryNode = geometryNode;
	this.boundingBox = geometryNode.boundingBox;
	this.name = geometryNode.name;
	this.level = geometryNode.level;
	this.numPoints = geometryNode.numPoints;
}

PCDviewer.PointCloudOctreeProxyNode.prototype = Object.create(THREE.Object3D.prototype);


PCDviewer.PointCloudOctree = function(geometry, material, OrbitControl){
	THREE.Object3D.call( this );

    PCDviewer.PointCloudOctree.lru = PCDviewer.PointCloudOctree.lru || new LRU();
	
    // initialize geometry
    //
    var min = new THREE.Vector3(999999, 999999, 999999);
    var max = new THREE.Vector3(-999999, -999999, -999999);

	this.pcoGeometry = geometry;
	this.boundingBox = new THREE.Box3(min,max);//this.pcoGeometry.boundingBox;
	this.material = material;
	this.maxVisibleNodes = 500;
	this.maxVisiblePoints = 500*100*100;
	this.level = 0;
	
	this.LODDistance = 20;
	this.LODFalloff = 1.3;
	this.LOD = 4;

    this.ViewMode = "color_Height";//  color_Texture color_Intensity color_Class color_Height color_Specified(gray)
    this.maxIntensity = 65536;      //  geometry.maxIntensity;
    this.minIntensity = 0;          //  geometry.minIntensity;
    this.MaxdeltaIntensity = this.maxIntensity - this.minIntensity;

    var _endPointColors = [];
    _endPointColors.push(new THREE.Vector3(0, 0, 1.0));
    _endPointColors.push(new THREE.Vector3(0, 1.0, 1.0));
    _endPointColors.push(new THREE.Vector3(0, 1.0, 0));
    _endPointColors.push(new THREE.Vector3(1.0, 1.0, 0));
    _endPointColors.push(new THREE.Vector3(1.0, 0, 0));
    this.endPointColors = _endPointColors;
    
    this.statisticalMaxz = 1000;
    this.statisticalMinz = 0;
    this.offset_z = 500;
    this.maxHeight = 500;
    this.minHeight = -500;
    this.rampLength = 1000;
    this.sectionLength = 200;

    this.numVisiblePoints = 0;
    this.controls = OrbitControl;

    this.OBJECTCLASS = {
        NONE:new THREE.Vector3(0.5, 0.5, 0.5),
        UNKNOWN:new THREE.Vector3(0.5, 0.5, 0.5),
        GROUND:new THREE.Vector3(0.94, 0.89, 0.69),
        BUILDING:new THREE.Vector3(0.3, 0.74, 0.77),
        UTILITYPOLE:new THREE.Vector3(0.92, 0.81, 0.0),
        TRAFFICSIGN:new THREE.Vector3(0.90, 0.15, 0.1),
        TREE:new THREE.Vector3(0.56, 0.76, 0.12),
        STREETLAMP:new THREE.Vector3(1.0, 0.5, 0.0),
        ENCLOSURE:new THREE.Vector3(0.65, 0.87, 0.93),
        CAR:new THREE.Vector3(0.72, 0.5, 0.34),
        ROAD:new THREE.Vector3(0.0, 0.0, 1.0),
        ROADMARKING:new THREE.Vector3(1.0, 1.0, 1.0),
        UNKNOWN_POLE:new THREE.Vector3(0.0, 0.0, 0.0),
        POWERLINE:new THREE.Vector3(1.0, 0.68, 0.79),
        CURB:new THREE.Vector3(1.0, 1.0, 1.0),
        BUSH:new THREE.Vector3(0.56, 0.76, 0.12),
        UNKNOWN_PLANE:new THREE.Vector3(0.3, 0.76, 0.87)
    };
	
//	var rootProxy = new PCDviewer.PointCloudOctreeProxyNode(this.pcoGeometry.root);
//	this.add(rootProxy);  //this -> THREE.Object3D
}

PCDviewer.PointCloudOctree.prototype = Object.create(THREE.Object3D.prototype);

PCDviewer.PointCloudOctree.prototype.update = function(camera)
{
	this.numVisibleNodes = 0;
	this.numVisiblePoints = 0;
	var frustum = new THREE.Frustum();
	frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
	
	// check visibility
	var stack = [];
	stack.push(this);
	while(stack.length > 0){
		var object = stack.shift();
		
		var boxWorld = PCDviewer.utils.computeTransformedBoundingBox(object.boundingBox, object.matrixWorld);
		var camWorldPos = new THREE.Vector3().setFromMatrixPosition( camera.matrixWorld );
		var distance = boxWorld.center().distanceTo(camWorldPos);
		var radius = boxWorld.size().length() * 0.5;
		//var ratio = distance/(1100/this.LOD);
		var visible = true;
        //if(object.numPoints == 0 || object.numPoints === undefined) visible = false;
		visible = visible && frustum.intersectsBox(boxWorld);
		if(object.level >= 1){
            //visible = visible && (ratio>=(this.LOD - object.level) && ratio<(this.LOD + 1 - object.level));
            visible = visible && radius / distance > (/*1.17*/1 / this.LOD);
			//visible = visible && (this.numVisiblePoints + object.numPoints < PCDviewer.pointLoadLimit);
            visible = visible && (this.numVisiblePoints < 2000000);
			visible = visible && (this.numVisibleNodes <= this.maxVisibleNodes);
			//visible = visible && (this.numVisiblePoints <= this.maxVisiblePoints);
		}else{
			visible = true;
		}

		object.visible = visible;
		
		if(!visible){
			this.hideDescendants(object);
			continue;
		}
		
		if(object instanceof THREE.Points)
        {    //THREE.PointCloud -> THREE.Points
			this.numVisibleNodes++;
			this.numVisiblePoints += object.numPoints;
            this.setViewMode(object);
            PCDviewer.PointCloudOctree.lru.touch(object);
		}
        else if (object instanceof PCDviewer.PointCloudOctreeProxyNode) 
        {
			this.replaceProxy(object);
		}
		
		for(var i = 0; i < object.children.length; i++)
        {
			stack.push(object.children[i]);
		}
	}
}

// --------------------------------------------------------------
// add by sun 20210330

// load from file(lasdb)

PCDviewer.PointCloudOctree.prototype.loadCloud = function(name)
{
    var min = new THREE.Vector3(0, 0, 0);
    var boundingBox = new THREE.Box3(min, min);

    var geometryNode = new PCDviewer.PointCloudOctreeGeometryNode(name, this.pcoGeometry, boundingBox);
    var proxyNode = new PCDviewer.PointCloudOctreeProxyNode(geometryNode);

    this.add(proxyNode);
}

PCDviewer.PointCloudOctree.prototype.update2 = function(camera)
{
    if (this.children.length < 1)
    {
        return null;
    }

    this.numVisibleNodes = 0;
	this.numVisiblePoints = 0;

    var lastCloudBox;
    var centerPos = new THREE.Vector3(0, 0, 0);

    var stack = [];
	stack.push(this);
	while(stack.length > 0)
    {
		var object = stack.shift();
		
		if(object instanceof THREE.Points)
        {
			this.numVisibleNodes++;
			this.numVisiblePoints += object.numPoints;
            this.setViewMode(object);
            PCDviewer.PointCloudOctree.lru.touch(object);
		}
        else if (object instanceof PCDviewer.PointCloudOctreeProxyNode) 
        {
			var geometryNode = object.geometryNode;
            if(geometryNode.loaded == true)
            {
                var geometry = geometryNode.geometry;
                geometry.ViewMode = "color_Specified";
                var node = new THREE.Points(geometry, this.material);  //THREE.PointCloud -> THREE.Points
                node.name = object.name;
                node.level = object.level;
                node.numPoints = geometryNode.numPoints;
                node.boundingBox = geometry.boundingBox;
                node.pcoGeometry = geometryNode;
                //this.setViewMode(node);
                node.geometry.colorsNeedUpdate = true;
                var parent = object.parent;
                parent.remove(object);
                parent.add(node);
                this.numVisiblePoints += node.numPoints  //

                //  use the last cloud bound to update camera
                //
                lastCloudBox = node.boundingBox;
                centerPos.x = geometry.attributes.position.array[0];
                centerPos.y = geometry.attributes.position.array[1];
                centerPos.z = geometry.attributes.position.array[2];
            }else if (!geometryNode.loading)
            {
                geometryNode.load( geometryNode.name);  //
            }
		}
		
		for(var i = 0; i < object.children.length; i++)
        {
			stack.push(object.children[i]);
		}
	}

    if (lastCloudBox != undefined)
    {
        // update whole geometry
        // 

        this.boundingBox.min = new THREE.Vector3(999999, 999999, 999999);
        this.boundingBox.max = new THREE.Vector3(-999999, -999999, -999999);

        if (this.boundingBox.min.x > lastCloudBox.min.x)    this.boundingBox.min.x = lastCloudBox.min.x;
        if (this.boundingBox.min.y > lastCloudBox.min.y)    this.boundingBox.min.y = lastCloudBox.min.y;
        if (this.boundingBox.min.z > lastCloudBox.min.z)    this.boundingBox.min.z = lastCloudBox.min.z;
        if (this.boundingBox.max.x < lastCloudBox.max.x)    this.boundingBox.max.x = lastCloudBox.max.x;
        if (this.boundingBox.max.y < lastCloudBox.max.y)    this.boundingBox.max.y = lastCloudBox.max.y;
        if (this.boundingBox.max.z < lastCloudBox.max.z)    this.boundingBox.max.z = lastCloudBox.max.z;

        this.statisticalMaxz = this.boundingBox.max.z;
        this.statisticalMinz = this.boundingBox.min.z;
        this.offset_z = (this.statisticalMaxz + this.statisticalMinz) / 2;
        this.maxHeight = this.statisticalMaxz;// - this.offset_z;
        this.minHeight = this.statisticalMinz;// - this.offset_z;
        this.rampLength = this.maxHeight - this.minHeight;
        this.sectionLength = this.rampLength / this.endPointColors.length;

        this.moveToOrigin();
        this.moveToGroundPlane();

        // update camera position
        // 

        if (this.children.length % 10 == 1)
        {
            var boxRange = Math.sqrt(Math.pow(this.boundingBox.max.x - this.boundingBox.min.x, 2) + Math.pow(this.boundingBox.max.y - this.boundingBox.min.y, 2));

            camera.position.x = centerPos.x;
            camera.position.y = centerPos.y + boxRange / 2;
            camera.position.z = centerPos.z;

            controls.target.set( camera.position.x, camera.position.y - boxRange / 2, camera.position.z );
            camera.lookAt(controls.target);
        } 
    }
}

// load form buffer

PCDviewer.PointCloudOctree.prototype.loadCloudFromBuffer = function(camera, buffer)
{
    if(PCDviewer.PointCloudOctree.lru.numPoints >= PCDviewer.pointLoadLimit)
    {
        PCDviewer.PointCloudOctree.disposeLeastRecentlyUsed2(PCDviewer.PointCountOfNode);
	}

    var min = new THREE.Vector3(0, 0, 0);
    var boundingBox = new THREE.Box3(min, min);

    var geometryNode = new PCDviewer.PointCloudOctreeGeometryNode("cloud", this.pcoGeometry, boundingBox);
    geometryNode.bufferLoaded(buffer);

    var valid = false;
    if (Math.abs(geometryNode.geometry.attributes.position.array[0]) + Math.abs(geometryNode.geometry.attributes.position.array[1]) > 1)
    {
        var dx = camera.position.x - geometryNode.geometry.attributes.position.array[0];
        var dy = camera.position.z + geometryNode.geometry.attributes.position.array[1];

        if (Math.abs(dx) + Math.abs(dy) > 50)
        {
            valid = true;
        }
    }
    
    if (geometryNode.numPoints > 1)
    {
        geometryNode.geometry.attributes.position.array[0] = geometryNode.geometry.attributes.position.array[3]
        geometryNode.geometry.attributes.position.array[1] = geometryNode.geometry.attributes.position.array[4]
        geometryNode.geometry.attributes.position.array[2] = geometryNode.geometry.attributes.position.array[5]
    }

    var node = new THREE.Points(geometryNode.geometry, this.material);
    node.name = geometryNode.name;
    node.level = geometryNode.level;
    node.numPoints = geometryNode.numPoints;
    node.boundingBox = geometryNode.geometry.boundingBox;

    this.add(node);
    this.numVisibleNodes++;
    this.numVisiblePoints += node.numPoints;
    this.setViewMode(node);
    PCDviewer.PointCloudOctree.lru.touch(node);

    // update whole geometry
    // 

    this.boundingBox.min = new THREE.Vector3(999999, 999999, 999999);
    this.boundingBox.max = new THREE.Vector3(-999999, -999999, -999999);
    if (this.boundingBox.min.x > node.boundingBox.min.x)    this.boundingBox.min.x = node.boundingBox.min.x;
    if (this.boundingBox.min.y > node.boundingBox.min.y)    this.boundingBox.min.y = node.boundingBox.min.y;
    if (this.boundingBox.min.z > node.boundingBox.min.z)    this.boundingBox.min.z = node.boundingBox.min.z;
    if (this.boundingBox.max.x < node.boundingBox.max.x)    this.boundingBox.max.x = node.boundingBox.max.x;
    if (this.boundingBox.max.y < node.boundingBox.max.y)    this.boundingBox.max.y = node.boundingBox.max.y;
    if (this.boundingBox.max.z < node.boundingBox.max.z)    this.boundingBox.max.z = node.boundingBox.max.z;

    this.statisticalMaxz = this.boundingBox.max.z;
    this.statisticalMinz = this.boundingBox.min.z;
    this.offset_z = (this.statisticalMaxz + this.statisticalMinz) / 2;
    this.maxHeight = this.statisticalMaxz;
    this.minHeight = this.statisticalMinz;
    this.rampLength = this.maxHeight - this.minHeight;
    this.sectionLength = this.rampLength / this.endPointColors.length;

    // this.moveToOrigin();
    // this.moveToGroundPlane();

    // update camera position
    // 

    valid = false;
    if (valid == true)
    {
        var boxRange = Math.sqrt(Math.pow(this.boundingBox.max.x - this.boundingBox.min.x,2) + Math.pow(this.boundingBox.max.y - this.boundingBox.min.y, 2));
        boxRange = boxRange / 2;

        if (boxRange > 1000) boxRange = 1000;
        else if (boxRange < 100) boxRange = 100;

        var width = boxRange;
        var height = boxRange * window.innerHeight / window.innerWidth;
        // camera = new THREE.OrthographicCamera(-width, width, height, -height, 1, 10000);
        camera.left = -width;
        camera.right = width;
        camera.top = height;
        camera.bottom = -height;

        camera.position.x = geometryNode.geometry.attributes.position.array[0];
        camera.position.y = this.statisticalMaxz + 100;
        camera.position.z = -geometryNode.geometry.attributes.position.array[1];

        controls.target.set( camera.position.x, this.statisticalMinz, camera.position.z );
        camera.lookAt(controls.target);
    } 

}

// --------------------------------------------------------------

PCDviewer.PointCloudOctree.prototype.replaceProxy = function(proxy){
	
	var geometryNode = proxy.geometryNode;
	if(geometryNode.loaded == true)
    {
		var geometry = geometryNode.geometry;
        geometry.ViewMode = "color_Specified";
		var node = new THREE.Points(geometry, this.material);  //THREE.PointCloud -> THREE.Points
		node.name = proxy.name;
		node.level = proxy.level;
		node.numPoints = geometryNode.numPoints;
		node.boundingBox = geometry.boundingBox;
		node.pcoGeometry = geometryNode;
        //this.setViewMode(node);
        node.geometry.colorsNeedUpdate = true;
		var parent = proxy.parent;
		parent.remove(proxy);
		parent.add(node);
        this.numVisiblePoints += node.numPoints  //
		for(var i = 0; i < 8; i++){      // 8 -> geometryNode.children.length
			if(geometryNode.children[i] !== undefined){
				var child = geometryNode.children[i];
				var childProxy = new PCDviewer.PointCloudOctreeProxyNode(child);
				node.add(childProxy);
			}
		}
	}else
    {
        geometryNode.load(this.pcoGeometry.url + "/" + this.pcoGeometry.cache_folder);  //
	}
}

PCDviewer.PointCloudOctree.prototype.setViewMode = function(Three_Points){
    if(Three_Points.geometry.ViewMode != this.ViewMode){
        switch ( this.ViewMode ){
            case "color_Specified":
                for(var i = 0;i<Three_Points.geometry.attributes.position.count;i++){
                    Three_Points.geometry.attributes.color.array[3*i] = specifiedColor = 0;
                    Three_Points.geometry.attributes.color.array[3*i+1] = specifiedColor = 0;
                    Three_Points.geometry.attributes.color.array[3*i+2] = specifiedColor = 0;
                }
                 
                Three_Points.geometry.ViewMode = "color_Specified";
                Three_Points.geometry.attributes.color.needsUpdate = true;
                break;
            case "color_Texture":
                for(var i = 0;i<Three_Points.geometry.attributes.position.count;i++){
                    Three_Points.geometry.attributes.color.array[3*i] = Three_Points.geometry.attributes.RGB.array[3*i] / 255.0;    // �?�范?��?                   Three_Points.geometry.attributes.color.array[3*i+1] = Three_Points.geometry.attributes.RGB.array[3*i+1] / 255.0;
                    Three_Points.geometry.attributes.color.array[3*i+2] = Three_Points.geometry.attributes.RGB.array[3*i+2] / 255.0;
                }
                Three_Points.geometry.ViewMode = "color_Texture";
                Three_Points.geometry.attributes.color.needsUpdate = true;
                break;
            case "color_Intensity":
                for(var i = 0;i<Three_Points.geometry.attributes.position.count;i++){
                    var color = (Three_Points.geometry.attributes.intensity.array[i] - this.minIntensity) / this.MaxdeltaIntensity;
                    Three_Points.geometry.attributes.color.array[3*i] = color;
                    Three_Points.geometry.attributes.color.array[3*i+1] = color;
                    Three_Points.geometry.attributes.color.array[3*i+2] = color;
                }
                Three_Points.geometry.ViewMode = "color_Intensity";
                Three_Points.geometry.attributes.color.needsUpdate = true;
                break;
            case "color_Class":
                for(var i = 0;i<Three_Points.geometry.attributes.position.count;i++){
                    var color = this.getColorByClass(Three_Points.geometry.attributes.class.array[i]);
                    Three_Points.geometry.attributes.color.array[3*i] = color.x;
                    Three_Points.geometry.attributes.color.array[3*i+1] = color.y;
                    Three_Points.geometry.attributes.color.array[3*i+2] = color.z;
                }
                Three_Points.geometry.ViewMode = "color_Class";
                Three_Points.geometry.attributes.color.needsUpdate = true;
                break;
            case "color_Height":
                for(var i = 0;i<Three_Points.geometry.attributes.position.count;i++){
                    var color = this.getColorByHeight(Three_Points.geometry.attributes.position.array[3*i+2]);
                    Three_Points.geometry.attributes.color.array[3*i] = color.x;
                    Three_Points.geometry.attributes.color.array[3*i+1] = color.y;
                    Three_Points.geometry.attributes.color.array[3*i+2] = color.z;
                }
                Three_Points.geometry.ViewMode = "color_Height";
                Three_Points.geometry.attributes.color.needsUpdate = true;
                break;
            default :
                console.log('what\'s wrong!!');
        }
    }
}

PCDviewer.PointCloudOctree.prototype.getColorByClass = function(Class){
    switch(Class){
        case "NONE":
            return this.NONE;
            break;
        case "UNKNOWN":
            return this.NONE;
            break;
        case "GROUND":
            return this.NONE;
            break;
        case "BUILDING":
            return this.NONE;
            break;
        case "UTILITYPOLE":
            return this.NONE;
            break;
        case "TRAFFICSIGN":
            return this.NONE;
            break;
        case "TREE":
            return this.NONE;
            break;
        case "STREETLAMP":
            return this.NONE;
            break;
        case "ENCLOSURE":
            return this.NONE;
            break;
        case "CAR":
            return this.NONE;
            break;
        case "ROAD":
            return this.NONE;
            break;
        case "ROADMARKING":
            return this.NONE;
            break;
        case "UNKNOWN_POLE":
            return this.NONE;
            break;
        case "POWERLINE":
            return this.NONE;
            break;
        case "CURB":
            return this.NONE;
            break;
        case "BUSH":
            return this.NONE;
            break;
        case "UNKNOWN_PLANE":
            return this.NONE;
            break;
        default :
            console.log("Error Object Class!");
    }
}

PCDviewer.PointCloudOctree.prototype.getColorByHeight = function(height)
{
    var relevant_val = height - this.minHeight;
    var index = Math.floor(relevant_val/this.sectionLength);
    var maxIndex = this.endPointColors.length - 1;
    var color = new THREE.Vector3();
    if (index >= maxIndex)
    {
        index = this.endPointColors.length - 1;
        color = this.endPointColors[index];
    }
    else if (index < 0) 
    {
        index = 0;
        color = this.endPointColors[index];
    }
    else
    {
        var remainder = relevant_val - this.sectionLength * index;
        var ratio = remainder / this.sectionLength;
        var stColor = this.endPointColors[index];
        var endColor = this.endPointColors[index + 1];
        color.x = (endColor.x - stColor.x) * ratio + stColor.x;
        color.y = (endColor.y - stColor.y) * ratio + stColor.y;
        color.z = (endColor.z - stColor.z) * ratio + stColor.z;
    }
    return color;
}


PCDviewer.PointCloudOctree.prototype.getColorByHeight2 = function(height)
{
    var fixHeight = 50;
    var secHeight = 10;

    var rr = (height - this.minHeight) / fixHeight;
    var relevant_val = (rr - Math.floor(rr)) * fixHeight;

    var index = Math.floor(relevant_val/secHeight);
    var maxIndex = this.endPointColors.length - 1;
    var color = new THREE.Vector3();
    if (index >= maxIndex)
    {
        index = this.endPointColors.length - 1;
        color = this.endPointColors[index];
    }
    else if (index < 0) 
    {
        index = 0;
        color = this.endPointColors[index];
    }
    else
    {
        var remainder = relevant_val - secHeight * index;
        var ratio = remainder / secHeight;
        var stColor = this.endPointColors[index];
        var endColor = this.endPointColors[index + 1];
        color.x = (endColor.x - stColor.x) * ratio + stColor.x;
        color.y = (endColor.y - stColor.y) * ratio + stColor.y;
        color.z = (endColor.z - stColor.z) * ratio + stColor.z;
    }
    return color;
}

PCDviewer.PointCloudOctree.prototype.hideDescendants = function(object){
	var stack = [];
	for(var i = 0; i < object.children.length; i++){
		var child = object.children[i];
		if(child.visible){
			stack.push(child);
		}
	}
	
	while(stack.length > 0){
		var object = stack.shift();
        if(object.loaded)  this.numVisiblePoints -= object.numPoints;//
		object.visible = false;

		for(var i = 0; i < object.children.length; i++){
			var child = object.children[i];
			if(child.visible){
				stack.push(child);
			}
		}
	}
}

PCDviewer.PointCloudOctree.prototype.moveToOrigin = function(){
    this.position.set(0,0,0);
    this.updateMatrixWorld();
    var box = this.boundingBox;
    var transform = this.matrixWorld;
    var tBox = PCDviewer.utils.computeTransformedBoundingBox(box, transform);
    this.position.set(0,0,0).sub(tBox.center());
}

PCDviewer.PointCloudOctree.prototype.moveToGroundPlane = function(){
    this.updateMatrixWorld();
    var box = this.boundingBox;
    var transform = this.matrixWorld;
    var tBox = PCDviewer.utils.computeTransformedBoundingBox(box, transform);
    this.position.y += -tBox.min.y;
}


/**
 *
 * amount: minimum number of points to remove
 */
PCDviewer.PointCloudOctree.disposeLeastRecentlyUsed = function(amount){
	
	
	var freed = 0;
	do{
		var node = this.lru.first.node;
		var parent = node.parent;
		var geometry = node.geometry;
		var pcoGeometry = node.pcoGeometry;
		var proxy = new PCDviewer.PointCloudOctreeProxyNode(pcoGeometry);
	
		var result = PCDviewer.PointCloudOctree.disposeNode(node);
		freed += result.freed;
		
		parent.add(proxy);
		
		if(result.numDeletedNodes == 0){
			break;
		}
	}while(freed < amount);
}

PCDviewer.PointCloudOctree.disposeNode = function(node){
	
	var freed = 0;
	var numDeletedNodes = 0;
	var descendants = [];
	
	node.traverse(function(object){
		descendants.push(object);
	});
	
	for(var i = 0; i < descendants.length; i++){
		var descendant = descendants[i];
		if(descendant instanceof THREE.Points){    //THREE.PointCloud -> THREE.Points
			freed += descendant.pcoGeometry.numPoints;
			descendant.pcoGeometry.dispose();
			descendant.geometry.dispose();
            PCDviewer.PointCloudOctree.lru.remove(descendant);
			numDeletedNodes++;
		}
	}

    PCDviewer.PointCloudOctree.lru.remove(node);
	node.parent.remove(node);
	
	return {
		"freed": freed,
		"numDeletedNodes": numDeletedNodes
	};
}

//  add by sun  20210330
//
PCDviewer.PointCloudOctree.disposeLeastRecentlyUsed2 = function(amount)
{
	var freed = 0;
	do{
		var node = this.lru.first.node;
		freed += node.numPoints;

        node.geometry.dispose();

        this.lru.remove(node);
        node.parent.remove(node);
	}
    while(freed < amount);
}
