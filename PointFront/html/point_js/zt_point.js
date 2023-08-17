
var defaultPointSize = 0.3;
var defaultLOD = 1.5;
var pointcloudPath = "lasresult2";/*https://localhost/PCDviewer3*/

var renderer;
var camera;
var cube;
var scene;
var pointCloud;
var cameraCube, sceneCube;
var stats;
var pointcloudMaterial;
var pVisiblePoints;
var ws;

window.onresize = function()
{
	renderer.setSize(window.innerWidth,window.innerHeight);
	k = window.innerWidth/window.innerHeight;

	s = 500;
	camera.left = -s*k;
	camera.right = s*k;
	camera.top = s;
	camera.bottom = -s;

	camera.updateProjectionMatrix ();
};

function loadSkybox()
{
	cameraCube = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 100000 );
	sceneCube = new THREE.Scene();

	var skybox_dir = "/skybox/";
	var urls = [
		 skybox_dir + 'px.jpg' ,skybox_dir + 'nx.jpg',
		 skybox_dir + 'py.jpg' ,skybox_dir + 'ny.jpg',
		 skybox_dir + 'pz.jpg' ,skybox_dir + 'nz.jpg'
	];
	
	var textureCube = THREE.ImageUtils.loadTextureCube( urls);

	var shader = THREE.ShaderLib[ "cube" ];
	shader.uniforms[ "tCube" ].value = textureCube;

	var material = new THREE.ShaderMaterial( {

		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		depthWrite: false,
		side: THREE.BackSide

	});

	mesh = new THREE.Mesh( new THREE.BoxGeometry( 100, 100, 100 ), material );
	sceneCube.add( mesh );
}

function initGUI(){
	var gui = new dat.GUI({
		height : 6 * 32 - 1
	});

	var params = {
		PointSize: defaultPointSize,
		LOD: defaultLOD,
		ViewMode:"color_Specified",
		PointCount: "0"
	};
	
	var pLOD = gui.add(params, 'LOD', 0.5,20);
	pLOD.onChange(function(value){
		pointCloud.LOD = value;
	});
	
	var pPointSize = gui.add(params, 'PointSize', 0.05, 1);
	pPointSize.onChange(function(value){
		pointcloudMaterial.size = value;
	});

	var pViewMode = gui.add(params,'ViewMode',["color_Texture","color_Intensity","color_Class","color_Height","color_Specified"]);
	pViewMode.onChange(function(value){
		pointCloud.ViewMode = value;
	});

	pVisiblePoints = gui.add(params, 'PointCount', pointCloud.numVisiblePoints.toString(4));
}

function initThree(){
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.margin = '5px';

	scene = new THREE.Scene();
//			camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100000);
	camera = new THREE.OrthographicCamera(-window.innerWidth/8, window.innerWidth/8, window.innerHeight/8, -window.innerHeight/8, 1, 10000 );

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);
//			document.body.appendChild( stats.domElement );
	
	loadSkybox();

	// camera and controls
	camera.position.z = 0;
	camera.position.y = 100;
	camera.position.x = 0;
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	//controls.zoomSpeed = 1;
	controls.rotateSpeed = 1;
	controls.panSpeed = 8;
	controls.target.set( 0, 20, 0 );
	camera.lookAt(controls.target);
	
	pointcloudMaterial = new THREE.PointsMaterial( { size: defaultPointSize, vertexColors: true } );
	
	// load pointcloud
	pointCloud = new PCDviewer.PointCloudOctree(new PCDviewer.PointCloudOctreeGeometry(), pointcloudMaterial, controls);
	pointCloud.LOD = defaultLOD;
	pointCloud.rotation.set(-Math.PI/2,0,0);
	scene.add(pointCloud);

	var axisHelper = new THREE.AxisHelper( 50 );
	scene.add( axisHelper );

}

/*
// add by sun
//		
function initSocket()
{
	var url_buf;
	url_buf = 'ws://' + window.location.host + '/wsapp/';
	ws = new Socket({
//				url: 'ws://192.168.0.30:8089',	// 	��ַ
		url: url_buf,
		name: 'ZhengTu',			//	name
		isHeart:false,				// 
		isReconnection:true,		// 	
		received: function(data)	// 	
		{
//					pointCloud.loadCloudFromBuffer(camera, data);
		}
	});

	ws.connect("connect");
};
*/

function render() 
{	
	requestAnimationFrame(render);
	// render skybox
	cameraCube.rotation.copy( camera.rotation );
	renderer.render( sceneCube, cameraCube );
	
	renderer.render(scene, camera);
	// pointCloud.update2( camera );
	stats.update();
//			controls.update(0.1);

	pVisiblePoints.setValue( PCDviewer.PointCloudOctree.lru.numPoints );
}

/*******************************hkd**************************************/

// setInterval(function(){
// $.get('/cgi-bin/point.cgi', {}, function(response){
// console.log(response);

// var data = atob(response);

// int8arr = new Int8Array(data.length);
// arrbuf = new ArrayBuffer(data.length);

// for(var i = 0; i < data.length; i++)
// {
// 	int8arr[i] = data.charCodeAt(i); 
// }

// arrbuf = int8arr.buffer;
// pointCloud.loadCloudFromBuffer(camera, arrbuf);	

// }, );

// }, 50);


initThree();
initGUI();
//initSocket();
render();


