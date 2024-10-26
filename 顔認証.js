(function(Scratch) {
    'use strict';


    // 保存された顔データ
    const savedFaces = [];


    // HTML要素の生成
    function createHtmlContent() {
        const htmlContent = `
            <h1>顔認識拡張機能</h1>
            <video id="video" width="720" height="560" autoplay muted></video>
        `;
        document.body.innerHTML = htmlContent;
    }


    createHtmlContent();


    // カメラをオンにする関数
    async function startCamera() {
        const video = document.getElementById('video');
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
    }


    // カメラをオフにする関数
    function stopCamera() {
        const video = document.getElementById('video');
        const stream = video.srcObject;
        const tracks = stream.getTracks();


        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }


    // モデルの読み込み
    async function loadModels() {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        console.log('モデルの読み込みが完了しました');
    }


    loadModels();


    const imageProcessor = {
        getInfo: function() {
            return {
                id: 'imageProcessor',
                name: '顔認識拡張機能',
                color1: '#66B2FF',
                blocks: [
                    {
                        opcode: 'recognizeFace',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '顔認証モード [MODE] で顔を認識',
                        arguments: {
                            MODE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'recognitionModes',
                                defaultValue: 'identity'
                            }
                        }
                    },
                    {
                        opcode: 'getAge',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '年齢'
                    },
                    {
                        opcode: 'getFace',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '顔'
                    },
                    {
                        opcode: 'saveFace',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '顔を保存'
                    },
                    {
                        opcode: 'getSavedFaces',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '保存された顔'
                    },
                    {
                        opcode: 'toggleCameraWithMode',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'カメラを [STATE] にする（モード: [MODE]）',
                        arguments: {
                            STATE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'cameraStates',
                                defaultValue: 'オン'
                            },
                            MODE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'recognitionModes',
                                defaultValue: 'identity'
                            }
                        }
                    }
                ],
                menus: {
                    recognitionModes: [
                        { text: '本人認証', value: 'identity' },
                        { text: '年齢認証', value: 'age' }
                    ],
                    cameraStates: [
                        { text: 'オン', value: 'on' },
                        { text: 'オフ', value: 'off' }
                    ]
                }
            };
        },
        recognizeFace: async function(args) {
            const mode = args.MODE;
            console.log('選択されたモード:', mode);


            const video = document.getElementById('video');
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
            console.log('検出された顔:', detections);


            if (mode === 'identity') {
                console.log('本人認証モードで顔を認識しました');
                return detections.length ? '顔が認識されました（本人認証）' : '顔が認識されませんでした（本人認証）';
            } else if (mode === 'age') {
                const ages = detections.map(d => d.age);
                const averageAge = ages.length ? (ages.reduce((a, b) => a + b) / ages.length) : null;
                console.log('年齢認証モードで顔を認識しました');
                return averageAge ? `顔が認識されました（年齢認証）: 平均年齢 ${averageAge}` : '顔が認識されませんでした（年齢認証）';
            }
        },
        getAge: function() {
            return '年齢認証';
        },
        getFace: function() {
            return '顔';
        },
        saveFace: async function() {
            const video = document.getElementById('video');
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();


            if (detections.length > 0) {
                const faceDescriptor = detections[0].descriptor;
                const isSameFace = savedFaces.some(savedFace => faceapi.euclideanDistance(savedFace, faceDescriptor) < 0.6);


                if (!isSameFace) {
                    savedFaces.push(faceDescriptor);
                    console.log('顔が保存されました:', savedFaces);
                } else {
                    console.log('同じ顔は既に保存されています');
                }
            }
        },
        getSavedFaces: function() {
            return savedFaces.length ? '保存された顔が' + savedFaces.length + 'あります' : '保存された顔はありません';
        },
        toggleCameraWithMode: function(args) {
            const state = args.STATE;
            const mode = args.MODE;


            if (state === 'on') {
                startCamera();
                cameraOn = true;
                console.log(`カメラがオンになりました（モード: ${mode}）`);
            } else if (state === 'off') {
                stopCamera();
                cameraOn = false;
                console.log('カメラがオフになりました');
            }
        }
    };


    Scratch.extensions.register(imageProcessor);


})(Scratch);