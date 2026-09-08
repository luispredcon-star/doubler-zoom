/* Zoom meeting UI sound effects — Web Audio (works on file://, no mp3 files needed) */
window.ZoomSfx = (function () {
    var ctx = null;
    var unlocked = false;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctx;
    }

    function unlock() {
        var c = getCtx();
        if (c.state === "suspended") {
            return c.resume().then(function () { unlocked = true; }).catch(function () {
                unlocked = c.state === "running";
            });
        }
        unlocked = true;
        return Promise.resolve();
    }

    function tone(freq, start, dur, vol, type) {
        var c = getCtx();
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = type || "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
    }

    function noiseBurst(start, dur, vol) {
        var c = getCtx();
        var bufferSize = Math.floor(c.sampleRate * dur);
        var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        var src = c.createBufferSource();
        var gain = c.createGain();
        src.buffer = buffer;
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        src.connect(gain);
        gain.connect(c.destination);
        src.start(start);
    }

    function play(name) {
        var c = getCtx();
        var t = c.currentTime + 0.01;
        switch (name) {
            case "user-joined":
                tone(880, t, 0.12, 0.22, "sine");
                tone(1174, t + 0.1, 0.18, 0.18, "sine");
                break;
            case "user-left":
                tone(660, t, 0.14, 0.18, "sine");
                tone(440, t + 0.12, 0.22, 0.14, "sine");
                break;
            case "new-speaker":
                tone(523, t, 0.08, 0.16, "triangle");
                tone(784, t + 0.07, 0.14, 0.16, "triangle");
                tone(988, t + 0.14, 0.18, 0.14, "triangle");
                break;
            case "mute":
                noiseBurst(t, 0.04, 0.08);
                tone(220, t, 0.05, 0.12, "square");
                break;
            case "unmute":
                tone(440, t, 0.06, 0.14, "sine");
                tone(554, t + 0.05, 0.08, 0.12, "sine");
                break;
            case "recording-start":
                tone(880, t, 0.08, 0.15, "sine");
                tone(880, t + 0.18, 0.08, 0.15, "sine");
                break;
            case "recording-stop":
                tone(440, t, 0.12, 0.14, "sine");
                break;
        }
    }

    var map = {
        "snd-user-joined": "user-joined",
        "snd-user-left": "user-left",
        "snd-new-speaker": "new-speaker",
        "snd-mute": "mute",
        "snd-unmute": "unmute",
        "snd-recording-start": "recording-start",
        "snd-recording-stop": "recording-stop"
    };

    return {
        unlock: unlock,
        playId: function (id) {
            if (!map[id]) return;
            var c = getCtx();
            function doPlay() {
                if (c.state === "running") play(map[id]);
            }
            if (c.state === "suspended") {
                c.resume().then(doPlay).catch(function () {});
            } else {
                doPlay();
            }
        }
    };
})();
