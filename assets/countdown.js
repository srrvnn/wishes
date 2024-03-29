var end = new Date(Date.UTC(2016, 3, 15, 4, 0, 0));

var _second = 1000;
var _minute = _second * 60;
var _hour = _minute * 60;
var _day = _hour * 24;
var timer;

function showRemaining() {
    var now = new Date();
    var distance = end - now;
    if (distance < 0) {

        clearInterval(timer);
        document.getElementById('countdown-numbers').innerHTML = 'EXPIRED!';

        return;
    }
    var days = Math.floor(distance / _day);
    var hours = Math.floor((distance % _day) / _hour);
    var minutes = Math.floor((distance % _hour) / _minute);
    var seconds = Math.floor((distance % _minute) / _second);

    document.getElementById('countdown-numbers').innerHTML = days + ' day &mdash; ';
    document.getElementById('countdown-numbers').innerHTML += hours + ' hrs &mdash; ';
    document.getElementById('countdown-numbers').innerHTML += minutes + ' mins &mdash;  ';
    document.getElementById('countdown-numbers').innerHTML += seconds + ' secs';
}

timer = setInterval(showRemaining, 0);