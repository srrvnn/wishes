AWS.config.region = 'us-west-2';

var appId = '1172856152725672';
var roleArn = 'arn:aws:iam::694260833504:role/srrvnn-records-facebook';
var bucketName = 'srrvnn-records';
var fbUserId;

var bucket = new AWS.S3({
    params: {
        Bucket: bucketName
    }
});

var buttons = document.getElementById('buttons');
var recordings = document.getElementById('recordings');

var recordButton = document.getElementById('record-button');
var stopButton = document.getElementById('stop-button');
var saveButton = document.getElementById('save-button');

var intro = document.querySelector('#section0');

var recordingSvg = document.getElementById('recording-svg');

var savedList = document.getElementById('saved-list')

var audio_context;
var recorder;
var audio_recorded;
var section = 1;

function chooseSection(e) {

  buttons.style.display = 'block';
  intro.style.display = 'none';

  document.querySelector('#section1').style.display = 'none';
  document.querySelector('#section2').style.display = 'none';
  document.querySelector('#section3').style.display = 'none';

  document.querySelector('#item1').className = '';
  document.querySelector('#item2').className = '';
  document.querySelector('#item2').className = '';

  document.querySelector('#section' + e.target.id.slice(-1)).style.display = 'block';
  document.querySelector('#item' + e.target.id.slice(-1)).className = "selected";

  section = e.target.id.slice(-1);
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

function startRecording(button) {

    recordingSvg.style.display = 'block';

    recorder && recorder.record();
    stopButton.disabled = false;
    recordButton.disabled = true;
    saveButton.disabled = true;

    recordingslist.innerHTML = '';

    if (section == 2) {

      player1.playVideo();
    }

    __log('Recording...');
}

function stopRecording(button) {

    recordings.style.display = 'block';
    recordingSvg.style.display = 'none';

    recorder && recorder.stop();
    stopButton.disabled = true;
    recordButton.disabled = false;
    saveButton.disabled = false;
    __log('Stopped recording.');

    recorder && recorder.exportWAV(function(blob) {
        var url = URL.createObjectURL(blob);
        var li = document.createElement('div');
        var au = document.createElement('audio');
        au.controls = true;
        au.src = url;
        li.appendChild(au);
        recordingslist.appendChild(li);
        audio_recorded = blob;
    });
}

function saveRecording(button) {

    recordingslist.innerHTML = '';

    var objKey = 'facebook-' + fbUserId + '/records/' + section + '-' + Date.now();

    var params = {

        Key: objKey,

        Body: audio_recorded,

        ACL: 'public-read'

    };

    bucket.putObject(params, function(err, data) {

        if (err) {

            console.log('ERROR: ' + err);

        } else {

            listObjs();
            recorder.clear();
        }

    });

}

function __log(e, data) {
    console.log(e);
    // log.innerHTML += "\n" + e + " " + (data || '');
}

function listObjs() {

    savedList.innerHTML = 'Nothing saved, yet.';

    var prefix = 'facebook-' + fbUserId;

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

                    if (savedList.innerHTML == 'Nothing saved, yet.') {
                        savedList.innerHTML == '';
                    }

                    if (err || data === null) return;

                    var blob = new Blob([data.Body.buffer]);
                    blob.type = "audio/wav";

                    var url = URL.createObjectURL(blob);
                    var li = document.createElement('div');

                    var sp = document.createElement('span');
                    // sp.innerHTML = obj.Key;
                    sp.innerHTML = obj.Key.slice(obj.Key.lastIndexOf('/') + 1, obj.Key.lastIndexOf('/') + 2) + '.';

                    var au = document.createElement('audio');
                    au.id = obj.Key;
                    au.controls = true;
                    au.src = url;

                    li.appendChild(sp);
                    li.appendChild(au);

                    // var play = document.createElement('button');
                    // play.innerHTML = 'Play';
                    // play.setAttribute('onclick', "document.getElementById(\'" + au.id + "\').play()");
                    // li.appendChild(play);

                    savedList.appendChild(li);
                });
            });
        }
    });
}

window.onload = function init() {
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
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

window.fbAsyncInit = function() {
    FB.init({
        appId: appId
    });
    FB.login(function(response) {
        bucket.config.credentials = new AWS.WebIdentityCredentials({
            ProviderId: 'graph.facebook.com',
            RoleArn: roleArn,
            WebIdentityToken: response.authResponse.accessToken
        });
        fbUserId = response.authResponse.userID;
        listObjs();
    });
};

// Load the Facebook SDK asynchronously

(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/all.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
