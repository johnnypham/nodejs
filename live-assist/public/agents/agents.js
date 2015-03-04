var sitekey = '54811518c469881d668b456d';

function sendRequest(url, callback, postData) {
    var req = createXMLHTTPObject();
    if (!req) return;
    var method = (postData) ? "POST" : "GET";
    req.open(method, url, true);
    // req.setRequestHeader('User-Agent','XMLHTTP/1.0');
    if (postData)
        req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    req.onreadystatechange = function () {
        if (req.readyState != 4) return;
        if (req.status != 200 && req.status != 304) {
            return;
        }
        callback(req.responseText);
    };
    if (req.readyState == 4) return;
    req.send(postData);
}

var XMLHttpFactories = [

    function () {
        return new XMLHttpRequest();
    },
    function () {
        return new ActiveXObject("Msxml2.XMLHTTP");
    },
    function () {
        return new ActiveXObject("Msxml3.XMLHTTP");
    },
    function () {
        return new ActiveXObject("Microsoft.XMLHTTP");
    }
];

function createXMLHTTPObject() {
    var xmlhttp = false;
    for (var i = 0; i < XMLHttpFactories.length; i++) {
        try {
            xmlhttp = XMLHttpFactories[i]();
        } catch (e) {
            continue;
        }
        break;
    }
    return xmlhttp;
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function createCookie(name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else var expires = "";
        document.cookie = name + "=" + value + expires + "; path=/";
    }

function getVisitorInfo(cartRescue911_uid) {
    var userData = cartRescue911_uid;
    
    document.getElementById('visitor-from-domain-1').innerHTML = document.getElementById('visitor-from-domain-2').innerHTML = userData.domain;
    document.getElementById('visitor-from-domain-1').title = document.getElementById('visitor-from-domain-2').title = userData.title;
    
    document.getElementById('visitor-from-href').innerHTML = userData.href;
    document.getElementById('visitor-from-referer').innerHTML = userData.href;
    
    var platformAndBrowser = userData.browserData.browserName + ' (' + userData.browserData.fullVersion + ') ' + userData.OSName;
    
    document.getElementById('platform-and-browser').innerHTML = platformAndBrowser;
    document.getElementById('platform-and-browser').title = userData.browserData.userAgent;
    
    cartRescue911_uid = cartRescue911_uid.cartRescue911_uid;
    // sitekeys.forEach(function(sitekey){

    // })
    
    sendRequest('//dev.ping.cartrescue911.com/n/getuser/' + sitekey + '/' + cartRescue911_uid, function(data){
        var data = JSON.parse(data);
        if(!data.user) {
            data = JSON.parse(data);
        }
        var user = data.user;
        if(!user.ip) return;
        
        var userDIV = document.getElementById(targetvisitor);
        if(userDIV) {
            var data = user.google_data || user.facebook_data;
            if(data) {
                userDIV.querySelector('h4').innerHTML = '<i class="icon-comments"></i>' + data.user_first_name + ' ' + data.user_last_name;
            }
            userDIV.querySelector('#user-email').innerHTML = user.email;
        }
        
        sendRequest('//65.60.43.119/n/geoip/' + user.ip, function(data) {
            data = JSON.parse(data);
            if(!data.message) {
                data = JSON.parse(data);
            }
            var message = data.message;
            
            document.getElementById('visitor-location').innerHTML =
                message.city + ' (' + message.country + ')';
            
            var map_canvas = document.getElementById('map_canvas');
            var map_options = {
                center: new google.maps.LatLng(message.ll[0], message.ll[1]),
                zoom: 8,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            }
            var map = new google.maps.Map(map_canvas, map_options)
        });
    });
}

function getRandomString() {
    if (window.crypto && crypto.getRandomValues && navigator.userAgent.indexOf('Safari') == -1) {
        var a = window.crypto.getRandomValues(new Uint32Array(3)),
            token = '';
        for (var i = 0, l = a.length; i < l; i++) {
            token += a[i].toString(36);
        }
        return token;
    } else {
        return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
    }
}

var status = 'available';
var userid = getRandomString();

if (readCookie(sitekey + '-agent-userid')) {
    userid = readCookie(sitekey + '-agent-userid');
}
else createCookie(sitekey + '-agent-userid', userid, 365);

var targetvisitor;
// var socket =io.connect('http://localhost:8080');
// socket.on('connect',function(data){

//     console.log(data);
// })
var socket = io.connect('/?userid=' + userid + '&status=' + status + '&sitekey=' + sitekey, {
    'reconnect': true,
    'reconnection delay': 500,
    'max reconnection attempts': 10
});
socket.on('test',function(data){

    console.log('data-test');
    console.log(data);
})
if (readCookie(sitekey + '-agent-userid')) {
    socket.emit('returning-agent', userid);
    socket.on('visitor-connected', function(visitor) {
        targetvisitor = visitor.visitorid;
        chatInputBox.disabled = false;
        chatInputBox.focus();

        document.querySelector('#Request-Screen-Sharing').disabled = false;
            
        appendVisitorIntoList(visitor);
        
        document.getElementById('page-1').style.display = 'none';
        document.getElementById('page-2').style.display = 'block';
        
        socket.emit('get-unread-messages', visitor.visitorid);
    });
}

function updateStatus() {
    socket.emit('update-agent-status', {
        userid: userid,
        status: status
    });
}

socket.on('share-media', function (visitorid) {
    if (localStream) return;

    alertify.set({
        labels: {
            ok    : 'OK',
            cancel: 'No',
            buttonFocus: 'OK'
        }
    });

    alertify.confirm(visitorid + ' want you to setup media connection with him. Are you ready?', function (accepted) {
        if (accepted) {
            captureVideo(function () {
                socket.emit('visitor-mediaconnection-accepted', {
                    agentid: userid,
                    visitorid: visitorid
                });
            });
        } else {
            socket.emit('visitor-mediaconnection-rejected', {
                agentid: userid,
                visitorid: visitorid
            });
        }
    });
});

socket.on('agent-available', function (agentid) {
    if (document.getElementById(agentid)) return;
    
    // selectAvailableAgents
    var option = document.createElement('option');
    option.id = 'agentid-' + agentid;
    option.value = option.innerHTML = agentid;
    selectAvailableAgents.appendChild(option);
    
    var selectBox = document.querySelector('#agentid-to-redirect');
    if (!selectBox) return;
    option = document.createElement('option');
    option.value = option.innerHTML = option.id = agentid;
    selectBox.appendChild(option);
});

function onAgentBusyOrLeave(agentid) {
    if (document.getElementById('agentid-' + agentid)) {
        var option = document.getElementById('agentid-' + agentid);
        selectAvailableAgents.removeChild(option);
    }
    
    if (!document.getElementById(agentid)) return;

    var selectBox = document.querySelector('#agentid-to-redirect');
    if (!selectBox) return;

    var option = document.getElementById(agentid);
    selectBox.removeChild(option);
}

socket.on('agent-busy', onAgentBusyOrLeave);
socket.on('agent-left', onAgentBusyOrLeave);

socket.on('status-changed', function(status) {
    document.getElementById('page-1').style.display = status == 'busy' ? 'none' : 'block';
    document.getElementById('page-2').style.display = status == 'busy' ? 'block' : 'none';
    
    if(status != 'busy') {
        socket.emit('get-average-chat-minutes');
    }
});

socket.on('average-chat-minutes', function(minutes) {
    document.getElementById('minutes-average-chat-time').innerHTML = minutes;
});

socket.on('visitor-available', function (visitor) {
    console.log('visitor');
    console.log(visitor);
    targetvisitor = visitor.visitorid;

    alertify.set({
        labels: {
            ok    : 'Yes',
            cancel: 'No',
            buttonFocus: 'Yes'
        }
    });

    if (visitor.joinas == 'IMS') {
        joinIMS(visitor);
    }

    if (visitor.joinas == 'IMS + Audio') {
        joinIMSPlusAudio(visitor);
    }
});

function joinIMSPlusAudio(visitor) {
    var options = '<select id="agentid-to-redirect" style="padding: 3px 1px;">';
    for (var i = 0; i < visitor.agents.length; i++) {
        if (visitor.agents[i] != userid) {
            if (!visitor.redirected || (visitor.redirected && visitor.redirectedFrom != visitor.agents[i])) {
                options += '<option id="' + visitor.agents[i] + '">' + visitor.agents[i] + '</option>';
            }
        }
    }
    options += '</select>';

    var html = '<div style="padding: 1em 2em;margin-top: -2em;padding-bottom: 0;"><h2 style="border-bottom: 1px solid black;display: inline;">New Customer</h2><br><br>';
    html += 'A customer is waiting for assistance.  Are you available to help?';
    //html += '<br /><br />';
    //html += '<strong>Redirect him to: </strong> ' + options;
    //html += '<input type="checkbox" id="redirect" style="padding: 3px 5px;padding-bottom: 2px;"><label for="redirect">Redirect</label>';
    //html += '<br /><small style="font-size: 11px;font-style: italic;color: gray;">Keep above checkbox uncheked if you don\'t want to redirect the visitor.</small>';

    if (visitor.redirected) {
        html += '<br><br><span style="color:red">This visitor is redirected from agent: ' + visitor.redirectedFrom + '</span>';
    }

    if (visitor.warning) {
        html += '<br><br><span style="color:red">' + visitor.warning + '</span>';
    }

    html += '</div>';

    alertify.confirm(html, function (accepted) {
        if (accepted) {
            /*
            var redirect = document.querySelector('#redirect').checked;
            var agentidToRedirect = document.querySelector('#agentid-to-redirect').value;

            if (redirect && agentidToRedirect && agentidToRedirect.length) {
                socket.emit('redirect-to-agent', {
                    agentid: agentidToRedirect,
                    visitorid: visitor.visitorid,
                    redirectedFrom: userid
                });

                return;
            }
            */

            targetvisitor = visitor.visitorid;
            chatInputBox.disabled = false;
            chatInputBox.focus();

            document.querySelector('#Request-Screen-Sharing').disabled = false;

            socket.emit('connect-visitor', {
                agentid: userid,
                visitorid: visitor.visitorid
            });
            
            appendVisitorIntoList(visitor);
        } else {
            socket.emit('reject-visitor', {
                agentid: userid,
                visitorid: visitor.visitorid
            });
        }

        if (accepted) {
            captureVideo(function () {
                socket.emit('visitor-mediaconnection-accepted', {
                    agentid: userid,
                    visitorid: visitor.visitorid
                });
            });
        } else {
            socket.emit('visitor-mediaconnection-rejected', {
                agentid: userid,
                visitorid: visitor.visitorid
            });
        }
    });
}

function joinIMS(visitor) {
    var options = '<select id="agentid-to-redirect" style="padding: 3px 1px;">';
    for (var i = 0; i < visitor.agents.length; i++) {
        if (visitor.agents[i] != userid) {
            if (!visitor.redirected || (visitor.redirected && visitor.redirectedFrom != visitor.agents[i])) {
                options += '<option id="' + visitor.agents[i] + '">' + visitor.agents[i] + '</option>';
            }
        }
    }
    options += '</select>';

    var html = '<div style="padding: 1em 2em;margin-top: -2em;padding-bottom: 0;"><h2 style="border-bottom: 1px solid black;display: inline;">New Customer</h2><br><br>';
    html += 'A customer is waiting for assistance.  Are you available to help?';
    //html += '<br /><br />';
    //html += '<strong>Redirect him to: </strong> ' + options;
    //html += '<input type="checkbox" id="redirect" style="padding: 3px 5px;padding-bottom: 2px;"><label for="redirect">Redirect</label>';
    //html += '<br /><small style="font-size: 11px;font-style: italic;color: gray;">Keep above checkbox uncheked if you don\'t want to redirect the visitor.</small>';

    if (visitor.redirected) {
        html += '<br><br><span style="color:red">This visitor is redirected from agent: ' + visitor.redirectedFrom + '</span>';
    }

    if (visitor.warning) {
        html += '<br><br><span style="color:red">' + visitor.warning + '</span>';
    }

    html += '</div>';

    alertify.confirm(html, function (accepted) {
        if (accepted) {
            /*
            var redirect = document.querySelector('#redirect').checked;
            var agentidToRedirect = document.querySelector('#agentid-to-redirect').value;

            if (redirect && agentidToRedirect && agentidToRedirect.length) {
                socket.emit('redirect-to-agent', {
                    agentid: agentidToRedirect,
                    visitorid: visitor.visitorid,
                    redirectedFrom: userid
                });

                return;
            }
            */

            targetvisitor = visitor.visitorid;
            chatInputBox.disabled = false;
            chatInputBox.focus();

            document.querySelector('#Request-Screen-Sharing').disabled = false;

            socket.emit('connect-visitor', {
                agentid: userid,
                visitorid: visitor.visitorid
            });
            
            appendVisitorIntoList(visitor);
        } else {
            socket.emit('reject-visitor', {
                agentid: userid,
                visitorid: visitor.visitorid
            });
        }
    });
}

function onstreamended(event) {
    status = 'available';
    socket.emit('update-agent-status', status);
}

function onstream(event) {
    var audio = document.createElement('audio');
    audio.src = URL.createObjectURL(event.stream);
    audio.controls = true;
    
    var div = document.getElementById(targetvisitor);
    if(div) div = div.getElementsByClassName('portlet-body')[0];
    
    if(div) {
        div.appendChild(audio);
    }
    else chatBox.insertBefore(audio, chatBox.firstChild);
    
    audio.play();
}

var chatBox = document.querySelector('#chat-box');
var chatInputBox = document.querySelector('#chat-input');

chatInputBox.onkeyup = function (event) {
    if (event.keyCode != 13) return;
    if (!this.value || !this.value.length) return;

    socket.emit('ims', {
        message: this.value,
        visitorid: targetvisitor
    });

    appendChatMessage(this.value, 'You', false);

    this.value = '';
};

document.querySelector('#agent-available').onclick = function () {
    document.querySelector('#agent-available').style.background = 'gainsboro';
    document.querySelector('#agent-pause').style.background = 'white';
    
    socket.emit('agent-online', userid);
    return false;
};

document.querySelector('#agent-pause').onclick = function () {
    document.querySelector('#agent-pause').style.background = 'gainsboro';
    document.querySelector('#agent-available').style.background = 'white';
    
    socket.emit('update-agent-status', 'busy');
    return false;
};

var isGetScreenShots = false;

document.querySelector('#Request-Screen-Sharing').setAttribute('data-hints', 'Request Screen Sharing');

document.querySelector('#Request-Screen-Sharing').onclick = function () {
    var button = this;
    if (button.getAttribute('data-hints') == 'Request Screen Sharing') {
        isGetScreenShots = true;
        button.setAttribute('data-hints', 'Stop Previewing Screen');

        socket.emit('ask-to-share-screen', targetvisitor);
    } else {
        isGetScreenShots = false;
        setTimeout(function () {
            image.src = '';
            button.setAttribute('data-hints', 'Request Screen Sharing');
        }, 1000);

        socket.emit('ask-to-close-screen', targetvisitor);
    }
};

socket.on('close-screen', function() {
    isGetScreenShots = false;

        setTimeout(function () {
            image.src = '';
            document.querySelector('#Request-Screen-Sharing').setAttribute('data-hints', 'Request Screen Sharing');
        }, 1000);

        socket.emit('ask-to-close-screen', targetvisitor);
});

var image = document.getElementById('shared-screen-preview-image');

image.state = 'small';

image.onclick = function( ) {
    if(image.state == 'small') {
        image.state = 'large';
        image.setAttribute('style', 'width: 100%; height: 100%;');
        image.parentNode.setAttribute('style', 'position:fixed;top:0; left:0;z-index:10000;');
    }
    else {
        image.state = 'small';
        image.setAttribute('style', 'position:static;width: 50%; height: auto;z-index:0;');
        image.parentNode.setAttribute('style', 'top:auto; left:auto;');
    }
};

socket.on('screenshot', function (screenshot) {
    if (!isGetScreenShots) return;

    image.src = screenshot;
});

socket.on('ims', function (message) {
    appendChatMessage(message, 'Visitor', true);
});

socket.on('ims-failed', function (error) {
    alert(error);
});

socket.on('visitor-left', function (visitorid) {
    if (targetvisitor && targetvisitor == visitorid) {
        // socket.targetuser = null;
        socket.emit('update-agent-status', 'available');

    }

    /*added by Tu Tran 14:25, 19/9/2014*/
    //no active conversation -> display idle state
    document.getElementById('no-active-conversation').style.display = 'block';
    
    var userDIV = document.getElementById(visitorid);
    if(userDIV) {
        userDIV.parentNode.removeChild(userDIV);
    }
    
    alertify.set({
        delay: 2000
    });
    alertify.error('Visitor (' + visitorid + ') went offline. Checking other "waiting" visitors.');

    if (document.querySelector('.alertify-button-cancel')) {
        fireClickEvent(document.querySelector('.alertify-button-cancel'));
    }
});

function fireClickEvent(element) {
    var evt = new window.MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    element.dispatchEvent(evt);
}

var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
var RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

var MediaStream = window.MediaStream || window.webkitMediaStream;
var AudioContext = window.AudioContext || window.webkitAudioContext;

var isChrome = !!navigator.webkitGetUserMedia;
var isFirefox = !!navigator.mozGetUserMedia;

var chromeVersion = 50;
if (isChrome && navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]) {
    chromeVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);
}

