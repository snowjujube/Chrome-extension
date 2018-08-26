/*这里只能用到background中的方法，而不能用到变量， 很奇怪 mmp*/
let backgroundJS = chrome.extension.getBackgroundPage();
let container = backgroundJS.shareContainer();


/*执行请求增删修改状态的关键方法*/
const request = ({type, text, id}) => {
  /*{
*
* type:"ADD or TOGGLE or DELETE",
* text: "When add soemething new to use",
* id:"When toggle or delete something to use"
*
}*/
  chrome.runtime.sendMessage({type, text, id})
};
/*自定义一个Promise的ajax方法*/

const ajax = ({method = "GET", path, body, headers}) => {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open(method, path);
    for (let key in headers) {
      request.setRequestHeader(key, value);
    }
    request.send(body);
    request.onreadystatechange = () => {
      if (request.readyState === 4) {
        if (request.status >= 200 && request.status < 400) {
          resolve(request.responseText);
        }
        else {
          reject(request);
        }
      }
    }
  })
};


/*订阅container内的数据变化*/
container.subscribe(() => {
  /*绑定render事件*/
  render()
});


/*---------------------------------------样式相关------------------------------------------*/
let switcher = document.querySelector('#switcher');

/*是否隐藏除了图片的部分*/
let show = true;

/*左上角开关的点击事件*/
const toggleContainer = () => {
  let greet = document.querySelector('.greeting-container');
  let sticker = document.querySelector('.sticker-container');
  let app = document.querySelector('.app-container');
  if (show) {
    greet.style.top = '-400px';
    sticker.style.opacity = 0;
    app.style.bottom = '-400px';
    switcher.classList.remove('off');
    switcher.classList.add('on')
  } else {
    greet.style.top = '0';
    sticker.style.opacity = 1;
    app.style.bottom = '0';
    switcher.classList.remove('on');
    switcher.classList.add('off')
  }
  show = !show;
};

switcher.addEventListener('click', function () {
  toggleContainer();
});

/*检查壁纸*/
function wallpaperChecking() {
  /*检测壁纸是否需要更新*/
  chrome.storage.sync.get(['time'], function (result) {
    let now = new Date().getTime();
    let timeStamp = result.time;
    if (now > timeStamp + 86400) {
      chrome.storage.sync.set({"time": now});
      let response = ajax({path: "http://cn.bing.com/HPImageArchive.aspx?idx=0&n=1"});
      response.then((data) => {
        let regex = new RegExp('<url>([^<>]+)</url>');
        let path = regex.exec(data)[1];
        let pathArr = path.split('1366x768');
        let newPath = Array.prototype.concat(pathArr[0], ["1920x1080"], pathArr[1]).join('');
        let imgURL = "http://cn.bing.com/" + newPath;

        document.querySelector('.container').style.backgroundImage = "url(" + imgURL + ")";
        document.querySelector('.container').style.backgroundSize = "cover";
        document.querySelector('.container').style.backgroundRepeat = "no-repeat";
        document.querySelector('.container').style.opacity = 1;
        /*获取到了Bing每日更新的壁纸URL*/
        chrome.storage.sync.set({"imgURL": imgURL});
      }).catch((e) => {
        console.error(e);
      })
    }
  })
}

/*设置壁纸*/
function setWallpaper() {
  chrome.storage.sync.get(['imgURL'], function (result) {
    document.querySelector('.container').style.backgroundImage = "url(" + result.imgURL + ")";
    document.querySelector('.container').style.backgroundSize = "cover";
    document.querySelector('.container').style.backgroundRepeat = "no-repeat";
    document.querySelector('.container').style.opacity = 1;
  })
}

/*时间控制*/
const renderClock = () => {
  const setTime = () => {
    let clock = document.querySelector('#time');
    let date = new Date();
    let hour = date.getHours();
    let minute = Number(date.getMinutes()) > 9 ? date.getMinutes() : '0' + date.getMinutes()
    let second = Number(date.getSeconds()) > 9 ? date.getSeconds() : '0' + date.getSeconds()
    let string = hour + ":" + minute + ":" + second
    clock.innerHTML = string
  };
  setTime()
  setInterval(function () {
    setTime()
  }, 1000)
};
renderClock();

