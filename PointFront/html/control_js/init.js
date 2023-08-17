
//取出cookie
function getCookie(c_name){
    if (document.cookie.length>0){
        c_start=document.cookie.indexOf(c_name + "=");
        if (c_start!=-1){
            c_start=c_start + c_name.length+1;
            c_end=document.cookie.indexOf(";",c_start);
            if (c_end==-1)
                c_end=document.cookie.length;
            return unescape(document.cookie.substring(c_start,c_end));
        }
      }
    return "";
}

function loginInit()
{
    var passwd = getCookie("passwd");
    if(passwd.length == 0)
    {
        console.log(1);
        // window.location.href="/html/login.html";
        window.location.href="/html/pointcloud.html";
        // window.location.href="/html/point.html";
    }
    else
    {
        console.log(2);
        // window.location.href="/html/control.html";
        window.location.href="/html/pointcloud.html";
        // window.location.href="/html/point.html";
    }
}

loginInit();
