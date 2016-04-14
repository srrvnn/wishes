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

var everything = [];

function listObjs() {

    var prefix = '';

    bucket.listObjects({

        Prefix: prefix

    }, function(err, data) {

        if (err) {

            console.log('ERROR: ' + err);

        } else {

            function makeAudio(entry) {

              var blob = new Blob([entry.data]);
              blob.type = "audio/wav";

              var url = URL.createObjectURL(blob);

              var au = document.createElement('audio');
              au.id = entry.key;
              au.controls = true;
              au.src = url;

              var li = document.createElement('div');
              li.appendChild(au);

              savedList.appendChild(li);
            }

            var objKeys = "";

            data.Contents.forEach(function(obj) {

                objKeys += obj.Key + "<br>";

                bucket.getObject({

                    Bucket: 'srrvnn-records',
                    Key: obj.Key

                }, function(err, data) {

                    if (err || data === null) return;

                    everything.push({

                        key: obj.Key,
                        data: data.Body.buffer
                    });

                    // var blob = new Blob([data.Body.buffer]);
                    // blob.type = "audio/wav";
                    // var url = URL.createObjectURL(blob);

                    // var li = document.createElement('div');

                    // var sp = document.createElement('span');
                    // // sp.innerHTML = obj.Key;
                    // // sp.innerHTML = 'Task ' + obj.Key.slice(obj.Key.lastIndexOf('/') + 1, obj.Key.lastIndexOf('/') + 2) + '&mdash;';

                    // var au = document.createElement('audio');
                    // au.id = obj.Key;
                    // au.controls = true;
                    // au.src = url;

                    // li.appendChild(sp);
                    // li.appendChild(au);

                    // savedList.appendChild(li);
                });
            });

            console.log('everything', everything.length);

            // find all the ones

            var task_one_entries = everything.filter(function(item) {

              var tasknumber = item.key.slice(item.key.lastIndexOf('/') + 1, item.key.lastIndexOf('/') + 2);
              return tasknumber == 1 || tasknumber == '1';
            });

            console.log('one', task_two_entries.length);

            var task_two_entries = everything.filter(function(item) {

              var tasknumber = item.key.slice(item.key.lastIndexOf('/') + 1, item.key.lastIndexOf('/') + 2);
              return tasknumber == 2 || tasknumber == '2';
            });

            console.log('two', task_two_entries.length);

            var task_three_entries = everything.filter(function(item) {

              var tasknumber = item.key.slice(item.key.lastIndexOf('/') + 1, item.key.lastIndexOf('/') + 2);
              return tasknumber == 3 || tasknumber == '3';
            });

            console.log('three', task_three_entries.length);


            var h1 = document.createElement('h2');
            h1.innerHTML = 'Task One Responses';
            savedList.appendChild(h1);

            task_one_entries.forEach(makeAudio);

            var h2 = document.createElement('h2');
            h2.innerHTML = 'Task Two Responses';
            savedList.appendChild(h1);

            task_two_entries.forEach(makeAudio);

            var h3 = document.createElement('h2');
            h3.innerHTML = 'Task Three Responses';
            savedList.appendChild(h1);

            task_three_entries.forEach(makeAudio);
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
