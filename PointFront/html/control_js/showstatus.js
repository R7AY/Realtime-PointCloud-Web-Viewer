var trigExtraFlag = 0;

//全局变量
function storeopen_status_f() {
	var e1 = document.getElementById("b1");
	e1.style.background = "#CCC";
	e1.setAttribute("disabled", true);

	var e2 = document.getElementById("b2");
	e2.style.background = "#0F6";
	e2.removeAttribute("disabled");

	return 0;
}

function storeclose_status_f() {
	var e1 = document.getElementById("b1");
	e1.style.background = "#0F6";
	e1.removeAttribute("disabled");

	var e2 = document.getElementById("b2");
	e2.style.background = "#CCC";
	e2.setAttribute("disabled", true);

	return 0;
}

function mems_set_status_f() {
	var e3 = document.getElementById("b9");
	e3.style.background = "#0FC";
	e3.removeAttribute("disabled");

	var e4 = document.getElementById("b10");
	e4.style.background = "#0FC";
	e4.removeAttribute("disabled");

	var e5 = document.getElementById("b11");
	e5.style.background = "#0FC";
	e5.removeAttribute("disabled");

	var e6 = document.getElementById("b7");
	e6.style.background = "#0FC";
	e6.removeAttribute("disabled");

	var e7 = document.getElementById("b8");
	e7.style.background = "#0FC";
	e7.removeAttribute("disabled");

	var e8 = document.getElementById("u1_input");
	e8.removeAttribute("readonly");

	var e9 = document.getElementById("u2_input");
	e9.removeAttribute("readonly");

	var e10 = document.getElementById("u3_input");
	e10.removeAttribute("readonly");

	var e11 = document.getElementById("b14");
	e11.style.background = "#0FC";
	e11.removeAttribute("disabled");

}

function mems_unset_status_f() {
	var e3 = document.getElementById("b9");
	e3.style.background = "#CCC";
	e3.setAttribute("disabled", true);

	var e4 = document.getElementById("b10");
	e4.style.background = "#CCC";
	e4.setAttribute("disabled", true);

	var e5 = document.getElementById("b11");
	e5.style.background = "#CCC";
	e5.setAttribute("disabled", true);

	var e6 = document.getElementById("b7");
	e6.style.background = "#CCC";
	e6.setAttribute("disabled", true);

	var e7 = document.getElementById("b8");
	e7.style.background = "#CCC";
	e7.setAttribute("disabled", true);

	var e8 = document.getElementById("u1_input");
	e8.setAttribute("readonly", true);

	var e9 = document.getElementById("u2_input");
	e9.setAttribute("readonly", true);

	var e10 = document.getElementById("u3_input");
	e10.setAttribute("readonly", true);

	var e11 = document.getElementById("b14");
	e11.style.background = "#CCC";
	e11.setAttribute("disabled", true);

	return 0;
}

function mems_start_status_f() {
	var e1 = document.getElementById("b3");
	e1.style.background = "#CCC";
	e1.setAttribute("disabled", true);

	var e2 = document.getElementById("b4");
	e2.style.background = "#0F6";
	e2.removeAttribute("disabled");

	var e3 = document.getElementById("b8");
	e3.style.background = "#CCC";
	e3.setAttribute("disabled", true);

	return 0;
}

function mems_stop_status_f() {
	var e1 = document.getElementById("b3");
	e1.style.background = "#0F6";
	e1.removeAttribute("disabled");

	var e2 = document.getElementById("b4");
	e2.style.background = "#CCC";
	e2.setAttribute("disabled", true);

	var e3 = document.getElementById("b8");
	e3.style.background = "#0FC";
	e3.removeAttribute("disabled");

	return 0;
}

