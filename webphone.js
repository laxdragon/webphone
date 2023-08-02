/*
** SIP Demo using sip.js 0.20
*/

// SIP Server
defaultSIPServer = "sipserver.local";

// WebSocket Server URL
webSocketServer = `wss://${defaultSIPServer}:8089/ws`;

// get interactive elements
serverSpan = document.getElementById("server");
targetSpan = document.getElementById("target");
callButton = document.getElementById("call");
answerButton = document.getElementById("answer");
hangupButton = document.getElementById("hangup");
audioElement = document.getElementById("remoteAudio");
keypad = document.querySelectorAll(".keypad");
dtmfSpan = document.getElementById("dtmf");
holdButton = document.getElementById("hold");
muteButton = document.getElementById("mute");
dialInput = document.getElementById("dial");
ringTone = document.getElementById("ringtone");
ringbackTone = document.getElementById("ringbacktone");
dtmfTone = document.getElementById("dtmfTone");
pbdial = document.querySelectorAll(".pbdial");

/*
** Setup SIP
*/

// SimpleUser options
simpleUserOptions = {
    delegate: {
        onCallCreated:      function(){ callCreate(); },
        onCallAnswered:     function(){ callAnswer(); },
        onCallHangup:       function(){ callHangUp(); },
        onCallReceived:     function(){ callReceived(); },
        onCallHold:         function(held){ callHold(held); },
        onServerConnect:    function() { serverConnect(); },
        onServerDisconnect: function(error) { serverDisconnect(error); }
    },
    media: {
        remote: {
            audio: audioElement
        }
    },
    aor:`sip:webrtc_309@${defaultSIPServer}`,
    userAgentOptions: {
        logLevel: "debug",
        displayName: "SIP User",
        authorizationUsername: "webrtc_000",
        authorizationPassword: "PASSWORD"
    }
};

// SimpleUser construction
var simpleUser = new SIP.Web.SimpleUser(webSocketServer, simpleUserOptions);

/*
** Connect SIP on Load
*/

// connect
callButton.disabled = true;
hangupButton.disabled = true;
simpleUser.connect().then(function()
{
    callButton.disabled = false;
    hangupButton.disabled = true;
    serverSpan.innerHTML = defaultSIPServer;
})
.catch(function(error)
{
    console.error(`[${simpleUser.id}] failed to connect`);
    console.error(error);
    serverSpan.innerHTML = "Failed to connect: " + error;
});

/*
** Event Listeners
*/

// Add click listeners to keypad buttons
keypad.forEach(function(button)
{
    button.addEventListener("click", function()
    {
        tone = button.textContent;
        if (tone)
        {
            playdtmfTone();
            simpleUser.sendDTMF(tone).then(function()
            {
                dtmfSpan.innerHTML += tone;
            });
        }
    });
});

// phonebook dial
pbdial.forEach(function(button)
{
    button.addEventListener("click", function()
    {
        var target = button.value;
        makeCall(target);
    });
});

// on enter key in dial
dialInput.addEventListener("keyup", function(event)
{
    if (event.keyCode === 13)
    {
        event.preventDefault();
        var target = dialInput.value;
        makeCall(target);
    }
});

// Add click listener to call button
callButton.addEventListener("click", function()
{
    var target = dialInput.value;
    makeCall(target);
});

// Add click listener to answer button
answerButton.addEventListener("click", function()
{
    // just answer for now
    simpleUser.answer().then(function()
    {
        answerButton.disabled = true;
        callButton.disabled = true;
        hangupButton.disabled = false;
        keypadDisabled(false);
    })
    .catch(function(error)
    {
        console.error(`[${simpleUser.id}] failed to answer`);
        console.error(error);
        alert("Failed to answer\n" + error);
    });
});

// Add click listener to hangup button
hangupButton.addEventListener("click", function()
{
    callButton.disabled = true;
    hangupButton.disabled = true;
    muteButtonToggle(false);
    holdButtonToggle(false);
    simpleUser.hangup().catch(function(error)
    {
        console.error(`[${simpleUser.id}] failed to hangup call`);
        console.error(error);
        alert("Failed to hangup call.\n" + error);
    });
});

// Add change listener to hold checkbox
holdButton.addEventListener("click", function()
{
    if (holdButton.value == "hold")
    {
        // un-hold
        holdButtonToggle(false);
        simpleUser.unhold().catch(function(error)
        {
            console.error(`[${simpleUser.id}] failed to unhold call`);
            console.error(error);
            alert("Failed to unhold call.\n" + error);
        });
    }
    else
    {
        // hold
        holdButtonToggle(true);
        simpleUser.hold().catch(function(error)
        {
            console.error(`[${simpleUser.id}] failed to hold call`);
            console.error(error);
            alert("Failed to hold call.\n" + error);
        });
    }
});

