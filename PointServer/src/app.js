/*
  Project Name: PointServer
  File Name: main.js
  Author: Poi
  Creation Date: 2023-08-10
  Copyright Notice: MIT License
*/

/*本地点云文件监测服务:
  1.前端主动轮询接口
  2.当有文件更新时，通过websocket主动通知前端。
*/

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const cors = require('cors')
const morgan = require('morgan');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const folderPath = '../PointCloudFiles/'; // 更换为实际的PCD生成路径
const IMUFilePath = '../IMUFiles/';// 更换为实际的IMU生成路径

// 注册中间件解决跨域和日志
app.use(cors())
app.use(morgan('combined'));

// 设置静态文件夹路径，使其可被前端访问
app.use('/PCDfiles', express.static(path.join(__dirname, folderPath)));
app.use('/IMUfiles', express.static(path.join(__dirname, IMUFilePath)));

// HTTP测试接口，确保后端服务启动了
app.get('/api/test', (req, res) => {

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('PointServer is Online!');
      return;
  
});

// HTTP接口,主动轮询接口，返回文件名
app.get('/api/PCDdata', (req, res) => {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading folder');
      return;
    }
      // 对文件进行排序
      const sortedFiles = files.sort((a, b) => {
          return parseInt(a) - parseInt(b);
        });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sortedFiles));
  });
});

// WebSocket接口，服务端给前端主动发送更新后的文件列表
wss.on('connection', ws => {
  console.log('Client connected');

  updateFilePathList(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// 在顶部声明一个变量用于计数文件新增的变化次数
let fileAdditionCount = 0;

// 在 fs.watch 事件监听函数中增加判断
fs.watch(folderPath, (eventType, filename) => {
  if (eventType === 'rename' && filename) { // 确保 filename 存在
    const filePath = path.join(folderPath, filename);

    // 检查文件是否存在，再进行计数，否则后面会导致 fs.statSync 报错
    if (fs.existsSync(filePath)) {
      fileAdditionCount++; // 增加文件新增计数
      if (fileAdditionCount >= 10) {
        updateFilePathListForAllClients();
        fileAdditionCount = 0; // 重置文件新增计数
      }
    }
  }
});

// 给所有连接的客户端更新文件列表
function updateFilePathListForAllClients() {
  wss.clients.forEach(client => {
    updateFilePathList(client);
  });
}

// 文件列表更新函数
function updateFilePathList(ws) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading folder:', err);
      return;
    }

    // 仅保留文件，过滤掉子文件夹
    const fileNames = files.filter(file => fs.statSync(path.join(folderPath, file)).isFile());

    // 按照数字大小对文件名进行排序
    const sortedFileNames = fileNames.sort((a, b) => {
      return parseInt(a) - parseInt(b);
    });

    // 生成文件路径列表
    const filePathList = sortedFileNames.map(fileName => path.join(folderPath, fileName));

    // 发送路径列表给前端
    ws.send(JSON.stringify(sortedFileNames));
  });
}


server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});