# Realtime-PointCloud-Web-Viewer

## 1.配置环境，安装node.js npm pm2
```shell
sudo apt update
sudo apt install -y nodejs npm
```

## 2.解压PointFront与PointServer

## 3.终端分别进入上述两个文件夹
```shell
sudo npm install
```

## 4.配置PointFront中的IP为本机的静态IP

## 5.终端分别进入上述两个文件夹,启动
### PointServer
```shell
cd src
sudo node app.js
```
### PointFront
```shell
sudo node app.js
```