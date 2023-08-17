
//设置cookie
function setCookie (name, value){ 
    var expdate = new Date();  
    expdate.setTime(expdate.getTime() + 10 * 60 * 1000); 
    document.cookie = name+"="+value+";expires="+expdate.toGMTString()+";path=/";
 
    //即document.cookie= name+"="+value+";path=/";  时间默认为当前会话可以不要，但路径要填写，因为JS的默认路径是当前页，如果不填，此cookie只在当前页面生效！
}

var login_btn = document.getElementById('login_btn');
login_btn.addEventListener('click', function() {

    var user_name = document.getElementById('login_user');
    var passwd = document.getElementById('login_passwd');   

    $.post('/cgi-bin/login.cgi', { user: user_name.value, passwd: passwd.value}, function (response) {
        console.log(response);

        if(response == 'OK')
        {
            setCookie("passwd",passwd.value);
            window.location.href="/html/control.html";  
        }
        else
        {
            // alert('用户名或密码输入错误！');
            var user = user_name.value;
            var passw = passwd.value
            alert(user + " " + passw);
        }

    });

});  

var change_btn1  = document.getElementById('change_btn1');
change_btn1.addEventListener('click', function() {
    window.location.href="/html/changepasswd.html";
});

