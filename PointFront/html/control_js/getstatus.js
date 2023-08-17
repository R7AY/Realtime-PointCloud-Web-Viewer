var laser_prr = 100264;
var lidar_conn_flag = 0;
var lidar_stop_flag = 0;
var lidar_disconn_flag = 0;
var triStatusFlag = 0;

function paramInit() {

	$.getJSON('/tristatus.json', {}, function (data) {
		document.getElementById("u8_input").value = data.tri_s.interval;
		document.getElementById("u9_input").value = data.tri_s.edge;
		document.getElementById("u6_input").value = data.tri_s.width;

		if (data.tri_s.type == 'inner') {
			var trigerlocation_bt = document.getElementById('trigerlocation_bt');
			trigerlocation_bt.innerHTML = '内部触发';
			trigerlocation_bt.value = 'inner';
			trigerlocation_bt.className = 'location_box inner';
		}
		else if (data.tri_s.type == 'extra') {
			var trigerlocation_bt = document.getElementById('trigerlocation_bt');
			trigerlocation_bt.innerHTML = '外部触发';
			trigerlocation_bt.value = 'extra';
			trigerlocation_bt.className = 'location_box extra';
		}

	})

	$.getJSON('/lidar2.json', {}, function (data) {
		document.getElementById("u1_input").value = data.lidar_s.sps_start;
		document.getElementById("u2_input").value = data.lidar_s.sps_stop;
		document.getElementById("u3_input").value = data.lidar_s.return_type;   
		document.getElementById("u4_input").value = data.lidar_s.rpm;
	})

}

var scale_2x_vref = 5.0 / 4096;
function lm20_volts_to_degCel(volts) {
    return -1481.96 + Math.sqrt(2.1962E6 + (1.8639 - volts) / 3.88E-6);
}

var lidarTimer = setInterval(function () {
	$.getJSON('/lidar1.json', {}, function (data) {

//		 var pwr_v = data.lidar_s.hui * 11.0 * scale_2x_vref;	
//		 var lm20_temp = lm20_volts_to_degCel(data.lidar_s.htd * scale_2x_vref);	

		 document.getElementById("hk_t_dev").innerHTML = data.lidar_s.htd.toFixed(2);
		 document.getElementById("hk_u_in").innerHTML = data.lidar_s.hui;

		 document.getElementById("l_sync").innerHTML = data.lidar_s.sync_status;
		 document.getElementById("lidar_return_type").innerHTML = data.lidar_s.return_type; 
	})
}, 1000);

var posTimer = setInterval(function () {
	$.getJSON('/pos.json', {}, function (data) {
		document.getElementById("l_sat_a").innerHTML = data.pos_s.sat_a;
		document.getElementById("l_sat").innerHTML = data.pos_s.sat;
		document.getElementById("l_lon").innerHTML = data.pos_s.lon;
		document.getElementById("l_lat").innerHTML = data.pos_s.lat;
		document.getElementById("l_alt").innerHTML = data.pos_s.alt;
		document.getElementById("rtk").innerHTML = data.pos_s.rtk;
	})
}, 1000);

var statusTimer = setInterval(function () {
	$.getJSON('/status.json', {}, function (data) {
		if (data.status_s.shutdown_s == 'ok') {

			clearInterval(lidarTimer);
			clearInterval(posTimer);
			clearInterval(storeTimer);
			clearInterval(triTimer);
			clearInterval(tristatusTimer);
			clearInterval(machTimer);
			clearInterval(dnsTimer);

			shutdown_status_f();
			lidardisconnect_status_f();
		}
		else {
			if (data.status_s.pos_s == 'open') {
				storeopen_status_f();
			}
			else {
				storeclose_status_f();
			}

			if (data.status_s.l_conn_s == 'ok') {
				lidarconnect_status_f();

				if (data.status_s.lidar_s == 'open') {
					mems_start_status_f();
				}
				else {
					mems_stop_status_f();
				}

				if (data.status_s.l_cmd_s == 'ok') {
					mems_unset_status_f();
				}
				else {
					if (data.status_s.lidar_s == 'open') {
						mems_unset_status_f();
					}
					else {
						mems_set_status_f();
					}
				}

			}
			else {
				lidar_disconn_flag++;
				if (lidar_disconn_flag == 3) {
					lidardisconnect_status_f();
					lidar_disconn_flag = 0;
				}
			}

			if (data.status_s.tri_s == 'open') {
				triopen_status_f();
				triStatusFlag = 1;
			}
			else {
				triStatusFlag = 0;
				triclose_status_f();
			}
		}
	})
}, 1000);

var storeTimer = setInterval(function () {
	$.getJSON('/store.json', {}, function (data) {
		document.getElementById("total_size1").innerHTML = (data.sd_s.total_size / 1024).toFixed(0);
		document.getElementById("used_size1").innerHTML = (data.sd_s.used_size / 1024).toFixed(0);
		document.getElementById("mem_location").innerHTML = data.memlocation;

		if (data.memlocation == 'inner') {
			var storelocation_bt = document.getElementById('storelocation_bt');

			storelocation_bt.innerHTML = '内部存储';
			storelocation_bt.value = 'inner';
			storelocation_bt.className = 'location_box inner';
		}
		else if (data.memlocation == 'extra') {

			var storelocation_bt = document.getElementById('storelocation_bt');
			storelocation_bt.innerHTML = '外部存储';
			storelocation_bt.value = 'extra';
			storelocation_bt.className = 'location_box extra';
		}

	})
}, 1000);

var triTimer = setInterval(function () {
	$.getJSON('/tri.json', {}, function (data) {
		document.getElementById("tri_tx_cnt").innerHTML = data.tri_s.tx_cnt;
	})
}, 1000);

var tristatusTimer = setInterval(function () {
	$.getJSON('/tristatus.json', {}, function (data) {
		if (data.tri_s.type == 'inner') {
			var trigerlocation_bt = document.getElementById('trigerlocation_bt');
			trigerlocation_bt.innerHTML = '内部触发';
			trigerlocation_bt.value = 'inner';
			
			if(triStatusFlag == 0)
			{
				trigerlocation_bt.className = 'location_box inner';
				triinner_status();	
			}

		}
		else if (data.tri_s.type == 'extra') {
			var trigerlocation_bt = document.getElementById('trigerlocation_bt');
			trigerlocation_bt.innerHTML = '外部触发';
			trigerlocation_bt.value = 'extra';
			trigerlocation_bt.className = 'location_box extra';
			
			triextra_status();
		}
	})

}, 1000);

var machTimer = setInterval(function () {
	$.getJSON('/mach.json', {}, function (data) {
		document.getElementById("u5_input").value = data.dev_type;
		document.getElementById("u7_input").value = data.dev_serial;
	})
}, 2000);

var dnsTimer = setInterval(function () {
	$.getJSON('/dns.json', {}, function (data) {
		document.getElementById("dns_status").innerHTML = data.dns_s.dns;
	})
}, 2000);

paramInit();