var iceServers = [];

iceServers.push({
    url: 'stun:stun.l.google.com:19302'
});

if (isChrome && chromeVersion < 28) {
    iceServers.push({
        url: 'turn:homeo@turn.bistri.com:80?transport=udp',
        credential: 'homeo'
    });

    iceServers.push({
        url: 'turn:homeo@turn.bistri.com:80?transport=tcp',
        credential: 'homeo'
    });
}

if (isFirefox || (isChrome && chromeVersion < 28)) {
    iceServers.push({
        url: 'turn:turn.bistri.com:80?transport=udp',
        credential: 'homeo',
        username: 'homeo'
    });
}

if (isChrome && chromeVersion >= 28) {
    iceServers.push({
        url: 'turn:turn.bistri.com:80?transport=tcp',
        credential: 'homeo',
        username: 'homeo'
    });
}

iceServers = {
    iceServers: iceServers
};

var sdpConstraints = {
    optional: [],
    mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    }
};

function onSdpError(error) {
    console.error(error);
}

var peer;

function initPeer() {
    peer = new RTCPeerConnection(iceServers);
    if (localStream) peer.addStream(localStream);

    peer.onaddstream = function (event) {
        onstream(event);
    };

    peer.onicecandidate = function (event) {
        if (!event.candidate) return;

        socket.emit('candidate', {
            candidate: event.candidate,
            targetvisitor: targetvisitor
        });
    };
}

