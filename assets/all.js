AWS.config.region = 'us-west-2';

var appId = ~window.location.host.indexOf('localhost') ? '1173370219340932' : '1172856152725672';
var roleArn = 'arn:aws:iam::694260833504:role/srrvnn-records-facebook';
var bucketName = 'srrvnn-records';
var fbUserId;

var bucket = new AWS.S3({
    params: {
        Bucket: bucketName
    }
});

var elHeader = document.getElementById('header');
var elIntro = document.querySelector('#intro');

var elButtons = document.getElementById('buttons');
var recordings = document.getElementById('recordings');

var elRecord = document.getElementById('record-button');
var elStop = document.getElementById('stop-button');
var elRecordAgain = document.getElementById('record-again-button');
var elSave = document.getElementById('save-button');

var elSection = document.getElementById('section-contents');
var elVideos = document.getElementById('videos');

var recordingSvg = document.getElementById('recording-svg');

var savedList = document.getElementById('saved-list')

var audio_context;
var recorder;
var audio_recorded;
var section = 1;

function chooseSection(e) {

  if (e.target.tagName !== 'LI') return;

  elHeader.className = 'shorten';
  elIntro.style.display = 'none';

  elButtons.style.display = 'block';
  elSection.style.height = '500px';

  elRecord.style.display = 'inline-block';
  elStop.style.display = 'inline-block';

  elSave.style.display = 'none';
  recordingslist.innerHTML = '';

  document.querySelector('#item1').className = '';
  document.querySelector('#item2').className = '';
  document.querySelector('#item3').className = '';
  document.querySelector('#item' + e.target.id.slice(-1)).className = "selected";

  document.querySelector('#section1').style.display = 'none';
  document.querySelector('#section2').style.display = 'none';
  document.querySelector('#section3').style.display = 'none';
  document.querySelector('#section' + e.target.id.slice(-1)).style.display = 'block';

  section = e.target.id.slice(-1);
}

function startRecording(button) {

    elSection.style.height = '500px';
    elSection.style.height = '0px';

    recordingSvg.style.display = 'block';
    elStop.disabled = false;
    elRecord.disabled = true;

    recorder && recorder.record();

    recordingslist.innerHTML = '';

    if (section == 2) {

        elVideos.style.display = 'block';

        player1.stopVideo();
        player1.playVideo();

    } else if (section == 3) {

        elVideos.style.display = 'block';

        player2.stopVideo();
        player2.playVideo();
    }

    __log('Recording...');
}

function stopRecording(button) {

    if (player1ready) player1.stopVideo();
    if (player2ready) player2.stopVideo();

    recordingSvg.style.display = 'none';
    recordings.style.display = 'block';

    elRecord.style.display = 'none';
    elVideos.style.display = 'none';
    elStop.style.display = 'none';
    elRecordAgain.style.display = 'inline-block'
    elSave.style.display = 'inline-block';

    recorder && recorder.stop();

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

    savedList.innerHTML = '';

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

                    if (savedList.innerHTML == '') {
                        savedList.innerHTML == 'Your saved recordings so far.';
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
        console.log('use name to store the recording');
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