function triopen_status_f() {

	if(trigExtraFlag == 1)
		return 0;

	var e1 = document.getElementById("b5");
	e1.style.background = "#CCC";
	e1.setAttribute("disabled", true);

	var e2 = document.getElementById("b6");
	e2.style.background = "#0F6";
	e2.removeAttribute("disabled");

	var e3 = document.getElementById("u9_input");
	e3.setAttribute("readonly", true);

	var e4 = document.getElementById("u6_input");
	e4.setAttribute("readonly", true);

	var e5 = document.getElementById("u8_input");
	e5.setAttribute("readonly", true);

	var e6 = document.getElementById("b12");
	e6.style.background = "#CCC";
	e6.setAttribute("disabled", true);

	var e7 = document.getElementById("b13");
	e7.style.background = "#0FC";
	e7.removeAttribute("disabled");

	var e8 = document.getElementById("trigerlocation_bt");
	e8.className = 'location_box disable';
	e8.setAttribute("disabled", true);

	return 0;
}

function triclose_status_f() {

	if(trigExtraFlag == 1)
		return 0;

	var e1 = document.getElementById("b5");
	e1.style.background = "#0F6";
	e1.removeAttribute("disabled");

	var e2 = document.getElementById("b6");
	e2.style.background = "#CCC";
	e2.setAttribute("disabled", true);

	var e3 = document.getElementById("u9_input");
	e3.removeAttribute("readonly");

	var e4 = document.getElementById("u6_input");
	e4.removeAttribute("readonly");

	var e5 = document.getElementById("u8_input");
	e5.removeAttribute("readonly");

	var e6 = document.getElementById("b12");
	e6.style.background = "#0FC";
	e6.removeAttribute("disabled");

	var e7 = document.getElementById("b13");
	e7.style.background = "#0FC";
	e7.removeAttribute("disabled");

	var e8 = document.getElementById("trigerlocation_bt");
	e8.className = 'location_box inner';
	e8.removeAttribute("disabled");

	return 0;
}

function lidarconnect_status_f() {
	if (lidar_conn_flag == 1) {
		var e1 = document.getElementById("b3");
		e1.style.background = "#0F6";
		e1.removeAttribute("disabled");

		lidar_conn_flag = 0;

		mems_set_status_f();
	}

	return 0;
}

function lidardisconnect_status_f() {
	lidar_conn_flag = 1;

	var e1 = document.getElementById("b3");
	e1.style.background = "#CCC";
	e1.setAttribute("disabled", true);

	var e2 = document.getElementById("b4");
	e2.style.background = "#CCC";
	e2.setAttribute("disabled", true);

	mems_unset_status_f();

	return 0;

}

function shutdown_status_f() {
	var e1 = document.getElementById("b1");
	e1.style.background = "#CCC";
	e1.setAttribute("disabled", true);

	var e2 = document.getElementById("b2");
	e2.style.background = "#CCC";
	e2.setAttribute("disabled", true);

	var e3 = document.getElementById("b5");
	e3.style.background = "#CCC";
	e3.setAttribute("disabled", true);

	var e4 = document.getElementById("b6");
	e4.style.background = "#CCC";
	e4.setAttribute("disabled", true);

	var e5 = document.getElementById("b12");
	e5.style.background = "#CCC";
	e5.setAttribute("disabled", true);

	var e6 = document.getElementById("b13");
	e6.style.background = "#CCC";
	e6.setAttribute("disabled", true);

	var e7 = document.getElementById("trigerlocation_bt");
	e7.style.background = "#CCC";
	e7.setAttribute("disabled", true);

	var e8 = document.getElementById("storelocation_bt");
	e8.style.background = "#CCC";
	e8.setAttribute("disabled", true);

	return 0;
}

function triinner_status() {
	
	trigExtraFlag = 0;

	return 0;
}

function triextra_status() {

	trigExtraFlag = 1;

	var e1 = document.getElementById("b5");
	e1.style.background = "#CCC";
	e1.setAttribute("disabled", true);

	var e2 = document.getElementById("b6");
	e2.style.background = "#CCC";
	e2.setAttribute("disabled", true);

	var e3 = document.getElementById("u9_input");
	e3.setAttribute("readonly", true);

	var e4 = document.getElementById("u6_input");
	e4.setAttribute("readonly", true);

	var e5 = document.getElementById("u8_input");
	e5.setAttribute("readonly", true);

	var e6 = document.getElementById("b12");
	e6.style.background = "#CCC";
	e6.setAttribute("disabled", true);

	var e7 = document.getElementById("b13");
	e7.style.background = "#CCC";
	e7.setAttribute("disabled", true);

	return 0;
}

