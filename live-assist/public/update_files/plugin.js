// plugin.js

(function () {
    var domainName =
        document.domain == 'jasonkorkin_prototype_cr911.jit.su' ? 'https://jasonkorkin_prototype_cr911.nodejitsu.com' : 'http://localhost:8080';

    if (document.domain.indexOf('localhost') == -1) {
        domainName = 'https://jasonkorkin_prototype_cr911.nodejitsu.com';
    }

    var directoryURI = domainName + '/update_files/';

    var scripts = document.getElementsByTagName('script');
    var myScript = scripts[scripts.length - 1];

    var queryString = myScript.src.replace(/^[^\?]+\??/, '');

    var params = parseQuery(queryString);

    function parseQuery(query) {
        var Params = new Object();
        if (!query) return Params; // return empty object
        var Pairs = query.split(/[;&]/);
        for (var i = 0; i < Pairs.length; i++) {
            var KeyVal = Pairs[i].split('=');
            if (!KeyVal || KeyVal.length != 2) continue;
            var key = unescape(KeyVal[0]);
            var val = unescape(KeyVal[1]);
            val = val.replace(/\+/g, ' ');
            Params[key] = val;
        }
        return Params;
    }

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
                // return;
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

    var sitekey = window.CR911_siteName || params.sitekey;

    var userid = getRandomString();

    // cookies stuff

    function createCookie(name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else var expires = "";
        document.cookie = name + "=" + value + expires + "; path=/";
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

    var cartRescue911_uid = readCookie('cartRescue911_uid');

    function CR911_Plugin() {


        function getFirstTag(element, tagName) {
            return element.getElementsByTagName(tagName)[0];
        }

        var targetagent;

        var body = document.body || document.documentElement;

        var isMobileDevice = navigator.userAgent && navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i);
        if (isMobileDevice) {
            // manually inject viewport if absent
            var hasViewport = false;
            Array.prototype.slice.call(document.getElementsByTagName('meta')).forEach(function (meta) {
                if (meta.name && meta.name == 'viewport') hasViewport = true;
            });
            if (!hasViewport) {
                var meta = document.createElement('meta');
                meta.name = 'viewport';
                meta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
                var head = getFirstTag(document, 'head');
                if (head) {
                    head.appendChild(meta);
                } else body.appendChild(meta);
            }
        }

        function loadPage(page, callback) {
            sendRequest(directoryURI + page, callback);
        }

        var style0 = document.createElement('link');
        style0.rel = 'stylesheet';
        style0.type = 'text/css';
        style0.href = directoryURI + 'style.css';
        document.documentElement.getElementsByTagName('head')[0].appendChild(style0);

        var style1 = document.createElement('link');
        style1.rel = 'stylesheet';
        style1.type = 'text/css';
        style1.href = directoryURI + 'images/fonts/fonts.css';
        document.documentElement.getElementsByTagName('head')[0].appendChild(style1);

        loadPage('chat_screen_page0.html', function (html) {
            var div = document.createElement('div');
            div.innerHTML = html;
            body.appendChild(div);

            document.getElementById('CR911-LA-header').onclick = function () {
                loadPage1(div);
            };
        });

        function loadPage1(div) {
            if (!RTCPeerConnection) {
                socket.emit('any-agent-available', {
                    visitorid: userid,
                    joinas: 'IMS'
                });
                return;
            }

            socket.emit('any-agent-available-precheck', {
                visitorid: userid,
                joinas: 'IMS',
                cartRescue911_uid: cartRescue911_uid
            });

            socket.on('agent-available-preanswer', function (agentAvailable) {
                if (!agentAvailable) {
                    onNoAgentAvailable();
                    return;
                }

                loadPage('chat_screen_page1.html', function (html) {
                    div.innerHTML = html;

                    document.getElementById('CR911-radio-video-chat').onchange =
                        document.getElementById('CR911-radio-text-chat').onchange = function () {
                            document.getElementById('CR911-radio-video-chat').checked = false;
                            document.getElementById('CR911-radio-text-chat').checked = false;
                            this.checked = true;
                        };

                    document.getElementById('lets-chat').onclick = function () {
                        checkToSeeIfAnyAgentAvailable();
                    };

                    document.getElementById('CR911-LA-header').onclick = function () {
                        var child = div.firstChild || div.childNodes[0];

                        var clostBtn = document.getElementById('CR911-LA-x');

                        if (getFirstTag(clostBtn, 'img').src.indexOf('images/close.png') != -1) {
                            child.style.bottom = '-' + (child.clientHeight - 30) + 'px';
                            getFirstTag(clostBtn, 'img').src = directoryURI + 'images/upArrow.png';
                        } else {
                            child.style.bottom = '0';
                            getFirstTag(clostBtn, 'img').src = directoryURI + 'images/close.png';
                        }
                    };
                });
            });
        }

        function loadPage8(div, onPageLoaded) {
            // text-only conversation
            loadPage('chat_screen_page8.html', function (html) {
                div.innerHTML = html;

                appendSystemMessage('Trying to connect with the agent. Please wait a few seconds.');

                document.getElementById('CR911-send-chat-message').onclick = function () {
                    var value = document.getElementById('CR911-input-chat-message').value;

                    // removing trailing/leading whitespace
                    value = value.replace(/^\s+|\s+$/g, '');

                    // checking for value length
                    if (!value.length) {
                        return;
                    }

                    appendCustomerMessage(value);
                    emitMessage(value);

                    document.getElementById('CR911-input-chat-message').value = '';
                };

                document.getElementById('CR911-input-chat-message').onkeyup = function (e) {
                    var keyCode = (window.event) ? e.which : e.keyCode;
                    if (keyCode == 13) {
                        document.getElementById('CR911-send-chat-message').onclick();
                    }
                };

                document.getElementById('CR911-LA-header').onclick = function () {
                    var child = div.firstChild || div.childNodes[0];

                    var clostBtn = document.getElementById('CR911-LA-x');

                    if (getFirstTag(clostBtn, 'img').src.indexOf('images/close.png') != -1) {
                        child.style.bottom = '-' + (child.clientHeight - 30) + 'px';
                        getFirstTag(clostBtn, 'img').src = 'images/upArrow.png';
                    } else {
                        child.style.bottom = '0';
                        getFirstTag(clostBtn, 'img').src = 'images/close.png';
                    }
                };

                if (onPageLoaded) onPageLoaded();
            });
        }

        function loadPage9(div, onPageLoaded) {
            // text+audio conversation
            loadPage('chat_screen_page9.html', function (html) {
                div.innerHTML = html;

                appendSystemMessage('Trying to connect with the agent. Please wait a few seconds.');

                document.getElementById('CR911-send-chat-message').onclick = function () {
                    var value = document.getElementById('CR911-input-chat-message').value;

                    appendCustomerMessage(value);
                    emitMessage(value);

                    document.getElementById('CR911-input-chat-message').value = '';
                };

                document.getElementById('CR911-input-chat-message').onkeyup = function (e) {
                    var keyCode = (window.event) ? e.which : e.keyCode;
                    if (keyCode == 13) {
                        document.getElementById('CR911-send-chat-message').onclick();
                    }
                };

                document.getElementById('CR911-LA-header').onclick = function () {
                    var child = div.firstChild || div.childNodes[0];

                    var clostBtn = document.getElementById('CR911-LA-x');

                    if (getFirstTag(clostBtn, 'img').src.indexOf('images/close.png') != -1) {
                        child.style.bottom = '-' + (child.clientHeight - 30) + 'px';
                        getFirstTag(clostBtn, 'img').src = 'images/upArrow.png';
                    } else {
                        child.style.bottom = '0';
                        getFirstTag(clostBtn, 'img').src = 'images/close.png';
                    }
                };

                if (onPageLoaded) onPageLoaded();
            });
        }

        function appendAgentMessage(agentid, message) {
            var div = document.createElement('div');
            div.className = 'CR911-LA-online_chat_mess';
            // div.innerHTML = '<img src="' + domainName + '/update_files/images/janeline.png" alt="" />';
            div.innerHTML = '<div class="CR911-LA-online_chat_text">';
            div.innerHTML += '<h4 class="suport">System</h4><div class="CR911-LA-showing_text_whithoutBox">';
            div.innerHTML += '<p style="word-wrap: break-word">' + message + '</p>';
            div.innerHTML += '</div></div>';

            document.getElementById('CR911-LA-scroll').appendChild(div);
            
            div.tabIndex = 0;
            div.focus();
            if(document.getElementById('CR911-input-chat-message')) {
                document.getElementById('CR911-input-chat-message').focus();
            }
        }

        function appendCustomerMessage(message) {
            var div = document.createElement('div');
            div.className = 'CR911-LA-online_chat_mess_you';
            div.innerHTML += '<div class="CR911-LA-online_chat_text_full_width">';
            div.innerHTML += '<h4 class="you">You</h4><div class="CR911-LA-showing_text_whithoutBox">';
            div.innerHTML += '<p style="word-wrap: break-word">' + message + '</p>';
            div.innerHTML += '</div></div>';

            document.getElementById('CR911-LA-scroll').appendChild(div);
            
            div.tabIndex = 0;
            div.focus();
            if(document.getElementById('CR911-input-chat-message')) {
                document.getElementById('CR911-input-chat-message').focus();
            }
        }

        function appendSystemMessage(message) {
            var div = document.createElement('div');
            div.className = 'CR911-LA-online_chat_mess_you';
            div.innerHTML += '<div class="CR911-LA-online_chat_text_full_width">';
            div.innerHTML += '<h4 class="you">System</h4><div class="CR911-LA-showing_text_whithoutBox">';
            div.innerHTML += '<p>' + message + '</p>';
            div.innerHTML += '</div></div>';

            if (document.getElementById('CR911-LA-scroll')) {
                document.getElementById('CR911-LA-scroll').appendChild(div);
            } else if(document.getElementsByClassName('CR911-LA-moreinfo')[0]) {
                document.getElementsByClassName('CR911-LA-moreinfo')[0].appendChild(div);
            }
            else {
                var div = document.getElementById('CR911-LA-moreinfo');
                if (!div) div = document.getElementById('CR911-LA-live_chat_support');
                if (!div) div = document.getElementById('CR911-LA-offline_div');
                if (!div) {
                    if (document.getElementById('CR911-radio-video-chat')) {
                        div = document.getElementById('CR911-radio-video-chat').parentNode.parentNode.parentNode.parentNode;
                    } else throw 'No such <DIV>';
                }
            
                loadPage8(div, function() {
                    appendSystemMessage(message);
                });
            }
            
            div.tabIndex = 0;
            div.focus();
            if(document.getElementById('CR911-input-chat-message')) {
                document.getElementById('CR911-input-chat-message').focus();
            }
        }

        var status = 'waiting';

        // socket stuff

        var io_uri = domainName + '/?userid=' + userid + '&status=' + status + '&sitekey=' + sitekey;

        io_uri = io_uri.replace(/@/g, '---at---');
        console.log('line 398 io_uri');
        console.log(io_uri);
        var socket = io.connect(io_uri, {
            'reconnect': true,
            'reconnection delay': 500,
            'max reconnection attempts': 10
        });

        socket.on('test',function(data){

            console.log('data-test');
            console.log(data);
        })
         //fix me change variable cartRescue911_uid form db

        if (!cartRescue911_uid) {
            createCookie('cartRescue911_uid', '546eaca6-07698c-a7c2c3-2e0a-000421', 365);
            cartRescue911_uid = readCookie('cartRescue911_uid');
        }

        cartRescue911_uid = {
            cartRescue911_uid: cartRescue911_uid,
            href: location.href,
            title: document.title,
            domain: document.domain,
            browserData: getBrowserData(),
            OSName: getOSName()
        };

        if (readCookie(sitekey + '-userid')) {
            socket.emit('returning-visitor', {
                visitorid: readCookie(sitekey + '-userid'),
                agentid: readCookie(sitekey + '-agentid'),
                cartRescue911_uid: cartRescue911_uid
            });
        }

        socket.on('agent-available', function (agentid) {
            targetagent = agentid;

            var div = document.getElementById('CR911-LA-moreinfo');
            if (!div) div = document.getElementById('CR911-LA-live_chat_support');
            if (!div) div = document.getElementById('CR911-LA-offline_div');
            if (!div) {
                if (document.getElementById('CR911-radio-video-chat')) {
                    div = document.getElementById('CR911-radio-video-chat').parentNode.parentNode.parentNode.parentNode;
                } else throw 'No such <DIV>';
            }

            if (document.getElementById('CR911-radio-video-chat')) {
                if (document.getElementById('CR911-radio-video-chat').checked) {
                    loadPage9(div);
                } else loadPage8(div);
            } else {
                if (socket.joinas == 'IMS + Audio') {
                    loadPage9(div);
                } else loadPage8(div);
            }

            createCookie(sitekey + '-agentid', agentid, 365);
        });

        socket.on('no-agent-available', function () {
            onNoAgentAvailable();
        });

        function onNoAgentAvailable() {
            socket.emit('update-visitor-status', 'waiting');
            loadPage3();
        }
        
        function loadPage3() {
            loadPage('chat_screen_page3.html', function (html) {
                var div = document.getElementById('CR911-LA-moreinfo');
                if (!div) div = document.getElementById('CR911-LA-live_chat_support');

                div.innerHTML = html;
                body.appendChild(div);

                document.getElementById('CR911-LA-header').onclick = function () {
                    var child = div.firstChild || div.childNodes[0];

                    var clostBtn = document.getElementById('CR911-LA-x');

                    if (getFirstTag(clostBtn, 'img').src.indexOf('images/close.png') != -1) {
                        child.style.bottom = '-' + (child.clientHeight - 30) + 'px';
                        getFirstTag(clostBtn, 'img').src = 'images/upArrow.png';
                    } else {
                        child.style.bottom = '0';
                        getFirstTag(clostBtn, 'img').src = 'images/close.png';
                    }
                };
            });
        }

        socket.on('rejected', function () {
            appendSystemMessage('Unfortunately the agent rejected request. He may have some urgent works. We are going to navigate you to email form in 5 seconds. You can stay on this page and new-available agent will auto contact you.');
            setTimeout(function () {
                appendSystemMessage('4 seconds to open email-form.');
                setTimeout(function () {
                    appendSystemMessage('3 seconds to open email-form.');
                    setTimeout(function () {
                        appendSystemMessage('2 seconds to open email-form.');
                        setTimeout(function () {
                            appendSystemMessage('1 second to open email-form.');
                            loadPage3();
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 1000);
            setTimeout(onNoAgentAvailable, 5000);
        });

        function launchFullscreen(element) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        }

        socket.on('visitor-mediaconnection-accepted', function (agentid) {
            targetagent = agentid;
            joinWithAudio();
        });

        socket.on('visitor-mediaconnection-rejected', function () {
            alert('Sorry Sir, agent excused to share his video. Please continue IMS.');
        });

        socket.on('join-me', function (args) {
            targetagent = args.agentid;

            if (document.getElementById('CR911-input-chat-message')) {
                document.getElementById('CR911-input-chat-message').disabled = false;
                document.getElementById('CR911-input-chat-message').focus();
                document.getElementById('CR911-send-chat-message').disabled = false;
            }

            appendSystemMessage('Agent is ready to chat with you.');

            if (args.joinas == 'IMS + Audio') {
                socket.emit('share-media', {
                    agentid: args.agentid,
                    visitorid: userid
                });
            }
        });

        socket.on('join-me-again', function (args) {
            targetagent = args.agentid;

            var div = document.getElementById('CR911-LA-moreinfo');
            if (!div) div = document.getElementById('CR911-LA-live_chat_support');
            if (!div) div = document.getElementById('CR911-LA-offline_div');
            if (!div) {
                if (document.getElementById('CR911-radio-video-chat')) {
                    div = document.getElementById('CR911-radio-video-chat').parentNode.parentNode.parentNode.parentNode;
                } else throw 'No such <DIV>';
            }

            if (document.getElementById('CR911-radio-video-chat')) {
                if (document.getElementById('CR911-radio-video-chat').checked) {
                    loadPage9(div);
                } else loadPage8(div, onPageLoaded);
            } else {
                if (socket.joinas == 'IMS + Audio') {
                    loadPage9(div, onPageLoaded);
                } else loadPage8(div, onPageLoaded);
            }

            function onPageLoaded() {
                if (document.getElementById('CR911-input-chat-message')) {
                    document.getElementById('CR911-input-chat-message').disabled = false;
                    document.getElementById('CR911-input-chat-message').focus();
                    document.getElementById('CR911-send-chat-message').disabled = false;
                }

                if (args.joinas == 'IMS + Audio') {
                    socket.emit('share-media', {
                        agentid: args.agentid,
                        visitorid: userid
                    });
                }

                args.messages.forEach(function (arg) {
                    if (arg.isAgent) {
                        appendAgentMessage('Agent', arg.message);
                    } else appendCustomerMessage(arg.message);
                });
            }

            createCookie(sitekey + '-agentid', args.agentid, 365);
        });


        function emitMessage(message) {
            socket.emit('ims', {
                message: message,
                agentid: targetagent
            });
        }

        function checkToSeeIfAnyAgentAvailable() {
            socket.joinas = document.getElementById('CR911-radio-video-chat').checked ? 'IMS + Audio' : 'IMS';
            socket.emit('any-agent-available', {
                visitorid: userid,
                joinas: socket.joinas,
                cartRescue911_uid: cartRescue911_uid
            });
        }

        socket.on('ims', function (message) {
            appendAgentMessage('Agent', message);
        });

        socket.on('ims-failed', function (error) {
            alert(error);
        });

        socket.on('agent-left', function (agentid) {
            if (targetagent && targetagent == agentid) {
                targetagent = null;
                socket.emit('update-visitor-status', 'waiting');
            }
        });

        var isShareScreen = false;
        socket.on('share-screen', function () {
            document.getElementById('CR911-LA-screen-notification').style.display = 'block';
            var bottom = -62;
            (function selfInvoker() {
                document.getElementById('CR911-LA-screen-notification').style.bottom = bottom + 'px';
                bottom++;
                if (bottom <= 0) setTimeout(selfInvoker, 10);
            })();

            document.getElementById('CR911-LA-yes').onclick = function () {
                shareMyScreen();
                closeInvoker();
            };
            document.getElementById('CR911-LA-no').onclick = function () {
                socket.emit('visitor-stopped-screen', targetagent);
                closeInvoker();
            };

            function closeInvoker() {
                var bottom = 0;
                (function selfInvoker() {
                    document.getElementById('CR911-LA-screen-notification').style.bottom = bottom + 'px';
                    bottom--;
                    if (bottom >= -62) setTimeout(selfInvoker, 1);
                    else {
                        document.getElementById('CR911-LA-screen-notification').style.display = 'none';
                    }
                })();
            }
        });

        function shareMyScreen() {
            document.getElementById('CR911-LA-screen-ON').style.display = 'block';

            document.getElementById('CR911-LA-x-screen').onclick = function () {
                socket.emit('visitor-stopped-screen', targetagent);
                document.getElementById('CR911-LA-screen-ON').style.display = 'none';
            };

            isShareScreen = true;
        }

        var partOfScreenInProgress = false;

        function sharePartOfScreen(pageX, pageY) {
            takeScreenshot('body', function (screenshot) {
                if (lastScreenshot !== screenshot) {
                    lastScreenshot = screenshot;
                    socketScreenEmitter.emit('screenshot', {
                        agentid: targetagent,
                        screenshot: screenshot
                    });
                }
                partOfScreenInProgress = false;
            }, {
                x: pageX,
                y: pageY
            });
        }

        socket.on('close-screen', function () {
            isShareScreen = false;
        });

        window.addEventListener('mousemove', function (event) {
            if (!targetagent || !isShareScreen) return;
            if (!partOfScreenInProgress) {
                partOfScreenInProgress = true;
                sharePartOfScreen(event.pageX, event.pageY);
            }
        });

        var socketScreenEmitter = io.connect(domainName + '/');

        var lastScreenshot = '';
        
        var cursorImage;

        function takeScreenshot(element, callback, coords) {
            if (!element || !callback) throw 'Invalid number of arguments.';

            if (!window.html2canvas) {
                return load_CR911_Scripts(directoryURI + 'screenshot.js', function () {
                    takeScreenshot(element, callback, coords);
                });
            }

            if (typeof element == 'string') {
                element = document.querySelector(element);
                if (!element) element = document.getElementById(element);
            }
            if (!element) throw 'HTML Element is inaccessible!';

            if (!cursorImage) {
                cursorImage = new Image(25, 25);
            }
            cursorImage.src = domainName + '/update_files/images/cursor.png';

            // html2canvas.js is used to take screenshots
            html2canvas(element, {
                onrendered: function (canvas) {
                    var context = canvas.getContext('2d');
                    context.drawImage(cursorImage, coords.x, coords.y, 25, 25);
                    callback(canvas.toDataURL());
                }
            });
        }

        var localStream;

        function joinWithAudio() {
            if (localStream) return;
            if (!localStream) localStream = true;

            navigator.getMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            navigator.getMedia({
                audio: true
            }, function (stream) {
                localStream = stream;

                socket.emit('plz-create-offer', {
                    targetagent: targetagent
                });
            }, function (error) {
                console.error(error);
            });
        }

        var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
        var RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

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

        iceServers.push({
            url: 'stun:stun.anyfirewall.com:3478'
        });

        iceServers.push({
            url: 'turn:turn.bistri.com:80',
            credential: 'homeo',
            username: 'homeo'
        });

        iceServers.push({
            url: 'turn:turn.anyfirewall.com:443?transport=tcp',
            credential: 'webrtc',
            username: 'webrtc'
        });

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
                var video = document.createElement('video');
                video.src = URL.createObjectURL(event.stream);

                video.style.width = '100%';
                video.onclick = function () {
                    launchFullscreen(video);
                };
                document.getElementById('CR911-LA-online_pic_thum').innerHTML = '';
                document.getElementById('CR911-LA-online_pic_thum').appendChild(video);

                video.play();
            };

            peer.onicecandidate = function (event) {
                if (!event.candidate) return;

                socket.emit('candidate', {
                    candidate: event.candidate,
                    targetagent: targetagent
                });
            };
        }

        function createAnswer() {
            peer.createAnswer(function (sdp) {
                peer.setLocalDescription(sdp);

                socket.emit('sdp', {
                    sdp: sdp,
                    targetagent: targetagent
                });
            }, onSdpError, sdpConstraints);
        }

        function setRemoteDescription(remoteSdp) {
            peer.setRemoteDescription(new RTCSessionDescription(remoteSdp), function() {
                // sdp success
            }, function(error) {
                console.error(error);
            });
        }

        socket.on('sdp', function (sdp) {
            initPeer();
            setRemoteDescription(sdp);
            createAnswer();
        });

        socket.on('candidate', function (candidate) {
            peer.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
        });

        socket.on('agent-closed-ims', function () {
            loadPage('chat_screen_page3.html', function (html) {
                var div = document.getElementById('CR911-LA-moreinfo');
                if (!div) div = document.getElementById('CR911-LA-live_chat_support');

                div.innerHTML = html;
                body.appendChild(div);

                document.getElementById('CR911-LA-header').onclick = function () {
                    var child = div.firstChild || div.childNodes[0];

                    var clostBtn = document.getElementById('CR911-LA-x');

                    if (getFirstTag(clostBtn, 'img').src.indexOf('images/close.png') != -1) {
                        child.style.bottom = '-' + (child.clientHeight - 30) + 'px';
                        getFirstTag(clostBtn, 'img').src = 'images/upArrow.png';
                    } else {
                        child.style.bottom = '0';
                        getFirstTag(clostBtn, 'img').src = 'images/close.png';
                    }
                };
            });
        });
        
        socket.on('confirm-connected', function() {
            socket.emit('still-connected', userid);
        });
    }

    function load_CR911_Scripts(src, onload) {
        var script = document.createElement('script');
        script.src = src;
        if (onload) script.onload = onload;
        document.documentElement.appendChild(script);
    }

    function getBrowserData() {
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browserName = navigator.appName;
        var fullVersion = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // In Opera, the true version is after "Opera" or after "Version"
        if ((verOffset = nAgt.indexOf("Opera")) != -1) {
            browserName = "Opera";
            fullVersion = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf("Version")) != -1)
                fullVersion = nAgt.substring(verOffset + 8);
        }
        // In MSIE, the true version is after "MSIE" in userAgent
        else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
            browserName = "Microsoft Internet Explorer";
            fullVersion = nAgt.substring(verOffset + 5);
        }
        // In Chrome, the true version is after "Chrome" 
        else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
            browserName = "Chrome";
            fullVersion = nAgt.substring(verOffset + 7);
        }
        // In Safari, the true version is after "Safari" or after "Version" 
        else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
            browserName = "Safari";
            fullVersion = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf("Version")) != -1)
                fullVersion = nAgt.substring(verOffset + 8);
        }
        // In Firefox, the true version is after "Firefox" 
        else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
            browserName = "Firefox";
            fullVersion = nAgt.substring(verOffset + 8);
        }
        // In most other browsers, "name/version" is at the end of userAgent 
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
            (verOffset = nAgt.lastIndexOf('/'))) {
            browserName = nAgt.substring(nameOffset, verOffset);
            fullVersion = nAgt.substring(verOffset + 1);
            if (browserName.toLowerCase() == browserName.toUpperCase()) {
                browserName = navigator.appName;
            }
        }
        // trim the fullVersion string at semicolon/space if present
        if ((ix = fullVersion.indexOf(";")) != -1)
            fullVersion = fullVersion.substring(0, ix);
        if ((ix = fullVersion.indexOf(" ")) != -1)
            fullVersion = fullVersion.substring(0, ix);

        majorVersion = parseInt('' + fullVersion, 10);
        if (isNaN(majorVersion)) {
            fullVersion = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        return {
            browserName: browserName,
            fullVersion: fullVersion,
            majorVersion: majorVersion,
            appName: navigator.appName,
            userAgent: navigator.userAgent
        };
    }

    function getOSName() {
        var OSName = "Unknown OS";
        if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
        if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
        if (navigator.appVersion.indexOf("X11") != -1) OSName = "UNIX";
        if (navigator.appVersion.indexOf("Linux") != -1) OSName = "Linux";

        return OSName;
    }

    function invoke_CR911_Plugin() {
        if (readCookie(sitekey + '-userid')) {
            userid = readCookie(sitekey + '-userid');
        }

        !readCookie(sitekey + '-userid') && sendRequest('//dev.ping.cartrescue911.com/n/getuser/' + sitekey + '/' + cartRescue911_uid, function (data) {
            console.log('plugin.js - line 979', data);
            if(data && data.length) {
                var data = JSON.parse(data);
                if (!data.user) {
                    data = JSON.parse(data);
                }
                var user = data.user;

                if (user) {
                    userid = user.email;
                    createCookie(sitekey + '-userid', userid, 365);
                }
            }

            CR911_Plugin();
        });

        if (readCookie(sitekey + '-userid')) {
            CR911_Plugin();
            createCookie(sitekey + '-userid', userid, 365);
        }
    }

    if (!window.io) {
        load_CR911_Scripts(directoryURI + 'socket.io.js', invoke_CR911_Plugin);
    } else invoke_CR911_Plugin();
})();
