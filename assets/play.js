AWS.config.region = 'us-west-2';

var appId = ~window.location.host.indexOf('localhost') ? '1173370219340932' : '1172856152725672';
var roleArn = 'arn:aws:iam::694260833504:role/srrvnn-records-facebook';
var bucketName = 'srrvnn-records';
var fbUserId;
var fbUserName;

var bucket = new AWS.S3({
    params: {
        Bucket: bucketName
    }
});

var audio_context;
var recorder;
var audio_recorded;
var section = 1;

function __log(e, data) {
    console.log(e);
    // log.innerHTML += "\n" + e + " " + (data || '');
}

function listObjs() {

    var prefix = '';

    bucket.listObjects({

        Prefix: prefix

    }, function(err, data) {

        if (err) {

            console.log('ERROR: ' + err);

        } else {

            var objKeys = "";

            data.Contents.forEach(function(obj) {

                objKeys += obj.Key + "<br>";

                bucket.getObject({

                    Bucket: 'srrvnn-records',
                    Key: obj.Key

                }, function(err, data) {

                    if (err || data === null) return;

                    var blob = new Blob([data.Body.buffer]);
                    blob.type = "audio/wav";
                    var url = URL.createObjectURL(blob);

                    var li = document.createElement('div');

                    var sp = document.createElement('span');
                    // sp.innerHTML = obj.Key;
                    // sp.innerHTML = 'Task ' + obj.Key.slice(obj.Key.lastIndexOf('/') + 1, obj.Key.lastIndexOf('/') + 2) + '&mdash;';

                    var au = document.createElement('audio');
                    au.id = obj.Key;
                    au.controls = true;
                    au.src = url;

                    li.appendChild(sp);
                    li.appendChild(au);

                    savedList.appendChild(li);
                });
            });
        }
    });
}

function startUserMedia(stream) {

    var input = audio_context.createMediaStreamSource(stream);
    __log('Media stream created.');

    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    //__log('Input connected to audio context destination.');

    recorder = new Recorder(input);
    __log('Recorder initialised.');
}

window.onload = function init() {
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        __log('Audio context set up.');
        __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));



    } catch (e) {
        alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({
        audio: true
    }, startUserMedia, function(e) {
        __log('No live audio input: ' + e);
    });
};

function statusChange(response) {

  if (response.status === 'connected') {

      // document.getElementById('fb-login').style.display = 'none';
      // document.getElementById('body').style.display = 'block';

      var token = response.authResponse.accessToken;
      fbUserId = response.authResponse.userID;

      FB.api('/me', function(response) {
        fbUserName = response.name.replace(' ', '-').toLowerCase();
        // document.querySelector('#header h2').innerHTML = 'Hello ' + response.name.split(' ')[0] + ', send your wishes, and love by recording a message, in: '

        bucket.config.credentials = new AWS.WebIdentityCredentials({
            ProviderId: 'graph.facebook.com',
            RoleArn: roleArn,
            WebIdentityToken: token
        });

        listObjs();
      });
  }
}

window.fbAsyncInit = function() {
    FB.init({
        appId: appId
    });
    FB.Event.subscribe('auth.statusChange', statusChange);
};

// Load the Facebook SDK asynchronously

(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&version=v2.6";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