function createOffer() {
    peer.createOffer(function (sdp) {
        peer.setLocalDescription(sdp);

        socket.emit('sdp', {
            sdp: sdp,
            targetvisitor: targetvisitor
        });
    }, onSdpError, sdpConstraints);
}

function setRemoteDescription(remoteSdp) {
    peer.setRemoteDescription(new RTCSessionDescription(remoteSdp));
}

var localStream;

function captureVideo(callback) {
    if (localStream) return;
    if (!localStream) localStream = true;

    navigator.getMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    navigator.getMedia({
        audio: true,
        video: true
    }, function (stream) {
        localStream = stream;

        var video = document.createElement('video');
        video.src = URL.createObjectURL(stream);
        video.controls = true;
        video.style.height = 'auto';

        var myvideo = document.getElementsByClassName('myvideo')[0];
        myvideo.innerHTML = '';
        myvideo.insertBefore(video, myvideo.firstChild);
        video.play();
        
        document.getElementById('self-video-container').style.display = 'block';

        callback();
    }, function (error) {
        console.error(error);
    });
}

socket.on('plz-create-offer', function () {
    initPeer();
    createOffer();
});

socket.on('candidate', function (candidate) {
    peer.addIceCandidate(
        new RTCIceCandidate(candidate)
    );
});

