
const socket = io.connect("/");
const url = new URL(window.location.href);
const room = url.searchParams.get("room");
const peers = []

socket.on("connect", () => {
  const peer = new Peer(socket.id)
  // Event join room and show video of self
  peer.on("open", async id => {
    const my_camera = document.createElement("video")
    my_camera.muted = true;
    my_camera.dataset.id = id
    const stream = await getUserStream()
    socket.emit("join-room", { room, id });

    addVideoMySelf(my_camera, stream);
  })


  // Event connected and call friend
  socket.on("user-connected", async userId => {
    const stream = await getUserStream()
    const call = peer.call(userId, stream);
    const friend_camera = document.createElement("video");
    call.on("stream", friend_stream => {
      if (!peers.includes(userId)) {
        addNewVideo(friend_camera, friend_stream, userId);
        peers.push(userId)
      }
    })
  })

  peer.on("call", async call => {
    const stream = await getUserStream()
    const friend_camera = document.createElement("video");

    call.answer(stream);
    call.on("stream", friend_stream => {
      if (!peers.includes(call.peer)) {
        addNewVideo(friend_camera, friend_stream, call.peer);
        peers.push(call.peer)
      }
    })
  })
})

// Get stream for user
const getUserStream = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  return stream;
}

const addVideoMySelf = (video, stream) => {
  video.srcObject = stream;
  video.play();
  $("#self-camera .card").append(video);
}

const addNewVideo = (pos, stream, id) => {
  pos.srcObject = stream
  pos.onloadedmetadata = () => {
    pos.play()
  }

  $('#friend-camera').append(`<div class="col-6" data-id="${id}"></div>`)

  $(`#friend-camera .col-6[data-id="${id}"]`).append(pos)
}

socket.on('user-disconnected', userId => {
  //toastr.warning(`A member leave the room`)
  toastr.warning(`A member leave the room`)
  $(`#friend-camera .col-6[data-id="${userId}"]`).remove();
  delete peers[userId];
})