function hola() {
  let hour = new Date().getHours();
  let holaStr = '';
  console.log(hour);
  if (hour >= 0 && hour < 6) {
    holaStr = '早点休息';
  }
  if (hour >= 6 && hour < 12) {
    holaStr = '早上好';
  }
  if (hour >= 12 && hour < 18) {
    holaStr = '下午好';
  }
  if (hour >= 18 && hour <= 23) {
    holaStr = '晚上好';
  }
  document.querySelector("#hola").innerHTML = holaStr;
}

/*-------------------------------------功能--------------------------------------------*/


/*第一次使用app时 输入一个姓名*/
const logIn = () => {
  chrome.storage.sync.get(['username'], function (result) {
    if (!result.username) {
      toggleContainer();
      let nameInput = document.querySelector("#nameInput");
      nameInput.addEventListener('keydown', function (event) {
        if (event.keyCode === 13 && nameInput.value && nameInput.value.length <= 10) {
          document.querySelector('#username').value = nameInput.value;
          chrome.storage.sync.set({'username': nameInput.value}, function () {
            toggleContainer();
            document.querySelector('.first-time-use').style.visibility = "hidden";
          });
        }
      })
    }
    else {
      document.querySelector('#username').value = result.username;
      document.querySelector('.first-time-use').style.visibility = "hidden";
    }
  })
}


/*输入新item触发的方法*/
let appInput = document.querySelector('#app-input');
appInput.addEventListener('keydown', function (event) {
  if (event.keyCode === 13 && appInput.value) {
    let text = appInput.value;
    if (text.split('').length >= 50) {
      text = text.slice(0, 50)
    }
    request({"type": "ADD", "text": text});
    appInput.value = '';
    document.querySelector('.sticker-container').scrollLeft = document.querySelector('.sticker-container').scrollWidth;
  }
});


/*用户名发生变化触发的方法*/
let usernameInput = document.querySelector('#username');
usernameInput.addEventListener('blur', function () {
  if (usernameInput.value && nameInput.value.length <= 10) {
    chrome.storage.sync.set({'username': usernameInput.value});
  }
})

/*数据发生变化渲染模型*/
const render = () => {

  let stickerContainer = document.querySelector('.sticker-container');

  let state = container.getState();
  stickerContainer.innerHTML = null;
  state.forEach(item => {


    let div = document.createElement('div');
    div.classList.add('sticker');
    div.dataset.id = item.id;


    let span = document.createElement('span');
    span.classList.add('sticker-text');
    span.append(item.text);
    if (item.completed) {
      span.classList.add('completed');
    }
    let checkbox = document.createElement('input');
    checkbox.classList.add('sticker-status');
    checkbox.type = 'checkbox';
    checkbox.checked = item.completed;
    checkbox.style.marginRight = '10px';

    checkbox.addEventListener('click', function () {
      request({type: "TOGGLE", id: item.id})
    });
    let copy = document.createElement('div');
    copy.classList.add('sticker-copy');
    copy.dataset.clipboardText = item.text;
    let clipboard = new ClipboardJS('.sticker-copy');

    copy.addEventListener('click', function () {

      document.querySelector('.toast-basic').classList.add('animate-toast');

      setTimeout(function () {
        document.querySelector('.toast-basic').classList.remove('animate-toast');
      }, 2000)
    })


    div.appendChild(checkbox);
    div.appendChild(span);
    div.appendChild(copy);


    div.addEventListener('dblclick', function () {
      request({type: "DELETE", id: item.id});
    });
    stickerContainer.appendChild(div);
  })


};

/*订阅渲染方法*/
container.subscribe(() => {
  render();
});


window.onload = logIn() || wallpaperChecking() || setWallpaper() || render() || hola();