socket.on('sdp', function (sdp) {
    setRemoteDescription(sdp);
});

function appendChatMessage(message, name, isVisitor) {
    var div = document.createElement('div');
    div.className = isVisitor ? 'text_visitor_div' : 'text_jason_div';
    div.innerHTML = '<h5>' + name + '</h5>';
    div.innerHTML += '<div class="text_record"><div class="text_record_lft">';
    div.innerHTML += '<p style="word-wrap: break-word">' + message + '</p>';
    div.innerHTML += '</div><div class="text_record_rgt">';
    div.innerHTML += '<p>' + getTime() + '</p>';
    div.innerHTML += '</div></div>';
    
    chatBox.appendChild(div);
    
    div.tabIndex = 0;
    div.focus();
    chatInputBox.focus();
    
    if(!listOfOldMessages[targetvisitor]) {
       listOfOldMessages[targetvisitor] = [];
    }
    
    listOfOldMessages[targetvisitor].push({
        isVisitor: isVisitor,
        innerHTML: div.innerHTML
    });
}

function getTime() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    
    if(hours < 10) {
        hours = '0' + hours;
    }
    if(minutes < 10) {
        minutes = '0' + minutes;
    }
    if(seconds < 10) {
        seconds = '0' + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
}

// Upon page load/login, should default agent to “Available”
document.querySelector('#agent-available').onclick();

