var fs = require('fs');

// node-static is optional
// it can easily be switched to expressjs or any other framework
var _static = require('node-static');
var file = new _static.Server('./public', {
    cache: false
});

var app = require('http').createServer(serverCallback);

function serverCallback(request, response) {
    request.addListener('end', function () {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        file.serve(request, response);
    }).resume();
}

var sites = {};

var io = require('socket.io').listen(app, {
    log: false,
    origins: '*:*'
});

// use websocket if available
// otherwise switch to XHR-polling
// otherwise switch to jsonp-polling
io.set('transports', [
    // 'websocket',
    'xhr-polling',
    'jsonp-polling'
]);

// io.set('heartbeat timeout', 10);
// io.set('heartbeat interval', 4);

io.sockets.on('connection', function (socket) {
    console.log('connect-here');
    console.log(socket.handshake.query)
    // data passed from the users


    var userid = socket.handshake.query.userid.replace(/---at---/g, '@');
    var status = socket.handshake.query.status;
    var sitekey = socket.handshake.query.sitekey;


    

    // each user is part of a site
    if (!sites[sitekey]) {
        sites[sitekey] = {
            visitors: {},
            agents: {}
        };
    }
    

   
    //----------------------------------------------------
    //---- common
    //----------------------------------------------------
    
    socket.on('message', function (message) {
        // if message is sent from site XXX,
        // broadcast it over that site XXX-only.
        var site = sites[sitekey];
        console.log('message');
        console.log(site);

        for (var agent in site.agents) {
            site.agents[agent].socket.emit('message', message);
        }

        for (var visitor in site.visitors) {
            site.visitors[visitor].socket.emit('message', message);
        }
    });
    
    // it is text conversation
    socket.on('ims', function (args) {
        console.log('ims');
        console.log(sites);
         socket.emit('test',{sites:'1sites'});
        // if sender is agent
        if (args.visitorid) {
            var visitor = sites[sitekey].visitors[args.visitorid];
            if (visitor) {
                visitor.socket.emit('ims', args.message);
            } else socket.emit('ims-failed', 'No such visitor.');
            
            if(sites[sitekey].agents[userid].job[args.visitorid]) {
                sites[sitekey].agents[userid].job[args.visitorid].messages.push({
                    message: args.message,
                    isAgent: true
                });

            }
        }

        // if sender is visitor
        if (args.agentid) {
            var agent = sites[sitekey].agents[args.agentid];

            if (agent) {
                if(sites[sitekey].agents[args.agentid].job[userid]) {
                    sites[sitekey].agents[args.agentid].job[userid].messages.push({
                        message: args.message,
                        isAgent: false
                    });
                }
                
                if (agent.activejob == userid) {
                    agent.socket.emit('ims', args.message);
                } else {
                    // number of unread messages
                    if (!agent.unreadmessages[userid]) {
                        sites[sitekey].agents[args.agentid].unreadmessages[userid] = [];
                    }
                    sites[sitekey].agents[args.agentid].unreadmessages[userid].push(args.message);
                    sites[sitekey].agents[args.agentid].socket.emit('number-of-unread-message', {
                        numberofmessages: sites[sitekey].agents[args.agentid].unreadmessages[userid].length,
                        visitorid: userid
                    });
                }
            } else socket.emit('ims-failed', 'No such agent.');
        }
    });
    
    // if socket disconnects, remove users' stored data
    socket.on('disconnect', function () {
        if (!sites[sitekey]) return;
        
                    if(sites[sitekey].agents[userid]) {
                        propagateAgentStatusToVisitors('agent-left');
                        delete sites[sitekey].agents[userid];
                    }
                    
                    
                    var visitor = sites[sitekey].visitors[userid];
                    if(visitor) {
                        if(sites[sitekey].agents[visitor.agentid]) {
                            sites[sitekey].agents[visitor.agentid].socket.emit(
                                'visitor-left',
                                userid
                            );
                        }
                        delete sites[sitekey].visitors[userid];
                    }
        
        return;
        
        // wait a user for 1-minutes;
        // if he is still disconnected; consider him left.
        
       // setTimeout(onUserLeft, 5 * 1000);
        setTimeout(onUserLeft, 2 * 1000);
    });
    
    socket.on('still-connected', function(userid) {
        console.log('still-connected')
        console.log(userid);
        if (sites[sitekey].agents[userid]) {
            sites[sitekey].agents[userid].stillConnected = true;
        }
        
        if (sites[sitekey].visitors[userid]) {
            sites[sitekey].visitors[userid].stillConnected = true;
        }
    });
    
    function onUserLeft() {
        // if agent is disconnected
        if (sites[sitekey].agents[userid]) {
            // ask agent to confirm if he is still connected
            socket.emit('confirm-connected');
        
            // wait a user for 20-seconds;
            // if he is still disconnected; consider him left.
            setTimeout(function() {
                console.log('stillConnected');
                console.log(sites[sitekey].agents[userid].stillConnected);
                if(!sites[sitekey].agents[userid].stillConnected) {
                    propagateAgentStatusToVisitors('agent-left');
                    delete sites[sitekey].agents[userid];
                }
                else sites[sitekey].agents[userid].stillConnected = false;
            }, 3 * 1000);
        }

        // if visitor is disconnected
        if (sites[sitekey].visitors[userid]) {
            // ask visitor to confirm if he is still connected
            socket.emit('confirm-connected');
        
            // wait a user for 20-seconds;
            // if he is still disconnected; consider him left.
            setTimeout(function() {
                if(!sites[sitekey].visitors[userid].stillConnected) {
                    for(var agent in sites[sitekey].agents) {
                        if(sites[sitekey].agents[agent].job[userid]) {
                            sites[sitekey].agents[agent].job[userid].closed = true;
                            sites[sitekey].agents[agent].job[userid].endedAt = new Date();
                        }
                    }
                    
                    var visitor = sites[sitekey].visitors[userid];
                    if(sites[sitekey].agents[visitor.agentid]) {
                        sites[sitekey].agents[visitor.agentid].socket.emit(
                            'visitor-left',
                            userid
                        );
                    }
                    delete sites[sitekey].visitors[userid];
                }
                else sites[sitekey].visitors[userid].stillConnected = false;
            }, 3 * 1000);
        }
    }
    
    //----------------------------------------------------
    //---- visitors
    //----------------------------------------------------
    
    socket.on('update-visitor-status', function (status) {
        sites[sitekey].visitors[userid].status = status;
    });

    socket.on('any-agent-available-precheck', function (args) {
        if (!sites[sitekey].visitors[args.visitorid]) {
            sites[sitekey].visitors[args.visitorid] = {
                userid: args.visitorid,
                status: 'waiting',
                joinas: args.joinas,
                socket: socket,
                agentid: 'none',
                cartRescue911_uid: args.cartRescue911_uid
            };
        }
        
        var isAgentAvailable = false;
        for (var a in sites[sitekey].agents) {
            var agent = sites[sitekey].agents[a];
            if (agent.status == 'available' && !agent.job[args.visitorid] && sites[sitekey].visitors[args.visitorid].status == 'waiting') {
                isAgentAvailable = true;
                continue;
            }
        }
        socket.emit('agent-available-preanswer', isAgentAvailable);
    });

    socket.on('any-agent-available', function (args) {
        if (!sites[sitekey].visitors[args.visitorid]) {
            sites[sitekey].visitors[args.visitorid] = {
                userid: args.visitorid,
                status: 'waiting',
                joinas: args.joinas,
                socket: socket,
                agentid: 'none',
                cartRescue911_uid: args.cartRescue911_uid
            };
        }

        var isAgentAvailable = false;
        for (var a in sites[sitekey].agents) {
            var agent = sites[sitekey].agents[a];
            if (agent.status == 'available' && !agent.job[args.visitorid] && sites[sitekey].visitors[args.visitorid].status == 'waiting') {

                sites[sitekey].visitors[args.visitorid].status = 'busy';
                sites[sitekey].agents[agent.userid].status = 'busy';

                sites[sitekey].agents[agent.userid].socket.emit('status-changed', 'busy');

                socket.emit('agent-available', agent.userid);
                agent.socket.emit('visitor-available', {
                    visitorid: args.visitorid,
                    joinas: args.joinas,
                    agents: getAgentsArray(),
                    cartRescue911_uid: args.cartRescue911_uid
                });
                isAgentAvailable = true;
                continue;
            }
        }

        if (!isAgentAvailable) {
            socket.emit('no-agent-available');
        }
    });

    socket.on('visitor-stopped-screen', function (agentid) {
        var agent = sites[sitekey].agents[agentid];
        if (agent) {
            agent.socket.emit('close-screen');
        }
    });

    socket.on('screenshot', function (args) {
        var agent = sites[sitekey].agents[args.agentid];
        if (agent) {
            agent.socket.emit('screenshot', args.screenshot);
        }
    });

    socket.on('share-media', function (args) {
        var agent = sites[sitekey].agents[args.agentid];
        if (agent) {
            agent.socket.emit('share-media', args.visitorid);
        }
    });

    socket.on('coordiantes', function (args) {
        var agent = sites[sitekey].agents[args.agentid];
        if (agent) {
            agent.socket.emit('coordiantes', {
                x: args.x,
                y: args.y
            });
        }
    });
    
    //----------------------------------------------------
    //---- WebRTC
    //----------------------------------------------------

    socket.on('candidate', function (args) {
        if (!sites[sitekey]) return;

        if (sites[sitekey].agents[args.targetagent]) {
            sites[sitekey].agents[args.targetagent].socket.emit('candidate', args.candidate);
        }

        if (sites[sitekey].visitors[args.targetvisitor]) {
            sites[sitekey].visitors[args.targetvisitor].socket.emit('candidate', args.candidate);
        }
    });

    socket.on('sdp', function (args) {
        if (!sites[sitekey]) return;

        if (sites[sitekey].agents[args.targetagent]) {
            sites[sitekey].agents[args.targetagent].socket.emit('sdp', args.sdp);
        }

        if (sites[sitekey].visitors[args.targetvisitor]) {
            sites[sitekey].visitors[args.targetvisitor].socket.emit('sdp', args.sdp);
        }
    });

    socket.on('plz-create-offer', function (args) {
        if (!sites[sitekey]) return;

        if (sites[sitekey].agents[args.targetagent]) {
            sites[sitekey].agents[args.targetagent].socket.emit('plz-create-offer');
        }

        if (sites[sitekey].visitors[args.targetvisitor]) {
            sites[sitekey].visitors[args.targetvisitor].socket.emit('plz-create-offer');
        }
    });
    
    socket.on('returning-visitor', function(args) {
        var agent   = sites[sitekey].agents[args.agentid];
        var visitor = sites[sitekey].visitors[args.visitorid];
        
        if(agent && agent.job[args.visitorid] && !agent.job[args.visitorid].closed) {
            if (!sites[sitekey].visitors[args.visitorid]) {
                sites[sitekey].visitors[args.visitorid] = {
                    userid: args.visitorid,
                    status: 'waiting',
                    joinas: sites[sitekey].agents[args.agentid].job[args.visitorid].joinas,
                    cartRescue911_uid: args.cartRescue911_uid,
                    socket: socket,
                    agentid: 'none'
                };
            }
        
            sites[sitekey].agents[args.agentid].status = 'busy';
            sites[sitekey].visitors[args.visitorid].status = 'busy';
            sites[sitekey].visitors[args.visitorid].agentid = args.agentid;

            sites[sitekey].agents[args.agentid].socket.emit('status-changed', 'busy');
            
            sites[sitekey].agents[args.agentid].socket.emit('returning-visitor', {
                visitorid: args.visitorid,
                cartRescue911_uid: args.cartRescue911_uid,
                messages: sites[sitekey].agents[args.agentid].job[args.visitorid].messages
            });

            sites[sitekey].visitors[args.visitorid].socket.emit('join-me-again', {
                agentid: args.agentid,
                joinas: sites[sitekey].agents[args.agentid].job[args.visitorid].joinas,
                messages: sites[sitekey].agents[args.agentid].job[args.visitorid].messages
            });

            sites[sitekey].agents[args.agentid].activejob = args.visitorid;
        }
    });
    
    //----------------------------------------------------
    //---- agents
    //----------------------------------------------------
    socket.on('returning-agent', function(agentid) {
        if(sites[sitekey].agents[agentid]) {
            sites[sitekey].agents[agentid].stillConnected = true;
        }
    });
    
    socket.on('agent-online', function (agentid) {
        if(sites[sitekey].agents[agentid]) {
            var activejob = sites[sitekey].agents[agentid].activejob;
            if(sites[sitekey].visitors[activejob]) {
                socket.emit('visitor-connected', {
                    visitorid: activejob,
                    cartRescue911_uid: sites[sitekey].visitors[activejob].cartRescue911_uid
                });
            }
            return;
        }
        
        sites[sitekey].agents[agentid] = {
            userid: agentid,
            status: status,
            socket: socket,
            job: {},
            activejob: 'none',
            unreadmessages: {}
        };

        checkWaitingVisitor();
    });
    
    socket.on('update-agent-status', function (status) {

      
        

       

        if (status == 'available') {
            console.log(status);
            console.log(sites[sitekey].agents[userid]);
            console.log('--------');
             console.log(sites[sitekey]);
            sites[sitekey].agents[userid].status = status;
            socket.emit('status-changed', status);
            for (var v in sites[sitekey].visitors) {
                if (sites[sitekey].visitors[v].status == 'waiting' && !sites[sitekey].agents[userid].job[v]) {

                    sites[sitekey].visitors[v].status = 'busy';
                    sites[sitekey].agents[userid].status = 'busy';

                    sites[sitekey].agents[userid].socket.emit('status-changed', 'busy');

                    sites[sitekey].visitors[v].socket.emit('agent-available', userid);
                    socket.emit('visitor-available', {
                        visitorid: sites[sitekey].visitors[v].userid,
                        joinas: sites[sitekey].visitors[v].joinas,
                        agents: getAgentsArray(),
                        cartRescue911_uid: sites[sitekey].visitors[v].cartRescue911_uid
                    });
                    continue;
                }
            }
        }
    });

    socket.on('redirect-to-agent', function (args) {
        var agent = sites[sitekey].agents[args.agentid];
        if (agent && sites[sitekey].visitors[args.visitorid]) {

            /*
            if(agent.status == 'busy') {
                propagateAgentStatusToAgents('agent-busy');
                
                socket.emit('visitor-available', {
                    visitorid: sites[sitekey].visitors[args.visitorid].userid,
                    joinas: sites[sitekey].visitors[args.visitorid].joinas,
                    agents: getAgentsArray(),
                    warning: 'You tried to redirect visitor (' + args.visitorid 
                            + ') to agent (' + args.agentid + ') however target agent is busy.'
                });
                return;
            }
            
            if(agent.job[args.visitorid]){
                socket.emit('visitor-available', {
                    visitorid: sites[sitekey].visitors[args.visitorid].userid,
                    joinas: sites[sitekey].visitors[args.visitorid].joinas,
                    agents: getAgentsArray(),
                    warning: 'You tried to redirect visitor (' + args.visitorid 
                            + ') to agent (' + args.agentid + ') however target agent already '
                            + agent.job[args.visitorid].status + ' this job.'
                });
                return;
            }
            */

            sites[sitekey].agents[userid].status = 'busy';
            
            // busy -> waiting -> busy
            sites[sitekey].visitors[args.visitorid].status = 'waiting';

            sites[sitekey].agents[userid].socket.emit('status-changed', 'busy');

            sites[sitekey].visitors[args.visitorid].socket.emit('agent-available', agent.userid);
            agent.socket.emit('visitor-available', {
                visitorid: sites[sitekey].visitors[args.visitorid].userid,
                joinas: sites[sitekey].visitors[args.visitorid].joinas,
                cartRescue911_uid: sites[sitekey].visitors[args.visitorid].cartRescue911_uid,
                agents: getAgentsArray(),
                redirected: true,
                redirectedFrom: args.redirectedFrom
            });
        }
    });
    
    socket.on('connect-visitor', function (args) {
        // propagateAgentStatusToAgents('agent-busy');

console.log('args');
console.log(args);
        sites[sitekey].agents[args.agentid].status = 'busy';
        sites[sitekey].visitors[args.visitorid].status = 'busy';
        sites[sitekey].visitors[args.visitorid].agentid = userid;

        sites[sitekey].agents[args.agentid].socket.emit('status-changed', 'busy');

        sites[sitekey].visitors[args.visitorid].socket.emit('join-me', {
            agentid: args.agentid,
            joinas: sites[sitekey].visitors[args.visitorid].joinas
        });

        sites[sitekey].agents[userid].job[args.visitorid] = {
            status: 'accepted',
            startedAt: new Date(),
            joinas: sites[sitekey].visitors[args.visitorid].joinas,
            messages: []
        };

        sites[sitekey].agents[userid].activejob = args.visitorid;
    });

    socket.on('reject-visitor', function (args) {
        sites[sitekey].agents[args.agentid].status = 'available';

        sites[sitekey].agents[args.agentid].socket.emit('status-changed', 'available');

        if (sites[sitekey].visitors[args.visitorid]) {
            sites[sitekey].visitors[args.visitorid].status = 'waiting';
            sites[sitekey].visitors[args.visitorid].socket.emit('rejected', args.agentid);
        }

        sites[sitekey].agents[userid].job[args.visitorid] = {
            status: 'rejected',
            startedAt: new Date(),
            endedAt: new Date(),
            joinas: sites[sitekey].visitors[args.visitorid].joinas,
            messages: []
        };

        checkWaitingVisitor();
    });
    
    socket.on('get-unread-messages', function (visitorid) {
        if (!sites[sitekey].agents[userid].unreadmessages[visitorid]) return;
        socket.emit('get-unread-messages', sites[sitekey].agents[userid].unreadmessages[visitorid]);

        delete sites[sitekey].agents[userid].unreadmessages[visitorid];

        if (sites[sitekey].agents[userid].job[visitorid]) {
            sites[sitekey].agents[userid].activejob = visitorid;
        }
    });

    socket.on('ask-to-share-screen', function (visitorid) {
        var visitor = sites[sitekey].visitors[visitorid];
        if (visitor) {
            visitor.socket.emit('share-screen');
        }
    });

    socket.on('ask-to-close-screen', function (visitorid) {
        var visitor = sites[sitekey].visitors[visitorid];
        if (visitor) {
            visitor.socket.emit('close-screen');
        }
    });
    
    socket.on('visitor-mediaconnection-accepted', function (args) {
        var visitor = sites[sitekey].visitors[args.visitorid];
        if (visitor) {
            visitor.socket.emit('visitor-mediaconnection-accepted', args.agentid);
        }
    });

    socket.on('visitor-mediaconnection-rejected', function (args) {
        var visitor = sites[sitekey].visitors[args.visitorid];
        if (visitor) {
            visitor.socket.emit('visitor-mediaconnection-accepted', args.agentid);
        }
    });
    
    socket.on('bye-ims', function (args) {
        console.log('bye');
        console.log(args);
        if (sites[sitekey].agents[args.agentid]) {
            sites[sitekey].agents[args.agentid].status = 'available';
            sites[sitekey].agents[args.agentid].socket.emit('status-changed', 'available');
            
            if(sites[sitekey].agents[args.agentid].job[args.visitorid]) {
                sites[sitekey].agents[args.agentid].job[args.visitorid].closed  = true;
                sites[sitekey].agents[args.agentid].job[args.visitorid].endedAt = new Date();
            }
        }

        if (sites[sitekey].visitors[args.visitorid]) {
            sites[sitekey].visitors[args.visitorid].socket.emit('agent-closed-ims', args.agentid);
        }
    });
    
    socket.on('get-average-chat-minutes', function() {
        var minutes = [];
        for(var job in sites[sitekey].agents[userid].job) {
            job = sites[sitekey].agents[userid].job[job];
            minutes.push(getMinutes(job.startedAt - job.endedAt));
        }
        
        var sum = 0;
        for(var i = 0; i < minutes.length; i++){
            sum += parseInt(minutes[i], 10);
        }

        socket.emit('average-chat-minutes', sum/minutes.length);
    });
    
    //----------------------------------------------------
    //---- methods
    //----------------------------------------------------
    
    function getMinutes(milliseconds) {
        return new Date(milliseconds).getUTCMinutes();
    }

    function getAgentsArray() {
        var agentsArray = [];

        for (var agent in sites[sitekey].agents) {
            agentsArray.push(sites[sitekey].agents[agent].userid);
        }

        return agentsArray;
    };

    function propagateAgentStatusToVisitors(eventName) {
        for (var visitor in sites[sitekey].visitors) {
            sites[sitekey].visitors[visitor].socket.emit(eventName, userid);
        }
    }
    
    function checkWaitingVisitor() {
        for (var v in sites[sitekey].visitors) {
            if(sites[sitekey].visitors[v].status == 'waiting' && !sites[sitekey].agents[userid].job[v]) {
                sites[sitekey].visitors[v].status = 'busy';
                sites[sitekey].agents[userid].status = 'busy';

                sites[sitekey].agents[userid].socket.emit('status-changed', 'busy');

                sites[sitekey].visitors[v].socket.emit('agent-available', userid);
                socket.emit('visitor-available', {
                    visitorid: sites[sitekey].visitors[v].userid,
                    joinas: sites[sitekey].visitors[v].joinas,
                    agents: getAgentsArray(),
                    cartRescue911_uid: sites[sitekey].visitors[v].cartRescue911_uid
                });
                continue;
            }
        }
    }
});

app.listen(8080);
