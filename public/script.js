const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});


var peer = new Peer({
  host: '127.0.0.1',
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

    socket.on("user-connected", (userId) => {
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
    });
  });

const connectToNewUser = (userId, stream) => {
  console.log('I call someone' + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, isScreenSharing);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = { call, video };
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
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
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

screenShareButton.addEventListener("click", () => {
  if (isScreenSharing) {
    // Stop sharing screen
    if (screenShareStream) {
      screenShareStream.getTracks().forEach((track) => track.stop());
      screenShareStream = null;
    }
    // Resume camera stream
    myVideoStream.getVideoTracks()[0].enabled = true;
    isScreenSharing = false;
    myVideo.style.border = 'none';
    myVideo.id = "";
    addVideoStream(myVideo, myVideoStream);
  } else {
    // Share screen
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((stream) => {
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          screenShareStream.getTracks().forEach((track) => track.stop());
          screenShareStream = null;
          myVideoStream.getVideoTracks()[0].enabled = true;
          isScreenSharing = false;
          addVideoStream(myVideo, myVideoStream);
          myVideo.style.border = 'none';
          myVideo.id = "";
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
          const call = peer.call(peerId, screenShareStream);
          const video = document.createElement("video");
          call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream);
          });
          call.on("close", () => {
            video.remove();
          });
          peers[peerId].call = call;
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
