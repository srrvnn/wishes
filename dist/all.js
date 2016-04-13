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

var recordButton = document.getElementById('record-button');
var stopButton = document.getElementById('stop-button');
var saveButton = document.getElementById('save-button');

var results = document.getElementById('results');

var audio_context;
var recorder;
var audio_recorded;

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
    recorder && recorder.record();
    stopButton.disabled = false;
    recordButton.disabled = true;
    saveButton.disabled = true;
    __log('Recording...');
}

function stopRecording(button) {
    recorder && recorder.stop();
    stopButton.disabled = true;
    recordButton.disabled = false;
    saveButton.disabled = false;
    __log('Stopped recording.');

    recorder && recorder.exportWAV(function(blob) {
        var url = URL.createObjectURL(blob);
        var li = document.createElement('li');
        var au = document.createElement('audio');
        au.controls = true;
        au.src = url;
        li.appendChild(au);
        recordingslist.appendChild(li);
        audio_recorded = blob;
    });
}

function saveRecording(button) {

    var objKey = 'facebook-' + fbUserId + '/recording' + Date.now();

    var params = {

        Key: objKey,

        Body: audio_recorded,

        ACL: 'public-read'

    };

    bucket.putObject(params, function(err, data) {

        if (err) {

            results.innerHTML = 'ERROR: ' + err;

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

    var prefix = 'facebook-' + fbUserId;

    bucket.listObjects({

        Prefix: prefix

    }, function(err, data) {

        if (err) {

            results.innerHTML = 'ERROR: ' + err;

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

                    var au = document.createElement('audio');
                    au.id = obj.Key;

                    var play = document.createElement('button');
                    play.innerHTML = 'Play';
                    play.setAttribute('onclick', "document.getElementById(\'" + au.id + "\').play()");

                    // au.controls = true;
                    au.src = url;

                    li.appendChild(au);
                    li.appendChild(play);

                    recordingslist.appendChild(li);
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
