/*引入Redux*/
let createStore = Redux.createStore;
let combineReducers = Redux.combineReducers;


/*在标签页中选中文字后的鼠标右击事件*/
chrome.contextMenus.create({
  title: '将选中的文字加入「One」：%s',
  contexts: ['selection'],
  onclick: function (params) {
    container.dispatch(addTodo(params.selectionText))
    notice(params.selectionText)
  }
});

/*获取请求后的处理*/
chrome.runtime.onMessage.addListener(function (request) {
  request && request.type && handleMessage(request);
});

/*初始化时间戳在Chrome浏览器中的保存*/
chrome.storage.sync.get(['time'], function (result) {
  if (!result.time) {
    chrome.storage.sync.set({time: 0})
  }
});


/*--------------------------------------------------------------------------*/

/*一些工具方法*/

/*触发通知*/
function notice(message) {
  let data = {
    type: 'basic',
    iconUrl: "../img/dog.png",
    title: "One",
    message: message
  };
  chrome.notifications.create(null, data);
}

/*触发Chrome的保存功能*/
function storeSync(data) {
  chrome.storage.sync.set({"list": data});

}

/*popup 与 new tab中可用的方法*/
function shareContainer(func) {
  return container;
}

function handleMessage(request) {
  switch (request.type) {
    case "ADD":
      container.dispatch(addTodo(request.text)) && notice(request.text);
      break;
    case "TOGGLE":
      container.dispatch(toggleTodo(request.id)) && notice("操作成功");
      break;
    case "DELETE":
      container.dispatch(deleteTodo(request.id)) && notice("删除成功");
      break;
    default:
      notice('Error');
  }
}


/*--------------------------------------------------------------------------*/


/*初始化的id为0*/
let nextTodoId = 0;


/*定义好action*/
const addTodo = text => ({
  type: "ADD_TODO",
  id: nextTodoId++,
  text
});
const toggleTodo = id => ({
  type: "TOGGLE_TODO",
  id
});
const deleteTodo = id => ({
  type: "DELETE_TODO",
  id
});


/*定义reducer*/
const todos = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        {
          id: action.id,
          text: action.text,
          completed: false
        }
      ];
    case 'TOGGLE_TODO':
      return state.map(todo =>
        (todo.id === action.id)
          ? {...todo, completed: !todo.completed}
          : todo
      );
    case 'DELETE_TODO':
      return state.filter(todo => (todo.id !== action.id));
    default:
      return state
  }
};


var container = createStore(todos);


container.subscribe(() => {
  let state = container.getState();
  storeSync(state)
});