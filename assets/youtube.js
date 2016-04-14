var player1;
var tag = document.createElement('script');

var player1ready = false;
var player2ready = false;

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


// 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.
function onYouTubeIframeAPIReady() {
  player1 = new YT.Player('player1', {
    height: '390',
    width: '640',
    videoId: 'mnj8vhLZtTk',
    playerVars: {
      controls: 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });

  // 4. The API will call this function when the video player is ready.
        function onPlayerReady(event) {
          console.log('player ready');
          window.player1ready = true;
        }
}
var done = false;
      function onPlayerStateChange(event) {
        // if (event.data == YT.PlayerState.PLAYING && !done) {
        //   setTimeout(stopVideo, 6000);
        //   done = true;
        // }
      }
      function stopVideo() {
        player1.stopVideo();
      }

