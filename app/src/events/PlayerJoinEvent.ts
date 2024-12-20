import { environmentManager } from "../core/Environment";
import { playerManager } from "../core/Player";
import { ScriptPlayer } from "zep-script";

export class PlayerJoinEvent {
    constructor() {
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
    }
}