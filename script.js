const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');

async function setupCamera() {
    video.width = 640;
    video.height = 480;

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadModel() {
    const net = await posenet.load();
    return net;
}

async function detectPose(net) {
    const pose = await net.estimateSinglePose(video, {
        flipHorizontal: false
    });
    return pose;
}

function drawPose(pose) {
    ctx.clearRect(0, 0, 640, 480);
    const keypoints = pose.keypoints;

    keypoints.forEach((keypoint) => {
        if (keypoint.score > 0.6) { // 信頼度が0.6以上のポイントのみ描画
            const { x, y } = keypoint.position;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    });
}

async function main() {
    await setupCamera();
    const net = await loadModel();

    function poseDetectionFrame() {
        detectPose(net).then(pose => {
            drawPose(pose);
            requestAnimationFrame(poseDetectionFrame);
        });
    }

    poseDetectionFrame();
}

main();
