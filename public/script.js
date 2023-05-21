const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
const endButton = document.querySelector("#endButton");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.flex = "0.3";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});
const user = prompt("Enter your name how you would like to appear in the chat");

var peer = new Peer({
	host: '44.202.38.217',
  secure: false,
  port: 3030,
  path: '/peerjs',
  config: {
    'iceServers': [
      { url: 'stun:stun01.sipphone.com' },
      { url: 'stun:stun.ekiga.net' },
      { url: 'stun:stunserver.org' },
      { url: 'stun:stun.softjoys.com' },
      { url: 'stun:stun.voiparound.com' },
      { url: 'stun:stun.voipbuster.com' },
      { url: 'stun:stun.voipstunt.com' },
      { url: 'stun:stun.voxgratia.org' },
      { url: 'stun:stun.xten.com' },
      {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      },
      {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      }
    ]
  },

  debug: 3
});

let peers = {};
let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      console.log('someone call me');
      if (isScreenSharing) {
        // Reject call if already sharing screen
        call.close();
        return;
      }
      call.answer(myVideoStream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, false);
      });
      call.on("close", () => {
        video.remove();
      });
      peers[call.peer] = { call, video };
    });

    socket.on("user-connected", (userId, userName) => {
      if (isScreenSharing) {
        // Call new user with screen share stream
        const call = peer.call(userId, screenShareStream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream, true);
        });
        call.on("close", () => {
          video.remove();
        });
        peers[userId] = { call, video };
      } else{
        connectToNewUser(userId, stream);
      }
      const userConnectedMessage = `${userName} has joined the room`;
      displayChatMessage(userConnectedMessage, "info");
    });
  });

const connectToNewUser = (userId, stream) => {
  console.log('I call someone' + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", async (userVideoStream) => {
    addVideoStream(video, userVideoStream, isScreenSharing);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = { call, video };
};

const displayChatMessage = (message, className) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.classList.add(className);
  messageElement.innerHTML = `<span>${message}</span>`;
  messages.appendChild(messageElement);
};

const closeScreenShare = () => {
  if (screenShareStream) {
    // Stop screen sharing
    screenShareStream.getTracks().forEach((track) => track.stop());
    screenShareStream = null;
    // Resume camera stream
    myVideoStream.getVideoTracks()[0].enabled = true;
    isScreenSharing = false;
    // Display local video stream without screen sharing
    myVideo.style.border = 'none';
    myVideo.id = "";
    addVideoStream(myVideo, myVideoStream);
    // Notify other users to stop receiving screen share stream
    for (let peerId in peers) {
      const peerConnection = peers[peerId].call;
      peerConnection.peerConnection.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "video") {
          sender.replaceTrack(myVideoStream.getVideoTracks()[0]);
        }
      });
    }
  }
};

peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
let screenShareButton = document.querySelector("#screenShare");
let screenShareStream = null;
let isScreenSharing = false;

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    muteButton.title = "Unmute";
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    muteButton.title = "Mute";
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    stopVideo.title = "Start Video";
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    stopVideo.title = "Stop Video";
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

endButton.addEventListener("click", (e) => {
  window.location.href = "/";
});

screenShareButton.addEventListener("click", () => {
  let stopVdo = document.querySelector("#stopVideo");
  let ss = document.querySelector("#screenShare");
  if (isScreenSharing) {
    screenShareButton.title = "Share Screen";
    stopVdo.style.pointerEvents = "";
    ss.classList.remove("background__red");
    closeScreenShare();
  } else {
    // Share screen
    screenShareButton.title = "Stop Sharing Screen";
    ss.classList.add("background__red");
    stopVdo.style.pointerEvents = "none";
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((stream) => {
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          closeScreenShare();
          console.log('The user has ended sharing the screen');
      });
        // Stop camera stream
        myVideoStream.getVideoTracks()[0].enabled = false;
        // Save screen share stream
        screenShareStream = stream;
        isScreenSharing = true;
        // Show screen share stream
        myVideo.srcObject = screenShareStream;
        myVideo.style.border = "2px solid red";
        myVideo.id = "screen_share_video";
        myVideo.addEventListener("loadedmetadata", () => {
          myVideo.play();
        });
        // Send screen share stream to other users
        for (let peerId in peers) {
          const peerConnection = peers[peerId].call;
          peerConnection.peerConnection.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === "video") {
              sender.replaceTrack(screenShareStream.getVideoTracks()[0]);
            }
          });
        }
      });
  }
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName
    }</span> </b>
        <span>${message}</span>
    </div>`;
});

//handle user disconnect
socket.on("user-disconnected", (userId, userName) => {
  console.log('user disconnected' + userId);
  if (peers[userId]) {
    peers[userId].call.close();
    peers[userId].video.remove();
    const userDisconnectedMessage = `${userName} has left the room`;
    displayChatMessage(userDisconnectedMessage, "info");
  }
}
);