// Add change listener to mute checkbox
muteButton.addEventListener("click", function()
{
    if (muteButton.value == "mute")
    {
        // unmute
        simpleUser.unmute();
        muteButtonToggle(false);
        if (simpleUser.isMuted() === true)
        {
            console.error(`[${simpleUser.id}] failed to unmute call`);
            alert("Failed to unmute call.\n");
        }
    }
    else
    {
        // mute
        simpleUser.mute();
        muteButtonToggle(true);
        if (simpleUser.isMuted() === false)
        {
            console.error(`[${simpleUser.id}] failed to mute call`);
            alert("Failed to mute call.\n");
        }
    }
});


/*
** Helper Functions
*/

// dial a number and make a call
makeCall = function (target)
{
    if (!target || !target.match(/^[0-9]+$/))
    {
        console.log("invalid dial");
        return;
    }
    callButton.disabled = true;
    hangupButton.disabled = true;
    simpleUser.call(`sip:${target}@${defaultSIPServer}`,
    {
        inviteWithoutSdp: false
    })
    .catch(function(error)
    {
        console.error(`[${simpleUser.id}] failed to place call`);
        console.error(error);
        alert("Failed to place call.\n" + error);
    });
};

// Keypad helper function
keypadDisabled = function (disabled)
{
    keypad.forEach(function(button)
    {
        button.disabled = disabled
    });
    dtmfSpan.innerHTML = "";
};

// Hold helper function
holdButtonToggle = function (down)
{
    if (down)
    {
        targetSpan.innerHTML = targetSpan.innerHTML + " (HOLD)";
        holdButton.value = "hold";
        holdButton.classList.add("btn-primary");
    }
    else
    {
        targetSpan.innerHTML = targetSpan.innerHTML.replace(/ \(HOLD\)/,'');
        holdButton.value = "";
        holdButton.classList.remove("btn-primary");
    }
};

// Mute helper function
muteButtonToggle = function (down)
{
    if (down)
    {
        muteButton.value = "mute";
        muteButton.classList.add("btn-primary");
    }
    else
    {
        muteButton.value = "";
        muteButton.classList.remove("btn-primary");
    }
};

/*
** Call Hanlders (Delegates)
*/

// on call created
callCreate = function()
{
    console.log(`[${simpleUserOptions.userAgentOptions.displayName}] Call created`);
    callButton.disabled = true;
    hangupButton.disabled = false;
    answerButton.disabled = true;
    keypadDisabled(true);
    holdButtonToggle(false);
    muteButtonToggle(false);
    startRingbackTone();
    targetSpan.innerHTML = `calling ${dialInput.value}`;
};

// on call answered
callAnswer = function()
{
    console.log(`[${simpleUserOptions.userAgentOptions.displayName}] Call answered`);
    keypadDisabled(false);
    holdButtonToggle(false);
    muteButtonToggle(false);
    muteButton.disabled = false;
    holdButton.disabled = false;
    stopRingTone();
    stopRingbackTone();
    //console.log(simpleUser.session);
    targetSpan.innerHTML = `connected to ${simpleUser.session.remoteIdentity.uri.user}`;
};

// on call hang up
callHangUp = function()
{
    console.log(`[${simpleUserOptions.userAgentOptions.displayName}] Call hangup`);
    callButton.disabled = false;
    hangupButton.disabled = true;
    answerButton.disabled = true;
    answerButton.classList.remove("btn-primary");
    keypadDisabled(true);
    holdButtonToggle(false);
    muteButtonToggle(false);
    muteButton.disabled = true;
    holdButton.disabled = true;
    stopRingTone();
    stopRingbackTone();
    targetSpan.innerHTML = "OK";
    dialInput.value = "";
};

// on call hold
callHold = function(held)
{
    console.log(`[${simpleUserOptions.userAgentOptions.displayName}] Call hold ${held}`);
};

// incomming call
callReceived = function()
{
    answerButton.disabled = false;
    answerButton.classList.add("btn-primary");
    targetSpan.innerHTML = `incomming call from ${simpleUser.session.remoteIdentity.uri.user}`;
    startRingTone();
};

// server is connected
serverConnect = function()
{
    // update display
    targetSpan.innerHTML = `OK`;

    // register to receive calls
    simpleUser.register();
};

// when server is disconnected
serverDisconnect = function(error)
{
    console.log(error);
    callButton.disabled = true;
    targetSpan.innerHTML = `Disconnected: ${error}`;
};


/*
** Sound functions
*/

startRingTone = function() {
    try { ringTone.play(); } catch (e) { }
};

stopRingTone = function() {
    try { ringTone.pause(); } catch (e) { }
};

startRingbackTone = function() {
    try { ringbackTone.play(); } catch (e) { }
};

stopRingbackTone = function() {
    try { ringbackTone.pause(); } catch (e) { }
};

playdtmfTone = function () {
    try { dtmfTone.play(); } catch (e) { }
}

/*
** Window Handlers
*/

// force prompt to confirm leaving page
window.onbeforeunload = function()
{
    return 'Leaving will disconnect your phone. Do you want to leave?';
};

// disconnect connection when leaving page
window.onunload = function()
{
    simpleUser.disconnect();
};

// done
