import * as THREE from "/assets/three.module.js";
import { OrbitControls } from "/assets/OrbitControls.js";
import { PCDLoader } from "/assets/PCDLoader.js";
import Stats from '/assets/Stats.js';
import { GUI } from '/assets/lil-gui.module.min.js';



// 初始化全局变量
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const axesHelper = new THREE.AxesHelper(5);
const tik = 10;//间隔10帧取一帧
const gui = new GUI();


const loader = new PCDLoader();
var mixers = [];
let renderer;
let camera;

//性能监测
function initStats() {
  var stats = new Stats();
  stats.setMode(0); // 0: fps, 1: ms
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.getElementById("Stats-output").appendChild(stats.domElement);
  return stats;
}
var stats = initStats();

//创建相机
function createCamera() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1, 10);
}
createCamera();

//创建渲染器
function createRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x7f7f7f);
  //renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);
}
createRenderer();


// 添加相机、控件
scene.add(camera);
scene.add(axesHelper);
const controls = new OrbitControls(camera, renderer.domElement);


// 主渲染动画
function animate() {
  stats.update();
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  update(delta);
  renderer.render(scene, camera);
}
animate();



// 自适应窗口
function handleWindowResize() {
  window.addEventListener(
    "resize",
    () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );
}
handleWindowResize();

// 初次加载点云
function intiLoadPoints() {
  // 首先访问接口获得点云文件列表
  fetch('http://127.0.0.1:3000/api/PCDdata')
    .then(function (response) {
      // 检查响应状态
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(function (data) {
      // 判断是否有pcd再进行加载
      if (data.length !== 0) {

        var counter = 0;
        var pointClouds = [];

        data.forEach(function (item) {
          
          counter++;
          if (counter === 2) {
            loader.load('http://127.0.0.1:3000/PCDfiles/' + String(item), function (points) {
              
        

                      // 获取点云几何数据
              var geometry = points.geometry;

              // 获取点云的位置、颜色和强度属性
              var positions = geometry.attributes.position.array;
              // colors = geometry.attributes.color.array;
              var intensities = geometry.attributes.intensity.array; // 假设强度值存储在名为"intensity"的属性中

              // 创建新的颜色属性根据强度值
              var colorAttribute = new THREE.Float32BufferAttribute(positions.length, 3);
              for (var i = 0; i < positions.length; i += 3) {
                  var intensity = intensities[i / 3];
                  var color = new THREE.Color(); 
                  
                  // 根据强度值设置颜色，这里可以根据你的需求来设置渐变规则
                  color.setHSL(0.5 + intensity * 0.5, 1.0, 0.5); 

                  // 将颜色值写入属性数组
                  colorAttribute.setXYZ(i, color.r, color.g, color.b);
              }

              // 更新几何数据的颜色属性
              geometry.setAttribute('color', colorAttribute);

              // 创建着色器材质
              var material = new THREE.ShaderMaterial({
                  vertexColors: THREE.VertexColors,
                  vertexShader: document.getElementById('vertexshader').textContent,
                  fragmentShader: document.getElementById('fragmentshader').textContent
              });

              // 创建点云对象
              var pointCloud = new THREE.Points(geometry, material);

              // 添加到场景
              scene.add(pointCloud);































            //pointClouds.push(points);
              
            //   if (pointClouds.length === data.length) {
            //     // 合并点云几何数据
            //     var mergedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(pointClouds.map(pc => pc.geometry));
    
            //     // 创建点云材质
            //     var material = new THREE.PointsMaterial({
            //         color: 0xffffff,
            //         size: 0.1 // 设置点的大小
            //     });
    
            //     // 创建合并后的点云对象
            //     var mergedPointCloud = new THREE.Points(mergedGeometry, material);
    
            //     // 添加到场景
            //     scene.add(mergedPointCloud);
            // }
            




              // points.geometry.center();
              // points.geometry.rotateX( Math.PI );
              // points.name = '1.pcd';
              // scene.add(points);

            });
          counter = 0; // 重置计数器
        }



        });

      } else {
        console.log("无点云文件");
      }
      console.log(data);
    })
    .catch(function (error) {
      // 处理错误情况
      console.error('Fetch error:', error);
    });

}

intiLoadPoints()


// 启动WebSocket监听服务端文件变化
function wsFileCheck(){
  const socket = new WebSocket('ws://127.0.0.1:3000');

  socket.onmessage = event => {
    var fileList = JSON.parse(event.data);
    console.log('kksk');
    // fileList.forEach(filePath => {
      
    //   console.log(filePath);
   
    // });
  };
}


wsFileCheck()



























// loader.load('http://127.0.0.1:3000/PCDfiles/1.pcd', function (points) {

//   points.geometry.center();
//   //points.geometry.rotateX( Math.PI );
//   points.name = '1.pcd';
//   scene.add(points);

//   //

//   const gui = new GUI();

//   gui.add(points.material, 'size', 0.1, 0.8).onChange(renderer);
//   gui.addColor(points.material, 'color').onChange(renderer);
//   gui.open();
//   renderer.render(scene, camera);

// });


























function update(delta) {

  // loader.load(
  //   // resource URL
  //   "http://127.0.0.1:3000/PCDfiles/1.pcd",
  //   // called when the resource is loaded
  //   function (points) {
  //     scene.add(points);
  //     // judge=true;
  //   },
  //   // called when loading has errors
  //   function (error) {
  //     console.log("An error happened");
  //     // i--;
  //     // console.info(i);
  //   }
  // );




  // for (const mixer of mixer02s) {
  //   mixer.update(delta);
  // }

  // if (jump) {
  //   jump = false;

  //   // Start jumpping only when T-rex is on the ground.
  //   if (trex.position.y == 0) {
  //     vel = TREX_JUMP_SPEED;
  //     trex.position.y = vel * delta;
  //   }
  // }


  // for (const cactus of cactusGroup.children) {
  //   cactus.position.x += FLOOR_SPEED * delta;
  // }

  // // Remove out-of-the-screen cacti.
  // while (
  //   cactusGroup.children.length > 0 &&
  //   cactusGroup.children[0].position.x < CACTUS_DESTROY_X // out of the screen
  // ) {
  //   cactusGroup.remove(cactusGroup.children[0]);
  // }

  // // Check collision.
  // const trexAABB = new THREE.Box3(
  //   new THREE.Vector3(-1, trex.position.y, 0),
  //   new THREE.Vector3(1, trex.position.y + 2, 0)
  // );


}







