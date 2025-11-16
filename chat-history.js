/* simple client-side history localStorage */
(function(){
  const key='ai_chat_history_v1';
  window.saveChat = function(msg, who){
    let arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push({who, msg, ts:Date.now()});
    localStorage.setItem(key, JSON.stringify(arr));
  };
  window.loadChat = function(){ return JSON.parse(localStorage.getItem(key) || '[]'); };
})();
