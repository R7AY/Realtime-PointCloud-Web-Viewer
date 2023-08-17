

/**
 * @class Loads mno files and returns a PointcloudOctree
 * for a description of the mno binary file format, read mnoFileFormat.txt
 * 
 * @author Markus Schuetz
 */
function POCLoader(){
	
}
 
/**
 * @return a point cloud octree with the root node data loaded. 
 * loading of descendants happens asynchronously when they're needed
 * 
 * @param url
 * @param loadingFinishedListener executed after loading the binary has been finished
 */
POCLoader.load = function load(url) {
		var pco = new PCDviewer.PointCloudOctreeGeometry();
        pco.url = url;
		var pco_url = url + "/proj.qtx";
        try{
            //load pointcloud octree metadata
            var pco_xhr = new XMLHttpRequest();
            pco_xhr.open('GET', pco_url, false);
            pco_xhr.send(null);

//            pco_xhr.onreadystatechange = function () 
            {
                if(pco_xhr.status === 200 || pco_xhr.status === 0)
                {
                    var fMno = JSON.parse(pco_xhr.responseText);
                    pco.cache_folder = fMno.cache_folder;
                    //pco.depth =fMno.depth;
                    //pco.has_pano =fMno.has_pano;
                    //pco.has_traj =fMno.has_traj;
                    pco.maxIntensity =fMno.maxIntensity;
                    pco.minIntensity =fMno.minIntensity;
                    //pco.maxdepth =fMno.maxdepth;
                    pco.maxx =fMno.maxx;
                    pco.maxy =fMno.maxy;
                    pco.maxz =fMno.maxz;
                    pco.minx =fMno.minx;
                    pco.miny =fMno.miny;
                    pco.minz =fMno.minz;
                    pco.center = new THREE.Vector3(Math.floor((pco.minx + pco.maxx)/2),Math.floor((pco.miny + pco.maxy)/2),Math.floor((pco.minz + pco.maxz)/2));
                    pco.maxx -= pco.center.x;
                    pco.maxy  -= pco.center.y;
                    pco.maxz -= pco.center.z;
                    pco.minx -= pco.center.x;
                    pco.miny  -= pco.center.y;
                    pco.minz  -= pco.center.z;
    
                    pco.pointFormat =fMno.pointFormat;
                    pco.statisticalMaxz =fMno.statisticalMaxz;
                    pco.statisticalMinz =fMno.statisticalMinz;
                    //pco.wholePointNum =fMno.wholePointNum;
                    pco.lod = fMno.maxdepth;
                    pco.numpts = fMno.wholePointNum;

                    var nodes = {};

                    {//load root
                        var name = "0";
                        var min = new THREE.Vector3(pco.minx, pco.miny, pco.minz);
                        var max = new THREE.Vector3(pco.maxx, pco.maxy, pco.maxz);
                        var boundingBox = new THREE.Box3(min,max);
                        pco.boundingBox = boundingBox;

                        var root = new PCDviewer.PointCloudOctreeGeometryNode(name, pco, boundingBox);
                        root.name = name;
                        root.level = 0;
                        root.numPoints = 0;
                        pco.root = root;
                        /*root.numPoints = */pco.root.load(url + "/" + pco.cache_folder);
                        pco.boundingBox = pco.root.boundingBox; //!!!!!!
                        nodes[name] = root;
                    }

                    //load octree nodes
                    POCLoader.loadremainingnodes(nodes,url + "/" + pco.cache_folder,pco);
                }
            }

        }catch(e){
            console.log("loading failed: '" + pco_url + "'");
            console.log(e);
        }

        return pco;
};

POCLoader.loadremainingnodes = function(node,url,pco){
    var qtxb_url = url + "/0_list.txt"/*"/-1.qtxb"*/;
    var FileList = [];
    try{
        var qtxb_xhr = new XMLHttpRequest();
        qtxb_xhr.open('GET', qtxb_url, false);
        qtxb_xhr.send(null);

 //       qtxb_xhr.onreadystatechange = function(){
        if(qtxb_xhr.status === 200 || qtxb_xhr.status === 0)
        {
            var data = qtxb_xhr.responseText;
            var pattern = /\d+(?=\.lasdb)/g;
            //var result = pattern.exec( data);
            var result =data.match(pattern);
            var qtxb_Text = "";
            if ( result !== null ) {
                FileList = result;
            }
            for(var i = 1;i < FileList.length;i++){
                var name = FileList[i];
                //if(PCDviewer.utils.pathExists(url + "/" + name + ".lasdb")){
                    var index =  parseInt(name.charAt(name.length-1));
                    var parentName = name.substring(0,name.length-1);
                    var parentNode = node[parentName];
                    var boundingbox = POCLoader.createChildBoundingBox(parentNode.boundingBox,index);

                    var childNode = new PCDviewer.PointCloudOctreeGeometryNode(name, pco, boundingbox);
                    childNode.name  = name;
                    childNode.level = name.length - 1;
                    childNode.numPoints = 0;
                    parentNode.addChild(childNode);
                    node[name] = childNode;
                //}
            }
        }
        //return node;
    }
    catch(e){
        console.log("Failed to load:'" + qtxb_url + "'");
        //return ;
    }
};

POCLoader.loadPointAttributes = function(mno){

	var fpa = mno.pointAttributes;
	var pa = new PointAttributes();

	for(var i = 0; i < fpa.length; i++){
		var pointAttribute = PointAttribute[fpa[i]];
		pa.add(pointAttribute);
	}

	return pa;
};

POCLoader.createChildBoundingBox = function(boundingbox,index){
    var min,max;
    var center = new THREE.Vector3((boundingbox.min.x + boundingbox.max.x)/2,(boundingbox.min.y + boundingbox.max.y)/2,(boundingbox.min.z + boundingbox.max.z)/2);
    if(index == 0){
        min = new THREE.Vector3(boundingbox.min.x, boundingbox.min.y, boundingbox.min.z);
        max = new THREE.Vector3(center.x, center.y, center.z);
    }
    else if(index == 1){
        min = new THREE.Vector3(center.x, boundingbox.min.y, boundingbox.min.z);
        max = new THREE.Vector3(boundingbox.max.x, center.y, center.z);
    }
    else if(index == 2){
        min = new THREE.Vector3(center.x, center.y, boundingbox.min.z);
        max = new THREE.Vector3(boundingbox.max.x, boundingbox.max.y, center.z);
    }
    else if(index == 3){
        min = new THREE.Vector3(boundingbox.min.x, center.y, boundingbox.min.z);
        max = new THREE.Vector3(center.x, boundingbox.max.y, center.z);
    }
    else if(index == 4){
        min = new THREE.Vector3(boundingbox.min.x, boundingbox.min.y, center.z);
        max = new THREE.Vector3(center.x, center.y, boundingbox.max.z);
    }
    else if(index == 5){
        min = new THREE.Vector3(center.x, boundingbox.min.y, center.z);
        max = new THREE.Vector3(boundingbox.max.x, center.y, boundingbox.max.z);
    }
    else if(index == 6){
        min = new THREE.Vector3(center.x, center.y, center.z);
        max = new THREE.Vector3(boundingbox.max.x, boundingbox.max.y, boundingbox.max.z);
    }
    else if(index == 7){
        min = new THREE.Vector3(boundingbox.min.x, center.y, center.z);
        max = new THREE.Vector3(center.x, boundingbox.max.y, boundingbox.max.z);
    }
    return new THREE.Box3(min,max);
};