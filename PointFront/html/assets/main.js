import * as THREE from "/assets/three.module.js";
import { OrbitControls } from "/assets/OrbitControls.js";
import { PCDLoader } from "/assets/PCDLoader.js";
import Stats from '/assets/Stats.js';
import { GUI } from '/assets/lil-gui.module.min.js';



// 初始化全局变量
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const tik = 5;//间隔10帧取一帧
const gui = new GUI();
const IMU_axesHelper = new THREE.AxesHelper(3);
var IMU_pointsArray = [];
var IMU_pointGeometry;
const loader = new PCDLoader();

const serverURL = '127.0.0.1:3000' //修改为开发板的ip

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
  camera.position.set(0, 0, -12);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  camera.rotation.x = Math.PI / 2;
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
scene.add(IMU_axesHelper);
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
      if (!response.ok) {
        throw new Error('访问不到文件服务');
      }
      return response.json();
    })
    .then(function (data) {

      if (data.length !== 0) {
        var counter = 0;

        data.forEach(function (item) {
          counter++;
          //隔tik次显示一帧
          if (counter === tik) {
            //加载点云
            loader.load('http://127.0.0.1:3000/PCDfiles/' + String(item), function (points) {

              scene.add(points);

              //往IMU数组里存进新的点
              fetch('http://127.0.0.1:3000/IMUfiles/' + String(item).slice(0, -3) + 'txt')
                .then(response => {
                  if (!response.ok) {
                    throw new Error('File not found');
                  }
                  return response.text();
                })
                .then(imuData => {
                  let X = imuData.split(' ')[0];
                  let Y = imuData.split(' ')[1];
                  let Z = imuData.split(' ')[2];
                  IMU_pointsArray.push(new THREE.Vector3(X, Y, Z))
                })
            });
            counter = 0;
          }
        });
      } else {
        console.log("无点云文件");
      }
    })
    .catch(function (error) {
      console.error('Fetch error:', error);
    });

}

intiLoadPoints()

// 启动WebSocket监听服务端文件变化
function wsFileCheck() {
  const socket = new WebSocket('ws://127.0.0.1:3000');
  var count = 0;
  socket.onmessage = event => {

    var PCDFileList = JSON.parse(event.data);
    //获取最新的一帧PCD
    var currentPCD = PCDFileList[PCDFileList.length - 1];
    console.log("文件有变化");

      /*加载最新第tik帧的点云*/
      loader.load('http://127.0.0.1:3000/PCDfiles/' + String(currentPCD), function (points) {
        scene.add(points);
      });
      console.log('加载的最新一帧为'+currentPCD);
      count = 0;

      /*加载最新第tik帧的IMU*/
      fetch('http://127.0.0.1:3000/IMUfiles/' + String(currentPCD).slice(0, -3) + 'txt')
        .then(response => {
          if (!response.ok) {
            throw new Error('File not found');
          }
          return response.text();
        })
        .then(imuData => {

          let X = imuData.split(' ')[0];
          let Y = imuData.split(' ')[1];
          let Z = imuData.split(' ')[2];
          let ROLL = imuData.split(' ')[3];
          let PITCH = imuData.split(' ')[4];
          let YAW = imuData.split(' ')[5];
          let eulerRotation = new THREE.Euler(ROLL, PITCH, YAW);

          IMU_axesHelper.position.set(X, Y, Z);
          IMU_axesHelper.rotation.copy(eulerRotation);

          IMU_pointsArray.push(new THREE.Vector3(X, Y, Z));
          IMU_pointGeometry.setFromPoints(IMU_pointsArray);


        })
        .catch(error => {
          console.error('Error fetching the TXT file:', error);
        });
    }
  };


setTimeout(function () {
  wsFileCheck();
  initDispTrackPoint();
}, 3000); // 1秒后再链接websocket服务器

function update(delta) {

}


function initDispTrackPoint() {

  console.log('初始IMU点数:' + IMU_pointsArray.length);
  IMU_pointGeometry = new THREE.BufferGeometry().setFromPoints(IMU_pointsArray);
  const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const curve = new THREE.Line(IMU_pointGeometry, material);
  scene.add(curve);

}
