const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');

// 定義された関節ペア（これにより骨格が描画される）
const adjacentKeyPoints = [
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // 左右の肩、肘、手首
    [5, 11], [6, 12], // 肩から腰
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // 腰から膝、足首
    [0, 1], [1, 3], [0, 2], [2, 4] // 頭部
];

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

function drawKeypoints(keypoints) {
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

function drawSkeleton(keypoints) {
    adjacentKeyPoints.forEach(([i, j]) => {
        const pointA = keypoints[i];
        const pointB = keypoints[j];

        if (pointA.score > 0.6 && pointB.score > 0.6) {
            ctx.beginPath();
            ctx.moveTo(pointA.position.x, pointA.position.y);
            ctx.lineTo(pointB.position.x, pointB.position.y);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function drawPose(pose) {
    ctx.clearRect(0, 0, 640, 480);
    const keypoints = pose.keypoints;
    drawKeypoints(keypoints);  // 関節点の描画
    drawSkeleton(keypoints);   // 骨格の描画
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
