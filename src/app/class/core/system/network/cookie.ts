//import { getCookie,setCookie } from './cookie';

/*
   2022/05/28 Y.Takayama 追加。
*/

// =============================================
/**
* 保存されているクッキーの値を取得します
* @param {string} name クッキー名
* @return {string} クッキーの値
*/
export function getCookie(name:string): string{
    let strValue;
    const strCookiename = encodeURIComponent(name);
    
    let cookies = document.cookie.split(';');
    cookies.forEach(function(value) {
        let content = value.split('=');
        if(content[0]==strCookiename){
            strValue = content[1];
        }
    });
    return strValue;
}


// =============================================
/**
* クッキーを保存します
* @param {string} strName クッキー名
* @param {string} strValue クッキー値
* @param {number} expireDay クッキーの保存期間。日数で指定。
* @return {} - なし
*/
export function setCookie(strName:string,strValue:string,expireDay:number =3){
    let adddata;
    
    adddata = encodeURIComponent(strName) + "=" + encodeURIComponent(strValue);
    
    let expireTime =0;
    expireTime = 60*60*24; //１日の秒数
    expireTime *= expireDay;
    adddata =adddata + ";max-age=" + (expireTime.toString());
    
    document.cookie = adddata;

}

