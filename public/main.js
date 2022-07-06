const socket = io.connect("http://localhost:3000");
const url = new URL(window.location.href);
const room = url.searchParams.get("room");
$("#my-room").text(room);
const btnCall = $("#btn-call");
const my_camera = $("#my-camera");
const friend_camera = $("#friend-camera");
const actionVolume = $("#my-action .action-volume");
const actionTurn = $("#my-action .action-turn");
const actionCamera = $("#my-action .action-camera");
const friendActionVolume = $("#friend-action .action-volume");
const friendActionTurn = $("#friend-action .action-turn");
const friendActionCamera = $("#friend-action .action-camera");
let mediaRecorder = null;
let recordedBlobs = [];
let localstream;
let remotestream;

my_camera.volume = 0;
friend_camera.volume = 0;

/**
 * Connect Socket
 */
socket.on("connect", async () => {
  const peer = new Peer(socket.id);

  /**
   * Socket
   */
  socket.emit("joinRoom", room);
  socket.on("userJoined", (id) => {
    $("#socketId").attr("value", id);
    $("#friend-connect").html("Connected");
  });

  socket.on("reject-call", (data) => {
    Swal.fire({
      icon: "error",
      title: ":(",
      text: "The other party rejected the call",
    });
    $("#my-action,#friend-action").addClass("d-none");
    btnCall.removeClass("d-none");
    playStream(my_camera, null);
  });

  // action volume
  socket.on("volume-action", (data) => {
    data.status === "on"
      ? friendActionVolume
          .addClass("bi-volume-down")
          .removeClass("bi-volume-mute")
      : friendActionVolume
          .addClass("bi-volume-mute")
          .removeClass("bi-volume-down");
  });

  // action camera
  socket.on("camera-action", async (data) => {
    if (data.status === "on") {
      friendActionCamera
        .removeClass("bi-camera-video-off")
        .addClass("bi-camera-video");
      const stream = await getUserStream();
      stream.getVideoTracks()[0].enabled = true;
      playStream(friend_camera, stream);
    } else {
      friendActionCamera
        .removeClass("bi-camera-video")
        .addClass("bi-camera-video-off");
      const stream = await getUserStream();
      stream.getVideoTracks()[0].enabled = false;
      playStream(friend_camera, null);
    }
  });

  //cancel call
  socket.on("cancel-call", (data) => {
    Swal.fire({
      icon: "error",
      title: ":(",
      text: "The other party canceled the call",
    });
    $("#my-action,#friend-action").addClass("d-none");
    btnCall.removeClass("d-none");
    playStream(my_camera, null);
    playStream(friend_camera, null);
  });

  /**
   * End socket
   */

  const getUserStream = () =>
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { echoCancellation: false },
    });

  const playStream = (pos, stream) => {
    pos.get(0).srcObject = stream;
  };

  $("#btn-call").click(async () => {
    $("#my-action,#friend-action").removeClass("d-none");
    btnCall.addClass("d-none");
    const stream = await getUserStream();
    startRecording(stream);
    playStream(my_camera, stream);
    const call = peer.call($("#socketId").val(), stream);
    call.on("stream", (friend_stream) => {
      playStream(friend_camera, friend_stream);
    });
  });

  peer.on("call", async (call) => {
    const stream = await getUserStream();
    Swal.fire({
      title: "New Call",
      text: "You are on a call",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "green",
      cancelButtonColor: "red",
      confirmButtonText: "Accept",
      cancelButtonText: "Reject",
    }).then((result) => {
      if (result.isConfirmed) {
        $("#friend-action,#my-action").removeClass("d-none");
        btnCall.addClass("d-none");
        startRecording(stream);
        playStream(my_camera, stream);
        call.answer(stream);
        call.on("stream", (friend_stream) => {
          playStream(friend_camera, friend_stream);
        });
      }
    });
  });

  const startRecording = (stream) => {
    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedBlobs.push(e.data);
          console.log("Recorded Blobs: ", recordedBlobs);
          const blob = new Blob(recordedBlobs, { type: "video/webm" });
          console.log("Blob: ", blob);
          const url = window.URL.createObjectURL(blob);
          console.log("URL: ", url);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = "test.webm";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 100);
        }
      };
      mediaRecorder.start();
      console.log("MediaRecorder started", mediaRecorder.state);
      console.log("MediaRecorder started", mediaRecorder);
    } catch (e) {
      console.error("Exception while creating MediaRecorder:", e);
      return;
    }
  };
  const stopRecording = () => {
    mediaRecorder.stop();
  };

  // DOM
  actionVolume.click(async (e) => {
    actionVolume.toggleClass("bi-volume-mute bi-volume-down");
    if (actionVolume.hasClass("bi-volume-mute")) {
      const stream = await getUserStream();
      stream.getAudioTracks()[0].enabled = false;
      my_camera.attr("muted", "");
      socket.emit("volume-action", {
        room,
        status: "off",
      });
    } else {
      const stream = await getUserStream();
      stream.getAudioTracks()[0].enabled = true;
      my_camera.attr("muted", true);
      socket.emit("volume-action", {
        room,
        status: "on",
      });
    }
  });

  actionCamera.click(async (e) => {
    actionCamera.toggleClass("bi-camera-video-off bi-camera-video");
    if (actionCamera.hasClass("bi-camera-video-off")) {
      socket.emit("camera-action", {
        room,
        status: "off",
      });
      const stream = await getUserStream();
      stream.getVideoTracks()[0].enabled = false;
      playStream(my_camera, stream);
    } else {
      socket.emit("camera-action", {
        room,
        status: "on",
      });
      const stream = await getUserStream();
      stream.getVideoTracks()[0].enabled = true;
      playStream(my_camera, stream);
    }
  });

  actionTurn.click((e) => {
    //stopRecording();
    playStream(my_camera, null);
    playStream(friend_camera, null);
    socket.emit("cancel-call", room);
    $("#my-action,#friend-action").addClass("d-none");
    btnCall.removeClass("d-none");
    setTimeout(() => {
      Swal.fire({
        title: "Call Back",
        text: "Would you like to call back?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "green",
        cancelButtonColor: "red",
        confirmButtonText: "Accept",
        cancelButtonText: "Reject",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const stream = await getUserStream();
          startRecording(stream);
          playStream(my_camera, stream);
          const call = peer.call($("#socketId").val(), stream);
          call.on("stream", (friend_stream) => {
            playStream(friend_camera, friend_stream);
          });
        }
      });
    }, 2000);
  });
});