var transferVisitor = document.getElementById('btn-transfer-visitor');
var byeButton = document.getElementById('btn-bye');
var selectAvailableAgents = document.getElementById('available-agents');

transferVisitor.onclick = function() {
    socket.emit('redirect-to-agent', {
        agentid: selectAvailableAgents.value,
        visitorid: targetvisitor,
        redirectedFrom: userid
    });
    
    socket.emit('update-agent-status', {
        userid: userid,
        status: 'available'
    });
};

byeButton.onclick = function() {
    socket.emit('bye-ims', {
        visitorid: targetvisitor,
        agentid: userid
    });
};

socket.on('returning-visitor', function(args) {
    appendVisitorIntoList(args);
    
    args.messages.forEach(function(arg) {
        appendChatMessage(arg.message, 'Visitor', !arg.isAgent)
    });
});

var listOfOldMessages = { };
var visitorsListBox = document.getElementById('visitors-list-box');

function appendVisitorIntoList(visitor) {
  if(document.getElementById(visitor.visitorid)) return;
  
  chatBox.innerHTML = '';
  appendChatMessage(visitor.visitorid + ' is ready for IMS.', 'System')
  
  var div = document.createElement('div');
  div.id = visitor.visitorid;
  div.className = 'portlet box red';
  div.innerHTML = '<div class="portlet-title"><h4><i class="icon-comments"></i>' + (visitor.href || 'Site Name') + '</h4><div class="tools"><a href="javascript:;" class="collapse"></a></div></div><div class="portlet-body"><div class="scroller" data-height="200px" data-always-visible="1" data-rail-visible="1"><p id="user-email">' + (visitor.email || 'No Email') + '</p><p>Number of Messages: <strong id="numberofmessages">0</strong></p></div></div>';
  
  visitorsListBox.appendChild(div);
  
  div.onclick = function() {
    targetvisitor = visitor.visitorid;
    // // chatBox -- appendChatMessage(message, name, isVisitor)
    socket.emit('get-unread-messages', visitor.visitorid);
    
    // list-of-old-messages variable keeps all old messages
    if(listOfOldMessages[visitor.visitorid]) {
      chatBox.innerHTML = '';
      listOfOldMessages[visitor.visitorid].forEach(function(message){
        var div = document.createElement('div');
        div.className = message.isVisitor ? 'text_visitor_div' : 'text_jason_div';
        div.innerHTML = message.innerHTML;
        chatBox.appendChild(div);
      });
    }
    
    Array.prototype.slice.call(div.getElementsByTagName('strong')).forEach(function(strong){
        if(strong.id == 'numberofmessages') {
            strong.innerHTML = '0';
        }
    });
  };
  
  Array.prototype.slice.call(div.getElementsByTagName('strong')).forEach(function(strong){
    if(strong.id == 'numberofmessages') {
      socket.on('number-of-unread-message', function(args) {
        if(args.visitorid == div.id) {
            strong.innerHTML = args.numberofmessages;
        }
      });
    }
  });
  
  totalChats.innerHTML = parseInt(totalChats.innerHTML) + 1;
  getVisitorInfo(visitor.cartRescue911_uid);
  
  document.getElementById('no-active-conversation').style.display = 'none';
}

socket.on('get-unread-messages', function(messages) {
  messages.forEach(function(message) {
    appendChatMessage(message, targetvisitor, true);
  });
});

// seconds-average-response-time -- minutes-average-chat-time
var totalChats = document.getElementById('total-chats');

socket.on('confirm-connected', function() {
    socket.emit('still-connected', userid);
});
