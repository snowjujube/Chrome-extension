/*这里只能用到background中的方法，而不能用到变量， 很奇怪 mmp*/
let backgroundJS = chrome.extension.getBackgroundPage();
let container = backgroundJS.shareContainer();

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
      backgroundJS.notice("复制好啦")
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

render();


//执行请求增删修改状态的关键方法
const request = ({type = "ADD", text, id}) => {
  /*{
*
* type:"ADD or TOGGLE or DELETE",
* text: "When add soemething new to use",
* id:"When toggle or delete something to use"
*
}*/
  chrome.runtime.sendMessage({type, text, id});
};

let appInput = document.querySelector('#app-input');
appInput.addEventListener('keydown', function (event) {
  if (event.keyCode === 13 && appInput.value) {
    let text = appInput.value;
    if (text.split('').length >= 50) {
      text = text.slice(0, 50)
    }
    request({"type": "ADD", "text": text});
    appInput.value = '';
  }
});


/*订阅container内的数据变化*/
container.subscribe(() => {
  render();
});



