export function PhotoCamera() {
    const player = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
    })
        .then(stream => {
            player.srcObject = stream;
            player.play()
        })
        .catch(err =>
            console.log("An error occurred: " + err)
        );

    player.addEventListener('canplay', ev => {
        canvas.width = player.videoWidth
        canvas.height = player.videoHeight
    })

    function snap() {
        ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    }

    return {
        snap
    }

}
