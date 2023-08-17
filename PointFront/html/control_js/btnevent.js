//获取当前时间
function get_time() {
    var date = new Date();
    var y = date.getFullYear(),

        m = date.getMonth() + 1,
        d = date.getDate(),
        h = date.getHours(),
        min = date.getMinutes(),
        s = date.getSeconds();

    m < 10 ? m = "0" + m : m;
    d < 10 ? d = "0" + d : d;
    h < 10 ? h = "0" + h : h;
    min < 10 ? min = "0" + min : min;
    s < 10 ? s = "0" + s : s;
    var time = y + m.toString() + d.toString() + h.toString() + min.toString() + s.toString();

    return time;
}

//pos开始存储
$('#b1').on('click', function () {
    var time = get_time();

    $.post('/cgi-bin/cmd.cgi', { cmd: 'storeopen', arg1: time }, function (response) {
        console.log(response);
    });

})

//pos关闭存储
$('#b2').on('click', function () {
    var result = confirm("Pos Stop!");
    if (result == true) {
        $.post('/cgi-bin/cmd.cgi', { cmd: 'storeclose' }, function (response) {
            console.log(response);
        });
    }
})

//lidar开始存储
$('#b3').on('click', function () {
    var time = get_time();
    $.post('/cgi-bin/cmd.cgi', { cmd: 'lidarstoreopen', arg1: time }, function (response) {
        console.log(response);
    });
})

//lidar关闭存储
$('#b4').on('click', function () {
        $.post('/cgi-bin/cmd.cgi', { cmd: 'lidarstoreclose' }, function (response) {
            console.log(response);
        });
})

//开始拍照
$('#b5').on('click', function () {

    var form;
    var myselect;
    var index;
    var triedge_value;

    myselect = document.getElementById('u9_input');
    index = myselect.selectedIndex;
    triedge_value = myselect.options[index].value;

    var width = document.getElementById('u6_input').value;
    var interval = document.getElementById('u8_input').value;

    $.post('/cgi-bin/cmd.cgi', { cmd: 'triset', arg1: 'timer', arg2: triedge_value, arg3: width, arg4: interval }, function (response) {
        console.log(response);
    });
})

//停止拍照
$('#b6').on('click', function () {

    $.post('/cgi-bin/cmd.cgi', { cmd: 'triset', arg1: 'close' }, function (response) {
        console.log(response);
    });
})

//刷新激光参数
$('#b7').on('click', function () {
    $.getJSON('/lidar2.json', {}, function (data) {
         document.getElementById("u1_input").value = data.lidar_s.sps_start;
         document.getElementById("u2_input").value = data.lidar_s.sps_stop;
         document.getElementById("u3_input").value = data.lidar_s.return_type;   
         document.getElementById("u4_input").value = data.lidar_s.rpm;    
    })
})

//设置激光参数
$('#b8').on('click', function () {

    var a = 0, b = 360, c = 100, d = 50;

    a = document.getElementById('u1_input').value;
    b = document.getElementById('u2_input').value;
    c = document.getElementById('u3_input').value;
    d = document.getElementById('u4_input').value;

    $.post('/cgi-bin/cmd.cgi', { cmd: 'lidarcmd', arg1: 'set_range', arg2: a, arg3: b}, function (response) {
        console.log(response);
    });

    $.post('/cgi-bin/cmd.cgi', { cmd: 'lidarcmd', arg1: 'set_return_mode', arg2: c}, function (response) {
        console.log(response);
    });

    $.post('/cgi-bin/cmd.cgi', { cmd: 'lidarcmd', arg1: 'set_spinspeed', arg2: d}, function (response) {
        console.log(response);
    });

})

//关机
$('#b9').on('click', function () {
    $.post('/cgi-bin/cmd.cgi', { cmd: 'shutdown' }, function (response) {
        console.log(response);
    });
})

//激光重启
$('#b10').on('click', function () {
    $.post('/cgi-bin/cmd.cgi', { cmd: 'reboot' }, function (response) {
        console.log(response);
    });
})

//激光清错
$('#b11').on('click', function () {
    $.post('/cgi-bin/cmd.cgi', { cmd: 'errclean' }, function (response) {
        console.log(response);
    });
})

//刷新拍照信息
$('#b12').on('click', function () {
    $.getJSON('/tristatus.json', {}, function (data) {
        document.getElementById("u8_input").value = data.tri_s.interval;
        document.getElementById("u9_input").value = data.tri_s.edge;
        document.getElementById("u6_input").value = data.tri_s.width;
    })
})

//触发一次曝光
$('#b13').on('click', function () {
    $.post('/cgi-bin/cmd.cgi', { cmd: 'trionce' }, function (response) {
        console.log(response);
    });
})

//lidar保存配置参数
$('#b14').on('click', function () {
    alert("save user parameter!");
    $.post('/cgi-bin/cmd.cgi', { cmd: 'lidarcmd', arg1: 'saveconfig' }, function (response) {
        console.log(response);
    });
})

//触发方式设置
var trigerlocation_bt = document.getElementById('trigerlocation_bt');

trigerlocation_bt.addEventListener('click', function () {

    if (trigerlocation_bt.value == 'inner') {
        $.post('/cgi-bin/cmd.cgi', { cmd: 'camtype', arg1: 'extra' }, function (response) {
            console.log(response);
        });
    }
    else if (trigerlocation_bt.value == 'extra') {
        $.post('/cgi-bin/cmd.cgi', { cmd: 'camtype', arg1: 'inner' }, function (response) {
            console.log(response);
        });
    }

});

//存储位置设置
var storelocation_bt = document.getElementById('storelocation_bt');
storelocation_bt.addEventListener('click', function () {

    if (storelocation_bt.value == 'inner') {
        $.post('/cgi-bin/cmd.cgi', { cmd: 'memlocation', arg1: 'extra' }, function (response) {
            console.log(response);
        });
    }
    else if (storelocation_bt.value == 'extra') {
        $.post('/cgi-bin/cmd.cgi', { cmd: 'memlocation', arg1: 'inner' }, function (response) {
            console.log(response);
        });  
    }

});
