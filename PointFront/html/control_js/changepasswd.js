
var change_btn2  = document.getElementById('change_btn2');
change_btn2.addEventListener('click', function() {
    var login_user1 = document.getElementById('login_user1');
    var pass_old = document.getElementById('pass_old');
    var pass_new = document.getElementById('pass_new');
    var pass_new2 = document.getElementById('pass_new2');

    if(pass_new.value !== pass_new2.value)
    {
        alert('输入的新密码不一致！');
    }
    else
    {
        if(pass_new.value.length <= 3)
        {
            alert('请输入大于3位的密码！');
        }
        else
        {
            $.post('/cgi-bin/passwd.cgi', { user: login_user1.value, pass_old: pass_old.value, pass_new:pass_new.value}, function (response) {
                console.log(response);

                if(response == 'OK')
                {
                    document.getElementById('login_user1').value = '';
                    document.getElementById('pass_old').value = '';
                    document.getElementById('pass_new').value = '';
                    document.getElementById('pass_new2').value = '';   
                
                    alert('修改成功');
                }
                else
                {
                    alert('用户名或密码验证错误！');
                }

            });
        }
    }
});

var return_btn = document.getElementById('return_btn');
return_btn.addEventListener('click', function() {

    document.getElementById('login_user1').value = '';
    document.getElementById('pass_old').value = '';
    document.getElementById('pass_new').value = '';
    document.getElementById('pass_new2').value = ''; 

    window.location.href="/html/login.html";

});
