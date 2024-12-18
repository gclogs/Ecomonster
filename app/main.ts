import { ScriptPlayer } from "zep-script";
import { OnJoinPlayer } from "./src/events/OnJoinPlayer";
import { playerManager } from "./src/core/Player";
import { environmentManager } from "./src/core/Environment";
import { _COLORS } from "./src/utils/Color";
import { objectManager, monsterManager, catManager } from "./src/core/Object";

const STATE_INIT = 3000;
const STATE_READY = 3001;
const STATE_PLAYING = 3002;
const STATE_END = 3003;

let _gameState = STATE_INIT;
let _stateTimer = 0;
let _transformCount = 0;
let _answerCount = 0;

const _maps = {
    UNIVERSITY: "r7LY4M",
    CLASSROOM: "Wa376G",
}

// 스태프 명령어 처리
ScriptApp.onSay.Add(function (player: ScriptPlayer, text: string) {
    // !가 포함되어 있는 경우만 처리
    if (!text.includes('!')) return;

    const args = text.split(' ');
    const command = args[0].toLowerCase().replace('!', '');

    if (command === 'staff') {
        if (args.length < 2) {
            ScriptApp.sayToStaffs(`
            스태프 명령어 사용법:
            !staff <명령어> [플레이어이름]

            사용 가능한 명령어:
            - resetmove [플레이어이름]: 플레이어의 이동 모드 초기화
            - showmove [플레이어이름]: 플레이어의 이동 모드 상태 표시
            - showinfo [플레이어이름]: 플레이어의 상세 정보 표시
            
            * 플레이어 이름을 입력하지 않으면 명령어를 입력한 스태프 본인에게 적용됩니다.
            `);
            return;
        }

        const subCommand = args[1].toLowerCase();
        const targetPlayerName = args[2];
        
        // 대상 플레이어 결정 (이름이 주어지지 않으면 명령어를 입력한 스태프)
        let targetPlayer = player;
        let targetPlayerData = playerManager.players[player.id];

        if (targetPlayerName) {
            const foundPlayer = Object.values(ScriptApp.players).find(p => p.name === targetPlayerName);
            if (!foundPlayer) {
                ScriptApp.sayToStaffs(`플레이어 '${targetPlayerName}'를 찾을 수 없습니다.`);
                return;
            }
            targetPlayer = foundPlayer; // 여기서는 확실히 ScriptPlayer 타입임
            targetPlayerData = playerManager.players[targetPlayer.id];
        }

        if (!targetPlayerData) {
            ScriptApp.sayToStaffs(`플레이어 '${targetPlayer.name}'의 데이터를 찾을 수 없습니다.`);
            return;
        }

        switch (subCommand) {
            case 'resetmove':
                // 플레이어의 moveMode 초기화
                targetPlayerData.moveMode = {
                    WALK: { speed: 80, title: " 걷기", carbonEmission: 0.001 },
                    RUN: { speed: 150, title: " 달리기", carbonEmission: 0.015 },
                    current: 'WALK'
                };
                playerManager.updatePlayerMoveStats(targetPlayer);
                playerManager.savePlayerData(targetPlayer.id);
                ScriptApp.sayToStaffs(`${targetPlayer.name}의 이동 모드가 초기화되었습니다.`);
                break;

            case 'showmove':
                // 플레이어의 moveMode 상태 표시
                ScriptApp.sayToStaffs(`
                ${targetPlayer.name}의 이동 모드 정보:
                - 현재 모드: ${targetPlayerData.moveMode.current}
                - WALK: 속도 ${targetPlayerData.moveMode.WALK.speed}, 탄소 배출 ${targetPlayerData.moveMode.WALK.carbonEmission}
                - RUN: 속도 ${targetPlayerData.moveMode.RUN.speed}, 탄소 배출 ${targetPlayerData.moveMode.RUN.carbonEmission}
                `);
                break;

            case 'showinfo':
                // 플레이어의 상세 정보 표시
                ScriptApp.sayToStaffs(`
                플레이어 정보: ${targetPlayerData.name}
                - ID: ${targetPlayerData.id}
                - 잔액: $${targetPlayerData.money.toFixed(2)}
                - 청치 수: ${targetPlayerData.kills}
                - 퀴즈 정답: ${targetPlayerData.quizCorrects}
                - 현재 이동 모드: ${targetPlayerData.moveMode.current}
                `);
                break;
                
            case 'resetobjs':
                // 객체를 초기화
                objectManager.resetObjects();
                targetPlayer.sendMessage("오브젝트를 초기화하였습니다.", _COLORS.DARK_GREEN);
                targetPlayer.playSound("reset.wav");
                break;

            default:
                ScriptApp.sayToStaffs(`알 수 없는 명령어입니다: ${subCommand}`);
                break;
        }
    }
});

// 사이드바 앱이 터치(클릭)되었을 때 동작하는 함수
ScriptApp.onSidebarTouched.Add(function (player: ScriptPlayer) {
    const widget = player.showWidget("widget.html", "sidebar", 350, 350);
    environmentManager.setWidget(widget);
    player.tag.widget = widget;
});

// 플레이어가 퇴장할 때 동작하는 함수
ScriptApp.onLeavePlayer.Add(function (player: ScriptPlayer) {
    if (player.tag.widget) {
        player.tag.widget.destroy();
        player.tag.widget = null;
    }
});

// 플레이어 입장시 동작하는 함수
ScriptApp.onJoinPlayer.Add(function(player: ScriptPlayer) {
    ScriptApp.sayToStaffs(`플레이어 참가: ${player.name} (ID: ${player.id})`);
    player.tag = {
        widget: null,
    };
    playerManager.initPlayer(player);
    ScriptApp.sayToStaffs(`현재 맵 HashID: ${ScriptApp.mapHashID}`);
    ScriptApp.sayToStaffs(`현재 맵 너비/높이: ${ScriptMap.width}x${ScriptMap.height}`);
    
    // 환경 지표 위젯 생성
    const widget = player.showWidget("widget.html", "topleft", 300, 150);
    environmentManager.setWidget(widget);
});

// R키를 눌렀을 때 이동 모드 전환
ScriptApp.addOnKeyDown(82, function (player) {
    playerManager.toggleMovementMode(player);
});

// 매 프레임마다 환경 업데이트
ScriptApp.onUpdate.Add(function(dt) {
    environmentManager.updateEnvironmentByMovement(dt);
    environmentManager.saveMetrics(dt); // 저장 로직 추가

    if(ScriptApp.mapHashID == _maps.CLASSROOM) { // 교실에서만 몬스터 생성
        monsterManager.respawnMonster(dt);
    }
    
    if(ScriptApp.mapHashID == _maps.UNIVERSITY) { // 대학교에서만 고양이 생성
        catManager.respawnCat(dt);
    }
});

// 쓰레기 몬스터 처치 이벤트
ScriptApp.onAppObjectAttacked.Add(function (sender: ScriptPlayer, x: number, y: number, layer: number, key: string) {
    monsterManager.handleObjectAttack(sender, key);
});

// 쓰레기 분리수거 이벤트
ScriptApp.onTriggerObject.Add(function(sender: ScriptPlayer, x: number, y: number, layer: number, key: string) {
    catManager.handleObjectTouch(sender, key);
});


ScriptApp.onInit.Add(()=>{
    new OnJoinPlayer();
})