window.playTTS = async function(text){
  if(!('speechSynthesis' in window)) return alert('TTS tidak tersedia di browser ini');
  const ut = new SpeechSynthesisUtterance(text);
  ut.lang = 'id-ID';
  speechSynthesis.cancel();
  speechSynthesis.speak(ut);
};
